// apps/web/app/lib/default-document-layouts.ts
//
// Data-driven layouts that reproduce the reference accounting documents. These
// replace the former hardcoded `buildInvoiceLikeSheet` / `buildPoaSheet`
// builders: each emitted row becomes a `row` block and the item loop becomes a
// `lineItems` block, with literal values replaced by `{{bindings}}`.
//
// The shared 8-column geometry mirrors the old WIDE_COLS widths so XLSX exports
// keep their column sizing. The М-2 form uses a 10-column grid.

import type { Layout } from './document-layout';

const WIDE_COLS = [5, 38, 16, 10, 8, 12, 14, 14];

/**
 * Invoice (Рахунок-фактура). Mirrors the former `buildInvoiceLikeSheet` for the
 * `invoices` document type, including the leading "Знижка:" (discount) row.
 */
export const INVOICE_LAYOUT: Layout = {
  cols: WIDE_COLS,
  blocks: [
    // --- Supplier block ---
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Постачальник' },
        { col: 2, text: '{{supplier.name}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 2, text: 'ЄДРПОУ {{supplier.egrpou}}, тел. {{supplier.phone}}', omitIfEmpty: true },
      ],
    },
    {
      type: 'row',
      cells: [
        {
          col: 2,
          text: 'Р/р {{supplier.iban}} в  {{supplier.bankName}} МФО {{supplier.mfo}}',
          omitIfEmpty: true,
        },
      ],
    },
    {
      type: 'row',
      cells: [
        {
          col: 2,
          text: 'ІПН {{supplier.inn}}, номер свідоцтва {{supplier.vatCertificate}}',
          omitIfEmpty: true,
        },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: '{{supplier.taxNote}}', omitIfEmpty: true }] },
    { type: 'row', cells: [{ col: 2, text: 'Адреса {{supplier.address}}', omitIfEmpty: true }] },
    { type: 'row', cells: [] },

    // --- Recipient block ---
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Одержувач' },
        { col: 2, text: '{{counterparty.name}}' },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: 'тел. {{counterparty.phone}}', omitIfEmpty: true }] },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Платник' },
        { col: 2, text: 'той самий' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Замовлення' },
        { col: 2, text: '{{field.invoice_ref}}', omitIfEmpty: true },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Умова продажу:' },
        { col: 2, text: '{{field.sales_terms}}', omitIfEmpty: true },
      ],
    },
    { type: 'row', cells: [] },

    // --- Title ---
    { type: 'row', cells: [{ col: 0, text: 'Рахунок-фактура № {{field.number}}' }] },
    { type: 'row', cells: [{ col: 0, text: 'від {{field.date | longDate}}', omitIfEmpty: true }] },
    { type: 'row', cells: [] },

    // --- Line items ---
    {
      type: 'lineItems',
      header: [
        { col: 0, text: '№' },
        { col: 1, text: 'Назва' },
        { col: 4, text: 'Од.' },
        { col: 5, text: 'Кількість' },
        { col: 6, text: 'Ціна без ПДВ' },
        { col: 7, text: 'Сума без ПДВ' },
      ],
      row: [
        { col: 0, text: '{{index}}' },
        { col: 1, text: '{{line.name}}' },
        { col: 4, text: '{{line.unit}}' },
        { col: 5, text: '{{line.quantity}}' },
        { col: 6, text: '{{line.price | money}}' },
        { col: 7, text: '{{line.total | money}}' },
      ],
    },

    // --- Totals ---
    {
      type: 'row',
      cells: [
        { col: 6, text: 'Знижка:' },
        { col: 7, text: '{{totals.discount | money}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 6, text: 'Разом без ПДВ:' },
        { col: 7, text: '{{totals.subtotal | money}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 6, text: 'ПДВ:' },
        { col: 7, text: '{{totals.vat | money}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 6, text: 'Всього з ПДВ:' },
        { col: 7, text: '{{totals.total | money}}' },
      ],
    },
    { type: 'row', cells: [] },

    // --- Amount in words ---
    { type: 'row', cells: [{ col: 0, text: 'Всього на суму:' }] },
    { type: 'row', cells: [{ col: 0, text: '{{totals.total | hryvniaWords}}' }] },
    { type: 'row', cells: [{ col: 0, text: 'ПДВ:       {{totals.vat | money}} грн.' }] },
    { type: 'row', cells: [] },

    {
      type: 'row',
      cells: [{ col: 7, text: '{{field.valid_until_note}}', omitIfEmpty: true }],
    },
    { type: 'row', cells: [] },

    // --- Signatures ---
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Виписав(ла):' },
        { col: 5, text: 'Отримав(ла)' },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: '{{supplier.signatoryName}}' }] },
  ],
};

