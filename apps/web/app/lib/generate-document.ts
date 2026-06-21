import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

import type { Item } from '~/database/schema';

import { hryvniaInWords, integerInWords } from './amount-in-words';
import { formatUaDateLong } from './format-ua';
import { registerCyrillicFont } from './pdf-font';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The business issuing the documents (the "Постачальник" identity block). */
export interface SupplierIdentity {
  name: string;
  egrpou: string | null;
  inn: string | null;
  vatCertificate?: string | null;
  iban: string | null;
  bankName: string | null;
  mfo: string | null;
  phone: string | null;
  address: string | null;
  taxNote: string | null;
  signatoryName: string | null;
}

export interface Counterparty {
  name: string;
  egrpou?: string | null;
  phone?: string | null;
}

export interface LineItem {
  item: Item;
  quantity: number;
  priceOverride?: number;
}

export interface ResolvedLineItem {
  name: string;
  unit: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface Totals {
  subtotal: number;
  vat: number;
  total: number;
}

export type DocumentType = 'invoices' | 'bills' | 'poas';

export interface DocumentBuildInput {
  docType: DocumentType;
  templateName: string;
  supplier: SupplierIdentity;
  counterparty: Counterparty;
  /** Captured field values keyed by template schema field key. */
  fields: Record<string, string>;
  lines: ResolvedLineItem[];
  /** VAT rate as a fraction, e.g. 0.2 for 20%, 0 for non-VAT payers. */
  vatRate: number;
}

type Cell = string | number | null;

export interface SheetModel {
  rows: Cell[][];
  merges?: XLSX.Range[];
  cols?: { wch: number }[];
}

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

/** Resolve raw line items to display rows. Bills the sale price (Відпускна, без ПДВ). */
export function resolveLineItems(lineItems: LineItem[]): ResolvedLineItem[] {
  return lineItems.map((li) => {
    const price = li.priceOverride ?? li.item.priceSaleVATFree;
    return {
      name: li.item.name,
      unit: li.item.unit,
      quantity: li.quantity,
      price,
      total: round2(price * li.quantity),
    };
  });
}

export function computeTotals(lines: ResolvedLineItem[], vatRate = 0.2): Totals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.total, 0));
  const vat = round2(subtotal * vatRate);
  return { subtotal, vat, total: round2(subtotal + vat) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Sheet builders
// ---------------------------------------------------------------------------

const TITLE_NOUN: Record<DocumentType, string> = {
  invoices: 'Рахунок-фактура',
  bills: 'Видаткова накладна',
  poas: 'Довіреність',
};

/** Build the in-memory sheet model for a document. Dispatches by type. */
export function buildDocumentSheet(input: DocumentBuildInput): SheetModel {
  if (input.docType === 'poas') return buildPoaSheet(input);
  return buildInvoiceLikeSheet(input);
}

const WIDE_COLS = [
  { wch: 5 },
  { wch: 38 },
  { wch: 16 },
  { wch: 10 },
  { wch: 8 },
  { wch: 12 },
  { wch: 14 },
  { wch: 14 },
];

/** Invoice (Рахунок-фактура) and bill (Видаткова накладна) share a layout. */
function buildInvoiceLikeSheet(input: DocumentBuildInput): SheetModel {
  const { supplier, counterparty, fields, lines, vatRate } = input;
  const rows: Cell[][] = [];
  const row = (cells: Record<number, Cell>) => {
    const arr: Cell[] = new Array(8).fill(null);
    for (const [k, v] of Object.entries(cells)) arr[Number(k)] = v;
    rows.push(arr);
  };

  // --- Supplier block ---
  row({ 1: 'Постачальник', 2: supplier.name });
  row({ 2: joinNonEmpty([egrpouPart(supplier.egrpou), phonePart(supplier.phone)], ', ') });
  row({ 2: bankLine(supplier) });
  row({ 2: innLine(supplier) });
  if (supplier.taxNote) row({ 2: supplier.taxNote });
  if (supplier.address) row({ 2: `Адреса ${supplier.address}` });
  row({});

  // --- Recipient block ---
  row({ 1: 'Одержувач', 2: counterparty.name });
  if (counterparty.phone) row({ 2: `тел. ${counterparty.phone}` });
  row({ 1: 'Платник', 2: 'той самий' });
  if (fields.invoice_ref) row({ 1: 'Замовлення', 2: fields.invoice_ref });
  if (fields.sales_terms) row({ 1: 'Умова продажу:', 2: fields.sales_terms });
  row({});

  // --- Title ---
  const number = fields.number ?? '';
  row({ 0: `${TITLE_NOUN[input.docType]} № ${number}` });
  if (fields.date) row({ 0: `від ${formatUaDateLong(fields.date)}` });
  row({});

  // --- Line items ---
  const itemHeader = input.docType === 'bills' ? 'Товар' : 'Назва';
  row({ 0: '№', 1: itemHeader, 4: 'Од.', 5: 'Кількість', 6: 'Ціна без ПДВ', 7: 'Сума без ПДВ' });
  lines.forEach((l, idx) => {
    row({ 0: idx + 1, 1: l.name, 4: l.unit ?? '', 5: l.quantity, 6: l.price, 7: l.total });
  });

  // --- Totals ---
  const totals = computeTotals(lines, vatRate);
  if (input.docType === 'invoices') row({ 6: 'Знижка:', 7: 0 });
  row({ 6: 'Разом без ПДВ:', 7: totals.subtotal });
  row({ 6: 'ПДВ:', 7: totals.vat });
  row({ 6: 'Всього з ПДВ:', 7: totals.total });
  row({});

  // --- Amount in words ---
  row({ 0: 'Всього на суму:' });
  row({ 0: hryvniaInWords(totals.total) });
  row({ 0: `ПДВ:       ${totals.vat.toFixed(2)} грн.` });
  row({});

  if (fields.valid_until_note) {
    row({ 7: fields.valid_until_note });
    row({});
  }

  // --- Signatures ---
  const issuedLabel = input.docType === 'bills' ? 'Відвантажив(ла)' : 'Виписав(ла):';
  row({ 1: issuedLabel, 5: 'Отримав(ла)' });
  row({ 2: supplier.signatoryName ?? '' });

  return { rows, cols: WIDE_COLS };
}

/** Power of attorney — standard М-2 form. */
function buildPoaSheet(input: DocumentBuildInput): SheetModel {
  const { supplier, counterparty, fields, lines } = input;
  const rows: Cell[][] = [];
  const row = (cells: Record<number, Cell>) => {
    const arr: Cell[] = new Array(10).fill(null);
    for (const [k, v] of Object.entries(cells)) arr[Number(k)] = v;
    rows.push(arr);
  };

  // The receiving enterprise ("підприємство-одержувач") is our own company.
  row({ 1: supplier.name, 9: 'Типова форма N М-2' });
  if (supplier.address) row({ 1: supplier.address });
  row({ 1: 'підприємство-одержувач і його адреса' });
  row({ 1: 'Ідентифікаційний код ЄДРПОУ', 5: supplier.egrpou ?? '' });
  row({ 1: supplier.name });
  if (supplier.address) row({ 1: supplier.address });
  row({ 1: 'підприємство-платник і його адреса' });
  row({
    1: 'рахунок',
    2: supplier.iban ?? '',
    6: 'МФО',
    7: supplier.mfo ?? '',
    9: 'Довіреність дійсна до',
  });
  row({
    1: supplier.bankName ?? '',
    9: fields.valid_until ? formatUaDateLong(fields.valid_until) : '',
  });
  row({});

  row({ 4: 'ДОВІРЕНІСТЬ N', 7: fields.number ?? '' });
  row({ 4: 'Дата видачі', 6: fields.date ? formatUaDateLong(fields.date) : '' });
  row({});

  row({ 1: 'Видано', 2: fields.recipient_name ?? '' });
  row({ 2: "(посада, прізвище, ім'я, по батькові)" });
  row({ 1: 'Документ, що засвідчує особу', 7: 'паспорт' });
  row({
    1: 'серія',
    2: fields.recipient_passport_series ?? '',
    3: 'N',
    4: fields.recipient_passport_number ?? '',
    6: 'від',
    7: fields.recipient_passport_date ? formatUaDateLong(fields.recipient_passport_date) : '',
  });
  row({ 1: 'Виданий', 3: fields.recipient_passport_issued_by ?? '' });
  row({ 1: 'На отримання від', 3: counterparty.name });
  row({ 1: 'цінностей за', 3: fields.invoice_ref ? `рахунком № ${fields.invoice_ref}` : '' });
  row({});

  row({ 0: 'Перелік цінностей, які належить отримати:' });
  row({ 0: 'NN п/п', 1: 'Найменування цінностей', 7: 'Одиниця виміру', 8: 'Кількість (прописом)' });
  lines.forEach((l, idx) => {
    row({ 0: idx + 1, 1: l.name, 7: l.unit ?? '', 8: integerInWords(l.quantity) });
  });
  row({});

  row({ 1: 'Підпис', 8: 'засвідчую' });
  row({ 1: 'Керівник підприємства' });
  row({ 1: 'Головний бухгалтер' });
  row({ 1: 'Місце печатки' });

  return { rows, cols: WIDE_COLS };
}

// --- supplier block helpers ---

function egrpouPart(egrpou: string | null): string {
  return egrpou ? `ЄДРПОУ ${egrpou}` : '';
}
function phonePart(phone: string | null): string {
  return phone ? `тел. ${phone}` : '';
}
function bankLine(s: SupplierIdentity): string {
  if (!s.iban) return '';
  return joinNonEmpty(
    [`Р/р ${s.iban}`, s.bankName ? `в  ${s.bankName}` : '', s.mfo ? `МФО ${s.mfo}` : ''],
    ' '
  );
}
function innLine(s: SupplierIdentity): string {
  return joinNonEmpty(
    [s.inn ? `ІПН ${s.inn}` : '', s.vatCertificate ? `номер свідоцтва ${s.vatCertificate}` : ''],
    ', '
  );
}
function joinNonEmpty(parts: string[], sep: string): string {
  return parts.filter((p) => p && p.length > 0).join(sep);
}

// ---------------------------------------------------------------------------
// XLSX output
// ---------------------------------------------------------------------------

export function sheetModelToWorkbook(model: SheetModel, sheetName: string): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(model.rows);
  if (model.cols) ws['!cols'] = model.cols;
  if (model.merges) ws['!merges'] = model.merges;
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31) || 'Sheet1');
  return wb;
}

