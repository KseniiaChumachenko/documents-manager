import type { ColumnDef } from '@tanstack/react-table';
import { eq } from 'drizzle-orm';
import { Link } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { company, document as documentTable, type Document } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/documents/type/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

type DocumentRow = Document & { companyName: string };

export async function loader({ params: { type }, context }: Route.LoaderArgs) {
  const docs = await context.db
    .select({
      id: documentTable.id,
      templateId: documentTable.templateId,
      companyId: documentTable.companyId,
      documentType: documentTable.documentType,
      dataJson: documentTable.dataJson,
      createdBy: documentTable.createdBy,
      createdAt: documentTable.createdAt,
      exportedAt: documentTable.exportedAt,
      exportFormat: documentTable.exportFormat,
      r2Key: documentTable.r2Key,
      companyName: company.name,
    })
    .from(documentTable)
    .leftJoin(company, eq(documentTable.companyId, company.id))
    .where(eq(documentTable.documentType, type!));

  return { data: { documents: docs }, type };
}

export default function DocumentList({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = i.documents;

  const columns: ColumnDef<DocumentRow>[] = [
    { accessorKey: 'id', header: t.table.headers.number },
    {
      accessorKey: 'dataJson',
      header: t.table.headers.date,
      cell: ({ row }) => {
        try {
          const parsed = JSON.parse(row.original.dataJson);
          return parsed.date ?? '';
        } catch {
          return '';
        }
      },
    },
    { accessorKey: 'companyName', header: t.table.headers.company },
    { accessorKey: 'createdBy', header: t.table.headers.createdBy },
    { accessorKey: 'exportFormat', header: t.table.headers.exportStatus },
    { accessorKey: 'createdAt', header: t.table.headers.createdAt },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link to={`/documents/${type}/new`}>
          <Button>{t.actions.newDocument}</Button>
        </Link>
      </div>

      {data.documents.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">{t.empty}</p>
      ) : (
        <DataTable
          data={data.documents as DocumentRow[]}
          columns={columns}
          onRowClick={(row) => {
            window.location.href = `/documents/${type}/${row.id}`;
          }}
        />
      )}
    </div>
  );
}

export const ErrorBoundary = EB;
