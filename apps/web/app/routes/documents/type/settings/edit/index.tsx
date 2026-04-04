import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { useNavigate, useFetcher } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { documentTemplate } from '~/database/schema';
import { i18n as i } from '~/i18n';
import type { TemplateManagementAction } from '~/routes/documents/_api/template-management';

import type { Route } from '../../../../../../.react-router/types/app/routes/documents/type/settings/edit/+types';

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

interface SchemaField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

interface SchemaLineItems {
  columns: string[];
  allow_price_override?: boolean;
}

interface SchemaTotal {
  label: string;
  formula: string;
}

interface ParsedSchema {
  fields?: SchemaField[];
  line_items?: SchemaLineItems;
  totals?: SchemaTotal[];
}

const COLUMN_LABELS: Record<string, string> = {
  name: 'Назва',
  unit: 'Одиниця',
  quantity: 'Кількість',
  price_override: 'Ціна',
  total: 'Сума',
};

function TemplatePreview({ schemaJson, name }: { schemaJson: string; name: string }) {
  let schema: ParsedSchema;
  try {
    schema = JSON.parse(schemaJson);
  } catch {
    return <div className="text-destructive text-sm p-4">Помилка в JSON — перевірте синтаксис</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{name || 'Без назви'}</h3>
      <Separator />

      {/* Fields preview */}
      {schema.fields && schema.fields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Поля документу</h4>
          <div className="grid grid-cols-2 gap-3">
            {schema.fields.map((field) => (
              <div key={field.key}>
                <Label className="text-xs">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                {field.type === 'date' ? (
                  <Input type="date" disabled className="mt-1" />
                ) : field.type === 'company_ref' ? (
                  <div className="mt-1 h-9 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    Обрати контрагента...
                  </div>
                ) : (
                  <Input disabled placeholder={field.label} className="mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line items preview */}
      {schema.line_items && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Товари / послуги</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">№</th>
                  {schema.line_items.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium">
                      {COLUMN_LABELS[col] ?? col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-2 text-muted-foreground">1</td>
                  {schema.line_items.columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-muted-foreground">
                      {col === 'name'
                        ? 'Приклад товару'
                        : col === 'unit'
                          ? 'шт'
                          : col === 'quantity'
                            ? '10'
                            : col === 'price_override'
                              ? '150.00'
                              : col === 'total'
                                ? '1 500.00'
                                : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">2</td>
                  {schema.line_items.columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-muted-foreground">
                      {col === 'name'
                        ? 'Інший товар'
                        : col === 'unit'
                          ? 'кг'
                          : col === 'quantity'
                            ? '5'
                            : col === 'price_override'
                              ? '200.00'
                              : col === 'total'
                                ? '1 000.00'
                                : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totals preview */}
      {schema.totals && schema.totals.length > 0 && (
        <div className="space-y-1 text-sm">
          {schema.totals.map((total, idx) => (
            <div
              key={idx}
              className={`flex justify-between ${idx === schema.totals!.length - 1 ? 'font-bold' : ''}`}
            >
              <span>{total.label}</span>
              <span className="text-muted-foreground">
                {idx === 0 ? '2 500.00' : idx === 1 ? '500.00' : '3 000.00'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stamp indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
        <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs">
          М.П.
        </div>
        <span>Місце для печатки</span>
      </div>
    </div>
  );
}

export async function loader({ params: { type, templateId }, context }: Route.LoaderArgs) {
  let template = null;
  if (templateId && templateId !== 'new') {
    const [found] = await context.db
      .select()
      .from(documentTemplate)
      .where(eq(documentTemplate.id, Number(templateId)));
    template = found ?? null;
  }

  return { data: { template }, type };
}

export default function TemplateEditor({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = i.documents;
  const navigate = useNavigate();
  const fetcher = useFetcher<TemplateManagementAction>();
  const isEditing = !!data.template;

  const [name, setName] = useState(data.template?.name ?? '');
  const [schemaJson, setSchemaJson] = useState(
    data.template?.schemaJson ?? getDefaultSchema(type!)
  );

  const handleSave = () => {
    const formData = new FormData();
    if (data.template) {
      formData.set('id', String(data.template.id));
    }
    formData.set('name', name);
    formData.set('type', type!);
    formData.set('schemaJson', schemaJson);

    fetcher.submit(formData, {
      method: 'POST',
      action: '/documents/template-management',
    });
  };

  const handleDelete = () => {
    if (!data.template) return;
    fetcher.submit(null, {
      method: 'DELETE',
      action: `/documents/template-management?id=${data.template.id}`,
    });
  };

  // Redirect on success
  useEffect(() => {
    if (fetcher.data && !fetcher.data.error) {
      navigate('/documents/settings');
    }
  }, [fetcher.data, navigate]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isEditing
            ? data.template!.name
            : `${t.actions.newTemplate} ${t.typeLabels[type!] ?? ''}`}
        </h2>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete}>
              {t.actions.delete}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!name || fetcher.state !== 'idle'}>
            {t.actions.save}
          </Button>
        </div>
      </div>

      {fetcher.data?.error && <p className="text-destructive text-sm">{fetcher.data.error}</p>}

      {/* Name field */}
      <div>
        <Label htmlFor="name">{t.templates.form.name}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {/* Split view: editor + preview */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: JSON editor */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="schemaJson">{t.templates.form.schema}</Label>
          <textarea
            id="schemaJson"
            value={schemaJson}
            onChange={(e) => setSchemaJson(e.target.value)}
            className="flex-1 min-h-[500px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none"
          />
        </div>

        {/* Right: live preview */}
        <div className="flex flex-col gap-1">
          <Label>Попередній перегляд</Label>
          <div className="flex-1 min-h-[500px] rounded-md border border-input bg-muted/30 p-4 overflow-auto">
            <TemplatePreview schemaJson={schemaJson} name={name} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const ErrorBoundary = EB;
