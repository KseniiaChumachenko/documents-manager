# Initial Legal-Basis Review — Existing Plans, Schema & Reference Documents

*Date: 2026-06-25. Method: each feature in `.claude/plans/phase0–5`, `apps/web/database/schema.ts`, and the 3 reference `.xls` files cross-referenced against the `ukrainian-accounting` knowledge base (see `references/`). Buckets: ✅ sound · ⚠ gap/ambiguous · ❌ conflict (contradicts the law).*

> This is a development-validation review, not tax advice. Verify ❌/⚠ items against the live act before implementation. Most numeric values reset annually — see `references/08-volatile-values-2026.md`.

---

## Reference documents — what the `.xls` files actually contain

Extracted from `.claude/references/*.xls` (cp1251). All three are exports from **legacy accounting software** and use **pre-2015 conventions** — important context for the "exports must match the reference files" goal.

| Doc | Key observations |
|---|---|
| **Довіреність № 19** | Uses **"Типова форма N М-2"** — the M-2 form was legally **abolished 01.01.2015** (Наказ Мінфіну № 987), yet is still widely used in practice. Has: дата видачі, "дійсна до" (10-day term: issued 30.06, valid to 10.07), Видано (посада, прізвище), passport, "На отримання від" supplier, ТМЦ list (№, найменування, од. виміру, кількість прописом), Керівник / Головний бухгалтер / Місце печатки. |
| **РН-0000003** (видаткова накладна) | Постачальник ФОП, line table (№, Товар, Од., Кількість, Ціна без ПДВ, Сума без ПДВ), Разом без ПДВ / ПДВ (20%) / Всього з ПДВ, sum in words, **Відвантажив(ла) / Отримав(ла) за дов. №**. ПДВ 914.69 = 20% of 4573.44 ✓. |
| **СФ-0000305** (рахунок-фактура) | Same supplier block; line table; Знижка / Разом без ПДВ / ПДВ (20%) / Всього з ПДВ; sum in words; **Виписав(ла)** only (no receiver signature — consistent with рахунок being a payment request); "Рахунок дійсний до сплати до …". ПДВ 1170 = 20% ✓. |

**Two cross-cutting facts these documents establish:**

1. **The supplier ФОП's code is printed as "ЄДРПОУ 2559104287" and "ІПН 2559104287" — but that is a 10-digit РНОКПП, not an 8-digit ЄДРПОУ or a 12-digit VAT number.** This is the real-world conflation described in `references/01-entities-registries.md`. **Document templates must label a ФОП's 10-digit code as "ЄДРПОУ"/"ІПН"** to match these references, even though it is technically the РНОКПП. The schema stores this in `company.ik` (length 10) — the generator must map `ik` → the "ЄДРПОУ" label on ФОП documents.
2. The reference docs also carry a legacy **"номер свідоцтва ПДВ" (8-digit)** — the ПДВ certificate was abolished in 2014, replaced by the 12-digit ІПН ПДВ. If matching the references exactly is the goal, the template reproduces a deprecated field; flag this as a **product decision** (replicate legacy layout vs. modernize). See memory note "document-export-ground-truth".

---

## ❌ Conflicts (plan contradicts the law)

**C1 — Single-tax rate hardcoded at 3%; the default is 5%.**
`phase2_income_ledger.md:57,80` (`taxUnified … 3% єдиний податок`, `unified: income * 0.03`).
Group 3 єдиний податок is **5% of income (non-VAT payer)** or **3% + ПДВ (VAT payer)** — ПКУ ст. 293.3 (`references/02-simplified-single-tax.md`). 3% is correct **only** for a VAT-registered FOP (which the reference ФОП happens to be). For the common non-VAT єдинник the calculator would **understate tax by 40%**. Fix: rate must be a function of (group, VAT status), sourced from config, not a literal `0.03`.

**C2 — Weekend deadline shift goes the wrong direction.**
`phase4_deadline_notifications.md:74-75` ("Sat → Fri, Sun → Mon").
ПКУ ст. 49.20 / 57.1: a deadline on a weekend/holiday moves to the **next working day** — i.e. **Saturday → Monday**, never back to Friday (`references/07-reporting-deadlines.md`). Shifting a filing/payment deadline earlier is legally wrong and, for payment, actively harmful. Fix: always shift forward to the next banking day.

