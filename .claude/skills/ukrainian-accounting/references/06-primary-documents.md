# 06 — Primary Documents (the legal backbone for document generation)

*Current as of June 2026. This is the MOST important file for the document-generation engine (Phase 1). The app generates **довіреність**, **рахунок-фактура (СФ)**, **видаткова накладна (РН)**, and likely **акт**. Their exports must legally match these requisites.*

## What is a «первинний документ» (primary document)

- **Definition (Закон № 996-XIV, ст. 1):** a document **containing information about a господарська операція** (a business transaction that changes assets/liabilities/equity). Since the 2017 amendment (Закон № 1724-VIII) a document is "primary" by **content**, not by carrying a state-mandated form.

### MANDATORY requisites — обов'язкові реквізити (Закон № 996-XIV, ст. 9 ч. 2)

Every primary document **must** contain (this is the legal backbone for all templates):

1. **назву документа (форми)** — name of the document/form;
2. **дату складання** — date of compilation;
3. **назву підприємства**, on whose behalf the document is drawn up;
4. **зміст та обсяг господарської операції, одиницю виміру** — content, volume, and unit of measurement of the transaction;
5. **посади осіб**, responsible for the operation and the correctness of its execution;
6. **особистий підпис** or other data identifying the person who participated in the operation.

Notes:
- ст. 9 ч. 2 lists **positions**; the **surname (прізвище)** requirement is reinforced by **Наказ Мінфіну № 88, п. 2.4** — templates should carry **position + surname + signature**.
- **Optional** requisites (номер документа, підстава, печатка/М.П., recipient-ID) may be added but their absence does **not** invalidate the document (ст. 9 ч. 2).
- Reinforced by **Положення про документальне забезпечення записів у бухобліку (Наказ Мінфіну № 88 від 24.05.1995)** — п. 2.1–2.7 repeat the requisites and permit self-made forms that carry them.

## Видаткова накладна (РН — delivery/expense note)

- **Legal status:** unambiguously a **primary document** — it records the transfer (відвантаження) of goods/ТМЦ. **No state-mandated form**; the enterprise designs it, but it must carry all ст. 9 ч. 2 requisites.
- **Typical fields:** number + date; `Постачальник` and `Покупець` with name + **ЄДРПОУ** (ЮО) / **РНОКПП** (ФОП), address, IBAN; `Підстава` (договір/рахунок); line table — номенклатура, од. виміру, кількість, ціна без ПДВ, сума без ПДВ; `Сума ПДВ`, `Всього з ПДВ`; amount in words; `Відпустив` (position + surname + signature) and `Отримав` (position + surname + signature, often citing the довіреність); `М.П.` (optional since 2017).

## Рахунок-фактура (СФ — commercial invoice)

- **Legal status — disputed:** by default a рахунок-фактура is **NOT a primary document** (it's a payment request, "носить лише інформаційний характер" per ДПС).
- **Мінфін's liberal position (лист 16.02.2017 № 31-11410-06-5/4339, reaffirmed 24.03.2023 № 41010-06-5/7983):** a рахунок-фактура **CAN serve as the primary document** — without a separate акт приймання-передачі — **IF** (a) it carries **all** ст. 9 ч. 2 requisites **AND** (b) it has been **paid** (confirmed by payment docs). **Safe design:** build the СФ template to carry the full ст. 9 requisite set, and **also support an Акт** for cases where ДПС's stricter view matters.
- **Typical fields:** `Рахунок-фактура № ___` + date; seller/buyer with ЄДРПОУ/ІПН + IBAN; line items; ПДВ; total in figures and words; `Виписав(ла)` signature. **Numbering is free** (no state form).

## Довіреність на отримання ТМЦ (power of attorney to receive goods)

- **Current 2026 position:** the former mandatory typed forms **М-2 / М-2в** and the registration Instruction (Наказ Мінфіну № 99) were **CANCELLED** by **Наказ Мінфіну № 987 від 30.09.2014, effective 01.01.2015**. Since then there is **no obligatory state form**.
- **Legal basis now:** general representation rules — **ЦКУ ст. 244–250** — plus **Положення № 88**. Drawn up in **free form** on the enterprise letterhead; itself a primary document confirming authority to receive ТМЦ.
- **Term (ЦКУ ст. 247):** set in the document; a довіреність **without a date of issue is void (нікчемна)**. ⚠ verify the exact maximum-term wording against the live ЦКУ for help-text (commentaries vary).
- **Signed** by the head (керівник); chief-accountant signature no longer mandatory.
- **Журнал реєстрації довіреностей:** no longer legally mandatory (after № 99 repeal) but enterprises may keep one for internal control.
- **Recommended fields:** number, date, term, issuer (+ ЄДРПОУ), authorized person (ПІБ + passport/РНОКПП), supplier, the basis document (рахунок/договір) + list of ТМЦ, bearer's specimen signature, head's signature.

> The repo's reference file `Довіреність № 19 від 30,06,2023.xls` is exactly this free-form goods-receipt PoA.

## Акт виконаних робіт / наданих послуг

A **primary document** confirming works performed / services rendered. No universal state form. Full **ст. 9 ч. 2** requisites apply: name + date, both parties with ЄДРПОУ/ІПН, content + volume + units, cost without ПДВ + ПДВ + total, period, signatures of `Виконавець`/`Замовник` (position + surname). It is the standard alternative to the "paid invoice as primary document" route.

## Electronic documents & signatures

- Electronic primary documents have **equal legal force** with paper (Закон 996 ст. 9 ч. 1; Закон «Про електронні документи…» № 851-IV).
- Qualified e-signature **КЕП** (Закон «Про електронні довірчі послуги» № 2155-VIII) has the legal effect of a handwritten signature + seal.
- On request of a counterparty/controlling body, the enterprise must produce **paper copies** (ст. 9 ч. 5). The traditional **exported XLSX/PDF with signature + М.П. (stamp)** remains fully valid; the seal itself is optional since 2017 (Закон № 1982-VIII).

## Retention period

- **Перелік № 578/5** (Наказ Мін'юсту, з останніми змінами Наказом № 40/5, чинними з 10.02.2024): baseline **3 роки (1095 днів)** for primary documents; **5 років (1825 днів)** for primary documents of legal entities under ПКУ п. 44.3 / corporate-tax payers. ФОП generally 3 роки. Periods run from submission of the related reporting. ⚠ wartime suspension of retention terms may apply (ПКУ п. 69) — verify.

## Sources

- Закон № 996-XIV ст. 1, ст. 9 — https://zakon.rada.gov.ua/laws/show/996-14 (mirror: https://i.factor.ua/ukr/law-70/section-392/article-32626/)
- Наказ Мінфіну № 88 — https://zakon.rada.gov.ua/go/z0168-95
- ЦКУ ст. 244, 247 — https://zakon.rada.gov.ua/laws/show/435-15
- Довіреність М-2 скасовано (Наказ № 987) — https://interbuh.com.ua/ua/documents/onenews/54754
- Рахунок-фактура як первинний документ (Мінфін лист) — https://buhgalter911.com/uk/news/news-1027119.html
- Перелік № 578/5 (строки зберігання) — https://zakon.rada.gov.ua/laws/show/z0571-12

**⚠ unverified:** exact ЦКУ ст. 247 maximum-term wording; wartime suspension of retention periods.
