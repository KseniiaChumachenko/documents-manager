# Document Layout Schema & Generic Renderer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the hardcoded per-type document layout out of `generate-document.ts` into a data-driven `layout` schema on each template, rendered by a generic renderer that produces the existing `SheetModel` → XLSX/PDF.

**Architecture:** A template's `schemaJson` gains a `layout` (`{ cols, blocks }`). Two block types — `row` (positioned cells) and `lineItems` — with `{{path | transform}}` bindings. A pure renderer `renderLayout(layout, context) → SheetModel` replaces `buildInvoiceLikeSheet`/`buildPoaSheet`. The same renderer drives an HTML editor preview. R2 storage is consolidated to one bucket.

**Tech Stack:** TypeScript, React Router 7 (Cloudflare Workers/D1/R2), Drizzle, SheetJS (xlsx), jsPDF, Vitest, Playwright, i18next.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-06-21-document-layout-schema-design.md` (read it first).
- **Reference oracle:** generated content must still match `apps/web/.claude/references/*.xls`; the alignment suite (`apps/web/app/lib/__tests__/generate-document.test.ts` + `reference-fixtures.ts`) is the regression gate.
- **Dates lowercase** (Intl `uk-UA`); **currency plurals via i18next**; integer-to-words stays custom (UAH-specific — keep the code comment).
- **All work in `apps/web`.** Run unit tests with `npx vitest run` (from `apps/web`); typecheck with `npx tsc -b`; E2E with `npm run test:e2e` (applies D1 migrations + Playwright).
- **Pre-commit hook** runs lint-staged + typecheck; **pre-push** runs the full E2E. Never use `--no-verify`.
- **Branch:** `feat/document-layout-schema` (already created). Ask before pushing.
- Closed transform set only: `money`, `longDate`, `hryvniaWords`, `intWords`. No expression language, no arithmetic in templates.

---

## File Structure

- **Create** `apps/web/app/lib/document-layout.ts` — schema types (`Cell`, `RowBlock`, `LineItemsBlock`, `Block`, `Layout`, `RenderContext`, `Scope`), the `{{path|transform}}` resolver, and the transform registry. One responsibility: turn a cell + data scope into a placed value.
- **Create** `apps/web/app/lib/document-renderer.ts` — `renderLayout(layout, context) → SheetModel`. One responsibility: walk blocks → rows/cells/merges.
- **Create** `apps/web/app/lib/sheet-model-to-html.ts` — `sheetModelToHtml(model) → string`. One responsibility: render a `SheetModel` as an escaped HTML `<table>` for preview.
- **Create** `apps/web/app/lib/default-document-layouts.ts` — the canonical `invoice` / `bill` / `poa` `Layout` constants (single source of truth for seeds, editor defaults, and alignment tests).
- **Modify** `apps/web/app/lib/generate-document.ts` — remove `buildInvoiceLikeSheet`/`buildPoaSheet`/`buildDocumentSheet`; replace `generateXlsx(input)`/`generatePdf(input)` with `sheetModelToXlsx(model)`/`sheetModelToPdf(model, stamp?)`. Keep `computeTotals`, `resolveLineItems`, `sheetModelToWorkbook`, and the shared types.
- **Modify** `apps/web/app/routes/documents/_api/generate-document.ts` — build `RenderContext`, call `renderLayout`, then write; single R2 bucket.
- **Modify** `apps/web/app/routes/documents/_api/export-document.ts` — single R2 bucket.
- **Modify** `apps/web/database/seed-templates.sql` + `apps/web/app/routes/documents/type/settings/edit/index.tsx` (`DEFAULT_SCHEMAS`) — add `layout` from the canonical constants.
- **Modify** `apps/web/wrangler.jsonc` + `packages/infra/src/*` — one `DOCUMENTS` bucket.
- **Modify** `apps/web/app/routes/documents/type/settings/edit/index.tsx` (`TemplatePreview`) — render via `sheetModelToHtml`.
- **Modify tests** `apps/web/app/lib/__tests__/generate-document.test.ts` (re-point to renderer) + new test files per task.

---

### Task 1: Binding resolver + transforms

**Files:**
- Create: `apps/web/app/lib/document-layout.ts`
- Test: `apps/web/app/lib/__tests__/document-layout.test.ts`

**Interfaces:**
- Consumes: `SupplierIdentity`, `Counterparty`, `ResolvedLineItem`, `Totals` (types, from `./generate-document`).
- Produces:
  - `interface Cell { col: number; text: string; span?: number; align?: 'left'|'right'|'center'; bold?: boolean; omitIfEmpty?: boolean }`
  - `interface RowBlock { type: 'row'; cells: Cell[] }`
  - `interface LineItemsBlock { type: 'lineItems'; header: Cell[]; row: Cell[] }`
  - `type Block = RowBlock | LineItemsBlock`
  - `interface Layout { cols: number[]; blocks: Block[] }`
  - `interface RenderContext { supplier: SupplierIdentity; counterparty: Counterparty; field: Record<string,string>; lines: ResolvedLineItem[]; totals: Totals & { vatRate: number; discount?: number } }`
  - `type Scope = RenderContext & { line?: ResolvedLineItem; index?: number }`
  - `type PlacedValue = { value: string | number; numFmt?: string }`
  - `function resolveCell(cell: Cell, scope: Scope): PlacedValue | null` (null = omitted)

- [ ] **Step 1: Write the failing tests**

```ts
// apps/web/app/lib/__tests__/document-layout.test.ts
import { describe, expect, it } from 'vitest';
import { resolveCell, type Scope } from '../document-layout';

const scope = {
  supplier: { name: 'ФОП Тест', iban: 'UA123', bankName: 'БАНК', mfo: '380', phone: null,
    egrpou: '111', inn: '111', vatCertificate: null, address: null, taxNote: null, signatoryName: null },
  counterparty: { name: 'ТОВ Контрагент', phone: null },
  field: { number: 'СФ-1', date: '2024-12-26' },
  lines: [],
  totals: { subtotal: 5850.02, vat: 1170, total: 7020.02, vatRate: 0.2 },
  line: { name: 'Послуга', unit: 'шт.', quantity: 6, price: 541.67, total: 3250.02 },
  index: 1,
} as unknown as Scope;

describe('resolveCell', () => {
  it('interpolates multiple bindings into a string', () => {
    expect(resolveCell({ col: 2, text: 'Р/р {{supplier.iban}} в {{supplier.bankName}} МФО {{supplier.mfo}}' }, scope))
      .toEqual({ value: 'Р/р UA123 в БАНК МФО 380' });
  });

  it('keeps a pure numeric binding as a number with the money format', () => {
    expect(resolveCell({ col: 7, text: '{{line.total | money}}' }, scope))
      .toEqual({ value: 3250.02, numFmt: '0.00' });
  });

  it('returns a plain string for money in mixed text', () => {
    expect(resolveCell({ col: 0, text: 'ПДВ: {{totals.vat | money}} грн.' }, scope))
      .toEqual({ value: 'ПДВ: 1170.00 грн.' });
  });

  it('formats long dates lowercase via Intl', () => {
    expect(resolveCell({ col: 0, text: 'від {{field.date | longDate}}' }, scope))
      .toEqual({ value: 'від 26 грудня 2024 р.' });
  });

  it('spells the total in words', () => {
    expect(resolveCell({ col: 0, text: '{{totals.total | hryvniaWords}}' }, scope))
      .toEqual({ value: 'Сім тисяч двадцять гривень 02 копійки' });
  });

  it('spells an integer quantity in words', () => {
    expect(resolveCell({ col: 8, text: '{{line.quantity | intWords}}' }, { ...scope, line: { ...scope.line!, quantity: 1 } }))
      .toEqual({ value: 'Один' });
  });

  it('resolves a missing path to empty string', () => {
    expect(resolveCell({ col: 2, text: 'тел. {{counterparty.phone}}' }, scope)).toEqual({ value: 'тел. ' });
  });

  it('omits the cell when omitIfEmpty and all bindings are empty', () => {
    expect(resolveCell({ col: 2, text: 'тел. {{counterparty.phone}}', omitIfEmpty: true }, scope)).toBeNull();
  });

  it('keeps a literal-only cell', () => {
    expect(resolveCell({ col: 1, text: 'Постачальник' }, scope)).toEqual({ value: 'Постачальник' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run app/lib/__tests__/document-layout.test.ts`
Expected: FAIL — `Failed to load url ../document-layout`.

- [ ] **Step 3: Implement `document-layout.ts`**

```ts
// apps/web/app/lib/document-layout.ts
import type { Counterparty, ResolvedLineItem, SupplierIdentity, Totals } from './generate-document';
import { formatUaDateLong } from './format-ua';
import { hryvniaInWords, integerInWords } from './amount-in-words';

export interface Cell {
  col: number;
  text: string;
  span?: number;
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
  omitIfEmpty?: boolean;
}
export interface RowBlock { type: 'row'; cells: Cell[] }
export interface LineItemsBlock { type: 'lineItems'; header: Cell[]; row: Cell[] }
export type Block = RowBlock | LineItemsBlock;
export interface Layout { cols: number[]; blocks: Block[] }

export interface RenderContext {
  supplier: SupplierIdentity;
  counterparty: Counterparty;
  field: Record<string, string>;
  lines: ResolvedLineItem[];
  totals: Totals & { vatRate: number; discount?: number };
}
export type Scope = RenderContext & { line?: ResolvedLineItem; index?: number };

export type PlacedValue = { value: string | number; numFmt?: string };

const TOKEN = /\{\{\s*([\w.]+)\s*(?:\|\s*(\w+)\s*)?\}\}/g;
const SINGLE = /^\{\{\s*([\w.]+)\s*(?:\|\s*(\w+)\s*)?\}\}$/;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, scope);
}

type Transform = (raw: unknown) => PlacedValue;
const TRANSFORMS: Record<string, Transform> = {
  money: (raw) => ({ value: Number(raw), numFmt: '0.00' }),
  longDate: (raw) => ({ value: formatUaDateLong(String(raw ?? '')) }),
  hryvniaWords: (raw) => ({ value: hryvniaInWords(Number(raw)) }),
  intWords: (raw) => ({ value: integerInWords(Number(raw)) }),
};

/** Format a resolved value as a string (used in mixed-text interpolation). */
function asString(raw: unknown, transform?: string): string {
  if (raw == null) return '';
  if (transform === 'money') return Number(raw).toFixed(2);
  if (transform === 'longDate') return formatUaDateLong(String(raw));
  if (transform === 'hryvniaWords') return hryvniaInWords(Number(raw));
  if (transform === 'intWords') return integerInWords(Number(raw));
  return String(raw);
}