**C3 — Quarterly deadlines off by one day for Q2–Q4.**
`phase4_deadline_notifications.md:59` ("Q2 → Aug 10 | Q3 → Nov 10 | Q4 → Feb 10").
Filing is **40 calendar days** after quarter-end (ПКУ ст. 49.18.2). Counting: Q1→**May 10** ✓; Q2 (Jun 30 +40)→**Aug 9**; Q3 (Sep 30 +40)→**Nov 9**; Q4 (Dec 31 +40)→**Feb 9**. The plan's Aug/Nov/Feb **10** are each a day late. A deadline engine that is a day late causes penalties. Fix: compute `quarterEnd + 40 days` (then weekend-shift), don't hardcode.

**C4 — ЄСВ payment modelled as quarterly.**
`phase4_deadline_notifications.md:62-63` ("ESV payment for self: same as quarterly tax declaration deadline").
Employer **ЄСВ is paid MONTHLY, by the 20th** of the following month (Закон 2464 ст. 9; `references/07`). Only ФОП "за себе" may pay quarterly. Conflating the two will miss 2 of every 3 monthly ЄСВ deadlines for an employer. Fix: separate monthly employer-ЄСВ from quarterly ФОП-self-ЄСВ.

**C5 — Document-type enum omits довіреність.**
`phase1_document_generation.md:30,75` (`type: 'act' | 'invoice' | 'delivery_note'`).
The app has a `/documents/poas` route ("Довіренності"), a `*-poa` R2 bucket, and a reference Довіреність `.xls` — but the template type enum has no power-of-attorney type. Either the довіреність is unsupported (contradicts the product) or it is being forced into the wrong type. Fix: add a 4th type (`power_of_attorney`) whose schema differs from invoices (term/"дійсна до", authorized person + passport/РНОКПП, ТМЦ list, "за рахунком") — `references/06-primary-documents.md`.

**C6 — Payroll ignores the ЄСВ minimum-base rule.**
`phase3_employee_management.md:88,94-96` (`esvEmployer = taxable * 0.22`; `proratedGross` reduces gross below the minimum).
For a full-time employee ЄСВ must be charged on **at least the minimum wage** (8 647 грн → min ЄСВ **1 902,34 грн**), even when actual/prorated pay is lower (Закон 2464; `references/04`, `05`). `0.22 × proratedGross` underpays ЄСВ for partial months/low pay. Fix: `esv = max(0.22 × base, 0.22 × minWage)` for full-timers (with the documented exceptions), and **cap** the base at 20× min wage (172 940 грн).

---

## ⚠ Gaps / ambiguities (plan silent, or law unsettled)

**G1 — VAT hardcoded at 20%.** `phase1:86-87` (`* 0.2`, `* 1.2`). Rates are 20/14/7/0 and a non-VAT єдинник issues documents with **no ПДВ at all** (ст. 193; `references/03`). The template must support a VAT-rate parameter incl. a zero/none case. (The reference docs all happen to be 20%.)

**G2 — Templates lack ст. 9 signatory requisites.** `phase1:73-91` JSON example has fields/line-items/totals but no responsible-person fields. Закон 996 ст. 9 ч. 2 requires **position + (per Наказ 88) surname + signature** of responsible persons. The reference docs have them (Відвантажив/Отримав, Керівник, Виписав). A primary document missing these is legally deficient. Add signatory blocks to the template model (`references/06`).

**G3 — Internal contradiction on where VAT math lives.** `phase1:84-90` puts totals/VAT **formulas in the template JSON**, but `phase1:141` says "all math … must happen server-side, not in the template JSON." Pick one — recommend server-side computation keyed by a template rate field; keep JSON declarative.

**G4 — Counteragent auto-match only on ЄДРПОУ.** `phase2:98` (`counterEdrpou → company.egrpou`). ФОП counteragents have no ЄДРПОУ — they are keyed by 10-digit РНОКПП in `company.ik`. Matching only `egrpou` silently drops every ФОП counterparty. Fix: match incoming code against **both** `egrpou` and `ik` (`references/01`).

**G5 — Military-levy model fits only Group 3.** `phase2:58,82` (`military: income * 0.01`). 1% of income is right for **group 3 only**; groups 1/2/4 pay a **fixed 864,70 грн/month** (10% of min wage), and salaried ВЗ is 5% (`references/04`). Generalize by payer type.

