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

function placeRow(
  cells: Cell[],
  width: number,
  scope: Scope,
  rowIndex: number,
  merges: SheetModel['merges']
): CellOut[] {
  const out: CellOut[] = new Array(width).fill(null);
  for (const cell of cells) {
    const placed = resolveCell(cell, scope);
    if (placed == null) continue;
    out[cell.col] = placed.value;
    if (cell.span && cell.span > 1) {
      merges!.push({
        s: { r: rowIndex, c: cell.col },
        e: { r: rowIndex, c: cell.col + cell.span - 1 },
      });
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
        rows.push(
          placeRow(block.row, width, { ...context, line, index: i + 1 }, rows.length, merges)
        );
      });
    }
  }

  return { rows, merges, cols: layout.cols.map((wch) => ({ wch })) };
}
