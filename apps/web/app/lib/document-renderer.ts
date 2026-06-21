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
      rows.push(placeRow(block.header, width, context, rows.length, merges).row);
      context.lines.forEach((line, i) => {
        rows.push(
          placeRow(block.row, width, { ...context, line, index: i + 1 }, rows.length, merges).row
        );
      });
    }
  }

  return { rows, merges, cols: layout.cols.map((wch) => ({ wch })) };
}