/**
 * Bill (Видаткова накладна). Same geometry as the invoice but with a "Товар"
 * item header, no discount row, and an "Відвантажив(ла)" signature label.
 */
export const BILL_LAYOUT: Layout = {
  cols: WIDE_COLS,
  blocks: [
    // --- Supplier block ---
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Постачальник' },
        { col: 2, text: '{{supplier.name}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 2, text: 'ЄДРПОУ {{supplier.egrpou}}, тел. {{supplier.phone}}', omitIfEmpty: true },
      ],
    },
    {
      type: 'row',
      cells: [
        {
          col: 2,
          text: 'Р/р {{supplier.iban}} в  {{supplier.bankName}} МФО {{supplier.mfo}}',
          omitIfEmpty: true,
        },
      ],
    },
    {
      type: 'row',
      cells: [
        {
          col: 2,
          text: 'ІПН {{supplier.inn}}, номер свідоцтва {{supplier.vatCertificate}}',
          omitIfEmpty: true,
        },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: '{{supplier.taxNote}}', omitIfEmpty: true }] },
    { type: 'row', cells: [{ col: 2, text: 'Адреса {{supplier.address}}', omitIfEmpty: true }] },
    { type: 'row', cells: [] },

    // --- Recipient block ---
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Одержувач' },
        { col: 2, text: '{{counterparty.name}}' },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: 'тел. {{counterparty.phone}}', omitIfEmpty: true }] },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Платник' },
        { col: 2, text: 'той самий' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Замовлення' },
        { col: 2, text: '{{field.invoice_ref}}', omitIfEmpty: true },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Умова продажу:' },
        { col: 2, text: '{{field.sales_terms}}', omitIfEmpty: true },
      ],
    },
    { type: 'row', cells: [] },

    // --- Title ---
    { type: 'row', cells: [{ col: 0, text: 'Видаткова накладна № {{field.number}}' }] },
    { type: 'row', cells: [{ col: 0, text: 'від {{field.date | longDate}}', omitIfEmpty: true }] },
    { type: 'row', cells: [] },

    // --- Line items ---
    {
      type: 'lineItems',
      header: [
        { col: 0, text: '№' },
        { col: 1, text: 'Товар' },
        { col: 4, text: 'Од.' },
        { col: 5, text: 'Кількість' },
        { col: 6, text: 'Ціна без ПДВ' },
        { col: 7, text: 'Сума без ПДВ' },
      ],
      row: [
        { col: 0, text: '{{index}}' },
        { col: 1, text: '{{line.name}}' },
        { col: 4, text: '{{line.unit}}' },
        { col: 5, text: '{{line.quantity}}' },
        { col: 6, text: '{{line.price | money}}' },
        { col: 7, text: '{{line.total | money}}' },
      ],
    },

    // --- Totals ---
    {
      type: 'row',
      cells: [
        { col: 6, text: 'Разом без ПДВ:' },
        { col: 7, text: '{{totals.subtotal | money}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 6, text: 'ПДВ:' },
        { col: 7, text: '{{totals.vat | money}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 6, text: 'Всього з ПДВ:' },
        { col: 7, text: '{{totals.total | money}}' },
      ],
    },
    { type: 'row', cells: [] },

    // --- Amount in words ---
    { type: 'row', cells: [{ col: 0, text: 'Всього на суму:' }] },
    { type: 'row', cells: [{ col: 0, text: '{{totals.total | hryvniaWords}}' }] },
    { type: 'row', cells: [{ col: 0, text: 'ПДВ:       {{totals.vat | money}} грн.' }] },
    { type: 'row', cells: [] },

    {
      type: 'row',
      cells: [{ col: 7, text: '{{field.valid_until_note}}', omitIfEmpty: true }],
    },
    { type: 'row', cells: [] },

    // --- Signatures ---
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Відвантажив(ла)' },
        { col: 5, text: 'Отримав(ла)' },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: '{{supplier.signatoryName}}' }] },
  ],
};

