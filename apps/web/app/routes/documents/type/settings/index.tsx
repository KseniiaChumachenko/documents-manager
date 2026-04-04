import type { ColumnDef } from '@tanstack/react-table';
import { eq } from 'drizzle-orm';
import { Link } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { documentTemplate, type DocumentTemplate } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';

import type { Route } from '../../../../../.react-router/types/app/routes/documents/type/settings/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ params: { type }, context }: Route.LoaderArgs) {
  const templates = await context.db
    .select()
    .from(documentTemplate)
    .where(eq(documentTemplate.type, type!));

  return { data: { templates }, type };
}

export default function TemplateSettings({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = i.documents;

  const columns: ColumnDef<DocumentTemplate>[] = [
    { accessorKey: 'name', header: t.templates.table.headers.name },
    { accessorKey: 'createdAt', header: t.templates.table.headers.createdAt },
    { accessorKey: 'updatedAt', header: t.templates.table.headers.updatedAt },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link to={`/documents/${type}/settings/new`}>
          <Button>{t.actions.newTemplate}</Button>
        </Link>
      </div>

      {data.templates.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">{t.templatesEmpty}</p>
      ) : (
        <DataTable
          data={data.templates}
          columns={columns}
          onRowClick={(row) => {
            window.location.href = `/documents/${type}/settings/${row.id}`;
          }}
        />
      )}
    </div>
  );
}

export const ErrorBoundary = EB;
