import type { ColumnDef } from '@tanstack/react-table';
import { FileStack } from 'lucide-react';
import { Link } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { Typography } from '~/components/ui/typography';
import { documentTemplate, type DocumentTemplate } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/documents/settings/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

const DOCUMENT_TYPES = ['invoices', 'bills', 'poas'] as const;

const TYPE_LABELS: Record<string, string> = {
  invoices: i['/documents/invoices'].title,
  bills: i['/documents/bills'].title,
  poas: i['/documents/poas'].title,
};

export async function loader({ context }: Route.LoaderArgs) {
  const templates = await context.db.select().from(documentTemplate);
  return { data: { templates } };
}

export default function DocumentSettings({ loaderData: { data } }: Route.ComponentProps) {
  const t = i.documents;
  const totalTemplates = data.templates.length;

  const columns: ColumnDef<DocumentTemplate>[] = [
    { accessorKey: 'name', header: t.templates.table.headers.name },
    { accessorKey: 'createdAt', header: t.templates.table.headers.createdAt },
    { accessorKey: 'updatedAt', header: t.templates.table.headers.updatedAt },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Typography variant="h3">{t.actions.settings}</Typography>
        <p className="text-muted-foreground text-sm mt-1">{t.settingsDescription}</p>
      </div>

      {totalTemplates === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileStack className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{t.templatesEmpty}</p>
            <p className="text-muted-foreground text-sm mt-1">{t.settingsEmptyHint}</p>
          </div>
          <div className="flex gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <Link key={type} to={`/documents/${type}/settings/new`}>
                <Button variant="outline" size="sm">
                  {TYPE_LABELS[type]}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        DOCUMENT_TYPES.map((type) => {
          const templates = data.templates.filter((tmpl) => tmpl.type === type);
          return (
            <div key={type} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Typography variant="h4">{TYPE_LABELS[type]}</Typography>
                <Link to={`/documents/${type}/settings/new`}>
                  <Button variant="outline" size="sm">
                    {t.actions.newTemplate}
                  </Button>
                </Link>
              </div>

              {templates.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">{t.templatesEmpty}</p>
              ) : (
                <DataTable
                  data={templates}
                  columns={columns}
                  onRowClick={(row) => {
                    window.location.href = `/documents/${type}/settings/${row.id}`;
                  }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export const ErrorBoundary = EB;
