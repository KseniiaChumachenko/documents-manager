import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

import type { Company, DocumentTemplate, Item } from '~/database/schema';

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

export interface DocumentData {
  number: string;
  date: string;
  companyId: number;
  includeStamp?: boolean;
  lineItems: LineItem[];
}

export interface Totals {
  subtotal: number;
  vat: number;
  total: number;
}

export function resolveLineItems(data: DocumentData): ResolvedLineItem[] {
  return data.lineItems.map((li) => {
    const price = li.priceOverride ?? li.item.priceOutputVATFree;
    return {
      name: li.item.name,
      unit: li.item.unit,
      quantity: li.quantity,
      price,
      total: price * li.quantity,
    };
  });
}

export function computeTotals(lines: ResolvedLineItem[]): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const vat = Math.round(subtotal * 0.2 * 100) / 100;
  return { subtotal, vat, total: subtotal + vat };
}

export async function generateXlsx(
  template: DocumentTemplate,
  company: Company,
  data: DocumentData,
  lines: ResolvedLineItem[],
  totals: Totals,
  _stampBuffer: ArrayBuffer | null
): Promise<ArrayBuffer> {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [];

  // Title
  rows.push([`${template.name} № ${data.number} від ${data.date}`]);
  rows.push([]);
  rows.push([`Контрагент: ${company.name}`]);
  if (company.egrpou) {
    rows.push([`ЄДРПОУ: ${company.egrpou}`]);
  } else {
    rows.push([]);
  }
  rows.push([]);

  // Line items header
  rows.push(['№', 'Назва', 'Одиниця', 'Кількість', 'Ціна', 'Сума']);

  // Line items
  lines.forEach((line, idx) => {
    rows.push([idx + 1, line.name, line.unit ?? '', line.quantity, line.price, line.total]);
  });

  rows.push([]);

  // Totals
  rows.push(['', '', '', '', 'Сума без ПДВ', totals.subtotal]);
  rows.push(['', '', '', '', 'ПДВ 20%', totals.vat]);
  rows.push(['', '', '', '', 'Разом з ПДВ', totals.total]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(wb, ws, template.name.substring(0, 31));

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return buf as ArrayBuffer;
}

export async function generatePdf(
  template: DocumentTemplate,
  company: Company,
  data: DocumentData,
  lines: ResolvedLineItem[],
  totals: Totals,
  stampBuffer: ArrayBuffer | null
): Promise<ArrayBuffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.text(`${template.name} № ${data.number} від ${data.date}`, 105, 20, {
    align: 'center',
  });

  // Company
  doc.setFontSize(11);
  doc.text(`Контрагент: ${company.name}`, 15, 35);
  if (company.egrpou) {
    doc.text(`ЄДРПОУ: ${company.egrpou}`, 15, 42);
  }

  // Table header
  let y = 55;
  const colX = [15, 22, 90, 115, 135, 160];
  const colHeaders = ['№', 'Назва', 'Од.', 'К-сть', 'Ціна', 'Сума'];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  colHeaders.forEach((h, i) => {
    doc.text(h, colX[i], y);
  });

  doc.line(15, y + 1, 195, y + 1);
  y += 6;

  // Line items
  doc.setFont('helvetica', 'normal');
  lines.forEach((line, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(idx + 1), colX[0], y);
    doc.text(line.name.substring(0, 40), colX[1], y);
    doc.text(line.unit ?? '', colX[2], y);
    doc.text(String(line.quantity), colX[3], y);
    doc.text(line.price.toFixed(2), colX[4], y);
    doc.text(line.total.toFixed(2), colX[5], y);
    y += 5;
  });

  // Totals
  y += 5;
  doc.line(15, y, 195, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Сума без ПДВ: ${totals.subtotal.toFixed(2)}`, 130, y);
  y += 6;
  doc.text(`ПДВ 20%: ${totals.vat.toFixed(2)}`, 130, y);
  y += 6;
  doc.text(`Разом з ПДВ: ${totals.total.toFixed(2)}`, 130, y);

  // Stamp
  if (stampBuffer && data.includeStamp) {
    const base64 = arrayBufferToBase64(stampBuffer);
    doc.addImage(base64, 'PNG', 15, y + 10, 40, 40);
  }

  return doc.output('arraybuffer');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
