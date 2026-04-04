import { eq } from 'drizzle-orm';

import {
  company,
  document as documentTable,
  documentAuditLog,
  documentTemplate,
  item as itemTable,
} from '~/database/schema';
import {
  computeTotals,
  generatePdf,
  generateXlsx,
  resolveLineItems,
  type DocumentData,
  type LineItem,
} from '~/lib/generate-document';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/generate-document';

const BUCKET_MAP: Record<string, 'POAS' | 'INVOICES' | 'BILLS'> = {
  poas: 'POAS',
  invoices: 'INVOICES',
  bills: 'BILLS',
};

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const fd = await request.formData();
    const templateId = Number(fd.get('templateId'));
    const companyId = Number(fd.get('companyId'));
    const format = (fd.get('format') as string) || 'xlsx';
    const docType = fd.get('documentType') as string;
    const number = fd.get('number') as string;
    const date = fd.get('date') as string;
    const includeStamp = fd.get('includeStamp') === 'true';
    const lineItemsJson = fd.get('lineItems') as string;

    if (!templateId || !companyId || !docType || !number || !date) {
      return { data: null, error: 'Missing required fields' };
    }

    const bucketKey = BUCKET_MAP[docType];
    if (!bucketKey) {
      return { data: null, error: `Unknown document type: ${docType}` };
    }

    // Fetch template and company
    const [template] = await context.db
      .select()
      .from(documentTemplate)
      .where(eq(documentTemplate.id, templateId));

    const [companyRecord] = await context.db
      .select()
      .from(company)
      .where(eq(company.id, companyId));

    if (!template || !companyRecord) {
      return { data: null, error: 'Template or company not found' };
    }

    // Parse and resolve line items
    const rawItems: Array<{ itemId: number; quantity: number; priceOverride?: number }> =
      JSON.parse(lineItemsJson || '[]');

    const lineItems: LineItem[] = [];
    for (const raw of rawItems) {
      const [itemRecord] = await context.db
        .select()
        .from(itemTable)
        .where(eq(itemTable.id, raw.itemId));
      if (itemRecord) {
        lineItems.push({
          item: itemRecord,
          quantity: raw.quantity,
          priceOverride: raw.priceOverride,
        });
      }
    }

    const data: DocumentData = {
      number,
      date,
      companyId,
      includeStamp,
      lineItems,
    };

    const lines = resolveLineItems(data);
    const totals = computeTotals(lines);

    // Get stamp if needed
    let stampBuffer: ArrayBuffer | null = null;
    if (template.stampImageKey && includeStamp) {
      const stampObj = await context.cloudflare.env.TEMPLATES.get(template.stampImageKey);
      stampBuffer = stampObj ? await stampObj.arrayBuffer() : null;
    }

    // Generate file
    const buffer =
      format === 'pdf'
        ? await generatePdf(template, companyRecord, data, lines, totals, stampBuffer)
        : await generateXlsx(template, companyRecord, data, lines, totals, stampBuffer);

    // Store in R2
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const r2Key = `${docType}/${date}-${number}.${ext}`;
    const bucket = context.cloudflare.env[bucketKey];
    await bucket.put(r2Key, buffer, {
      httpMetadata: {
        contentType:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

    const now = new Date().toISOString();
    const actorEmail = context.user?.email ?? 'unknown';

    // Save document record
    const [doc] = await context.db
      .insert(documentTable)
      .values({
        templateId,
        companyId,
        documentType: docType,
        dataJson: JSON.stringify({ number, date, includeStamp, lineItems: rawItems }),
        createdBy: actorEmail,
        createdAt: now,
        exportedAt: now,
        exportFormat: format,
        r2Key,
      })
      .returning();

    // Audit log
    await context.db.insert(documentAuditLog).values({
      documentId: doc.id,
      action: 'created',
      actorEmail,
      timestamp: now,
    });

    return { data: { id: doc.id, r2Key }, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type GenerateDocumentAction = typeof action;
