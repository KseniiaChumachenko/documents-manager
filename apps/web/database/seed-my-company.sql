-- Seed the single "My company" (supplier identity) record from the reference
-- documents. Editable in-app via /settings. Always id=1.
INSERT OR IGNORE INTO my_company (
  id, name, egrpou, inn, vat_certificate, iban, bank_name, mfo, phone, address, tax_note, signatory_name
) VALUES (
  1,
  'Фізична особа-підприємець Чумаченко Ірина Вікторівна',
  '2559104287',
  '2559104287',
  '68904067',
  'UA183808380000026006799955398',
  'АТ "ПРАВЕКС-БАНК"',
  '380838',
  '0503412285',
  '25005,м.Кропивницький,вул. Короленка 42, кв. 23',
  'Не є платником податку на прибуток на загальних підставах',
  'Чумаченко І. В.'
);
