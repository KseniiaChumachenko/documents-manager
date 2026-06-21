# Document Layout Schema & Generic Renderer — Design

**Date:** 2026-06-21
**Status:** Approved (design); ready for implementation planning
**Origin:** PR #9 review comment on `generate-document.ts` — "the documents skeleton had to live in templates" (move the hardcoded document layout out of engine code and make it data-driven).

## Background

Generated documents (Рахунок-фактура / Видаткова накладна / Довіреність M-2) currently have their **layout hardcoded** in `app/lib/generate-document.ts` (`buildInvoiceLikeSheet`, `buildPoaSheet`). The static labels (`Постачальник`, `Одержувач`, the M-2 grid, signatures) live in TypeScript, so a layout change means a code change.

The reference documents (`apps/web/.claude/references/*.xls`) are the fidelity target and the regression oracle. Two shapes exist:
- **invoice / bill** — linear stacked sections.
- **M-2 довіреність** — a positional grid form (labels and values at specific cells/columns).

## Goal & Scope

The larger goal (chosen in design) is **user-authored document layouts**. That is too large for one spec, so it decomposes into three sub-projects, each with its own spec → plan → build cycle:

1. **Layout schema + generic renderer (THIS SPEC — the foundation).** Define the layout schema and data-binding model; build a renderer that turns `(layout + data context) → SheetModel → XLSX/PDF`; re-express the three reference documents as data and prove output parity.
2. **Authoring experience** (follow-on) — UI to create/edit layouts beyond raw JSON: block palette, add/remove/reorder, bind data, live preview.
3. **Validation & guardrails** (follow-on) — schema validation, safe rendering of incomplete/invalid layouts, and **layout versioning** so already-generated documents keep rendering when a template changes.

This spec covers **#1 only**, but the schema is designed to be general enough for user authoring later.

## Design Decisions (resolved during brainstorming)

