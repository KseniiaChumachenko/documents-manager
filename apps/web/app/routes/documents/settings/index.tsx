import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate, Link } from 'react-router';

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

export async function loader({ context }: Route.LoaderArgs) {
  const templates = await context.db.select().from(documentTemplate);
  return { data: { templates } };
}

export default function DocumentSettings({ loaderData: { data } }: Route.ComponentProps) {
  const t = i.documents;
  const navigate = useNavigate();

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

      {DOCUMENT_TYPES.map((docType) => {
        const typeLabel = t.typeLabels[docType];
        const templates = data.templates.filter((tmpl) => tmpl.type === docType);
        return (
          <div key={docType} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Typography variant="h4">{typeLabel}</Typography>
              <Link to={`/documents/${docType}/settings/new`}>
                <Button variant="outline" size="sm">
                  {t.actions.newTemplate} {typeLabel}
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
                  navigate(`/documents/${docType}/settings/${row.id}`);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const ErrorBoundary = EB;
