# Validation Checklist — Cross-Referencing Plans Against the Legal Basis

Use this when asked to **check / validate / cross-reference** a plan, spec, schema, migration, or generated document against Ukrainian law. Output a findings list bucketed **✅ sound / ⚠ gap / ❌ conflict**, each citing the artifact (`file_path:line`) and the legal source.

## General method

1. Decompose the artifact into discrete features/fields.
2. Map each to the governing rule (use the per-domain checklists below).
3. Classify: ✅ sound · ⚠ gap (plan silent, or law unsettled) · ❌ conflict (contradicts the law).
4. For any hard-coded number, flag its effective date + annual volatility (`08-volatile-values-2026.md`).
5. Report grouped by bucket.

## Domain checklists

### A. Entity & identifier modelling (`01-entities-registries.md`)
- [ ] ЮО records keyed by **8-digit ЄДРПОУ**; ФОП by **10-digit РНОКПП** — never both on one record.
- [ ] An `entity_type` distinguishes `legal` (ЮО) vs `fop` — required to pick the right identifier + tax rules.
- [ ] A VAT-payer's **12-digit ІПН ПДВ** stored separately (optional) — not conflated with ЄДРПОУ/РНОКПП.
- [ ] КВЕД stored as code (e.g. "01.11") + description; classifier is ДК 009:2010 through 2026 (NACE 2.1-UA from 2027 → plan a remap).
- [ ] Company data sourced from official ЄДR/data.gov.ua or labelled third-party (adm.tools/YouControl/Opendatabot).
- [ ] Field lengths/validation: ЄДРПОУ = exactly 8 digits; РНОКПП = exactly 10; ІПН ПДВ = 12.

### B. Document templates & generation (`06-primary-documents.md`)
- [ ] Every generated **primary document** carries all 6 ст. 9 ч. 2 requisites: name, date, enterprise, content+volume+unit, responsible persons' **positions + surnames**, signature.
- [ ] Видаткова накладна: both parties with ЄДРПОУ/РНОКПП, line items with units, ПДВ split, `Відпустив`/`Отримав` signatures.
- [ ] Рахунок-фактура: carries full ст. 9 requisites (so a *paid* invoice can stand as primary) **and** an Акт path exists for the stricter ДПС view.
- [ ] Довіреність: free-form (М-2/М-2в abolished 01.01.2015), has a **date of issue** (без дати = void), term, issuer, authorized person + РНОКПП, ТМЦ list, head's signature.
- [ ] Export (XLSX/PDF) preserves signature + optional М.П.; matches the reference `.xls` layout.
- [ ] Numbering: free per enterprise (no state format) — but consistent/sequential per type.

### C. Tax calculations (`02`, `03`, `04`, `05`, `08`)
- [ ] Single-tax rate matches group: G1 ≤332,80 / G2 ≤1 729,40 (fixed) / G3 5% or 3%+ПДВ (of income).
- [ ] Income-threshold checks use the 2026 ceilings (1.44M / 7.21M / 10.09M); over → 15%.
- [ ] ПДВ rate set correctly (20/14/7/0); registration logic uses the 1 000 000 грн / 12-month threshold.
- [ ] Військовий збір: 5% on salary; єдинники G1/2/4 = 864,70 грн/міс, G3 = 1% income (post-2025).
- [ ] ЄСВ: 22%, min 1 902,34 / max base 172 940; ФОП "за себе" mandatory in 2026.
- [ ] Payroll: ПДФО 18% + ВЗ 5% withheld; ЄСВ 22% employer on top. ПСП only below 4 660 грн.
- [ ] Money stored as integers (kopecks) — matches repo convention; rounding rules explicit.
- [ ] Every rate/threshold carries an effective date + "verify annually" note.

### D. Reporting & deadlines (`07-reporting-deadlines.md`)
- [ ] Deadlines use the right cadence: monthly +20 / quarterly +40 / annual +60; payment +10.
- [ ] Weekend/holiday shift to next working day implemented (ст. 49.20).
- [ ] ЄРПН windows: 1st–15th → 5th; 16th–end → 18th.
- [ ] Unified ПДФО/ВЗ/ЄСВ cadence keyed to entity type (ЮО monthly vs ФОП quarterly — ⚠ confirm 2026).
- [ ] ФОП загальна система (9 Feb) not conflated with ordinary individuals (1 May).

### E. Cross-cutting
- [ ] Martial-law overrides checked (підрозд. 10 розд. XX ПКУ) before applying a base rule.
- [ ] Volatile values isolated in config, not scattered — easy annual update.
- [ ] ⚠-flagged/unverified items in the KB are re-confirmed against the live act before production.

## Finding template

```
[❌ CONFLICT] apps/web/.../file.ts:42 — single-tax calc hard-codes 6%.
  Rule: Group 3 rate is 5% (non-VAT) or 3%+ПДВ — ПКУ ст. 293.3; see 02-simplified-single-tax.md.
  Fix: use 5%/3% by VAT status; move rate to config with effective date.
```
