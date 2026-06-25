import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

import type { Item } from '~/database/schema';

import { BILL_LAYOUT, INVOICE_LAYOUT, POA_LAYOUT } from '../default-document-layouts';
import type { RenderContext } from '../document-layout';
import { renderLayout } from '../document-renderer';
import {
  computeTotals,
  resolveLineItems,
  sheetModelToPdf,
  sheetModelToWorkbook,
  sheetModelToXlsx,
  type ResolvedLineItem,
  type SheetModel,
  type SupplierIdentity,
} from '../generate-document';

import {
  BILL_REF,
  INVOICE_REF,
  POA_REF,
  SUPPLIER,
  makeTestPng,
  normalize,
} from './reference-fixtures';

/** Build a RenderContext from a reference fixture (invoice/bill shape). */
function ctxFrom(
  ref: typeof INVOICE_REF | typeof BILL_REF,
  supplier: SupplierIdentity,
  recipientPhone?: string,
  fieldOverrides: Record<string, string> = {}
): RenderContext {
  const lines = ref.lines as ResolvedLineItem[];
  const totals = computeTotals(lines, 0.2);
  return {
    supplier,
    counterparty: { name: ref.recipientName, phone: recipientPhone ?? null },
    field: {
      number: ref.number,
      date: ref.date,
      ...fieldOverrides,
    },
    lines,
    totals: { ...totals, vatRate: 0.2, discount: 0 },
  };
}

const baseItem: Item = {
  id: 1,
  name: 'Товар',
  type: 'Тип',
  unit: 'шт',
  priceSaleVATFree: 100,
  priceCostVATFree: 60,
  priceRetailInclVAT: 144,
};

describe('resolveLineItems', () => {
  it('bills the sale price (Відпускна) by default', () => {
    const [r] = resolveLineItems([{ item: baseItem, quantity: 3 }]);
    expect(r.price).toBe(100);
    expect(r.total).toBe(300);
  });

  it('uses the price override when provided', () => {
    const [r] = resolveLineItems([{ item: baseItem, quantity: 2, priceOverride: 50 }]);
    expect(r.price).toBe(50);
    expect(r.total).toBe(100);
  });
});

function flatten(model: SheetModel): string {
  return normalize(
    model.rows.map((r) => r.map((c) => (c == null ? '' : String(c))).join(' ')).join('\n')
  );
}

/** Find the first row that has a cell exactly equal to `label` (trailing colon ignored). */
function rowWith(model: SheetModel, label: string): (string | number | null)[] | undefined {
  const norm = (s: string) => normalize(s).replace(/:$/, '');
  return model.rows.find((r) =>
    r.some((c) => typeof c === 'string' && norm(c) === normalize(label))
  );
}

function rowHasNumber(row: (string | number | null)[] | undefined, value: number): boolean {
  return !!row?.some((c) => typeof c === 'number' && Math.abs(c - value) < 0.005);
}

describe('computeTotals', () => {
  it('reproduces the invoice reference totals exactly (СФ-0000305)', () => {
    const t = computeTotals(INVOICE_REF.lines, 0.2);
    expect(t.subtotal).toBe(INVOICE_REF.subtotal);
    expect(t.vat).toBe(INVOICE_REF.vat);
    expect(t.total).toBe(INVOICE_REF.total);
  });

  it('reproduces the bill reference totals exactly (РН-0000003)', () => {
    const t = computeTotals(BILL_REF.lines, 0.2);
    expect(t.subtotal).toBe(BILL_REF.subtotal);
    expect(t.vat).toBe(BILL_REF.vat);
    expect(t.total).toBe(BILL_REF.total);
  });

  it('supports a 0% VAT rate (non-VAT payers)', () => {
    const t = computeTotals(INVOICE_REF.lines, 0);
    expect(t.vat).toBe(0);
    expect(t.total).toBe(INVOICE_REF.subtotal);
  });
});