export function resolveCell(cell: Cell, scope: Scope): PlacedValue | null {
  const single = cell.text.match(SINGLE);
  if (single) {
    const [, path, transform] = single;
    const raw = lookup(scope, path);
    if (transform && TRANSFORMS[transform]) return TRANSFORMS[transform](raw);
    if (typeof raw === 'number') return { value: raw };
    return { value: raw == null ? '' : String(raw) };
  }

  let anyNonEmpty = false;
  const text = cell.text.replace(TOKEN, (_m, path: string, transform?: string) => {
    const s = asString(lookup(scope, path), transform);
    if (s !== '') anyNonEmpty = true;
    return s;
  });

  if (cell.omitIfEmpty && !anyNonEmpty) return null;
  return { value: text };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run app/lib/__tests__/document-layout.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/lib/document-layout.ts apps/web/app/lib/__tests__/document-layout.test.ts
git commit -m "feat(documents): layout schema types + binding resolver"
```

---

### Task 2: `renderLayout` renderer

**Files:**
- Create: `apps/web/app/lib/document-renderer.ts`
- Test: `apps/web/app/lib/__tests__/document-renderer.test.ts`

**Interfaces:**
- Consumes: `Layout`, `RenderContext`, `resolveCell` (Task 1); `SheetModel` (type, from `./generate-document`).
- Produces: `function renderLayout(layout: Layout, context: RenderContext): SheetModel`

**SheetModel shape** (existing, in `generate-document.ts`): `{ rows: (string|number|null)[][]; merges?: { s:{r,c}, e:{r,c} }[]; cols?: { wch:number }[] }`.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/web/app/lib/__tests__/document-renderer.test.ts
import { describe, expect, it } from 'vitest';
import { renderLayout } from '../document-renderer';
import type { Layout, RenderContext } from '../document-layout';

const ctx = {
  supplier: { name: 'ФОП Тест', iban: 'UA1', bankName: 'Б', mfo: '380', phone: null, egrpou: '1', inn: '1', vatCertificate: null, address: null, taxNote: null, signatoryName: null },
  counterparty: { name: 'ТОВ К', phone: null },
  field: { number: 'СФ-1' },
  lines: [
    { name: 'A', unit: 'шт.', quantity: 2, price: 10, total: 20 },
    { name: 'B', unit: 'шт.', quantity: 1, price: 5, total: 5 },
  ],
  totals: { subtotal: 25, vat: 5, total: 30, vatRate: 0.2 },
} as RenderContext;

describe('renderLayout', () => {
  it('places row cells at their columns and skips omitted cells', () => {
    const layout: Layout = { cols: [10, 20, 20], blocks: [
      { type: 'row', cells: [{ col: 0, text: 'Постачальник' }, { col: 2, text: '{{supplier.name}}' }] },
      { type: 'row', cells: [{ col: 2, text: 'тел. {{counterparty.phone}}', omitIfEmpty: true }] },
    ]};
    const m = renderLayout(layout, ctx);
    expect(m.rows[0]).toEqual(['Постачальник', null, 'ФОП Тест']);
    expect(m.rows[1]).toEqual([null, null, null]); // omitted cell → empty row
    expect(m.cols).toEqual([{ wch: 10 }, { wch: 20 }, { wch: 20 }]);
  });

  it('expands a lineItems block into a header row + one row per line', () => {
    const layout: Layout = { cols: [5, 30, 10, 10], blocks: [
      { type: 'lineItems',
        header: [{ col: 0, text: '№' }, { col: 1, text: 'Назва' }, { col: 3, text: 'Сума' }],
        row: [{ col: 0, text: '{{index}}' }, { col: 1, text: '{{line.name}}' }, { col: 3, text: '{{line.total | money}}' }] },
    ]};
    const m = renderLayout(layout, ctx);
    expect(m.rows[0]).toEqual(['№', 'Назва', null, 'Сума']);
    expect(m.rows[1]).toEqual([1, 'A', null, 20]); // index numeric, total numeric
    expect(m.rows[2]).toEqual([2, 'B', null, 5]);
  });

  it('emits merges from cell span', () => {
    const layout: Layout = { cols: [10, 10, 10], blocks: [
      { type: 'row', cells: [{ col: 0, text: 'Заголовок', span: 3 }] },
    ]};
    const m = renderLayout(layout, ctx);
    expect(m.merges).toEqual([{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run app/lib/__tests__/document-renderer.test.ts`
Expected: FAIL — `Failed to load url ../document-renderer`.

- [ ] **Step 3: Implement `document-renderer.ts`**

```ts
// apps/web/app/lib/document-renderer.ts
import { resolveCell, type Layout, type RenderContext, type Cell, type Scope } from './document-layout';
import type { SheetModel } from './generate-document';

type CellOut = string | number | null;

function placeRow(cells: Cell[], width: number, scope: Scope, rowIndex: number, merges: SheetModel['merges']): CellOut[] {
  const out: CellOut[] = new Array(width).fill(null);
  for (const cell of cells) {
    const placed = resolveCell(cell, scope);
    if (placed == null) continue;
    out[cell.col] = placed.value;
    if (cell.span && cell.span > 1) {
      merges!.push({ s: { r: rowIndex, c: cell.col }, e: { r: rowIndex, c: cell.col + cell.span - 1 } });
    }
  }
  return out;
}

export function renderLayout(layout: Layout, context: RenderContext): SheetModel {
  const width = layout.cols.length;
  const rows: CellOut[][] = [];
  const merges: NonNullable<SheetModel['merges']> = [];

  for (const block of layout.blocks) {
    if (block.type === 'row') {
      rows.push(placeRow(block.cells, width, context, rows.length, merges));
    } else {
      rows.push(placeRow(block.header, width, context, rows.length, merges));
      context.lines.forEach((line, i) => {
        rows.push(placeRow(block.row, width, { ...context, line, index: i + 1 }, rows.length, merges));
      });
    }
  }

  return { rows, merges, cols: layout.cols.map((wch) => ({ wch })) };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run app/lib/__tests__/document-renderer.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/lib/document-renderer.ts apps/web/app/lib/__tests__/document-renderer.test.ts
git commit -m "feat(documents): generic layout renderer to SheetModel"
```

---

> **Atomicity note (pre-flight fix):** Tasks 3 and 4 must be implemented and committed **together as one change**. Task 3 deletes `buildDocumentSheet`/`generateXlsx`/`generatePdf`, which the alignment describes in `generate-document.test.ts` reference until Task 4 re-points them — so an isolated Task 3 commit would fail `tsc -b`. Treat Tasks 3+4 as a single deliverable: split writers, author layouts, re-point the whole test file, delete the builders, then one green commit (`npx vitest run` + `npx tsc -b` both pass).

### Task 3: Split output writers (SheetModel → XLSX/PDF)

**Files:**
- Modify: `apps/web/app/lib/generate-document.ts`
- Modify: `apps/web/app/lib/__tests__/generate-document.test.ts`

**Interfaces:**
- Produces: `function sheetModelToXlsx(model: SheetModel): ArrayBuffer`, `function sheetModelToPdf(model: SheetModel, stampDataUrl?: string | null): ArrayBuffer`.
- Removes: `buildInvoiceLikeSheet`, `buildPoaSheet`, `buildDocumentSheet`, `generateXlsx(input)`, `generatePdf(input)`, `DocumentBuildInput`, `DocumentType`, `TITLE_NOUN`, `WIDE_COLS`, the supplier-line helper functions.
- Keeps: `SupplierIdentity`, `Counterparty`, `LineItem`, `ResolvedLineItem`, `Totals`, `SheetModel`, `resolveLineItems`, `computeTotals`, `sheetModelToWorkbook`.

- [ ] **Step 1: Update the round-trip + PDF tests to use a SheetModel**

In `generate-document.test.ts`, the `generateXlsx round-trip` and `generatePdf` describes currently call `generateXlsx({...buildInput})` / `generatePdf({...buildInput})`. Replace them to build a `SheetModel` via `renderLayout` and call the writers. (The per-type alignment describes are re-pointed in Task 4 — leave them failing-to-compile until then; run only the two writer tests here with a path filter.)

```ts
// add imports
import { renderLayout } from '../document-renderer';
import { INVOICE_LAYOUT } from '../default-document-layouts'; // created in Task 4 — for now inline a tiny layout
import { sheetModelToXlsx, sheetModelToPdf } from '../generate-document';

// minimal inline layout for the writer tests (self-contained, no Task 4 dependency):
const TITLE_LAYOUT = { cols: [40], blocks: [
  { type: 'row' as const, cells: [{ col: 0, text: 'Рахунок-фактура № {{field.number}}' }] },
  { type: 'lineItems' as const, header: [{ col: 0, text: 'Сума' }], row: [{ col: 0, text: '{{line.total | money}}' }] },
]};

describe('sheetModelToXlsx round-trip', () => {
  it('produces a workbook whose cells include the title', () => {
    const model = renderLayout(TITLE_LAYOUT, { .../* INVOICE_REF-derived ctx */ } as any);
    const buf = sheetModelToXlsx(model);
    const wb = XLSX.read(buf, { type: 'array' });
    const aoa = XLSX.utils.sheet_to_json<(string|number)[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    expect(normalize(aoa.flat().map(String).join(' '))).toContain('Рахунок-фактура № СФ-0000305');
  });
});

describe('sheetModelToPdf', () => {
  it('produces a valid PDF with an embedded Cyrillic font', () => {
    const model = renderLayout(TITLE_LAYOUT, { ... } as any);
    const buf = sheetModelToPdf(model);
    const bytes = new Uint8Array(buf);
    expect(String.fromCharCode(...bytes.slice(0,5))).toBe('%PDF-');
    expect(Array.from(bytes, b => String.fromCharCode(b)).join('')).toContain('DejaVuSansUA');
  });
});
```

> Note: drop `INVOICE_LAYOUT` import above; use the inline `TITLE_LAYOUT`. The exact `ctx` is the `INVOICE_REF`-derived context built in Task 4's helper — for this step, inline a minimal context literal with `field.number: 'СФ-0000305'` and the two `INVOICE_REF.lines`.

- [ ] **Step 2: Run the two writer tests, expect failure**

Run: `npx vitest run app/lib/__tests__/generate-document.test.ts -t "round-trip|embedded Cyrillic"`
Expected: FAIL — `sheetModelToXlsx`/`sheetModelToPdf` not exported.

- [ ] **Step 3: Refactor `generate-document.ts`**

Delete `buildInvoiceLikeSheet`, `buildPoaSheet`, `buildDocumentSheet`, `generateXlsx`, `generatePdf`, `DocumentBuildInput`, `DocumentType`, `TITLE_NOUN`, `WIDE_COLS`, and the `egrpouPart`/`phonePart`/`bankLine`/`innLine`/`joinNonEmpty` helpers. Keep the types, `resolveLineItems`, `computeTotals`, `sheetModelToWorkbook`. Add:

```ts
export function sheetModelToXlsx(model: SheetModel): ArrayBuffer {
  const wb = sheetModelToWorkbook(model, 'Документ');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

export function sheetModelToPdf(model: SheetModel, stampDataUrl?: string | null): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const font = registerCyrillicFont(doc);
  doc.setFont(font);
  doc.setFontSize(9);
  const marginX = 12;
  let y = 16;
  const colX = [marginX, marginX+8, marginX+95, marginX+110, marginX+120, marginX+140, marginX+160, marginX+178];
  for (const r of model.rows) {
    if (y > 285) { doc.addPage(); y = 16; }
    r.forEach((cell, c) => {
      if (cell == null || cell === '') return;
      doc.text(String(cell), colX[Math.min(c, colX.length - 1)], y);
    });
    y += 5;
  }
  if (stampDataUrl) {
    try { doc.addImage(stampDataUrl, marginX, y + 6, 40, 40); } catch { /* ignore */ }
  }
  return doc.output('arraybuffer');
}
```

(`sheetModelToWorkbook`'s second arg already defaults the sheet name; keep its existing signature.)

- [ ] **Step 4: Run the two writer tests, expect pass**

Run: `npx vitest run app/lib/__tests__/generate-document.test.ts -t "round-trip|embedded Cyrillic"`
Expected: PASS. (Other describes in the file won't compile yet — they're re-pointed in Task 4; do not run the whole file here.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/lib/generate-document.ts apps/web/app/lib/__tests__/generate-document.test.ts
git commit -m "refactor(documents): split SheetModel writers from builders"
```

---

### Task 4: Default layouts + re-point alignment suite

**Files:**
- Create: `apps/web/app/lib/default-document-layouts.ts`
- Modify: `apps/web/app/lib/__tests__/generate-document.test.ts`

**Interfaces:**
- Produces: `export const INVOICE_LAYOUT: Layout`, `BILL_LAYOUT: Layout`, `POA_LAYOUT: Layout`.

**How to author the layouts:** the existing (now-deleted) `buildInvoiceLikeSheet` / `buildPoaSheet` in git history (`git show HEAD~2:apps/web/app/lib/generate-document.ts`) are the **exact** structure to reproduce. Translate each emitted row into a `row` block, and the item loop into a `lineItems` block, replacing literal values with `{{bindings}}`:
- supplier name line → `{ col:1,text:'Постачальник' }, { col:2,text:'{{supplier.name}}' }`
- egrpou+phone line → `{ col:2, text:'ЄДРПОУ {{supplier.egrpou}}, тел. {{supplier.phone}}', omitIfEmpty:true }`
- bank line → `{ col:2, text:'Р/р {{supplier.iban}} в  {{supplier.bankName}} МФО {{supplier.mfo}}' }`
- title → `{ col:0, text:'Рахунок-фактура № {{field.number}}' }`, date → `{ col:0, text:'від {{field.date | longDate}}' }`
- totals → `{ col:6,text:'Разом без ПДВ:' }, { col:7,text:'{{totals.subtotal | money}}' }` etc.
- words → `{ col:0, text:'{{totals.total | hryvniaWords}}' }`
- M-2 rows → positioned cells matching `buildPoaSheet`; qty column `{{line.quantity | intWords}}`.

The alignment assertions (below) are the oracle — author until green.

- [ ] **Step 1: Re-point the three `buildDocumentSheet` describes**

In `generate-document.test.ts`, add a helper that builds a `RenderContext` from the reference fixtures and replace each `buildDocumentSheet({...})` call with `renderLayout(<LAYOUT>, ctx)`:

```ts
import { renderLayout } from '../document-renderer';
import { INVOICE_LAYOUT, BILL_LAYOUT, POA_LAYOUT } from '../default-document-layouts';
import { computeTotals } from '../generate-document';

function ctxFrom(ref, supplier, recipientPhone) {
  return {
    supplier, counterparty: { name: ref.recipientName, phone: recipientPhone ?? null },
    field: { number: ref.number, date: ref.date, invoice_ref: ref.orderRef, sales_terms: ref.salesTerms,
             valid_until: ref.validUntil, recipient_name: ref.recipientName, /* + poa passport fields */ },
    lines: ref.lines,
    totals: { ...computeTotals(ref.lines, ref.lines[0]?.price === 0 ? 0 : 0.2), vatRate: 0.2 },
  };
}
// invoice describe:  const model = renderLayout(INVOICE_LAYOUT, ctxFrom(INVOICE_REF, SUPPLIER, INVOICE_REF.recipientPhone));
// bill describe:     const model = renderLayout(BILL_LAYOUT, ctxFrom(BILL_REF, SUPPLIER));
// poa describe:      const model = renderLayout(POA_LAYOUT, poaCtx);  // counterparty.name = POA_REF.supplierCompanyName; field carries passport keys
```

Keep all existing assertions (supplier block, totals, сума прописом, M-2 passport, every line item) unchanged — they define correctness.

- [ ] **Step 2: Run, expect failure**

Run: `npx vitest run app/lib/__tests__/generate-document.test.ts`
Expected: FAIL — `default-document-layouts` not found.

- [ ] **Step 3: Author `default-document-layouts.ts`**

Create `INVOICE_LAYOUT`, `BILL_LAYOUT`, `POA_LAYOUT` per the translation guide above. Reference `git show HEAD~2:apps/web/app/lib/generate-document.ts` for exact rows/columns.

- [ ] **Step 4: Run the full file until green**

Run: `npx vitest run app/lib/__tests__/generate-document.test.ts`
Expected: PASS — all alignment assertions reproduce the references through the renderer. Iterate the layouts until green.

- [ ] **Step 5: Run the whole unit suite + typecheck**

Run: `npx vitest run` then `npx tsc -b`
Expected: all green, 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/lib/default-document-layouts.ts apps/web/app/lib/__tests__/generate-document.test.ts
git commit -m "feat(documents): data-driven invoice/bill/M-2 layouts (alignment parity)"
```

---

### Task 5: Wire the generate route to the renderer + seed layouts

**Files:**
- Modify: `apps/web/app/routes/documents/_api/generate-document.ts`
- Modify: `apps/web/app/routes/documents/type/settings/edit/index.tsx` (`DEFAULT_SCHEMAS`)
- Modify: `apps/web/database/seed-templates.sql`
- Test: `apps/web/app/lib/__tests__/default-layouts-seed.test.ts`

**Interfaces:**
- Consumes: `renderLayout`, `sheetModelToXlsx`, `sheetModelToPdf`, `resolveLineItems`, `computeTotals`, the three layout constants.

- [ ] **Step 1: Add a drift-guard test (seed JSON == TS layouts)**

```ts
// apps/web/app/lib/__tests__/default-layouts-seed.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INVOICE_LAYOUT, BILL_LAYOUT, POA_LAYOUT } from '../default-document-layouts';

const sql = readFileSync(new URL('../../../database/seed-templates.sql', import.meta.url), 'utf8');
function layoutFromSeed(type: string) {
  // each INSERT has a schema_json string for the given type; parse it and return .layout
  const re = new RegExp(`'(\\{[\\s\\S]*?)',\\s*'${type}'`);
  const m = sql.match(re);
  if (!m) throw new Error(`no seed for ${type}`);
  return JSON.parse(m[1].replace(/''/g, "'")).layout;
}

describe('seed layouts match TS constants', () => {
  it('invoices', () => expect(layoutFromSeed('invoices')).toEqual(INVOICE_LAYOUT));
  it('bills', () => expect(layoutFromSeed('bills')).toEqual(BILL_LAYOUT));
  it('poas', () => expect(layoutFromSeed('poas')).toEqual(POA_LAYOUT));
});
```

> If the seed SQL's quoting makes parsing brittle, instead assert that `JSON.stringify(INVOICE_LAYOUT)` appears (whitespace-normalised) within the seed file. Pick whichever is robust against the actual seed formatting.

- [ ] **Step 2: Run, expect failure**

Run: `npx vitest run app/lib/__tests__/default-layouts-seed.test.ts`
Expected: FAIL — seed has no `layout`.

- [ ] **Step 3: Add `layout` to the three seed templates and `DEFAULT_SCHEMAS`**

Edit `seed-templates.sql`: for each of the three `INSERT`s, add `"layout": <JSON of the matching constant>` to the `schema_json`. Edit `DEFAULT_SCHEMAS` in the editor route to include the same `layout` (import the constants rather than duplicating).

- [ ] **Step 4: Wire the route**

Replace the route's `generateXlsx(buildInput)`/`generatePdf(buildInput)` block with:

```ts
import { renderLayout } from '~/lib/document-renderer';
import { resolveLineItems, computeTotals, sheetModelToXlsx, sheetModelToPdf } from '~/lib/generate-document';

const layout = JSON.parse(template.schemaJson).layout;
if (!layout) return { data: null, error: 'Шаблон не містить розмітки (layout)' };

const lines = resolveLineItems(lineItemsInput);
const totals = { ...computeTotals(lines, resolveVatRate(docType, template.schemaJson)),
                 vatRate: resolveVatRate(docType, template.schemaJson) };
const context = {
  supplier: supplier as SupplierIdentity,
  counterparty: { name: counterparty.name, egrpou: counterparty.egrpou, phone: counterparty.phone },
  field: fields, lines, totals,
};
const model = renderLayout(layout, context);
const buffer = format === 'pdf' ? sheetModelToPdf(model, stampDataUrl) : sheetModelToXlsx(model);
```

- [ ] **Step 5: Run drift test + typecheck**

Run: `npx vitest run app/lib/__tests__/default-layouts-seed.test.ts` then `npx tsc -b`
Expected: PASS, 0 errors.

- [ ] **Step 6: E2E generation happy-path**

Run: `cd apps/web && rm -rf .wrangler/state && npm run test:e2e`
Expected: 80 passed (the happy-path now generates via the data-driven renderer).

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/routes/documents/_api/generate-document.ts apps/web/app/routes/documents/type/settings/edit/index.tsx apps/web/database/seed-templates.sql apps/web/app/lib/__tests__/default-layouts-seed.test.ts
git commit -m "feat(documents): generate from template layout; seed layouts"
```

---

### Task 6: `sheetModelToHtml` + editor preview

**Files:**
- Create: `apps/web/app/lib/sheet-model-to-html.ts`
- Test: `apps/web/app/lib/__tests__/sheet-model-to-html.test.ts`
- Modify: `apps/web/app/routes/documents/type/settings/edit/index.tsx` (`TemplatePreview`)
- Modify: `apps/web/e2e/documents.spec.ts`

**Interfaces:**
- Produces: `function sheetModelToHtml(model: SheetModel): string` (escaped HTML `<table>`).

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/app/lib/__tests__/sheet-model-to-html.test.ts
import { describe, expect, it } from 'vitest';
import { sheetModelToHtml } from '../sheet-model-to-html';

describe('sheetModelToHtml', () => {
  it('renders rows as a table and escapes text', () => {
    const html = sheetModelToHtml({ rows: [['A & B', 1], [null, 'x']] });
    expect(html).toContain('<table');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('>1<');
  });

  it('applies colspan from merges', () => {
    const html = sheetModelToHtml({ rows: [['T', null, null]], merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }] });
    expect(html).toContain('colspan="3"');
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npx vitest run app/lib/__tests__/sheet-model-to-html.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// apps/web/app/lib/sheet-model-to-html.ts
import type { SheetModel } from './generate-document';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function sheetModelToHtml(model: SheetModel): string {
  const merges = model.merges ?? [];
  const spanAt = (r: number, c: number) => merges.find((m) => m.s.r === r && m.s.c === c);
  const covered = (r: number, c: number) =>
    merges.some((m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c && !(m.s.r === r && m.s.c === c));

  const rows = model.rows.map((row, r) => {
    const cells = row.map((cell, c) => {
      if (covered(r, c)) return '';
      const span = spanAt(r, c);
      const colspan = span ? ` colspan="${span.e.c - span.s.c + 1}"` : '';
      const v = cell == null ? '' : esc(String(cell));
      return `<td${colspan}>${v}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `<table class="w-full text-xs border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1">${rows}</table>`;
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npx vitest run app/lib/__tests__/sheet-model-to-html.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire `TemplatePreview`**

In the editor route, replace the field-only `TemplatePreview` body with: parse the edited `schemaJson` → `layout`; build a small sample `RenderContext` (placeholder supplier/counterparty + two sample lines); `renderLayout(layout, sample)`; render `sheetModelToHtml(model)` via `dangerouslySetInnerHTML`. On JSON parse error, show the existing "Помилка в JSON" message.

```tsx
const SAMPLE = { supplier: { name: 'ФОП Зразок', egrpou: '00000000', inn: '00000000', vatCertificate: null,
  iban: 'UA00', bankName: 'БАНК', mfo: '000', phone: '000', address: 'Адреса', taxNote: '', signatoryName: 'І. П.' },
  counterparty: { name: 'ТОВ Зразок', phone: '000' }, field: { number: '0001', date: '2024-12-26' },
  lines: [{ name: 'Зразок 1', unit: 'шт.', quantity: 1, price: 100, total: 100 },
          { name: 'Зразок 2', unit: 'шт.', quantity: 2, price: 50, total: 100 }],
  totals: { subtotal: 200, vat: 40, total: 240, vatRate: 0.2 } };
// ... in component:
let html = '';
try { html = sheetModelToHtml(renderLayout(JSON.parse(schemaJson).layout, SAMPLE)); }
catch { return <div className="text-destructive text-sm p-4">Помилка в JSON — перевірте синтаксис</div>; }
return <div dangerouslySetInnerHTML={{ __html: html }} />;
```

- [ ] **Step 6: Add an E2E preview check**

In `documents.spec.ts` "template editor shows live preview", assert the layout preview renders, e.g. `await expect(page.getByText('Постачальник')).toBeVisible();` (invoice layout has the supplier label).

- [ ] **Step 7: Typecheck + E2E**

Run: `npx tsc -b` then `cd apps/web && rm -rf .wrangler/state && npm run test:e2e`
Expected: 0 errors; E2E green.

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/lib/sheet-model-to-html.ts apps/web/app/lib/__tests__/sheet-model-to-html.test.ts apps/web/app/routes/documents/type/settings/edit/index.tsx apps/web/e2e/documents.spec.ts
git commit -m "feat(documents): renderer-driven template preview"
```

---

### Task 7: Consolidate R2 storage to one bucket — ⏸️ DEFERRED to a stacked follow-up PR

> **Status: NOT done on this branch (decided 2026-06-21).** Units 1–6 (the layout-schema foundation) shipped; this storage task was split off because it touches infra (Pulumi) + production R2 + a data migration, which is orthogonal to the layout schema and carries production-data risk. It MUST still be done — as its own stacked PR after this one merges. The route still uses the three per-type buckets (`POAS`/`INVOICES`/`BILLS`) via `BUCKET_MAP`; see the code comment in `apps/web/app/routes/documents/_api/generate-document.ts` and Section 5 of the design spec. Steps below are the to-do for that follow-up.

**Files:**
- Modify: `apps/web/wrangler.jsonc` (local + staging + production)
- Modify: `packages/infra/src/*` (R2 bucket resources)
- Modify: `apps/web/app/routes/documents/_api/generate-document.ts`, `export-document.ts`
- Modify: `apps/web/database/schema.ts` (drop the `// matches R2 bucket` comment)

> Infra task — no unit test; covered by the generation/download E2E. Land it as its own commit so the infra diff is reviewable in isolation.

- [ ] **Step 1: Add the `DOCUMENTS` bucket binding**

In `wrangler.jsonc`, add a `DOCUMENTS` binding (`local-documents` / `staging-documents` / `production-documents`) in each env. Keep `POAS`/`INVOICES`/`BILLS` for now (read-fallback during migration). Run `npx wrangler types --env staging` so `worker-configuration.d.ts` includes `DOCUMENTS` (do not stage that file).

- [ ] **Step 2: Switch the routes to `DOCUMENTS`**

In `generate-document.ts`: remove `BUCKET_MAP`; write to `context.cloudflare.env.DOCUMENTS`; keep `r2Key = ${docType}/${date}-${number}-${ts}.{ext}`. In `export-document.ts`: read from `DOCUMENTS` first, fall back to the legacy per-type bucket by `doc.documentType` if not found (so already-stored objects still download). Remove the schema comment.

- [ ] **Step 3: Provision the bucket in Pulumi**

In `packages/infra`, add the `DOCUMENTS` R2 bucket resource(s) for staging/production mirroring the existing per-type buckets. (Do not destroy the old buckets yet.)

- [ ] **Step 4: Typecheck + E2E (local uses the new bucket)**

Run: `npx tsc -b` then `cd apps/web && rm -rf .wrangler/state && npm run test:e2e`
Expected: 0 errors; generation happy-path writes/reads `DOCUMENTS`; 80 passed.

- [ ] **Step 5: Commit (infra isolated)**

```bash
git add apps/web/wrangler.jsonc packages/infra apps/web/app/routes/documents/_api/generate-document.ts apps/web/app/routes/documents/_api/export-document.ts apps/web/database/schema.ts
git commit -m "refactor(infra): consolidate document R2 buckets into DOCUMENTS"
```

- [ ] **Step 6: Follow-up (not in this plan):** migrate existing objects from the three buckets into `DOCUMENTS`, then remove the legacy buckets + the read-fallback. Tracked separately because it touches production data.

---

## Self-Review

- **Spec coverage:** Section 1 (template shape/context) → Tasks 1,5; Section 2 (blocks) → Tasks 1,2,4; Section 3 (bindings/transforms/numeric) → Task 1; Section 4 (renderer/integration/migration/tests) → Tasks 2,3,4,5; Section 5 (storage) → Task 7; Section 6 (preview) → Task 6. All covered.
- **Known limitation:** `hryvniaWords` UAH comment preserved (Task 1 reuses `amount-in-words`; add/keep the comment there).
- **Type consistency:** `renderLayout(Layout, RenderContext) → SheetModel`, `resolveCell(Cell, Scope) → PlacedValue|null`, `sheetModelToXlsx/Pdf(SheetModel)`, `sheetModelToHtml(SheetModel) → string` — used consistently across tasks.
- **Sequencing risk:** Task 3 leaves the alignment describes uncompilable until Task 4; mitigated by running only the two writer tests in Task 3 (path/`-t` filter) and the full file in Task 4.