/**
 * Power of attorney — standard М-2 form. 10-column grid; the receiving
 * enterprise ("підприємство-одержувач") is our own company (the supplier
 * identity), and the counterparty is the company the goods are collected from.
 */
export const POA_LAYOUT: Layout = {
  cols: [5, 38, 16, 16, 12, 12, 6, 14, 18, 18],
  blocks: [
    {
      type: 'row',
      cells: [
        { col: 1, text: '{{supplier.name}}' },
        { col: 9, text: 'Типова форма N М-2' },
      ],
    },
    { type: 'row', cells: [{ col: 1, text: '{{supplier.address}}', omitIfEmpty: true }] },
    { type: 'row', cells: [{ col: 1, text: 'підприємство-одержувач і його адреса' }] },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Ідентифікаційний код ЄДРПОУ' },
        { col: 5, text: '{{supplier.egrpou}}' },
      ],
    },
    { type: 'row', cells: [{ col: 1, text: '{{supplier.name}}' }] },
    { type: 'row', cells: [{ col: 1, text: '{{supplier.address}}', omitIfEmpty: true }] },
    { type: 'row', cells: [{ col: 1, text: 'підприємство-платник і його адреса' }] },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'рахунок' },
        { col: 2, text: '{{supplier.iban}}' },
        { col: 6, text: 'МФО' },
        { col: 7, text: '{{supplier.mfo}}' },
        { col: 9, text: 'Довіреність дійсна до' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: '{{supplier.bankName}}' },
        { col: 9, text: '{{field.valid_until | longDate}}', omitIfEmpty: true },
      ],
    },
    { type: 'row', cells: [] },

    {
      type: 'row',
      cells: [
        { col: 4, text: 'ДОВІРЕНІСТЬ N' },
        { col: 7, text: '{{field.number}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 4, text: 'Дата видачі' },
        { col: 6, text: '{{field.date | longDate}}', omitIfEmpty: true },
      ],
    },
    { type: 'row', cells: [] },

    {
      type: 'row',
      cells: [
        { col: 1, text: 'Видано' },
        { col: 2, text: '{{field.recipient_name}}' },
      ],
    },
    { type: 'row', cells: [{ col: 2, text: "(посада, прізвище, ім'я, по батькові)" }] },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Документ, що засвідчує особу' },
        { col: 7, text: 'паспорт' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'серія' },
        { col: 2, text: '{{field.recipient_passport_series}}' },
        { col: 3, text: 'N' },
        { col: 4, text: '{{field.recipient_passport_number}}' },
        { col: 6, text: 'від' },
        { col: 7, text: '{{field.recipient_passport_date | longDate}}', omitIfEmpty: true },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'Виданий' },
        { col: 3, text: '{{field.recipient_passport_issued_by}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'На отримання від' },
        { col: 3, text: '{{counterparty.name}}' },
      ],
    },
    {
      type: 'row',
      cells: [
        { col: 1, text: 'цінностей за' },
        { col: 3, text: 'рахунком № {{field.invoice_ref}}', omitIfEmpty: true },
      ],
    },
    { type: 'row', cells: [] },

    { type: 'row', cells: [{ col: 0, text: 'Перелік цінностей, які належить отримати:' }] },
    {
      type: 'lineItems',
      header: [
        { col: 0, text: 'NN п/п' },
        { col: 1, text: 'Найменування цінностей' },
        { col: 7, text: 'Одиниця виміру' },
        { col: 8, text: 'Кількість (прописом)' },
      ],
      row: [
        { col: 0, text: '{{index}}' },
        { col: 1, text: '{{line.name}}' },
        { col: 7, text: '{{line.unit}}' },
        { col: 8, text: '{{line.quantity | intWords}}' },
      ],
    },
    { type: 'row', cells: [] },

    {
      type: 'row',
      cells: [
        { col: 1, text: 'Підпис' },
        { col: 8, text: 'засвідчую' },
      ],
    },
    { type: 'row', cells: [{ col: 1, text: 'Керівник підприємства' }] },
    { type: 'row', cells: [{ col: 1, text: 'Головний бухгалтер' }] },
    { type: 'row', cells: [{ col: 1, text: 'Місце печатки' }] },
  ],
};
