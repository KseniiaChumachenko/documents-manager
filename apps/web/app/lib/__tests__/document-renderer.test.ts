// apps/web/app/lib/__tests__/document-renderer.test.ts
import { describe, expect, it } from 'vitest';

import type { Layout, RenderContext } from '../document-layout';
import { renderLayout } from '../document-renderer';

const ctx = {
  supplier: {
    name: 'ФОП Тест',
    iban: 'UA1',
    bankName: 'Б',
    mfo: '380',
    phone: null,
    egrpou: '1',
    inn: '1',
    vatCertificate: null,
    address: null,
    taxNote: null,
    signatoryName: null,
  },
  counterparty: { name: 'ТОВ К', phone: null },
  field: { number: 'СФ-1' },
  lines: [
    { name: 'A', unit: 'шт.', quantity: 2, price: 10, total: 20 },
    { name: 'B', unit: 'шт.', quantity: 1, price: 5, total: 5 },
  ],
  totals: { subtotal: 25, vat: 5, total: 30, vatRate: 0.2 },
} as RenderContext;

describe('renderLayout', () => {
  it('places row cells at their columns and skips rows where all cells are omitted', () => {
    const layout: Layout = {
      cols: [10, 20, 20],
      blocks: [
        {
          type: 'row',
          cells: [
            { col: 0, text: 'Постачальник' },
            { col: 2, text: '{{supplier.name}}' },
          ],
        },
        {
          type: 'row',
          // counterparty.phone is null with omitIfEmpty — entire row should be skipped
          cells: [{ col: 2, text: 'тел. {{counterparty.phone}}', omitIfEmpty: true }],
        },
      ],
    };
    const m = renderLayout(layout, ctx);
    // Only 1 row emitted; the all-omitted row is dropped
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]).toEqual(['Постачальник', null, 'ФОП Тест']);
    expect(m.cols).toEqual([{ wch: 10 }, { wch: 20 }, { wch: 20 }]);
  });

  it('expands a lineItems block into a header row + one row per line', () => {
    const layout: Layout = {
      cols: [5, 30, 10, 10],
      blocks: [
        {
          type: 'lineItems',
          header: [
            { col: 0, text: '№' },
            { col: 1, text: 'Назва' },
            { col: 3, text: 'Сума' },
          ],
          row: [
            { col: 0, text: '{{index}}' },
            { col: 1, text: '{{line.name}}' },
            { col: 3, text: '{{line.total | money}}' },
          ],
        },
      ],
    };
    const m = renderLayout(layout, ctx);
    expect(m.rows[0]).toEqual(['№', 'Назва', null, 'Сума']);
    expect(m.rows[1]).toEqual([1, 'A', null, 20]); // index numeric, total numeric
    expect(m.rows[2]).toEqual([2, 'B', null, 5]);
  });

  it('emits merges from cell span', () => {
    const layout: Layout = {
      cols: [10, 10, 10],
      blocks: [{ type: 'row', cells: [{ col: 0, text: 'Заголовок', span: 3 }] }],
    };
    const m = renderLayout(layout, ctx);
    expect(m.merges).toEqual([{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]);
  });

  it('skips a row block whose only cell is omitted via omitIfEmpty', () => {
    // phone is null in ctx -> omitIfEmpty should cause the row to be absent entirely
    const layout: Layout = {
      cols: [10, 20],
      blocks: [
        { type: 'row', cells: [{ col: 0, text: 'Before' }] },
        {
          type: 'row',
          cells: [{ col: 1, text: '{{counterparty.phone}}', omitIfEmpty: true }],
        },
        { type: 'row', cells: [{ col: 0, text: 'After' }] },
      ],
    };
    const m = renderLayout(layout, ctx);
    // The middle row is fully omitted; only 2 rows should be present
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0]).toEqual(['Before', null]);
    expect(m.rows[1]).toEqual(['After', null]);
  });

  it('keeps an explicit spacer row (cells: []) even when surrounded by data rows', () => {
    const layout: Layout = {
      cols: [10, 20],
      blocks: [
        { type: 'row', cells: [{ col: 0, text: 'Row A' }] },
        { type: 'row', cells: [] }, // intentional spacer
        { type: 'row', cells: [{ col: 0, text: 'Row B' }] },
      ],
    };
    const m = renderLayout(layout, ctx);
    expect(m.rows).toHaveLength(3);
    expect(m.rows[1]).toEqual([null, null]); // blank spacer row
  });

  it('emits a row that mixes a present cell with an omitted cell', () => {
    const layout: Layout = {
      cols: [10, 20],
      blocks: [
        {
          type: 'row',
          cells: [
            { col: 0, text: 'Static' },
            { col: 1, text: '{{counterparty.phone}}', omitIfEmpty: true },
          ],
        },
      ],
    };
    const m = renderLayout(layout, ctx);
    // Row has one present value; it must NOT be dropped
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]).toEqual(['Static', null]);
  });
});
