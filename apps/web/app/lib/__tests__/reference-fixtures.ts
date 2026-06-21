// Data transcribed from the reference accounting documents in
// .claude/references/*.xls. Used to assert that generated exports are aligned
// with the real documents the client produces.

import type { ResolvedLineItem, SupplierIdentity } from '../generate-document';

// The business that issues the documents (Постачальник / підприємство-одержувач).
// Taken from the supplier block shared by all three reference files.
export const SUPPLIER: SupplierIdentity = {
  name: 'Фізична особа-підприємець Чумаченко Ірина Вікторівна',
  egrpou: '2559104287',
  inn: '2559104287',
  vatCertificate: '68904067',
  iban: 'UA183808380000026006799955398',
  bankName: 'АТ "ПРАВЕКС-БАНК"',
  mfo: '380838',
  phone: '0503412285',
  address: '25005,м.Кропивницький,вул. Короленка 42, кв. 23',
  taxNote: 'Не є платником податку на прибуток на загальних підставах',
  signatoryName: 'Чумаченко І. В.',
};

// --- СФ-0000305 (Рахунок-фактура / invoice) ---
export const INVOICE_REF = {
  number: 'СФ-0000305',
  date: '2024-12-26',
  recipientName: 'Приватне Акціонерне Товариство  "Кіровоградобленерго"',
  recipientPhone: '0522358224',
  orderRef: 'Договір № ДГ-0001974 від 11.11.24',
  validUntilNote: 'Рахунок дійсний до сплати до 26.12.24',
  lines: [
    {
      name: 'Сервісне обслуговування кондиціонерів 07-12',
      unit: 'шт.',
      quantity: 6,
      price: 541.67,
      total: 3250.02,
    },
    {
      name: 'Сервісне обслуговування кондиціонерів 18-26',
      unit: 'шт.',
      quantity: 4,
      price: 650.0,
      total: 2600.0,
    },
  ] as ResolvedLineItem[],
  subtotal: 5850.02,
  vat: 1170.0,
  total: 7020.02,
  totalInWords: 'Сім тисяч двадцять гривень 02 копійки',
};

// --- РН-0000003 (Видаткова накладна / bill) ---
export const BILL_REF = {
  number: 'РН-0000003',
  date: '2025-02-26',
  recipientName: 'ФОП Крившенко О.С.',
  orderRef: 'Рахунок-фактура № СФ-0000003 від 08.01.25',
  salesTerms: 'Безготівковий розрахунок',
  lines: [
    {
      name: 'Труба мідна CUPRUMFOMA (06,35 мм) - 1/4", Т=0,76мм, бухта L=50м.',
      unit: 'м',
      quantity: 8,
      price: 112.38,
      total: 899.04,
    },
    {
      name: 'Труба мідна CUPRUMFOMA (09,52 мм) - 3/8", Т=0,81 мм, L=50м',
      unit: 'м',
      quantity: 8,
      price: 170.31,
      total: 1362.48,
    },
    { name: 'Труба каучукова Insul Tube 6*6', unit: 'м', quantity: 8, price: 21.08, total: 168.64 },
    {
      name: 'Труба каучукова Insul Tube 6*10',
      unit: 'м',
      quantity: 8,
      price: 22.18,
      total: 177.44,
    },
    { name: 'Труба металопластикова 16х2 мм', unit: 'м', quantity: 6, price: 25.48, total: 152.88 },
    { name: 'Провід ПВС 3х1,0+1х1', unit: 'м', quantity: 9, price: 36.48, total: 328.32 },
    {
      name: 'К-1 опора під кондиціонер (комплект)',
      unit: 'шт.',
      quantity: 2,
      price: 742.32,
      total: 1484.64,
    },
  ] as ResolvedLineItem[],
  subtotal: 4573.44,
  vat: 914.69,
  total: 5488.13,
  totalInWords: "П'ять тисяч чотириста вісімдесят вісім гривень 13 копійок",
};

// --- Довіреність № 19 (M-2 power of attorney / poa) ---
export const POA_REF = {
  number: '19',
  date: '2023-06-30',
  validUntil: '2023-07-10',
  // For a power of attorney the selected counterparty is the SUPPLIER from whom
  // goods will be collected ("На отримання від").
  supplierCompanyName: 'Товариство з Обмеженою Відповідальністю "ТОРГОВА КОМПАНІЯ "ОПТІМ"',
  invoiceRef: 'рахунком № Оп-00012630 від 30,06,2023',
  recipientName: 'Чумаченко Ірина Вікторівна',
  passportSeries: 'ЕА',
  passportNumber: '071876',
  passportDate: '1996-02-28',
  passportIssuedBy: 'Ленінським РВ УМВС України в Кіровоградській обл.',
  lines: [
    {
      name: 'Внутрішній блок кондиціонеру Leberg LS-09FRA2',
      unit: 'шт.',
      quantity: 1,
      price: 0,
      total: 0,
    },
    {
      name: 'Зовнішній блок кондиціонеру Leberg LU-09FRA2',
      unit: 'шт.',
      quantity: 1,
      price: 0,
      total: 0,
    },
  ] as ResolvedLineItem[],
};

/** Normalise apostrophe variants and whitespace so structural assertions are
 * robust to typography differences between the engine and the reference files. */
export function normalize(s: string): string {
  return s
    .replace(/[ʼ’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