- **Expressiveness:** hybrid — a small block model where one block type carries positioned cells, so the M-2 grid is faithful without a free-form pixel grid.
- **Data binding:** placeholder strings + transforms (`{{ path | transform }}`), not fully structured binding objects.
- **Authoring (this phase):** raw JSON in the existing template editor (a visual builder is sub-project #2).

## 1. Template shape & data context

The template stays one self-contained JSON blob in `document_template.schemaJson` — **no new column**. A sibling `layout` key is added next to the existing `fields` / `line_items` / `vat_rate`:

```jsonc
{
  "fields":     [ /* existing: what the compose form collects */ ],
  "line_items": { /* existing: form line columns */ },
  "vat_rate":   0.2,                              // 0 for довіреність
  "layout": {                                     // NEW: how the document renders
    "cols":   [5, 38, 16, 10, 8, 12, 14, 14],     // column widths (XLSX) / weights (PDF)
    "blocks": [ /* ordered blocks — Section 2 */ ]
  }
}
```

Responsibilities stay separated: **`fields`** = data *capture* (drives the compose form); **`layout`** = data *rendering* (drives the document).

At generation time the renderer builds a **data context** that bindings resolve against:

| Context key | Source |
|---|---|
| `supplier.*` | `my_company` record |
| `counterparty.*` | selected `company` |
| `field.<key>` | `dataJson.fields` (captured form values) |
| `lines` | resolved line items (`name, unit, quantity, price, total`) |
| `totals` | `{ subtotal, vat, total, vatRate, discount }` (computed in code) |

Templates are **per document type**, so layouts are naturally separate → the renderer needs **no doc-type conditionals** (e.g. the `Знижка` row simply lives in the invoice template's layout, not the bill's). The only conditional logic is `omitIfEmpty` for optional data.

## 2. Block catalogue & cell model

Two block types only — keeping the renderer a small interpreter.

### `row`
An ordered list of positioned cells. Covers titles, supplier/recipient blocks, totals lines, amount-in-words, signatures, blank spacers, and M-2 grid rows.

```jsonc
{ "type": "row", "cells": [
  { "col": 1, "text": "Постачальник" },
  { "col": 2, "text": "{{supplier.name}}" }
]}

// M-2 positioned row — multiple label/value pairs across columns:
{ "type": "row", "cells": [
  { "col": 1, "text": "рахунок" },
  { "col": 2, "text": "{{supplier.iban}}" },
  { "col": 6, "text": "МФО" },
  { "col": 7, "text": "{{supplier.mfo}}" },
  { "col": 9, "text": "Довіреність дійсна до" }
]}
```

**Cell fields:** `col` (0-based start column), `text` (with `{{bindings}}`), optional `span` (→ XLSX merge / PDF width), `align`, `bold`, `omitIfEmpty` (drop the cell when all its bindings resolve empty — e.g. a `тел. {{counterparty.phone}}` line). A `row` with no cells is a blank spacer.

### `lineItems`
A `header` row plus a `row` template applied per line item. Inside the row template, bindings resolve against each `line` plus `index` (1-based):

```jsonc
{ "type": "lineItems",
  "header": [ {"col":0,"text":"№"}, {"col":1,"text":"Назва"}, {"col":4,"text":"Од."},
              {"col":5,"text":"Кількість"}, {"col":6,"text":"Ціна без ПДВ"}, {"col":7,"text":"Сума без ПДВ"} ],
  "row":    [ {"col":0,"text":"{{index}}"}, {"col":1,"text":"{{line.name}}"}, {"col":4,"text":"{{line.unit}}"},
              {"col":5,"text":"{{line.quantity}}"}, {"col":6,"text":"{{line.price | money}}"}, {"col":7,"text":"{{line.total | money}}"} ]
}
```

For M-2, the quantity column is `{{line.quantity | intWords}}` ("Один"). Totals rows are ordinary `row` blocks binding `{{totals.subtotal | money}}` etc. — no special totals block.

## 3. Bindings, numeric cells & transforms

**Resolution.** Each cell's `text` is scanned for `{{ path | transform }}` tokens. `path` is a dotted lookup into the context (`supplier.iban`, `field.number`, `line.name`, `totals.total`, `index`). Missing/null path → empty string. `omitIfEmpty` drops the cell when all its bindings are empty.

**Numeric cells (XLSX fidelity).** The reference spreadsheets hold prices/quantities/totals as real numbers (right-aligned, summable). Rule:

> A cell whose `text` is **exactly one binding** (no surrounding literals) emits the **raw value** — a number stays a number (the transform supplies a display number-format), a string stays a string. A cell with literal text around bindings emits a string.

So `{{line.total | money}}` → numeric cell formatted `0.00`; but `ПДВ: {{totals.vat | money}} грн.` → a plain string line.

**Transform registry (closed set — exactly what the three documents need):**

| Transform | Input → output | Notes |
|---|---|---|
| `money` | number → 2-decimal | numeric cell w/ `0.00`, or `"3250.02"` in mixed text |
| `longDate` | `2024-12-26` → `26 грудня 2024 р.` | reuses `format-ua` (Intl, lowercase months) |
| `hryvniaWords` | `7020.02` → `Сім тисяч двадцять гривень 02 копійки` | reuses `amount-in-words`. **UAH-specific / unlocalised — see Known Limitations.** |
| `intWords` | `1` → `Один` | M-2 quantity, reuses `amount-in-words` |

No expression language and no arithmetic in templates — totals are computed in code and exposed via `totals.*`.

## 4. Renderer, integration, migration & tests

### Modules (small, well-bounded)
- **`app/lib/document-layout.ts`** — schema types (`Layout` / `Block` / `Cell`), the `{{path|transform}}` resolver (single-binding numeric rule + `omitIfEmpty`), and the transform registry. `hryvniaWords` carries the UAH-specific code comment.
- **`app/lib/document-renderer.ts`** — `renderLayout(layout, context) → SheetModel`: walks `blocks`, places `row` cells at their columns (span → merge), expands `lineItems` (header + one row per `line`). Returns the **same `SheetModel`** that `sheetModelToWorkbook` (XLSX) and `generatePdf` already consume — the output path is untouched.

### Integration
- Delete `buildInvoiceLikeSheet` / `buildPoaSheet`; `buildDocumentSheet` becomes `renderLayout(template.layout, context)`.
- The `generate-document` route builds the context (supplier, counterparty, captured fields, resolved lines, computed totals) and calls the renderer.
- `computeTotals` / `resolveLineItems` / `generateXlsx` / `generatePdf` are unchanged.
- A template missing `layout` → a clear generation error (deeper validation is sub-project #3).

### Migration
- Add `layout` to the three seed templates (`seed-templates.sql`) expressing invoice / bill / M-2 **exactly as the current builders do**. Proof of correctness: generated output stays identical.
- Already-generated `document` records keep their stored R2 file (unaffected). Re-generation uses the template's current layout; versioning is sub-project #3.

### Testing (the safety net)
- **Re-point the existing reference-alignment suite** (`generate-document.test.ts`) to the data-driven path: seed layout + reference context → `renderLayout` → the *same* assertions (supplier block, totals, сума прописом, M-2 passport, every line item). Green = the data-driven renderer provably reproduces the references.
- New unit tests for the resolver: dotted-path lookup, each transform, the single-binding numeric rule, `omitIfEmpty`, and per-block rendering (`row` positioning + merges, `lineItems` expansion).
- The E2E generation happy-path is unchanged.

## Known Limitations

- **`hryvniaWords` / `amount-in-words` is UAH + uk specific** — hardcoded to hryvnia + kopeck noun forms and Ukrainian word spelling. Acceptable for the current single-locale / single-currency app; if a second currency or locale is added it must be generalised (currency-aware noun forms + spelling). Flagged in code comment and the i18n-patterns memory note.
- Raw-JSON authoring only in this phase; malformed layouts are caught at generation time, not at edit time (robust validation is sub-project #3).

## Out of Scope (follow-on sub-projects)

- **#2 Authoring experience** — visual layout builder.
- **#3 Validation & guardrails** — JSON-schema validation of layouts, edit-time errors, layout versioning so historical documents render consistently.

## Open Questions / Risks

- **PDF column fidelity.** The `SheetModel` cell-column model already drives the simple PDF renderer; positioned M-2 cells map to PDF x-offsets approximately. XLSX is the faithful format (per earlier decision); PDF stays best-effort. No change to that stance here.
- **Authoring ergonomics.** Hand-writing positioned-cell JSON for M-2 is tedious; acceptable for the three built-in seeds, and the reason sub-project #2 exists.