export function generateXlsx(input: DocumentBuildInput): ArrayBuffer {
  const model = buildDocumentSheet(input);
  const wb = sheetModelToWorkbook(model, input.templateName || TITLE_NOUN[input.docType]);
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// PDF output
// ---------------------------------------------------------------------------

/** Render the same sheet model to a simple PDF. Uses an embedded Cyrillic font. */
export function generatePdf(input: DocumentBuildInput, stampDataUrl?: string | null): ArrayBuffer {
  const model = buildDocumentSheet(input);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const font = registerCyrillicFont(doc);
  doc.setFont(font);
  doc.setFontSize(9);

  const marginX = 12;
  let y = 16;
  const lineHeight = 5;
  const colX = [
    marginX,
    marginX + 8,
    marginX + 95,
    marginX + 110,
    marginX + 120,
    marginX + 140,
    marginX + 160,
    marginX + 178,
  ];

  for (const r of model.rows) {
    if (y > 285) {
      doc.addPage();
      y = 16;
    }
    r.forEach((cell, c) => {
      if (cell == null || cell === '') return;
      const x = colX[Math.min(c, colX.length - 1)];
      doc.text(String(cell), x, y);
    });
    y += lineHeight;
  }

  if (stampDataUrl) {
    try {
      doc.addImage(stampDataUrl, marginX, y + 6, 40, 40);
    } catch {
      // ignore unsupported image formats
    }
  }

  return doc.output('arraybuffer');
}
