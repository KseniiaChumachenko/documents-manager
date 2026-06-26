// apps/web/app/lib/document-layout.ts
import { hryvniaInWords, integerInWords } from './amount-in-words';
import { formatUaDateLong } from './format-ua';
import type { Counterparty, ResolvedLineItem, SupplierIdentity, Totals } from './generate-document';

export interface Cell {
  col: number;
  text: string;
  span?: number;
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
  omitIfEmpty?: boolean;
}
/**
 * Conditional rendering tied to VAT applicability. A non-VAT payer (єдинник,
 * ПКУ ст. 193 — see `.claude/skills/ukrainian-accounting/references/03-vat-pdv.md`)
 * issues documents with NO ПДВ line at all, so VAT-specific rows are tagged
 * `'vat'` (render only when a VAT rate applies) and the plain total is tagged
 * `'novat'` (render only when it does not). Untagged blocks always render.
 */
export type WhenVat = 'vat' | 'novat';

export interface RowBlock {
  type: 'row';
  cells: Cell[];
  when?: WhenVat;
}
export interface LineItemsBlock {
  type: 'lineItems';
  header: Cell[];
  row: Cell[];
  when?: WhenVat;
}
export type Block = RowBlock | LineItemsBlock;
export interface Layout {
  cols: number[];
  blocks: Block[];
}

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

interface TransformDef {
  /** Produce the placed value (may carry numFmt for numeric cells). */
  place: (raw: unknown) => PlacedValue;
  /** Render to a plain string for mixed-text interpolation. */
  str: (raw: unknown) => string;
}

const TRANSFORMS: Record<string, TransformDef> = {
  money: {
    place: (raw) => ({ value: Number(raw), numFmt: '0.00' }),
    str: (raw) => Number(raw).toFixed(2),
  },
  longDate: {
    place: (raw) => ({ value: formatUaDateLong(String(raw ?? '')) }),
    str: (raw) => formatUaDateLong(String(raw ?? '')),
  },
  hryvniaWords: {
    place: (raw) => ({ value: hryvniaInWords(Number(raw)) }),
    str: (raw) => hryvniaInWords(Number(raw)),
  },
  intWords: {
    place: (raw) => ({ value: integerInWords(Number(raw)) }),
    str: (raw) => integerInWords(Number(raw)),
  },
};

/** Format a resolved value as a string (used in mixed-text interpolation). */
function asString(raw: unknown, transform?: string): string {
  if (raw == null) return '';
  if (transform && TRANSFORMS[transform]) return TRANSFORMS[transform].str(raw);
  return String(raw);
}

export function resolveCell(cell: Cell, scope: Scope): PlacedValue | null {
  const single = cell.text.match(SINGLE);
  if (single) {
    const [, path, transform] = single;
    const raw = lookup(scope, path);
    // omitIfEmpty check BEFORE transform so that e.g. `{{ x | money }}` with x
    // absent returns null rather than { value: NaN, numFmt: '0.00' }.
    // Numeric 0 is NOT empty and must still render.
    if (cell.omitIfEmpty && (raw == null || raw === '')) return null;
    if (transform && TRANSFORMS[transform]) return TRANSFORMS[transform].place(raw);
    if (typeof raw === 'number') return { value: raw };
    const strVal = raw == null ? '' : String(raw);
    if (cell.omitIfEmpty && strVal === '') return null;
    return { value: strVal };
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
