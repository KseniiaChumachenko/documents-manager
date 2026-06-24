import { redirect } from 'react-router';

import { document as documentTable, documentAuditLog } from '~/database/schema';
import { renderDocument } from '~/lib/render-document';

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

    const result = await renderDocument(context, {
      templateId,
      companyId,
      docType,
      fields,
      rawItems,
      includeStamp,
      format,
    });
    if ('error' in result) {
      return { data: null, error: result.error };
    }

    const now = new Date().toISOString();
    // Timestamp suffix avoids overwriting documents that share number + date.
    const r2Key = `${docType}/${date}-${number}-${Date.parse(now)}.${result.ext}`;
    await context.cloudflare.env[bucketKey].put(r2Key, result.buffer, {
      httpMetadata: { contentType: result.contentType },
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