**G6 — Hiring notification not modelled.** `phase3` creates employees but omits the **Повідомлення про прийняття** that must reach ДПС **before** the employee starts work (КЗпП ст. 24; Постанова КМУ № 413; `references/05`). Add it to the employee lifecycle — it's a hard legal precondition to lawful employment.

**G7 — Unified report cadence assumed quarterly.** `phase3:117`, `phase4:65`. Per the 2026 reform, **legal-entity employers file the ПДФО/ВЗ/ЄСВ розрахунок MONTHLY**, ФОП/self-employed quarterly (`references/05`, `07`). Cadence must key off entity type. ⚠ Confirm against the current ДПС form order — this reform was still settling in 2026.

**G8 — ЄРПН + VAT payment deadlines absent from the engine.** `phase4` computes VAT filing (20th) but not the **payment** (+10 days, ~30th) nor **ЄРПН registration** (1st–15th→5th, 16th–end→18th) — relevant whenever the user is a VAT payer (`references/03`, `07`).

**G9 — ПСП not applied in payroll.** `phase3` payroll has no податкова соціальна пільга. At the 2026 min wage (8 647 > 4 660 limit) it rarely applies, so low risk — but document the omission and handle part-time/low-norm cases (`references/05`).

**G10 — Auto-number prefix mismatch.** `phase5:22` uses "РФ-0042". The reference рахунок-фактура prefix is **"СФ"** (and "РН" for видаткова). Align auto-numbering prefixes with the reference documents.

**G11 — `inn` field is ambiguous and unconstrained.** `schema.ts:51` `inn: text()` (the VAT number) has no length check; ІПН ПДВ is **12 digits** (`references/01`). The name `inn` collides with the legacy meaning of ІПН (=РНОКПП). Consider renaming/commenting and adding a length/format check.

**G12 — egrpou/ik mutual exclusivity not enforced.** `schema.ts:37-39`: both nullable-unique; nothing prevents a row having both (or neither) set inconsistently with `entity_type`. Add an app-level (or CHECK) invariant: `entity_type='legal' ⇒ egrpou set, ik null`; `='fop' ⇒ ik set, egrpou null`.

---

## ✅ Legally sound (verified against the KB)

- **Payroll rates** `phase3:80-82`: ПДФО 18% (ст. 167.1), ВЗ 5% (eff. 01.12.2024), ЄСВ 22% (Закон 2464) — all correct (`references/04`, `05`).
- **ЄСВ derived from min wage, not hardcoded** `phase2:73,85` — exactly the right pattern (`references/08`); extend the same discipline to the єдиний-податок/ВЗ rates (see C1, G5).
- **Phase 0 skips ФОП** for the gov refresh `phase0:81` — correct, adm.tools serves ЄДРПОУ only (`references/01`).
- **Identifier lengths** `schema.ts:37-38`: egrpou 8, ik 10 — correct.
- **VAT record direction** `phase2:48` `input | output` — matches ст. 198/187 (`references/03`).
- **Line items carry `unit`** `phase1:81` — satisfies the ст. 9 "одиниця виміру" requisite.
- **КЕП expiry reminders** `phase4:161-165` — КЕП is real and time-limited; tracking it is appropriate (`references/06`).
- **Money as integer kopecks** throughout — avoids float drift; sound.

---

## Volatility flags (values that must not be hardcoded)

- `phase3:80-82` hardcodes 0.18 / 0.05 / 0.22 in code with "update … when law changes" but **no effective date**. Move to dated config (like the min-wage KV in `phase2:85`). ВЗ was 1.5%→5% on 01.12.2024 — exactly the kind of change that breaks a hardcoded literal.
- `phase2:57,80` 3%/1% literals — see C1/G5; make them config with effective dates.
- All single-tax thresholds, ЄСВ min/max, ПСП, min wage — pull from one dated table mirroring `references/08-volatile-values-2026.md`; review every January.

---

## Suggested priority order

1. **C2, C3, C4** (deadline engine) — wrong deadlines cause real penalties; cheap to fix.
2. **C1, G5** (єдиний податок 3% vs 5%) — wrong tax math; central to Phase 2.
3. **C6, G6** (ЄСВ min base; hiring notification) — Phase 3 legal correctness.
4. **C5, G1, G2, G3** (document type coverage + ст. 9 requisites + VAT flexibility) — Phase 1 legal validity.
5. **G4, G11, G12** (identifier handling for ФОП) — data-integrity, affects matching and documents.
