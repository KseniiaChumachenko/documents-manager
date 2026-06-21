import { eq } from 'drizzle-orm';
import { useEffect, useMemo, useState } from 'react';
import { Link, useFetcher } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { company, documentTemplate, item as itemTable } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';
import type { GenerateDocumentAction } from '~/routes/documents/_api/generate-document';

import type { Route } from '../../../../../.react-router/types/app/routes/documents/type/new/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ params: { type }, context }: Route.LoaderArgs) {
  const [templates, companies, items] = await Promise.all([
    context.db.select().from(documentTemplate).where(eq(documentTemplate.type, type!)),
    context.db.select().from(company),
    context.db.select().from(itemTable),
  ]);

  return { data: { templates, companies, items }, type };
}

interface SchemaField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

interface ParsedSchema {
  fields?: SchemaField[];
  line_items?: { columns?: string[] };
  vat_rate?: number;
}

interface LineItemRow {
  itemId: string;
  quantity: number;
  priceOverride: string;
}

function parseSchema(json?: string): ParsedSchema {
  if (!json) return {};
  try {
    return JSON.parse(json) as ParsedSchema;
  } catch {
    return {};
  }
}

export default function NewDocument({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = i.documents;
  const fetcher = useFetcher<GenerateDocumentAction>();
  const [submitted, setSubmitted] = useState(false);

  const [templateId, setTemplateId] = useState(
    data.templates[0] ? String(data.templates[0].id) : ''
  );
  const [format, setFormat] = useState('xlsx');
  const [includeStamp, setIncludeStamp] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { itemId: '', quantity: 1, priceOverride: '' },
  ]);

  const selectedTemplate = data.templates.find((tmpl) => String(tmpl.id) === templateId);
  const schema = useMemo(() => parseSchema(selectedTemplate?.schemaJson), [selectedTemplate]);
  const schemaFields = schema.fields ?? [];
  const columns = schema.line_items?.columns ?? [];
  const showPrices = columns.includes('price_override') || columns.includes('total');
  const vatRate = type === 'poas' ? 0 : typeof schema.vat_rate === 'number' ? schema.vat_rate : 0.2;

  // Reset captured values when the chosen template changes; default a `date`
  // field to today.
  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const f of schemaFields) {
      if (f.type === 'date' && f.key === 'date') {
        defaults[f.key] = new Date().toISOString().split('T')[0];
      }
    }
    setFieldValues(defaults);
    setCompanyId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const setField = (key: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [key]: value }));

  const addLineItem = () =>
    setLineItems([...lineItems, { itemId: '', quantity: 1, priceOverride: '' }]);
  const updateLineItem = (idx: number, field: keyof LineItemRow, value: string | number) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  const getItemPrice = (itemId: string): number => {
    const item = data.items.find((it) => String(it.id) === itemId);
    return item?.priceSaleVATFree ?? 0;
  };
  const computeLineTotal = (li: LineItemRow): number => {
    const price = li.priceOverride ? Number(li.priceOverride) : getItemPrice(li.itemId);
    return price * li.quantity;
  };

  const subtotal = lineItems.reduce((sum, li) => sum + computeLineTotal(li), 0);
  const vat = Math.round(subtotal * vatRate * 100) / 100;
  const total = subtotal + vat;

  const hasLineItems = lineItems.some((li) => li.itemId);

  const missingFields = (): boolean => {
    for (const f of schemaFields) {
      if (!f.required) continue;
      if (f.type === 'company_ref') {
        if (!companyId) return true;
      } else if (!fieldValues[f.key]?.trim()) {
        return true;
      }
    }
    return false;
  };
  const isFieldMissing = (f: SchemaField): boolean =>
    submitted &&
    !!f.required &&
    (f.type === 'company_ref' ? !companyId : !fieldValues[f.key]?.trim());

  const handleSubmit = () => {
    setSubmitted(true);
    if (missingFields() || !hasLineItems) return;

    const formData = new FormData();
    formData.set('templateId', templateId);
    formData.set('companyId', companyId);
    formData.set('documentType', type!);
    formData.set('format', format);
    formData.set('includeStamp', String(includeStamp));
    formData.set('fields', JSON.stringify(fieldValues));
    formData.set(
      'lineItems',
      JSON.stringify(
        lineItems
          .filter((li) => li.itemId)
          .map((li) => ({
            itemId: Number(li.itemId),
            quantity: li.quantity,
            priceOverride: li.priceOverride ? Number(li.priceOverride) : undefined,
          }))
      )
    );

    fetcher.submit(formData, { method: 'POST', action: '/documents/generate-document' });
  };

  if (data.templates.length === 0) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <h2 className="text-xl font-semibold">
          {t.actions.newDocument} {t.typeLabels[type!] ?? ''}
        </h2>
        <p className="text-muted-foreground">{t.noTemplatesHint}</p>
        <Link to={`/documents/${type}/settings/new`}>
          <Button variant="outline">
            {t.actions.newTemplate} {t.typeLabels[type!] ?? ''}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h2 className="text-xl font-semibold">
        {t.actions.newDocument} {t.typeLabels[type!] ?? ''}
      </h2>

      {fetcher.data?.error && <p className="text-destructive text-sm">{fetcher.data.error}</p>}

      {/* Template selector */}
      <div>
        <Label>{t.form.template} *</Label>
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.form.template} />
          </SelectTrigger>
          <SelectContent>
            {data.templates.map((tmpl) => (
              <SelectItem key={tmpl.id} value={String(tmpl.id)}>
                {tmpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic fields from the template schema */}
      <div className="grid grid-cols-2 gap-4">
        {schemaFields.map((field) => (
          <div key={field.key} className={field.type === 'company_ref' ? 'col-span-2' : ''}>
            <Label htmlFor={field.key}>
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
            {field.type === 'company_ref' ? (
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id={field.key} aria-label={field.label} className="w-full">
                  <SelectValue placeholder={field.label} />
                </SelectTrigger>
                <SelectContent>
                  {data.companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.key}
                type={field.type === 'date' ? 'date' : 'text'}
                value={fieldValues[field.key] ?? ''}
                onChange={(e) => setField(field.key, e.target.value)}
              />
            )}
            {isFieldMissing(field) && (
              <p className="text-destructive text-xs mt-1">{t.validation.fieldRequired}</p>
            )}
          </div>
        ))}
      </div>

      {/* Line items */}
      <div>
        <h3 className="font-medium mb-2">{t.form.lineItems.title} *</h3>
        {submitted && !hasLineItems && (
          <p className="text-destructive text-xs mb-2">{t.validation.lineItemRequired}</p>
        )}
        <div className="flex flex-col gap-2">
          {lineItems.map((li, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                {idx === 0 && <Label className="text-xs">{t.form.lineItems.item}</Label>}
                <Select value={li.itemId} onValueChange={(v) => updateLineItem(idx, 'itemId', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.form.lineItems.item} />
                  </SelectTrigger>
                  <SelectContent>
                    {data.items.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                {idx === 0 && <Label className="text-xs">{t.form.lineItems.quantity}</Label>}
                <Input
                  type="number"
                  min={1}
                  value={li.quantity}
                  onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                />
              </div>

              {showPrices && (
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-xs">{t.form.lineItems.priceOverride}</Label>}
                  <Input
                    type="number"
                    placeholder={String(getItemPrice(li.itemId))}
                    value={li.priceOverride}
                    onChange={(e) => updateLineItem(idx, 'priceOverride', e.target.value)}
                  />
                </div>
              )}

              {showPrices && (
                <div className="col-span-2 text-right font-medium text-sm py-2">
                  {computeLineTotal(li).toFixed(2)}
                </div>
              )}

              <div className="col-span-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                  x
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            {t.form.lineItems.add}
          </Button>
        </div>
      </div>

      {/* Totals (hidden for documents without prices, e.g. powers of attorney) */}
      {showPrices && (
        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{t.form.totals.subtotal}</span>
            <span className="font-medium">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.form.totals.vat}</span>
            <span className="font-medium">{vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>{t.form.totals.total}</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeStamp}
            onChange={(e) => setIncludeStamp(e.target.checked)}
          />
          {t.form.includeStamp}
        </label>

        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="xlsx">XLSX</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={fetcher.state !== 'idle'}>
          {t.actions.save}
        </Button>
      </div>
    </div>
  );
}

export const ErrorBoundary = EB;
