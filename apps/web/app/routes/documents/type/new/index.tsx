import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useFetcher } from 'react-router';

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

interface LineItemRow {
  itemId: string;
  quantity: number;
  priceOverride: string;
}

export default function NewDocument({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = i.documents;
  const navigate = useNavigate();
  const fetcher = useFetcher<GenerateDocumentAction>();
  const [submitted, setSubmitted] = useState(false);

  const [templateId, setTemplateId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState('xlsx');
  const [includeStamp, setIncludeStamp] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { itemId: '', quantity: 1, priceOverride: '' },
  ]);

  const addLineItem = () => {
    setLineItems([...lineItems, { itemId: '', quantity: 1, priceOverride: '' }]);
  };

  const updateLineItem = (idx: number, field: keyof LineItemRow, value: string | number) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const getItemPrice = (itemId: string): number => {
    const item = data.items.find((i) => String(i.id) === itemId);
    return item?.priceOutputVATFree ?? 0;
  };

  const computeLineTotal = (li: LineItemRow): number => {
    const price = li.priceOverride ? Number(li.priceOverride) : getItemPrice(li.itemId);
    return price * li.quantity;
  };

  const subtotal = lineItems.reduce((sum, li) => sum + computeLineTotal(li), 0);
  const vat = Math.round(subtotal * 0.2 * 100) / 100;
  const total = subtotal + vat;

  const hasLineItems = lineItems.some((li) => li.itemId);
  const missingTemplate = !templateId;
  const missingCompany = !companyId;
  const missingNumber = !number;
  const missingLineItems = !hasLineItems;

  const handleSubmit = () => {
    setSubmitted(true);

    if (missingTemplate || missingCompany || missingNumber || missingLineItems) {
      return;
    }

    const formData = new FormData();
    formData.set('templateId', templateId);
    formData.set('companyId', companyId);
    formData.set('documentType', type!);
    formData.set('number', number);
    formData.set('date', date);
    formData.set('format', format);
    formData.set('includeStamp', String(includeStamp));
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

    fetcher.submit(formData, {
      method: 'POST',
      action: '/documents/generate-document',
    });
  };

  // Redirect on success
  useEffect(() => {
    if (fetcher.data?.data?.id) {
      navigate(`/documents/${type}/${fetcher.data.data.id}`);
    }
  }, [fetcher.data, navigate, type]);

  // No templates — guide user to settings
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

      {/* Template & basic fields */}
      <div className="grid grid-cols-2 gap-4">
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
          {submitted && missingTemplate && (
            <p className="text-destructive text-xs mt-1">{t.validation.templateRequired}</p>
          )}
        </div>

        <div>
          <Label>{t.form.company} *</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.form.company} />
            </SelectTrigger>
            <SelectContent>
              {data.companies.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitted && missingCompany && (
            <p className="text-destructive text-xs mt-1">{t.validation.companyRequired}</p>
          )}
        </div>

        <div>
          <Label>{t.form.number} *</Label>
          <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          {submitted && missingNumber && (
            <p className="text-destructive text-xs mt-1">{t.validation.numberRequired}</p>
          )}
        </div>

        <div>
          <Label>{t.form.date}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <div>
        <h3 className="font-medium mb-2">{t.form.lineItems.title} *</h3>
        {submitted && missingLineItems && (
          <p className="text-destructive text-xs mb-2">{t.validation.lineItemRequired}</p>
        )}
        <div className="flex flex-col gap-2">
          {lineItems.map((li, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
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

              <div className="col-span-2">
                {idx === 0 && <Label className="text-xs">{t.form.lineItems.priceOverride}</Label>}
                <Input
                  type="number"
                  placeholder={String(getItemPrice(li.itemId))}
                  value={li.priceOverride}
                  onChange={(e) => updateLineItem(idx, 'priceOverride', e.target.value)}
                />
              </div>

              <div className="col-span-2 text-right font-medium text-sm py-2">
                {computeLineTotal(li).toFixed(2)}
              </div>

              <div className="col-span-2">
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

      {/* Totals */}
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
