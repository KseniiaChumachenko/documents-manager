---
name: ukrainian-accounting
description: Use when building, planning, validating, or reviewing any feature that touches Ukrainian accounting, tax, business documents, or legal-entity data — единый налог/ЄП, ПДВ/VAT, ЄСВ, військовий збір, ПДФО, ФОП vs ЮО, ЄДРПОУ/РНОКПП/ІПН, КВЕД, податкова накладна, видаткова накладна, рахунок-фактура, довіреність, акт, reporting deadlines, or any рахунок/document export. The reference files ARE a primary-source-cited legal knowledge base for cross-referencing plans and specs against Ukrainian law.
---

# Ukrainian Accounting & Tax — Legal Knowledge Base

This skill is a **validation knowledge base** for a Ukrainian business document-management / accounting platform. Its reference files trace each accounting/tax rule to the governing legal act (Податковий кодекс article, law number, Мінфін order) so that plans, specs, schemas, and generated documents can be **cross-referenced against the legal basis**.

> ⚠ **This is a development-validation aid, not tax/legal advice.** It is not a substitute for a licensed бухгалтер or податковий консультант. Rates, thresholds, and forms change — values here are current as of **June 2026** and most are reset every **1 January** via the annual Budget Law. Always confirm load-bearing numbers against the live act before they go into production logic.

## When to use this skill

Invoke it whenever a task touches any of:
- **Entities & identifiers** — ФОП vs ЮО, ЄДРПОУ (8), РНОКПП/ІПН (10), ІПН платника ПДВ (12), КВЕД, the ЄДР registry, gov data sources.
- **Taxes** — единый налог groups & rates, VAT/ПДВ, військовий збір, ЄСВ, ПДФО, ПСП.
- **Documents** — видаткова накладна, рахунок-фактура, довіреність, акт, податкова накладна; mandatory primary-document requisites; export-format legality.
- **Reporting** — filing/payment deadlines, the deadline-notification engine, ЄРПН registration windows.
- **Payroll** — salary charges, hiring documents, unified ПДФО/ВЗ/ЄСВ reporting.

## Reference files (the knowledge base)

| File | Covers | Maps to roadmap |
|---|---|---|
| `references/00-legal-framework.md` | Source hierarchy: ПКУ, Закон 996, 2464, 755, ЦКУ, КЗпП; which act to cite for what; where official texts live | All phases |
| `references/01-entities-registries.md` | ФОП vs ЮО, ЄДРПОУ/РНОКПП/ІПН ПДВ, КВЕД, ЄДР registry, official vs third-party data sources | Phase 0 (company refresh), Library |
| `references/02-simplified-single-tax.md` | Спрощена система: groups 1–4, rates, income thresholds, restrictions, bookkeeping | Phase 2 (tax) |
| `references/03-vat-pdv.md` | ПДВ registration threshold, rates (20/14/7/0), податкова накладна, ЄРПН | Phase 2 |
| `references/04-military-levy-esv.md` | Військовий збір (5%; new on єдинники), ЄСВ (22%, min/max base) | Phase 2/3 |
| `references/05-payroll-employees.md` | ПДФО + ВЗ + ЄСВ on salary, worked example, hiring docs, 4ДФ reporting | Phase 3 |
| `references/06-primary-documents.md` | Закон 996 ст. 9 mandatory requisites; legal anatomy of the 3 documents + акт; e-signatures; retention | Phase 1 (document generation) |
| `references/07-reporting-deadlines.md` | Filing & payment deadlines per tax; ЄРПН windows; annual calendar | Phase 2/4 (notifications) |
| `references/08-volatile-values-2026.md` | ONE dated table of every rate/threshold/min-wage for 2026 — the thing to update each year | All phases |
| `references/validation-checklist.md` | The cross-reference workflow (below) in detail | — |

**Read the file(s) relevant to the task before answering.** For anything numeric (a rate, threshold, deadline, identifier length), also check `08-volatile-values-2026.md` — it is the single source of truth for values and carries effective dates.

## How to validate a plan/spec against the legal basis

When asked to check, cross-reference, or validate a plan, spec, schema, or generated document:

1. **Decompose** the artifact into discrete features/fields (e.g. "company.egrpou is 8 chars", "single-tax calc uses 5%", "invoice template fields").
2. **Map** each one to the governing rule in the relevant reference file. Cite the act/article.
3. **Classify** every mapping into one bucket:
   - ✅ **Legally sound** — matches the law; cite the supporting article.
   - ⚠ **Gap / ambiguous** — the plan is silent on a legal requirement, or the law is unsettled (note both interpretations).
   - ❌ **Conflict** — the plan contradicts the law (wrong rate, missing mandatory requisite, wrong identifier length, etc.). State the correct rule + citation.
4. **Flag volatility** — for any hard-coded rate/threshold, note its effective date and that it resets annually.
5. **Report** as a findings list grouped by bucket, each finding citing `file_path` (the plan) and the legal source.

See `references/validation-checklist.md` for the per-domain checklist (identifiers, document requisites, tax math, deadlines).

## Sourcing conventions used throughout

- Every substantive rule carries an inline citation to the governing act/article.
- Numeric values carry an **effective date**; recent changes are flagged (e.g. військовий збір 1.5%→5%, eff. 01.12.2024).
- Anything not confirmed against a primary source is marked **⚠ unverified** — treat as "verify before relying."
- Primary sources are Ukrainian-language: **zakon.rada.gov.ua** (acts), **tax.gov.ua** (ДПС). Reputable explainers (dtkt.ua, i.factor.ua, buhgalter911) are used to confirm interpretation.
