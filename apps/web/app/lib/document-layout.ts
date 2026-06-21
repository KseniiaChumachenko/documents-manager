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
export interface RowBlock {
  type: 'row';
  cells: Cell[];
}
export interface LineItemsBlock {
  type: 'lineItems';
  header: Cell[];
  row: Cell[];
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
