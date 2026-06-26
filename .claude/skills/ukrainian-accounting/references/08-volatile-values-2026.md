# 08 — Volatile Values (2026)

> ⚠ **VERIFY BEFORE RELYING.** Every value here changes at least annually — set on **1 January** via the Budget Law (and ad-hoc by ПКУ amendments). This is the **single source of truth** for numeric values across the knowledge base. When updating for a new year, update THIS file and the dependents will follow.
>
> **As of:** June 2026 · **Anchor act:** Закон «Про Державний бюджет України на 2026 рік» № 4695-IX (від 03.12.2025), effective 01.01.2026 · **Next review:** January 2027.

## B1. Base social standards (effective 01.01.2026)

| Indicator | Value | Notes |
|---|---|---|
| Мінімальна заробітна плата — monthly | **8 647 грн** | up from 8 000 грн (2025); flat all of 2026 |
| Мінімальна заробітна плата — hourly | **52 грн** | up from 48 грн |
| Прожитковий мінімум — загальний | **3 209 грн** | |
| Прожитковий мінімум — працездатних осіб | **3 328 грн** | drives ПСП & ЄП group 1 |
| ПМ — діти до 6 / 6–18 / непрацездатні | 2 817 / 3 512 / 2 595 грн | |

## B2. ЄСВ (rate 22%)

| Indicator | Value | Basis |
|---|---|---|
| Ставка ЄСВ | **22%** | Закон 2464 ст. 8 |
| Мінімальний місячний ЄСВ | **1 902,34 грн** | 22% × 8 647 |
| Максимальна база нарахування | **172 940 грн/міс** | 20 × 8 647 |
| Максимальний місячний ЄСВ | **38 046,80 грн** | 22% × 172 940 |
| ЄСВ за дисабіліті-працівника (роботодавець) | **8.41%** | reduced rate |

## B3. Єдиний податок — 2026

| Group | Rate | Max ЄП/month | Income threshold/year |
|---|---|---|---|
| **1** | ≤10% ПМ працездатних | **332,80 грн** | **1 444 049 грн** (167 × МЗП) |
| **2** | ≤20% МЗП | **1 729,40 грн** | **7 211 598 грн** (834 × МЗП) |
| **3** | **5%** (non-VAT) / **3%** + ПДВ | % of income | **10 091 049 грн** (1 167 × МЗП) |
| **4** | land-based (per ha) | — | no ceiling |

## B4. Військовий збір

| Payer | 2026 | Basis |
|---|---|---|
| Standard (employees / ПДФО payers) | **5% of income** | eff. 01.12.2024 (Закон 4015-IX); was 1.5% |
| Єдинники groups 1, 2, 4 | **864,70 грн/міс** (fixed) | 10% × МЗП 8 647; new since 01.01.2025 |
| Єдинники group 3 | **1% of income** | new since 01.01.2025 |
| Військовослужбовці (exception) | **1.5%** | |

## B5. ПДФО & ПСП

| Indicator | Value | Basis |
|---|---|---|
| Ставка ПДФО | **18%** | ПКУ розд. IV, ст. 167.1 |
| ПСП — базова (100%) | **1 664 грн** | 50% × 3 328 |
| ПСП — граничний дохід для застосування | **4 660 грн** | 3 328 × 1.4 |
| ПСП — 150% / 200% | 2 496 / 3 328 грн | enhanced categories |

> ПСП reduces the ПДФО base only — not ЄСВ, not військовий збір.

## B6. ПДВ

| Indicator | Value | Notes |
|---|---|---|
| Standard rate | **20%** | |
| Reduced — pharma/medical | **7%** | |
| Reduced — certain agri | **14%** | |
| Export / specified | **0%** | taxable, not exempt |
| Mandatory registration threshold | **1 000 000 грн** | taxable supplies over last 12 months, excl. VAT |

> ⚠ **Forward watch (draft, NOT law as of June 2026):** Мінфін proposal to raise VAT threshold to **4 000 000 грн** and make VAT registration largely mandatory for єдинники from **01.01.2027**. Track passage; do not encode yet.

## B7. Identifier lengths (structural — not annual)

| Identifier | Length | Belongs to |
|---|---|---|
| **ЄДРПОУ** | **8 digits** | Legal entities (ЮО) |
| **РНОКПП** (= ІПН фізособи) | **10 digits** | Individuals / ФОП |
| **ІПН платника ПДВ** | **12 digits** | VAT payers (ЮО or ФОП) |

## Quick consistency checks (arithmetic)

- 22% × 8 647 = **1 902.34** ✓ (min ЄСВ)
- 20 × 8 647 = **172 940** ✓ (max ЄСВ base)
- 50% × 3 328 = **1 664** ✓ (ПСП)
- 10% × 8 647 = **864.70** ✓ (ВЗ groups 1/2/4)
- 167 / 834 / 1 167 × 8 647 = **1 444 049 / 7 211 598 / 10 091 049** ✓ (ЄП thresholds)

## Sources

- Закон № 4695-IX (Держбюджет 2026) — https://zakon.rada.gov.ua/go/4695-20
- ДПС — 2026 для ФОП — https://tax.gov.ua/media-tsentr/novini/968282.html
- dtkt — ЄП 2026 / ЄСВ 2026 / ПМ 2026 — https://services.dtkt.ua/catalogues/tax_rates/173 , .../172 , https://services.dtkt.ua/catalogues/indexes/170
- factor.academy — Держбюджет 2026 — https://factor.academy/blog/derzhavnij-byudzhet-2026-minimalna-zarplata-prozhitkovij-minimum-indeksaciya-yesv/
- ПФУ — ЄСВ для ФОП 2026 — https://www.pfu.gov.ua/vn/414645-splata-yesv-dlya-fop-z-1-sichnya-2026-roku/

**⚠ unverified / pending:** VAT 4 млн threshold + mandatory єдинник VAT registration (draft, targeted 2027).
