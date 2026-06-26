import { jsPDF } from 'jspdf';
// xlsx-js-style is a drop-in SheetJS fork that supports cell styles (borders),
// which the community `xlsx` package cannot write.
import * as XLSX from 'xlsx-js-style';

import type { Item } from '~/database/schema';

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

type Cell = string | number | null;

export interface SheetModel {
  rows: Cell[][];
  merges?: XLSX.Range[];
  cols?: { wch: number }[];
  /**
   * Line-item table regions, used to draw cell borders in XLSX/PDF. `r0`..`r1`
   * is the inclusive row range (header + data rows); `cols` is the sorted list
   * of header column indices (each spans up to the next one — so a wide "name"
   * column that spills across empty grid columns stays one bordered cell).
   */
  tables?: { r0: number; r1: number; cols: number[] }[];
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
// XLSX output
// ---------------------------------------------------------------------------

const THIN_SIDE = { style: 'thin', color: { rgb: '000000' } } as const;
const THIN_BOX = { top: THIN_SIDE, bottom: THIN_SIDE, left: THIN_SIDE, right: THIN_SIDE };

// The reference .xls files are all set in Arial; match it so the workbook looks
// the same when opened in Excel.
const FONT_NAME = 'Arial';
const FONT_SIZE = 10;

export function sheetModelToWorkbook(model: SheetModel, sheetName = 'Документ'): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(model.rows);
  if (model.cols) ws['!cols'] = model.cols;
  const merges = model.merges ? [...model.merges] : [];

  // Border the line-item tables, and merge each logical column across the empty
  // grid columns it spans (so a wide "name" column stays a single bordered cell).
  const width = model.cols?.length ?? model.rows[0]?.length ?? 0;
  for (const t of model.tables ?? []) {
    for (let r = t.r0; r <= t.r1; r++) {
      // Thin border every grid cell in the table rectangle (create empties).
      for (let c = t.cols[0]; c < width; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { t: 's', v: '' };
        const isHeader = r === t.r0;
        ws[addr].s = { border: THIN_BOX, ...(isHeader ? { font: { bold: true } } : {}) };
      }
      // Merge each logical column (header col .. next header col - 1).
      for (let k = 0; k < t.cols.length; k++) {
        const c0 = t.cols[k];
        const c1 = k + 1 < t.cols.length ? t.cols[k + 1] - 1 : width - 1;
        if (c1 > c0) merges.push({ s: { r, c: c0 }, e: { r, c: c1 } });
      }
    }
  }

  // Apply the Arial typeface to every cell, preserving borders and bold headers.
  const ref = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let r = ref.s.r; r <= ref.e.r; r++) {
    for (let c = ref.s.c; c <= ref.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      cell.s = { ...cell.s, font: { name: FONT_NAME, sz: FONT_SIZE, ...cell.s?.font } };
    }
  }

  if (merges.length) ws['!merges'] = merges;
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31) || 'Sheet1');
  return wb;
}

export function sheetModelToXlsx(model: SheetModel): ArrayBuffer {
  const wb = sheetModelToWorkbook(model, 'Документ');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// PDF output
// ---------------------------------------------------------------------------

/**
 * Render a sheet model to PDF with an embedded Cyrillic font. Column positions
 * are derived from the layout's column widths and scaled to the printable page
 * width (so content never overflows); cell text spills into adjacent empty
 * columns (spreadsheet-style) and wraps; line-item tables are bordered.
 */
export function sheetModelToPdf(model: SheetModel, stampDataUrl?: string | null): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const font = registerCyrillicFont(doc);
  doc.setFont(font);
  doc.setFontSize(8);

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 12;
  const PRINT_W = PAGE_W - 2 * MARGIN;
  const LINE_H = 4;
  const PAD = 1;

  const colW = model.cols?.map((c) => c.wch) ?? [];
  const totalU = colW.reduce((a, b) => a + b, 0) || 1;
  // Left x (mm) of grid column c; xAt(colW.length) === right margin.
  const xAt = (c: number) =>
    MARGIN + (colW.slice(0, c).reduce((a, b) => a + b, 0) / totalU) * PRINT_W;
  const rightEdge = MARGIN + PRINT_W;

  const tableByRow = new Map<number, { r0: number; r1: number; cols: number[] }>();
  for (const t of model.tables ?? []) for (let r = t.r0; r <= t.r1; r++) tableByRow.set(r, t);

  let y = MARGIN;
  const rowTop: number[] = [];

  model.rows.forEach((row, r) => {
    const present = row.map((v, c) => ({ v, c })).filter((x) => x.v != null && x.v !== '');

    // Line-item table cells always wrap (they have real column boundaries).
    // Body cells stay on one line and overflow into adjacent empty space — the
    // way Excel shows them — UNLESS the value is genuinely too wide for its slot,
    // in which case it wraps so it never runs off the page. This keeps short
    // labels intact (wrapping breaks them mid-word, e.g. "МФО" → "МФ" / "О").
    const inTable = tableByRow.has(r);
    let maxLines = 1;
    const cells = present.map((cell, idx) => {
      const next = present[idx + 1];
      const xLeft = xAt(cell.c) + PAD;
      const xRight = (next ? xAt(next.c) : rightEdge) - PAD;
      const avail = Math.max(6, xRight - xLeft);
      const text = String(cell.v);
      const needsWrap = inTable || doc.getTextWidth(text) > avail;
      const lines = needsWrap ? (doc.splitTextToSize(text, avail) as string[]) : [text];
      maxLines = Math.max(maxLines, lines.length);
      return { lines, xLeft, xRight, isNum: typeof cell.v === 'number' };
    });

    const rowH = maxLines * LINE_H + PAD;
    if (y + rowH > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    rowTop[r] = y;

    for (const cell of cells) {
      let ty = y + LINE_H;
      for (const ln of cell.lines) {
        if (cell.isNum) doc.text(ln, cell.xRight, ty, { align: 'right' });
        else doc.text(ln, cell.xLeft, ty);
        ty += LINE_H;
      }
    }
    y += rowH;
  });
  rowTop.push(y);

  // Table borders: row separators + a vertical at each header column + the box.
  doc.setLineWidth(0.2);
  for (const t of model.tables ?? []) {
    const top = rowTop[t.r0];
    const bottom = rowTop[t.r1 + 1] ?? y;
    const leftX = xAt(t.cols[0]);
    for (let r = t.r0; r <= t.r1 + 1; r++) {
      const yy = rowTop[r] ?? bottom;
      doc.line(leftX, yy, rightEdge, yy);
    }
    for (const c of t.cols) doc.line(xAt(c), top, xAt(c), bottom);
    doc.line(rightEdge, top, rightEdge, bottom);
  }

  // The stamp overlays the signature/"Місце печатки" area of the printable copy
  // (the reference .xls files leave a labelled space for a physical stamp).
  if (stampDataUrl) {
    const fmt = stampDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
    try {
      doc.addImage(stampDataUrl, fmt, MARGIN, y + 4, 35, 35);
    } catch (e) {
      console.error('stamp addImage failed:', e instanceof Error ? e.message : e);
    }
  }

  return doc.output('arraybuffer');
}
