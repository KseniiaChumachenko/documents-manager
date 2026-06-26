# 05 — Payroll & Employment Documentation

*Current as of June 2026. For a future payroll/employee module. Sources: ПКУ № 2755-VI, КЗпП № 322-VIII, Закон 2464-VI.*

## The three charges on salary — who bears each

| Charge | Rate | Base | Borne by | Basis |
|---|---|---|---|---|
| **ПДФО** | **18%** | gross salary | employee (withheld) | ПКУ ст. 167.1 |
| **Військовий збір** | **5%** (since 01.12.2024) | gross salary | employee (withheld) | ПКУ підрозд. 10 розд. XX п. 16-1 |
| **ЄСВ** | **22%** | gross salary | **employer** (on top of gross) | Закон 2464 ст. 8 |

Employer is the **tax agent**: withholds ПДФО + ВЗ and remits at payment (ПКУ ст. 168.1). ЄСВ min base = МЗП → min monthly ЄСВ **1 902,34 грн** (2026); max base = 20× МЗП = 172 940 грн.

### Worked example — gross 20 000 грн (2026, full month)

| Line | Formula | Amount (грн) |
|---|---|---|
| Gross (нарахована ЗП) | — | **20 000.00** |
| − ПДФО 18% | 20 000 × 0.18 | −3 600.00 |
| − Військовий збір 5% | 20 000 × 0.05 | −1 000.00 |
| **= Net to employee (на руки)** | | **15 400.00** |
| ЄСВ 22% (employer, on top) | 20 000 × 0.22 | +4 400.00 |
| **Total employer cost** | 20 000 + 4 400 | **24 400.00** |

State receives 4 600 грн withheld (ПДФО + ВЗ); employer pays 4 400 грн ЄСВ on top.

## Minimum wage — 2026 (Закон № 4695-IX, eff. 01.01.2026)

- **Monthly: 8 647 грн** · **Hourly: 52 грн**. Fixed for all 12 months (no mid-year step).
- **КЗпП ст. 95:** wage for a fully performed monthly/hourly norm **cannot be below** the minimum wage; if it is, the employer pays the difference (доплата до рівня МЗП). Mandatory for all employers.

## Податкова соціальна пільга (ПСП) — ПКУ ст. 169

Reduces the **ПДФО base only** (not ВЗ, not ЄСВ), for lower-income employees, applied at one workplace on application.

- **2026 base (100%) ПСП = 1 664 грн** (50% × ПМ працездатних 3 328).
- **Income limit to qualify = 4 660 грн/month** (3 328 × 1.4, rounded). At the 2026 minimum wage (8 647) **no ordinary full-time employee qualifies**; ПСП is practically relevant only for part-timers/low norms and the enhanced categories.
- **Enhanced:** 150% = 2 496 грн (e.g. single parents, per child); 200% = 3 328 грн. Income limit ×(number of children) for employees with children.

## Employment documentation an HR/payroll module must track

| Document | Purpose | Basis |
|---|---|---|
| **Трудовий договір** | Employment contract — work cannot begin without it | КЗпП ст. 21, 24 |
| **Наказ про прийняття на роботу** | Hiring order formalizing the contract | КЗпП ст. 24 |
| **Повідомлення про прийняття працівника** | Notify **ДПС BEFORE the employee starts work** | Постанова КМУ № 413 (17.06.2015) |
| **Штатний розпис** | Staffing schedule (positions, headcount, rates) | employer org doc |
| **Табель обліку робочого часу** | Timesheet (form П-5) — basis for pay | КЗпП ст. 30 |
| **Розрахунково-платіжна відомість** | Payroll sheet (form П-6/П-7) | Інстр. № 5 |

**Critical:** under КЗпП ст. 24 an employee may **not** be admitted to work without (a) a contract + hiring order, **and** (b) a **Повідомлення про прийняття** filed to ДПС **before work begins** (form/procedure per КМУ № 413), electronically with КЕП.

## Payroll reporting — Об'єднана звітність (Податковий розрахунок, Додаток 4ДФ)

Unified report combining **ПДФО + ВЗ + ЄСВ**: a core form plus appendices Д1 (ЄСВ per person), 4ДФ (per-individual income + ПДФО + ВЗ), Д5 (employment events), Д6 (service record).

> ⚠ **2026 cadence split (correction to the common "quarterly for all" assumption):**
> - **Legal-entity employers (ЮО): MONTHLY**, within **20 days** after month-end.
> - **ФОП / self-employed: QUARTERLY**, within **40 days** after quarter-end.
> A payroll module's reporting cadence therefore **depends on entity type**. ⚠ Confirm against the current ДПС form order — this was an active 2026 reform.

ЄСВ paid monthly by the 20th; ПДФО/ВЗ paid on salary payout.

## Martial-law / wartime nuances (2026)

- **Військовий збір 5%** is itself a wartime measure (підрозд. 10 розд. XX) — in force in 2026.
- **Закон № 2136-IX «Про організацію трудових відносин в умовах воєнного стану»** affects notice, leave, and **призупинення трудового договору** for mobilized employees — a payroll module must handle "suspended" employees (no pay, no ЄСВ accrual during призупинення). ⚠ clauses change frequently — verify current text.
- ⚠ **unverified:** exact 2026 ЄСВ treatment for mobilized employees — confirm against Закон 2464 transitional provisions before implementing.

## Sources

- ПКУ ст. 167.1, 168, 169 — https://zakon.rada.gov.ua/laws/show/2755-17
- КЗпП ст. 24, 95 — https://zakon.rada.gov.ua/laws/show/322-08
- Постанова КМУ № 413 — https://zakon.rada.gov.ua/go/413-2015-%D0%BF
- Мінімальна зарплата 2026 (Закон 4695-IX) — https://services.dtkt.ua/catalogues/indexes/169-minimalna-zarplata-u-2026-roci
- ПСП 2026 — https://lv.tax.gov.ua/media-ark/news-ark/976512.html
- Об'єднана звітність 2026 (місяць vs квартал) — https://i.factor.ua/ukr/journals/nibu/2026/april/issue-32/article-137237.html , https://tax.gov.ua/media-tsentr/novini/984181.html

**⚠ unverified:** 2026 martial-law labour-suspension clauses; ЄСВ for mobilized employees.
