import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

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
  /** Per-cell number formats (e.g. '0.00' for money), applied to the worksheet. */
  formats?: { r: number; c: number; z: string }[];
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

export function sheetModelToWorkbook(model: SheetModel, sheetName = 'Документ'): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(model.rows);
  if (model.cols) ws['!cols'] = model.cols;
  if (model.merges) ws['!merges'] = model.merges;
  if (model.formats) {
    for (const f of model.formats) {
      const addr = XLSX.utils.encode_cell({ r: f.r, c: f.c });
      if (ws[addr]) ws[addr].z = f.z;
    }
  }
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

/** Render a sheet model to a simple PDF. Uses an embedded Cyrillic font. */
export function sheetModelToPdf(model: SheetModel, stampDataUrl?: string | null): ArrayBuffer {
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
