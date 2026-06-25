# 03 — VAT / Податок на додану вартість (ПДВ)

*Current as of June 2026. Governed by ПКУ Розділ V «Податок на додану вартість», ст. 180–211.*

## Who must register as a ПДВ payer

- **Mandatory (ст. 181):** register once taxable supply operations over the **last 12 calendar months cumulatively exceed 1 000 000 грн** (excl. VAT) — the "правило мільйона". Threshold in force since 28.12.2014. **Does NOT apply** to єдинники groups 1–3 (simplified, non-VAT).
- **Application deadline (ст. 183.2):** by the **10th day of the month following** the month the 1 млн was reached.
- **Voluntary (ст. 182):** below-threshold persons may register; apply ≥10 calendar days before the start of the period from which they want VAT-payer status (ст. 183.3).

## VAT rates (ст. 193, 194, 195) — unchanged for 2026

- **20%** — standard, the default for most supply/import.
- **14%** — certain agricultural products (specific УКТ ЗЕД codes: wheat, maize, soy, rapeseed, sunflower, etc.); in force since 01.03.2021.
- **7%** — medicines and medical products/devices (registered/authorised); temporary accommodation/hotel services (KVED 55.10); certain cultural events.
- **0%** — export of goods, international transport, duty-free supply. Note: 0% is **taxable** (gives право на податковий кредит/відшкодування), distinct from VAT-**exempt** operations under ст. 197.

## ІПН платника ПДВ (12-digit VAT number)

Assigned on VAT registration; **12 digits**. Distinct from ЄДРПОУ (8) and РНОКПП (10) — see `01-entities-registries.md`. It is a **mandatory requisite** of the податкова накладна for both seller and buyer (ст. 201.1).

## Податкова накладна (tax invoice) — the core VAT document

The **податкова накладна (ПН)** is the central VAT instrument: the seller draws it up on the date the tax liability arises and registers it; it is the buyer's sole basis for податковий кредит. It is **NOT a primary accounting document** — it is generated *from* primary documents.

**Mandatory requisites (ст. 201.1)** — each on a separate line:
- (а) sequential number; (б) date of issue;
- (в) seller's full/abbreviated name (per statutory docs);
- (г) **податковий номер (ІПН ПДВ) of seller AND buyer**;
- (ґ) buyer's full/abbreviated name;
- (д) description (nomenclature), quantity/volume of goods/services;
- (е) supply price excluding VAT;
- (є) VAT rate + tax amount;
- (ж) total payable incl. VAT;
- (з) **commodity code per УКТ ЗЕД** (goods) or **service code per ДК 016** (services).

**Registration in ЄРПН (ст. 201.10):** the seller must register the ПН in the **Єдиний реєстр податкових накладних**. Without registration the buyer has **no right to податковий кредит**.

**ЄРПН registration deadlines (ст. 201.10):**
- ПН/РК dated **1st–15th** → by the **5th** of the following month.
- ПН/РК dated **16th–end** → by the **18th** of the following month.
- Consolidated (зведені) → within 20 days after the month.
- Absolute ceiling: **1095 days** from the invoice date.

**Penalties for late registration (ст. 120¹, wartime reduced rates п. 90 підрозд. 2 розд. XX),** as a % of the invoice VAT: **2%** (≤15 days), **5%** (16–30), **10%** (31–60), **15%** (61–365), **25%** (366+). For exempt/0%: 2% of value (max 1 020 грн) late, 5% (max 3 400 грн) for non-registration. +50% if the assessed fine is unpaid within 10 days.

## Input vs output VAT

- **Податкове зобов'язання (output VAT)** — VAT charged on own supplies (sales); arises per the first-event rule (ст. 187). Recorded from ПН **issued**. Direction: **output**.
- **Податковий кредит (input VAT)** — VAT deductible on purchases (ст. 198); backed by ПН **received** and registered in ЄРПН. Direction: **input**.
- **VAT payable = output − input.** Every VAT record should carry a direction flag (видана/output vs отримана/input) — matches the repo's planned `vat_record.direction`.

## VAT reporting

- **Декларація з ПДВ** filed **monthly** (standard VAT period = calendar month, ст. 202): within **20 calendar days** after month-end (ст. 203.1 / 49.18.1).
- **Payment:** within **10 calendar days** after the filing deadline (ст. 203.2 / 57.1) — i.e. ~by the 30th.

## ⚠ Three DIFFERENT documents — do not conflate

Critical for this software, which generates **рахунок-фактура** and **видаткова накладна**, NOT податкова накладна:

| Document | Legal nature | Who issues |
|---|---|---|
| **Податкова накладна** | VAT/tax document (not primary); supports buyer's податковий кредит; registered in ЄРПН | VAT payers only |
| **Рахунок-фактура** (СФ) | Commercial billing/payment request; informational | Any seller |
| **Видаткова накладна** (РН) | Primary accounting document confirming transfer of goods | Any seller |

The податкова накладна is a separate fiscal document filed to ЄРПН — **not produced by this application** (unless a VAT module is later added). See `06-primary-documents.md` for the legal anatomy of the documents the app *does* generate.

## Sources

- ПКУ ст. 181, 182, 183, 193, 195, 201, 203 — https://zakon.rada.gov.ua/laws/show/2755-17 (mirrors: i.factor.ua/law-24, ibuhgalter.net/tax-codex)
- tax.gov.ua — Розділ V ПДВ — https://tax.gov.ua/nk/rozdil-v--podatok-na-dodanu-vartist/
- ЄРПН deadlines 2026 — https://i.factor.ua/ukr/journals/nibu/2026/january/issue-8/article-135850.html
- Штрафи за несвоєчасну реєстрацію ПН 2026 — https://news.dtkt.ua/taxation/pdv/99275
- Рахунок vs видаткова vs податкова — https://taxer.ua/uk/kb/vydatkova-nakladna-ta-rakhunok-faktura

**⚠ pending verbatim:** exact wording of ст. 182 (voluntary registration) — substance confirmed via ст. 183.3.
