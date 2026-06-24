// apps/web/app/lib/document-renderer.ts
import {
  resolveCell,
  type Layout,
  type RenderContext,
  type Cell,
  type Scope,
} from './document-layout';
import type { SheetModel } from './generate-document';

type CellOut = string | number | null;

/**
 * Place a set of cells into a row array.
 * Returns the row array, plus a boolean indicating whether at least one cell
 * was actually placed (i.e. resolveCell returned non-null for at least one).
 */
function placeRow(
  cells: Cell[],
  width: number,
  scope: Scope,
  rowIndex: number,
  merges: SheetModel['merges']
): { row: CellOut[]; anyPlaced: boolean } {
  const out: CellOut[] = new Array(width).fill(null);
  let anyPlaced = false;
  for (const cell of cells) {
    const placed = resolveCell(cell, scope);
    if (placed == null) continue;
    anyPlaced = true;
    // TODO(money-numfmt): resolveCell may return a `numFmt` (e.g. '0.00' for the
    // `money` transform), but SheetModel has no per-cell format channel, so it is
    // dropped here — XLSX money cells render numerically without a forced
    // 2-decimal display. Thread numFmt into SheetModel + apply in
    // sheetModelToWorkbook to match the reference spreadsheets. Follow-up.
    out[cell.col] = placed.value;
    if (cell.span && cell.span > 1) {
      merges!.push({
        s: { r: rowIndex, c: cell.col },
        e: { r: rowIndex, c: cell.col + cell.span - 1 },
      });
    }
  }
  return { row: out, anyPlaced };
}

export function renderLayout(layout: Layout, context: RenderContext): SheetModel {
  const width = layout.cols.length;
  const rows: CellOut[][] = [];
  const merges: NonNullable<SheetModel['merges']> = [];
  const tables: NonNullable<SheetModel['tables']> = [];

  for (const block of layout.blocks) {
    if (block.type === 'row') {
      // An explicit spacer (cells: []) always emits a blank row.
      // A non-empty cells array where every cell resolves to null is skipped —
      // it would otherwise produce a phantom blank row.
      if (block.cells.length === 0) {
        rows.push(new Array(width).fill(null));
        continue;
      }
      const { row, anyPlaced } = placeRow(block.cells, width, context, rows.length, merges);
      if (!anyPlaced) continue;
      rows.push(row);
    } else {
      const r0 = rows.length;
      rows.push(placeRow(block.header, width, context, rows.length, merges).row);
      context.lines.forEach((line, i) => {
        rows.push(
          placeRow(block.row, width, { ...context, line, index: i + 1 }, rows.length, merges).row
        );
      });
      const r1 = rows.length - 1;
      // Header columns define the table's logical columns for bordering.
      const headerCols = [...new Set(block.header.map((c) => c.col))].sort((a, b) => a - b);
      if (r1 >= r0 && headerCols.length > 0) tables.push({ r0, r1, cols: headerCols });
    }
  }

  return { rows, merges, cols: layout.cols.map((wch) => ({ wch })), tables };
}
