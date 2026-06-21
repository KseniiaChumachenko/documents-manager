import { eq } from 'drizzle-orm';

import { document as documentTable, documentAuditLog } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/export-document';

// Legacy per-type buckets, kept only as a read-fallback for documents stored
// before storage consolidation. New documents live in the generic DOCUMENTS
// bucket. Remove once existing objects are migrated.
const LEGACY_BUCKET_MAP: Record<string, 'POAS' | 'INVOICES' | 'BILLS'> = {
  poas: 'POAS',
  invoices: 'INVOICES',
  bills: 'BILLS',
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));

  if (!id) {
    return new Response('ID is required', { status: 400 });
  }

  const [doc] = await context.db.select().from(documentTable).where(eq(documentTable.id, id));

  if (!doc || !doc.r2Key) {
    return new Response('Document not found or not exported', { status: 404 });
  }

  // New documents are in the generic DOCUMENTS bucket; fall back to the legacy
  // per-type bucket for objects stored before consolidation.
  let object = await context.cloudflare.env.DOCUMENTS.get(doc.r2Key);
  if (!object) {
    const legacyKey = LEGACY_BUCKET_MAP[doc.documentType];
    if (legacyKey) {
      object = await context.cloudflare.env[legacyKey].get(doc.r2Key);
    }
  }

  if (!object) {
    return new Response('File not found in storage', { status: 404 });
  }

  // Write audit log entry
  await context.db.insert(documentAuditLog).values({
    documentId: doc.id,
    action: 'exported',
    actorEmail: context.user?.email ?? 'unknown',
    timestamp: new Date().toISOString(),
  });

  const ext = doc.r2Key.split('.').pop();
  const contentType =
    ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const filename = doc.r2Key.split('/').pop();

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
