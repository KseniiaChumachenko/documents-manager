import type { ColumnDef } from '@tanstack/react-table';
import { eq } from 'drizzle-orm';
import { useState } from 'react';
import { useFetcher } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { documentTemplate, type DocumentTemplate } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';
import type { TemplateManagementAction } from '~/routes/documents/_api/template-management';

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

const DEFAULT_SCHEMAS: Record<string, object> = {
  poas: {
    fields: [
      { key: 'number', label: '№ довіреності', type: 'text', required: true },
      { key: 'date', label: 'Дата видачі', type: 'date', required: true },
      { key: 'valid_until', label: 'Дійсна до', type: 'date', required: true },
      { key: 'company_id', label: 'Контрагент', type: 'company_ref', required: true },
      { key: 'recipient_name', label: 'ПІБ довіреної особи', type: 'text', required: true },
      { key: 'recipient_passport', label: 'Паспорт довіреної особи', type: 'text' },
    ],
    line_items: {
      source: 'items',
      columns: ['name', 'unit', 'quantity'],
      allow_price_override: false,
    },
    totals: [],
  },
  invoices: {
    fields: [
      { key: 'number', label: '№ рахунку', type: 'text', required: true },
      { key: 'date', label: 'Дата', type: 'date', required: true },
      { key: 'company_id', label: 'Контрагент', type: 'company_ref', required: true },
      { key: 'payment_terms', label: 'Умови оплати', type: 'text' },
    ],
    line_items: {
      source: 'items',
      columns: ['name', 'unit', 'quantity', 'price_override', 'total'],
      allow_price_override: true,
    },
    totals: [
      { label: 'Сума без ПДВ', formula: 'sum(line_items.total)' },
      { label: 'ПДВ 20%', formula: 'sum(line_items.total) * 0.2' },
      { label: 'Разом з ПДВ', formula: 'sum(line_items.total) * 1.2' },
    ],
  },
  bills: {
    fields: [
      { key: 'number', label: '№ накладної', type: 'text', required: true },
      { key: 'date', label: 'Дата', type: 'date', required: true },
      { key: 'company_id', label: 'Контрагент', type: 'company_ref', required: true },
      { key: 'contract_number', label: '№ договору', type: 'text' },
      { key: 'contract_date', label: 'Дата договору', type: 'date' },
    ],
    line_items: {
      source: 'items',
      columns: ['name', 'unit', 'quantity', 'price_override', 'total'],
      allow_price_override: true,
    },
    totals: [
      { label: 'Сума без ПДВ', formula: 'sum(line_items.total)' },
      { label: 'ПДВ 20%', formula: 'sum(line_items.total) * 0.2' },
      { label: 'Разом з ПДВ', formula: 'sum(line_items.total) * 1.2' },
    ],
  },
};

function getDefaultSchema(type: string): string {
  const schema = DEFAULT_SCHEMAS[type] ?? DEFAULT_SCHEMAS.invoices;
  return JSON.stringify(schema, null, 2);
}

export default function TemplateSettings({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = i.documents;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const fetcher = useFetcher<TemplateManagementAction>();

  const columns: ColumnDef<DocumentTemplate>[] = [
    { accessorKey: 'name', header: t.templates.table.headers.name },
    { accessorKey: 'createdAt', header: t.templates.table.headers.createdAt },
    { accessorKey: 'updatedAt', header: t.templates.table.headers.updatedAt },
  ];

  const handleNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (row: DocumentTemplate) => {
    setEditing(row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={handleNew}>{t.actions.newTemplate}</Button>
      </div>

      {data.templates.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">{t.templatesEmpty}</p>
      ) : (
        <DataTable data={data.templates} columns={columns} onRowClick={handleEdit} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? editing.name : t.actions.newTemplate}</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <fetcher.Form
            method="POST"
            action="/documents/template-management"
            onSubmit={() => {
              setTimeout(handleClose, 100);
            }}
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <input type="hidden" name="type" value={type} />

            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="name">{t.templates.form.name}</Label>
                <Input id="name" name="name" defaultValue={editing?.name ?? ''} required />
              </div>

              <div>
                <Label htmlFor="schemaJson">{t.templates.form.schema}</Label>
                <textarea
                  id="schemaJson"
                  name="schemaJson"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  defaultValue={editing?.schemaJson ?? getDefaultSchema(type!)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              {editing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    fetcher.submit(null, {
                      method: 'DELETE',
                      action: `/documents/template-management?id=${editing.id}`,
                    });
                    handleClose();
                  }}
                >
                  {t.actions.delete}
                </Button>
              )}
              <DialogClose asChild>
                <Button type="submit">{t.actions.save}</Button>
              </DialogClose>
            </DialogFooter>
          </fetcher.Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ErrorBoundary = EB;
