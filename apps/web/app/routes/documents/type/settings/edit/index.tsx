import { eq } from 'drizzle-orm';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useFetcher } from 'react-router';

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
import { documentTemplate, stamp as stampTable } from '~/database/schema';
import { tns } from '~/i18n';
import { BILL_LAYOUT, INVOICE_LAYOUT, POA_LAYOUT } from '~/lib/default-document-layouts';
import { renderLayout } from '~/lib/document-renderer';
import { sheetModelToHtml } from '~/lib/sheet-model-to-html';
import type { TemplateManagementAction } from '~/routes/documents/_api/template-management';

import type { Route } from '../../../../../../.react-router/types/app/routes/documents/type/settings/edit/+types';

const DEFAULT_SCHEMAS: Record<string, object> = {
  poas: {
    fields: [
      { key: 'number', label: '№ довіреності', type: 'text', required: true },
      { key: 'date', label: 'Дата видачі', type: 'date', required: true },
      { key: 'valid_until', label: 'Дійсна до', type: 'date', required: true },
      {
        key: 'company_id',
        label: 'Постачальник (від кого отримати)',
        type: 'company_ref',
        required: true,
      },
      { key: 'invoice_ref', label: 'За рахунком №', type: 'text' },
      { key: 'recipient_name', label: 'ПІБ довіреної особи', type: 'text', required: true },
      { key: 'recipient_position', label: 'Посада довіреної особи', type: 'text' },
      { key: 'recipient_passport_series', label: 'Серія паспорту', type: 'text' },
      { key: 'recipient_passport_number', label: '№ паспорту', type: 'text' },
      { key: 'recipient_passport_date', label: 'Дата видачі паспорту', type: 'date' },
      { key: 'recipient_passport_issued_by', label: 'Ким виданий паспорт', type: 'text' },
    ],
    line_items: {
      source: 'items',
      columns: ['name', 'unit', 'quantity'],
      allow_price_override: false,
    },
    totals: [],
    layout: POA_LAYOUT,
  },
  invoices: {
    fields: [
      { key: 'number', label: '№ рахунку-фактури', type: 'text', required: true },
      { key: 'date', label: 'Дата', type: 'date', required: true },
      { key: 'company_id', label: 'Одержувач', type: 'company_ref', required: true },
      { key: 'contract_number', label: '№ договору', type: 'text' },
      { key: 'contract_date', label: 'Дата договору', type: 'date' },
      { key: 'valid_until', label: 'Рахунок дійсний до', type: 'date' },
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
    layout: INVOICE_LAYOUT,
  },
  bills: {
    fields: [
      { key: 'number', label: '№ видаткової накладної', type: 'text', required: true },
      { key: 'date', label: 'Дата', type: 'date', required: true },
      { key: 'company_id', label: 'Одержувач', type: 'company_ref', required: true },
      { key: 'invoice_ref', label: 'Замовлення (рахунок-фактура)', type: 'text' },
      { key: 'sales_terms', label: 'Умова продажу', type: 'text' },
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
    layout: BILL_LAYOUT,
  },
};

function getDefaultSchema(type: string): string {
  const schema = DEFAULT_SCHEMAS[type] ?? DEFAULT_SCHEMAS.invoices;
  return JSON.stringify(schema, null, 2);
}

const SAMPLE = {
  supplier: {
    name: 'ФОП Зразок',
    egrpou: '00000000',
    inn: '00000000',
    vatCertificate: null,
    iban: 'UA00',
    bankName: 'БАНК',
    mfo: '000',
    phone: '000',
    address: 'Адреса',
    taxNote: '',
    signatoryName: 'І. П.',
  },
  counterparty: { name: 'ТОВ Зразок', phone: '000' },
  field: { number: '0001', date: '2024-12-26' },
  lines: [
    { name: 'Зразок 1', unit: 'шт.', quantity: 1, price: 100, total: 100 },
    { name: 'Зразок 2', unit: 'шт.', quantity: 2, price: 50, total: 100 },
  ],
  totals: { subtotal: 200, vat: 40, total: 240, vatRate: 0.2 },
};

function TemplatePreview({
  schemaJson,
}: {
  schemaJson: string;
  name: string;
  stampImageUrl?: string | null;
}) {
  let html = '';
  try {
    html = sheetModelToHtml(renderLayout(JSON.parse(schemaJson).layout, SAMPLE));
  } catch {
    return <div className="text-destructive text-sm p-4">Помилка в JSON — перевірте синтаксис</div>;
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

interface StampOption {
  id: number;
  name: string;
  dataUrl: string | null;
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

  // Fetch all stamps with preview data URLs
  const stamps = await context.db.select().from(stampTable);
  const stampOptions: StampOption[] = [];
  for (const s of stamps) {
    const obj = await context.cloudflare.env.TEMPLATES.get(s.imageKey);
    let dataUrl: string | null = null;
    if (obj) {
      const buf = await obj.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let j = 0; j < bytes.byteLength; j++) {
        binary += String.fromCharCode(bytes[j]);
      }
      const contentType = obj.httpMetadata?.contentType ?? 'image/png';
      dataUrl = `data:${contentType};base64,${btoa(binary)}`;
    }
    stampOptions.push({ id: s.id, name: s.name, dataUrl });
  }

  return { data: { template, stampOptions }, type };
}

export default function TemplateEditor({ loaderData: { data, type } }: Route.ComponentProps) {
  const t = tns('/documents');
  const navigate = useNavigate();
  const fetcher = useFetcher<TemplateManagementAction>();
  const isEditing = !!data.template;

  const [name, setName] = useState(data.template?.name ?? '');
  const [schemaJson, setSchemaJson] = useState(
    data.template?.schemaJson ?? getDefaultSchema(type!)
  );
  const [stampId, setStampId] = useState(
    data.template?.stampId ? String(data.template.stampId) : ''
  );

  const selectedStamp =
    stampId && stampId !== 'none'
      ? data.stampOptions.find((s) => String(s.id) === stampId)
      : undefined;

  const handleSave = () => {
    shouldRedirect.current = true;
    const formData = new FormData();
    if (data.template) {
      formData.set('id', String(data.template.id));
    }
    formData.set('name', name);
    formData.set('type', type!);
    formData.set('schemaJson', schemaJson);
    if (stampId && stampId !== 'none') {
      formData.set('stampId', stampId);
    }

    fetcher.submit(formData, {
      method: 'POST',
      action: '/documents/template-management',
    });
  };

  const handleDelete = () => {
    if (!data.template) return;
    shouldRedirect.current = true;
    fetcher.submit(null, {
      method: 'DELETE',
      action: `/documents/template-management?id=${data.template.id}`,
    });
  };

  // Redirect on success for save/delete only
  const shouldRedirect = useRef(false);

  useEffect(() => {
    if (fetcher.data && !fetcher.data.error && shouldRedirect.current) {
      shouldRedirect.current = false;
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
            : `${t.actions.newTemplate} ${t.typeLabels[type! as keyof typeof t.typeLabels] ?? ''}`}
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

      {/* Name + stamp selector */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">{t.templates.form.name}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <Label>{t.templates.form.stamp}</Label>
          <Select value={stampId} onValueChange={setStampId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Без печатки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без печатки</SelectItem>
              {data.stampOptions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  <span className="flex items-center gap-2">
                    {s.dataUrl && (
                      <img src={s.dataUrl} alt="" className="h-5 w-5 object-contain inline-block" />
                    )}
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            <TemplatePreview
              schemaJson={schemaJson}
              name={name}
              stampImageUrl={selectedStamp?.dataUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const ErrorBoundary = EB;