describe('renderLayout — invoice (Рахунок-фактура)', () => {
  const model = renderLayout(
    INVOICE_LAYOUT,
    ctxFrom(INVOICE_REF, SUPPLIER, INVOICE_REF.recipientPhone, {
      invoice_ref: INVOICE_REF.orderRef,
      valid_until_note: INVOICE_REF.validUntilNote,
    })
  );
  const text = flatten(model);

  it('has a titled header with number and long date', () => {
    expect(text).toContain('Рахунок-фактура № СФ-0000305');
    expect(text).toContain('26 грудня 2024 р.');
  });

  it('includes the supplier block (Постачальник identity)', () => {
    expect(text).toContain('Постачальник');
    expect(text).toContain(normalize(SUPPLIER.name));
    expect(text).toContain(SUPPLIER.egrpou!);
    expect(text).toContain(SUPPLIER.iban!);
    expect(text).toContain(SUPPLIER.mfo!);
    expect(text).toContain(normalize(SUPPLIER.bankName!));
    expect(text).toContain(normalize(SUPPLIER.taxNote!));
  });

  it('includes the recipient (Одержувач) and order reference', () => {
    expect(text).toContain('Одержувач');
    expect(text).toContain(normalize(INVOICE_REF.recipientName));
    expect(text).toContain(normalize(INVOICE_REF.orderRef));
  });

  it('renders a line-items table with headers and every item', () => {
    expect(text).toContain('Кількість');
    expect(text).toContain('Ціна без ПДВ');
    expect(text).toContain('Сума без ПДВ');
    for (const li of INVOICE_REF.lines) {
      expect(text).toContain(normalize(li.name));
    }
  });

  it('shows totals with the correct labels and values', () => {
    expect(rowHasNumber(rowWith(model, 'Разом без ПДВ'), INVOICE_REF.subtotal)).toBe(true);
    expect(rowHasNumber(rowWith(model, 'ПДВ'), INVOICE_REF.vat)).toBe(true);
    expect(rowHasNumber(rowWith(model, 'Всього з ПДВ'), INVOICE_REF.total)).toBe(true);
  });

  it('includes the amount in words (сума прописом)', () => {
    expect(text).toContain(normalize(INVOICE_REF.totalInWords));
  });
});

describe('renderLayout — bill (Видаткова накладна)', () => {
  const model = renderLayout(
    BILL_LAYOUT,
    ctxFrom(BILL_REF, SUPPLIER, undefined, {
      invoice_ref: BILL_REF.orderRef,
      sales_terms: BILL_REF.salesTerms,
    })
  );
  const text = flatten(model);

  it('has a titled header with number and long date', () => {
    expect(text).toContain('Видаткова накладна № РН-0000003');
    expect(text).toContain('26 лютого 2025 р.');
  });

  it('includes supplier, recipient, order and sales terms', () => {
    expect(text).toContain(normalize(SUPPLIER.name));
    expect(text).toContain(normalize(BILL_REF.recipientName));
    expect(text).toContain(normalize(BILL_REF.orderRef));
    expect(text).toContain(normalize(BILL_REF.salesTerms));
  });

  it('lists every line item', () => {
    for (const li of BILL_REF.lines) {
      expect(text).toContain(normalize(li.name));
    }
  });

  it('shows totals and amount in words', () => {
    expect(rowHasNumber(rowWith(model, 'Разом без ПДВ'), BILL_REF.subtotal)).toBe(true);
    expect(rowHasNumber(rowWith(model, 'Всього з ПДВ'), BILL_REF.total)).toBe(true);
    expect(text).toContain(normalize(BILL_REF.totalInWords));
  });
});

describe('renderLayout — power of attorney (M-2 довіреність)', () => {
  const poaTotals = computeTotals(POA_REF.lines as ResolvedLineItem[], 0);
  const model = renderLayout(POA_LAYOUT, {
    supplier: SUPPLIER,
    // For a поа the counterparty is the supplier the goods are collected from.
    counterparty: { name: POA_REF.supplierCompanyName },
    field: {
      number: POA_REF.number,
      date: POA_REF.date,
      valid_until: POA_REF.validUntil,
      invoice_ref: POA_REF.invoiceRef,
      recipient_name: POA_REF.recipientName,
      recipient_passport_series: POA_REF.passportSeries,
      recipient_passport_number: POA_REF.passportNumber,
      recipient_passport_issued_by: POA_REF.passportIssuedBy,
    },
    lines: POA_REF.lines as ResolvedLineItem[],
    totals: { ...poaTotals, vatRate: 0 },
  });
  const text = flatten(model);

  it('uses the M-2 form, not the invoice table', () => {
    expect(text).toContain('М-2');
    expect(text).toContain('ДОВІРЕНІСТЬ');
    // No money totals on a power of attorney.
    expect(text).not.toContain('Всього з ПДВ');
  });

  it('shows the receiving company (my company) and its bank details', () => {
    expect(text).toContain(normalize(SUPPLIER.name));
    expect(text).toContain(SUPPLIER.egrpou!);
    expect(text).toContain(SUPPLIER.iban!);
  });

  it('shows the authorised person and passport', () => {
    expect(text).toContain(normalize(POA_REF.recipientName));
    expect(text).toContain(POA_REF.passportSeries);
    expect(text).toContain(POA_REF.passportNumber);
    expect(text).toContain(normalize(POA_REF.passportIssuedBy));
  });

  it('names the supplier the goods are collected from', () => {
    expect(text).toContain(normalize(POA_REF.supplierCompanyName));
  });

  it('lists goods with quantity in words', () => {
    expect(text).toContain(normalize(POA_REF.lines[0].name));
    expect(text).toContain('Один'); // quantity 1 → "Один" (прописом)
  });
});

