# 07 — Reporting & Payment Deadlines

*Current as of June 2026. Grounded in ПКУ № 2755-VI. Designed as the reference for a deadline-notification engine (Phase 4).*

**Universal weekend rule (ст. 49.20 / ст. 57.1):** if the last filing/payment day falls on a weekend or holiday, it moves to the **next working (banking) day**. Applies to every line below.

## Master clock (ПКУ ст. 49.18 + ст. 57.1)

| Reporting period | Filing deadline (after period end) | Payment deadline |
|---|---|---|
| Monthly | **20 calendar days** (49.18.1) | +10 days → ≈30 days after month-end (57.1) |
| Quarterly / half-year | **40 calendar days** (49.18.2) | +10 days → ≈50 days after quarter-end |
| Annual | **60 calendar days** (49.18.3) | +10 days |

ст. 57.1: pay "протягом 10 календарних днів, що настають за останнім днем відповідного граничного строку" for filing.

## Єдиний податок (ст. 294–296)

| Group | Tax payment | Declaration filing |
|---|---|---|
| **1 & 2** | Advance, **by the 20th of the current month** (may prepay) | **Annually**, 60 days after year-end (≈ by 1 March) |
| **3** | Within 10 days after filing deadline → **~50 days after quarter-end** | **Quarterly**, 40 days after quarter-end |

### Військовий збір for єдинники

| Group | Rate | Payment timing |
|---|---|---|
| **1, 2, 4** | 10% of МЗП (**864,70 грн/міс** in 2026) | Advance, **by the 20th** of the current month (aligns with ЄП) |
| **3** | 1% of income | **Quarterly**, with the ЄП declaration |

## ПДВ (Розділ V)

| Item | Deadline |
|---|---|
| Declaration filing | **Monthly only** — within **20 days** after month-end (ст. 203.1) |
| Tax payment | within **10 days** after filing deadline (≈ by the 30th) (ст. 203.2) |

**ЄРПН registration of ПН/РК (ст. 201.10):** dated 1st–15th → by the **5th** of next month; dated 16th–end → by the **18th** of next month; зведені → within 20 days; absolute ceiling **1095 days**.

## Об'єднана звітність — ЄСВ + ПДФО + ВЗ (Податковий розрахунок, 4ДФ)

| Item | Deadline |
|---|---|
| Report filing | ⚠ **2026 split: ЮО employers MONTHLY (+20 days); ФОП/self-employed QUARTERLY (+40 days)** — see `05-payroll-employees.md`. Treat the split as **⚠ unverified** for the exact 2026 forms; confirm against the current ДПС order. |
| ЄСВ payment | Monthly, **by the 20th** of the following month (Закон 2464 ст. 9) |
| ПДФО / ВЗ payment | On salary payout (or next banking day; if accrued-unpaid, within 30 days after month-end) (ст. 168.1) |

## Загальна система ФОП (ст. 177)

| Item | Deadline |
|---|---|
| Annual income declaration (декларація про майновий стан і доходи) | within **40 days** after year-end → **by 9 February** (ст. 177.11, 49.18.5) |
| ПДФО + ВЗ payment | within 10 days after filing → **~19 February** (ст. 177.5.3) |
| Quarterly ПДФО advances | by the 20th of the month after each quarter (no advance for Q4) (ст. 177.5.1) |

> ⚠ Don't conflate: a **ФОП** on загальна система files by **9 Feb** (40 days); an **ordinary individual** declaring non-business income files by **1 May** (ст. 49.18.4).

## Юр. особи — податок на прибуток (ст. 137)

| Filer | Filing deadline |
|---|---|
| Quarterly (prior-year income > 40 млн грн) — cumulative Q/half/9-mo/year | **40 days** after each quarter (49.18.2, 137.4) |
| Annual (new entities, ag-producers, ≤ 40 млн грн) | **60 days** after year-end (49.18.3, 137.5) |
| Payment | within 10 days after filing (57.1) |

⚠ 40 млн грн threshold is the post-2022 value; some legacy sources cite 20 млн — verify against current ст. 137.

## Annual cadence summary

**Monthly (by 20th, pay by ~30th):** ПДВ declaration + payment; ЄП groups 1 & 2 advance + ВЗ; ЄСВ payment; ПДФО/ВЗ on each payout.
**Twice a month:** ЄРПН registration (5th and 18th cut-offs).
**Quarterly (file +40 days ≈ 9th of 2nd month after quarter; pay +10 days):** ЄП group 3 declaration + payment + ВЗ; unified ЄСВ/ПДФО/ВЗ розрахунок (filing); profit tax (quarterly filers).
**Annually (file +60 days ≈ by 1 March):** ЄП groups 1 & 2 declaration; profit tax (annual filers); **exception:** ФОП загальна система income declaration **by 9 Feb**; ordinary individuals **by 1 May**.

## Sources

- ПКУ ст. 49, 57, 177, 201, 203, 295 — https://zakon.rada.gov.ua/laws/show/2755-17 (mirrors: i.factor.ua/law-24, protocol.ua)
- ЄРПН registration terms — https://taxer.ua/uk/kb/stroky-reiestratsii-podatkovykh-nakladnykh-ta-rozrakhunkiv-koryhuvannia
- ВЗ for єдинники — https://taxer.ua/uk/kb/vijskovij-zbir-dlya-fopplatnikiv-yep
- Об'єднана звітність 2026 — https://i.factor.ua/ukr/journals/nibu/2026/april/issue-32/article-137237.html
- ФОП загальна система 9 Feb — https://i.factor.ua/ukr/journals/nibu/2026/january/issue-8/article-135832.html

**⚠ unverified for 2026:** monthly-vs-quarterly split of the unified Податковий розрахунок; profit-tax quarterly/annual income threshold (40 vs 20 млн).
