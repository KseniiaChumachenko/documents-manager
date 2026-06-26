import { eq } from 'drizzle-orm';
import { redirect } from 'react-router';

import {
  company,
  document as documentTable,
  documentAuditLog,
  documentTemplate,
  item as itemTable,
  myCompany,
  stamp,
} from '~/database/schema';
import type { RenderContext } from '~/lib/document-layout';
import { renderLayout } from '~/lib/document-renderer';
import {
  computeTotals,
  resolveLineItems,
  sheetModelToPdf,
  sheetModelToXlsx,
  type LineItem,
  type SupplierIdentity,
} from '~/lib/generate-document';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/generate-document';

// TODO(storage-consolidation): these three per-type R2 buckets should be
// replaced by a single generic `DOCUMENTS` bucket (the document_type column +
// the `${docType}/...` key prefix already discriminate). Deferred to a stacked
// follow-up PR because it touches Pulumi infra + a production object migration.
// See docs/superpowers/specs/2026-06-21-document-layout-schema-design.md §5.
const BUCKET_MAP: Record<string, 'POAS' | 'INVOICES' | 'BILLS'> = {
  poas: 'POAS',
  invoices: 'INVOICES',
  bills: 'BILLS',
};

/** Derive the VAT rate from an already-parsed schema object.
 * 0 for powers of attorney, else the template's `vat_rate` (fraction) if set,
 * otherwise 20%. */
function resolveVatRate(docType: string, schema: Record<string, unknown>): number {
  if (docType === 'poas') return 0;
  if (typeof schema.vat_rate === 'number') return schema.vat_rate;
  return 0.2;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const fd = await request.formData();
    const templateId = Number(fd.get('templateId'));
    const companyId = Number(fd.get('companyId'));
    const format = (fd.get('format') as string) || 'xlsx';
    const docType = fd.get('documentType') as string;
    const includeStamp = fd.get('includeStamp') === 'true';
    const fields: Record<string, string> = JSON.parse((fd.get('fields') as string) || '{}');
    const rawItems: Array<{ itemId: number; quantity: number; priceOverride?: number }> =
      JSON.parse((fd.get('lineItems') as string) || '[]');

    const number = fields.number;
    const date = fields.date;

    if (!templateId || !companyId || !docType || !number || !date) {
      return { data: null, error: 'Missing required fields' };
    }

    const bucketKey = BUCKET_MAP[docType];
    if (!bucketKey) {
      return { data: null, error: `Unknown document type: ${docType}` };
    }

    const [template] = await context.db
      .select()
      .from(documentTemplate)
      .where(eq(documentTemplate.id, templateId));

    const [counterparty] = await context.db.select().from(company).where(eq(company.id, companyId));

    const [supplier] = await context.db.select().from(myCompany).limit(1);

    if (!template || !counterparty) {
      return { data: null, error: 'Template or company not found' };
    }
    if (!supplier) {
      return {
        data: null,
        error: 'Спершу заповніть дані вашої компанії в налаштуваннях',
      };
    }

    // Resolve line items against the catalogue.
    const lineItemsInput: LineItem[] = [];
    for (const raw of rawItems) {
      const [itemRecord] = await context.db
        .select()
        .from(itemTable)
        .where(eq(itemTable.id, raw.itemId));
      if (itemRecord) {
        lineItemsInput.push({
          item: itemRecord,
          quantity: raw.quantity,
          priceOverride: raw.priceOverride,
        });
      }
    }
    const lines = resolveLineItems(lineItemsInput);

    // Parse the template's schema_json once; derive both layout and vat rate from it.
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(template.schemaJson);
    } catch {
      return { data: null, error: 'Шаблон не містить розмітки (layout)' };
    }
    const layout = schema.layout as import('~/lib/document-layout').Layout | undefined;
    if (!layout) {
      return { data: null, error: 'Шаблон не містить розмітки (layout)' };
    }

    const vatRate = resolveVatRate(docType, schema);
    const renderContext: RenderContext = {
      supplier: supplier as SupplierIdentity,
      counterparty: {
        name: counterparty.name,
        egrpou: counterparty.egrpou,
        phone: counterparty.phone,
      },
      field: fields,
      lines,
      totals: { ...computeTotals(lines, vatRate), vatRate, discount: 0 },
    };

    // Resolve the stamp image (if any) as a data URL for PDF embedding.
    let stampDataUrl: string | null = null;
    if (template.stampId && includeStamp) {
      const [stampRecord] = await context.db
        .select()
        .from(stamp)
        .where(eq(stamp.id, template.stampId));
      if (stampRecord) {
        const stampObj = await context.cloudflare.env.TEMPLATES.get(stampRecord.imageKey);
        if (stampObj) {
          const buf = await stampObj.arrayBuffer();
          const ct = stampObj.httpMetadata?.contentType ?? 'image/png';
          stampDataUrl = `data:${ct};base64,${arrayBufferToBase64(buf)}`;
        }
      }
    }

    const model = renderLayout(layout, renderContext);
    const buffer =
      format === 'pdf' ? sheetModelToPdf(model, stampDataUrl) : sheetModelToXlsx(model);

    const now = new Date().toISOString();
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    // Timestamp suffix avoids overwriting documents that share number + date.
    const r2Key = `${docType}/${date}-${number}-${Date.parse(now)}.${ext}`;
    const bucket = context.cloudflare.env[bucketKey];
    await bucket.put(r2Key, buffer, {
      httpMetadata: {
        contentType:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

    const actorEmail = context.user?.email ?? 'unknown';

    const [doc] = await context.db
      .insert(documentTable)
      .values({
        templateId,
        companyId,
        documentType: docType,
        dataJson: JSON.stringify({ fields, lineItems: rawItems, includeStamp }),
        createdBy: actorEmail,
        createdAt: now,
        exportedAt: now,
        exportFormat: format,
        r2Key,
      })
      .returning();

    await context.db.insert(documentAuditLog).values({
      documentId: doc.id,
      action: 'created',
      actorEmail,
      timestamp: now,
    });

    // Redirect from the action so React Router drives the navigation to the new
    // document (a client-side navigate() after the fetcher leaves a blank page).
    return redirect(`/documents/${docType}/${doc.id}`);
  } catch (e) {
    console.error(e);
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type GenerateDocumentAction = typeof action;
