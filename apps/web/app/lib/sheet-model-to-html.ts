import type { SheetModel } from './generate-document';

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function sheetModelToHtml(model: SheetModel): string {
  const merges = model.merges ?? [];
  const spanAt = (r: number, c: number) => merges.find((m) => m.s.r === r && m.s.c === c);
  const covered = (r: number, c: number) =>
    merges.some(
      (m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c && !(m.s.r === r && m.s.c === c)
    );

  const rows = model.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => {
          if (covered(r, c)) return '';
          const span = spanAt(r, c);
          const colspan = span ? ` colspan="${span.e.c - span.s.c + 1}"` : '';
          const v = cell == null ? '' : esc(String(cell));
          return `<td${colspan}>${v}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<table class="w-full text-xs border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1">${rows}</table>`;
}
