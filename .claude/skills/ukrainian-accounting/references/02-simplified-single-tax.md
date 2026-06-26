# 02 — Simplified System / Single Tax (Спрощена система / Єдиний податок)

*Current as of June 2026. Governed by ПКУ Розділ XIV, Глава 1, ст. 291–300. All 2026 amounts anchor to indicators set on 1 Jan 2026: minimum wage (МЗП) = **8 647 грн**; subsistence minimum for an able-bodied person (ПМ працездатних) = **3 328 грн** (Закон «Про Держбюджет на 2026 рік» № 4695-IX). See `08-volatile-values-2026.md`.*

## The four groups — eligibility (ПКУ ст. 291.4)

| Group | Entity | Max employees | Activity |
|---|---|---|---|
| **1** | ФОП only | **0** | Retail trade from market places + household services to the public only |
| **2** | ФОП only | **≤ 10** | Services to the public/єдинники, goods production/sale, restaurant business (excludes services to general-system businesses) |
| **3** | ФОП **and** ЮО | No limit | Almost any activity not banned by ст. 291.5; counterparties unrestricted |
| **4** | Agricultural producers (ЮО with ≥75% ag income; family-farm ФОП) | Family members | Agricultural commodity production (land-based tax) |

## Income thresholds — граничний обсяг доходу (ст. 291.4)

Thresholds are statutory multiples of the 1-January minimum wage (8 647 грн for 2026):

| Group | Multiplier | 2026 ceiling (UAH) |
|---|---|---|
| **1** | 167 × МЗП | **1 444 049 грн/рік** |
| **2** | 834 × МЗП | **7 211 598 грн/рік** |
| **3** | 1 167 × МЗП | **10 091 049 грн/рік** |
| **4** | — | No income ceiling (land-area based) |

Exceeding the ceiling → **15% penalty rate** on the excess (ст. 293.4) + obligatory transition off the group.

## Rates (ст. 293) — effective 01.01.2026

- **Group 1** — up to **10% of ПМ працездатних** → max **332,80 грн/month** (set by local council).
- **Group 2** — up to **20% of МЗП** → max **1 729,40 грн/month** (set by local council).
- **Group 3** — **5% of income** (non-VAT payer) **or** **3% of income + ПДВ** (VAT payer).
- **Group 4** — land-based, per hectare as a % of нормативна грошова оцінка (e.g. ~0,95% arable land); ст. 293.9, 292¹.
- **15%** penalty rate applies to over-threshold income, prohibited-activity income, and non-monetary settlements (ст. 293.4).

> ⚠ Group 1/2 figures above are statutory **maxima**; the actual rate is set per local hromada and may be lower.

## Restrictions (ст. 291.5, 291.6)

- **Prohibited activities (groups 1–3, ст. 291.5.1):** gambling/lotteries; currency exchange; production/export/import/sale of excisable goods (limited retail fuel/beer/wine exceptions); minerals of national significance; precious metals/stones; financial intermediation (except insurance agents); enterprise management; postal/electronic-communications; sale of art/antiques/auctions; tour-operator activity (operators barred, agents allowed); real-estate rental over limits (land >0.2 ha, residential >100 m², non-residential >300 m²).
- **Other ineligibility (ст. 291.5.2+):** non-residents; insurers/banks/financial institutions; those with **tax debt** on the application date.
- **Settlement form (ст. 291.6):** єдинники (groups 1–3) must settle **exclusively in money — cash (готівка) or non-cash (безготівка)**. Barter, promissory notes, assignment of claims = forbidden → 15% rate + loss of status.
- **Loss of status (ст. 298.2.3):** exceeding the ceiling; prohibited/unregistered activity; non-monetary settlement; tax debt 2+ quarters; exceeding employee limits. Transition to загальна система from the next quarter.

## Bookkeeping obligation (ст. 296.1)

- **Groups 1–3 non-VAT:** keep **income records in free form** (the mandatory paper Книга обліку доходів was abolished from 01.01.2021); paper or electronic. No expense accounting.
- **Group 3 VAT payers:** keep **both income and expenses** in free form.
- **Contrast — ФОП on загальна система:** must keep a formal Типова форма обліку доходів і витрат and account for documented **expenses** (taxed on net profit: ПДФО 18% + військовий збір), a materially heavier burden.

## Recent changes to flag

- **Військовий збір now applies to єдинники** — new from 01.01.2025 (Закон № 4015-IX). 2026: groups 1/2/4 pay **10% of МЗП = 864,70 грн/month**; group 3 pays **1% of income**. See `04-military-levy-esv.md`.
- **Threshold base rose** with МЗП going 8 000 → 8 647 грн, lifting all ceilings for 2026.
- ⚠ **Forward watch (draft, not law as of June 2026):** Мінфін proposal to make VAT registration largely mandatory for єдинники from 01.01.2027 and raise the VAT threshold to 4 млн грн — do not encode yet.

## Sources

- ПКУ ст. 291–300 — https://zakon.rada.gov.ua/laws/show/2755-17 (ст. 291 mirror: https://kodeksy.com.ua/podatkovij_kodeks_ukraini/statja-291.htm)
- ДПС — «2026 рік для ФОП: нові розміри ЄП та ВЗ» — https://tax.gov.ua/media-tsentr/novini/968282.html
- dtkt — Єдиний податок 2026 — https://services.dtkt.ua/catalogues/tax_rates/173-jedinii-podatok-v-ukrayini-u-2026-roci
- Закон № 4015-IX (ВЗ для ФОП з 2025) — https://business.diia.gov.ua/news/viiskovyi-zbir-dlia-fop-ta-iurydychnykh-osib-zaprovadzhuietsia-z-1-sichnia-2025-roku

**⚠ unverified:** local-council-adopted Group 1/2 rates (statutory maxima shown).
