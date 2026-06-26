import { eq } from 'drizzle-orm';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import {
  company,
  document as documentTable,
  documentAuditLog,
  documentTemplate,
} from '~/database/schema';
import { getTitle, tns } from '~/i18n';

import type { Route } from '../../../../../.react-router/types/app/routes/documents/type/id/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ params: { type, id }, context }: Route.LoaderArgs) {
  const docId = Number(id);

  const [doc] = await context.db.select().from(documentTable).where(eq(documentTable.id, docId));

  if (!doc) {
    throw new Response('Not found', { status: 404 });
  }

  const [template] = await context.db
    .select()
    .from(documentTemplate)
    .where(eq(documentTemplate.id, doc.templateId));

  const [companyRecord] = await context.db
    .select()
    .from(company)
    .where(eq(company.id, doc.companyId));

  const auditLogs = await context.db
    .select()
    .from(documentAuditLog)
    .where(eq(documentAuditLog.documentId, docId));

  return {
    data: {
      document: doc,
      template,
      company: companyRecord,
      auditLogs,
    },
    type,
  };
}

export default function DocumentDetail({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = tns('/documents');
  const doc = data.document;
  let parsedData: {
    fields?: Record<string, string>;
    lineItems?: Array<{ itemId: number; quantity: number; priceOverride?: number }>;
  } = {};
  try {
    parsedData = JSON.parse(doc.dataJson);
  } catch {
    // ignore
  }
  const number = parsedData.fields?.number;
  const date = parsedData.fields?.date;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">
          {data.template?.name} {number ? `${t.detail.numberLabel} ${number}` : ''}{' '}
          {date ? `${t.detail.dateLabel} ${date}` : ''}
        </h2>
        <p className="text-muted-foreground text-sm">
          {data.company?.name}
          {data.company?.egrpou ? ` (ЄДРПОУ: ${data.company.egrpou})` : ''}
        </p>
      </div>

      {/* Document info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">{t.table.headers.createdBy}: </span>
          {doc.createdBy}
        </div>
        <div>
          <span className="text-muted-foreground">{t.table.headers.createdAt}: </span>
          {doc.createdAt}
        </div>
        {doc.exportFormat && (
          <div>
            <span className="text-muted-foreground">{t.table.headers.exportStatus}: </span>
            {doc.exportFormat.toUpperCase()}
          </div>
        )}
      </div>

      {/* Download the generated file in the format it was created with */}
      <div className="flex gap-2">
        <a href={`/documents/export-document?id=${doc.id}`}>
          <Button>
            {doc.exportFormat === 'pdf' ? t.actions.export.pdf : t.actions.export.xlsx}
          </Button>
        </a>
      </div>

      {/* Audit log */}
      <div>
        <h3 className="font-medium mb-2">{t.audit.title}</h3>
        {data.auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">-</p>
        ) : (
          <div className="border rounded-md divide-y text-sm">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="flex justify-between px-3 py-2">
                <span>
                  {t.audit.actions[log.action as keyof typeof t.audit.actions] ?? log.action}
                </span>
                <span className="text-muted-foreground">
                  {log.actorEmail} - {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const ErrorBoundary = EB;
