import { describe, expect, it } from 'vitest';

import { resolveCell, type Scope } from '../document-layout';

const scope = {
  supplier: {
    name: 'ФОП Тест',
    iban: 'UA123',
    bankName: 'БАНК',
    mfo: '380',
    phone: null,
    egrpou: '111',
    inn: '111',
    vatCertificate: null,
    address: null,
    taxNote: null,
    signatoryName: null,
  },
  counterparty: { name: 'ТОВ Контрагент', phone: null },
  field: { number: 'СФ-1', date: '2024-12-26' },
  lines: [],
  totals: { subtotal: 5850.02, vat: 1170, total: 7020.02, vatRate: 0.2 },
  line: { name: 'Послуга', unit: 'шт.', quantity: 6, price: 541.67, total: 3250.02 },
  index: 1,
} as unknown as Scope;

describe('resolveCell', () => {
  it('interpolates multiple bindings into a string', () => {
    expect(
      resolveCell(
        { col: 2, text: 'Р/р {{supplier.iban}} в {{supplier.bankName}} МФО {{supplier.mfo}}' },
        scope
      )
    ).toEqual({ value: 'Р/р UA123 в БАНК МФО 380' });
  });

  it('keeps a pure numeric binding as a number with the money format', () => {
    expect(resolveCell({ col: 7, text: '{{line.total | money}}' }, scope)).toEqual({
      value: 3250.02,
      numFmt: '0.00',
    });
  });

  it('returns a plain string for money in mixed text', () => {
    expect(resolveCell({ col: 0, text: 'ПДВ: {{totals.vat | money}} грн.' }, scope)).toEqual({
      value: 'ПДВ: 1170.00 грн.',
    });
  });

  it('formats long dates lowercase via Intl', () => {
    expect(resolveCell({ col: 0, text: 'від {{field.date | longDate}}' }, scope)).toEqual({
      value: 'від 26 грудня 2024 р.',
    });
  });

  it('spells the total in words', () => {
    expect(resolveCell({ col: 0, text: '{{totals.total | hryvniaWords}}' }, scope)).toEqual({
      value: 'Сім тисяч двадцять гривень 02 копійки',
    });
  });

  it('spells an integer quantity in words', () => {
    expect(
      resolveCell(
        { col: 8, text: '{{line.quantity | intWords}}' },
        { ...scope, line: { ...scope.line!, quantity: 1 } }
      )
    ).toEqual({ value: 'Один' });
  });

  it('resolves a missing path to empty string', () => {
    expect(resolveCell({ col: 2, text: 'тел. {{counterparty.phone}}' }, scope)).toEqual({
      value: 'тел. ',
    });
  });

  it('omits the cell when omitIfEmpty and all bindings are empty', () => {
    expect(
      resolveCell({ col: 2, text: 'тел. {{counterparty.phone}}', omitIfEmpty: true }, scope)
    ).toBeNull();
  });

  it('keeps a literal-only cell', () => {
    expect(resolveCell({ col: 1, text: 'Постачальник' }, scope)).toEqual({ value: 'Постачальник' });
  });

  it('omits a pure single-binding cell when omitIfEmpty and value is null', () => {
    // counterparty.phone is null in scope — pure binding, no surrounding literal
    expect(
      resolveCell({ col: 2, text: '{{counterparty.phone}}', omitIfEmpty: true }, scope)
    ).toBeNull();
  });

  it('omits a transformed cell when omitIfEmpty and binding is absent', () => {
    // field.missing_key is undefined → money transform should still honour omitIfEmpty
    expect(
      resolveCell({ col: 0, text: '{{field.missing_key | money}}', omitIfEmpty: true }, scope)
    ).toBeNull();
  });

  it('does NOT omit a transformed cell when value is numeric 0', () => {
    // 0 is falsy but is NOT empty; omitIfEmpty must not suppress it
    const scopeWithZero = {
      ...scope,
      totals: { ...scope.totals, subtotal: 0 },
    } as unknown as typeof scope;
    expect(
      resolveCell({ col: 0, text: '{{totals.subtotal | money}}', omitIfEmpty: true }, scopeWithZero)
    ).toEqual({ value: 0, numFmt: '0.00' });
  });
});
