import { desc, eq } from 'drizzle-orm';
import type { AppLoadContext } from 'react-router';

import {
  company as companyTable,
  documentTemplate,
  item as itemTable,
  myCompany,
  stamp,
} from '~/database/schema';

import type { Layout, RenderContext } from './document-layout';
import { renderLayout } from './document-renderer';
import {
  computeTotals,
  resolveLineItems,
  sheetModelToPdf,
  sheetModelToXlsx,
  type LineItem,
  type SupplierIdentity,
} from './generate-document';

export interface RenderRequest {
  templateId: number;
  companyId: number;
  docType: string;
  fields: Record<string, string>;
  rawItems: Array<{ itemId: number; quantity: number; priceOverride?: number }>;
  includeStamp: boolean;
  format: string; // 'xlsx' | 'pdf'
}

export interface RenderedDocument {
  buffer: ArrayBuffer;
  ext: 'xlsx' | 'pdf';
  contentType: string;
}

function vatRateFor(docType: string, schema: Record<string, unknown>): number {
  if (docType === 'poas') return 0;
  if (typeof schema.vat_rate === 'number') return schema.vat_rate;
  return 0.2;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Build a document file (XLSX or PDF) from stored/submitted data. Shared by the
 * generate action and the export loader so any document can be downloaded in
 * either format — the file is rendered from the data, not a stored blob.
 */
export async function renderDocument(
  context: AppLoadContext,
  req: RenderRequest
): Promise<RenderedDocument | { error: string }> {
  const { db } = context;

  const [template] = await db
    .select()
    .from(documentTemplate)
    .where(eq(documentTemplate.id, req.templateId));
  const [counterparty] = await db
    .select()
    .from(companyTable)
    .where(eq(companyTable.id, req.companyId));
  const [supplier] = await db.select().from(myCompany).limit(1);

  if (!template || !counterparty) return { error: 'Template or company not found' };
  if (!supplier) return { error: 'Спершу заповніть дані вашої компанії в налаштуваннях' };

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(template.schemaJson);
  } catch {
    return { error: 'Шаблон не містить розмітки (layout)' };
  }
  const layout = schema.layout as Layout | undefined;
  if (!layout) return { error: 'Шаблон не містить розмітки (layout)' };

  const lineItemsInput: LineItem[] = [];
  for (const raw of req.rawItems) {
    const [itemRecord] = await db.select().from(itemTable).where(eq(itemTable.id, raw.itemId));
    if (itemRecord) {
      lineItemsInput.push({
        item: itemRecord,
        quantity: raw.quantity,
        priceOverride: raw.priceOverride,
      });
    }
  }
  const lines = resolveLineItems(lineItemsInput);
  const vatRate = vatRateFor(req.docType, schema);

  let stampDataUrl: string | null = null;
  if (req.includeStamp) {
    // Prefer the stamp linked to this template; otherwise fall back to the most
    // recently uploaded stamp, so "upload a stamp + tick include" works without
    // having to link it to every template first.
    let stampRecord: typeof stamp.$inferSelect | undefined;
    if (template.stampId) {
      [stampRecord] = await db.select().from(stamp).where(eq(stamp.id, template.stampId));
    }
    if (!stampRecord) {
      [stampRecord] = await db.select().from(stamp).orderBy(desc(stamp.id)).limit(1);
    }
    if (stampRecord) {
      const obj = await context.cloudflare.env.TEMPLATES.get(stampRecord.imageKey);
      if (obj) {
        const ct = obj.httpMetadata?.contentType ?? 'image/png';
        stampDataUrl = `data:${ct};base64,${arrayBufferToBase64(await obj.arrayBuffer())}`;
      }
    }
  }

  const renderContext: RenderContext = {
    supplier: supplier as SupplierIdentity,
    counterparty: {
      name: counterparty.name,
      egrpou: counterparty.egrpou,
      phone: counterparty.phone,
    },
    field: req.fields,
    lines,
    totals: { ...computeTotals(lines, vatRate), vatRate, discount: 0 },
  };

  const model = renderLayout(layout, renderContext);
  const ext = req.format === 'pdf' ? 'pdf' : 'xlsx';
  const buffer = ext === 'pdf' ? sheetModelToPdf(model, stampDataUrl) : sheetModelToXlsx(model);
  const contentType =
    ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  return { buffer, ext, contentType };
}
