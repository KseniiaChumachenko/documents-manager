import { eq } from 'drizzle-orm';

import { document as documentTable, documentAuditLog } from '~/database/schema';
import { renderDocument } from '~/lib/render-document';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/export-document';

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'xlsx';

  if (!id) {
    return new Response('ID is required', { status: 400 });
  }

  const [doc] = await context.db.select().from(documentTable).where(eq(documentTable.id, id));
  if (!doc) {
    return new Response('Document not found', { status: 404 });
  }

  let data: { fields?: Record<string, string>; lineItems?: RawItems; includeStamp?: boolean };
  try {
    data = JSON.parse(doc.dataJson);
  } catch {
    return new Response('Document data is corrupt', { status: 500 });
  }

  // Regenerate in the requested format from the stored data, so every document
  // is downloadable as both XLSX and PDF regardless of how it was created.
  const result = await renderDocument(context, {
    templateId: doc.templateId,
    companyId: doc.companyId,
    docType: doc.documentType,
    fields: data.fields ?? {},
    rawItems: data.lineItems ?? [],
    includeStamp: !!data.includeStamp,
    format,
  });
  if ('error' in result) {
    return new Response(result.error, { status: 500 });
  }

  await context.db.insert(documentAuditLog).values({
    documentId: doc.id,
    action: 'exported',
    actorEmail: context.user?.email ?? 'unknown',
    timestamp: new Date().toISOString(),
  });

  // documentType (a fixed enum) and the numeric id are server-controlled, but
  // sanitize defensively and add the RFC 5987 form so the response header can
  // never be broken by CR/LF/quotes even if the name source changes later.
  const filename = `${doc.documentType}-${doc.id}.${result.ext}`.replace(/[\r\n"\\;]/g, '_');
  return new Response(result.buffer, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}

type RawItems = Array<{ itemId: number; quantity: number; priceOverride?: number }>;