describe('sheetModelToXlsx round-trip', () => {
  it('produces a valid workbook whose cells include the reference content', () => {
    const model = renderLayout(INVOICE_LAYOUT, ctxFrom(INVOICE_REF, SUPPLIER));
    const buf = sheetModelToXlsx(model);

    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
    const text = normalize(
      aoa
        .flat()
        .map((c) => (c == null ? '' : String(c)))
        .join(' ')
    );

    expect(text).toContain('Рахунок-фактура № СФ-0000305');
    expect(text).toContain(normalize(SUPPLIER.name));
    expect(text).toContain(normalize(INVOICE_REF.totalInWords));
  });
});

describe('sheetModelToPdf', () => {
  it('produces a valid PDF with an embedded Cyrillic font', () => {
    const model = renderLayout(INVOICE_LAYOUT, ctxFrom(INVOICE_REF, SUPPLIER));
    const buf = sheetModelToPdf(model);

    const bytes = new Uint8Array(buf);
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe('%PDF-');

    // The embedded Cyrillic font must be referenced — jsPDF's built-in fonts
    // cannot render Ukrainian, so this proves the fix is in effect.
    const latin1 = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    expect(latin1).toContain('DejaVuSansUA');
    // Embedding a font makes the file substantial.
    expect(buf.byteLength).toBeGreaterThan(10000);
  });

  it('embeds a stamp image when a stamp data URL is provided', () => {
    const model = renderLayout(INVOICE_LAYOUT, ctxFrom(INVOICE_REF, SUPPLIER));
    const withoutStamp = sheetModelToPdf(model);
    const withStamp = sheetModelToPdf(model, makeTestPng(64));

    const bytes = Array.from(new Uint8Array(withStamp), (b) => String.fromCharCode(b)).join('');
    // The stamp is embedded as a PDF image XObject, which also grows the file.
    expect(bytes).toContain('/Image');
    expect(withStamp.byteLength).toBeGreaterThan(withoutStamp.byteLength + 200);
  });

  it('keeps short body labels on a single line (no mid-word wrap)', () => {
    // Regression for "МФО" wrapping to "МФ" / "О": a short label in a narrow
    // grid column must not wrap, so the page stays a single page.
    const model: SheetModel = { rows: [['МФО', '380838']], cols: [{ wch: 4 }, { wch: 10 }] };
    const buf = sheetModelToPdf(model);
    const text = Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join('');
    expect((text.match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(1);
  });
});

describe('sheetModelToWorkbook table formatting', () => {
  it('borders table cells and merges logical columns', () => {
    const model: SheetModel = {
      rows: [
        ['№', 'Назва', null, 'Сума'],
        [1, 'A', null, 20],
      ],
      cols: [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 10 }],
      tables: [{ r0: 0, r1: 1, cols: [0, 1, 3] }],
    };
    const wb = sheetModelToWorkbook(model, 'Документ');
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Header cell carries a thin border (and bold).
    expect(ws['A1'].s?.border?.top?.style).toBe('thin');
    expect(ws['A1'].s?.font?.bold).toBe(true);
    // A data cell is bordered too.
    expect(ws['A2'].s?.border?.bottom?.style).toBe('thin');

    // Every cell uses the reference typeface (Arial), bold preserved on headers.
    expect(ws['A1'].s?.font?.name).toBe('Arial');
    expect(ws['B2'].s?.font?.name).toBe('Arial');

    // The wide "name" column (grid cols 1..2) is merged on header + each data row.
    const refs = (ws['!merges'] ?? []).map((m) => XLSX.utils.encode_range(m));
    expect(refs).toContain('B1:C1');
    expect(refs).toContain('B2:C2');
  });
});
