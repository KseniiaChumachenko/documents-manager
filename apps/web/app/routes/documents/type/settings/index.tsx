import type { ColumnDef } from '@tanstack/react-table';
import { eq } from 'drizzle-orm';
import { FileStack } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t.actions.settings}</h3>
          <p className="text-muted-foreground text-sm">{t.settingsDescription}</p>
        </div>
        <Link to={`/documents/${type}/settings/new`}>
          <Button>{t.actions.newTemplate}</Button>
        </Link>
      </div>

      {data.templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileStack className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium">{t.templatesEmpty}</p>
          <p className="text-muted-foreground text-sm">{t.noTemplatesHint}</p>
          <Link to={`/documents/${type}/settings/new`}>
            <Button>{t.actions.newTemplate}</Button>
          </Link>
        </div>
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
