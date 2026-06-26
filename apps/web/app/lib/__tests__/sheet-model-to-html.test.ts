import { describe, expect, it } from 'vitest';

import { sheetModelToHtml } from '../sheet-model-to-html';

describe('sheetModelToHtml', () => {
  it('renders rows as a table and escapes text', () => {
    const html = sheetModelToHtml({
      rows: [
        ['A & B', 1],
        [null, 'x'],
      ],
    });
    expect(html).toContain('<table');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('>1<');
  });

  it('applies colspan from merges', () => {
    const html = sheetModelToHtml({
      rows: [['T', null, null]],
      merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }],
    });
    expect(html).toContain('colspan="3"');
  });

  it('skips cells covered by a merge so a spanned row renders a single cell', () => {
    const html = sheetModelToHtml({
      rows: [['T', null, null]],
      merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }],
    });
    expect(html.match(/<td/g)).toHaveLength(1); // only the merge origin renders
    expect(html).toContain('<tr><td colspan="3">T</td></tr>');
  });

  it('renders numeric cells as their value and null/empty as empty <td>', () => {
    const html = sheetModelToHtml({ rows: [[3250.02, null, '']] });
    expect(html).toContain('<td>3250.02</td>');
    expect(html.match(/<td><\/td>/g)).toHaveLength(2); // null and '' both empty
  });

  it('renders multiple rows as separate <tr> elements', () => {
    const html = sheetModelToHtml({ rows: [['a'], ['b'], ['c']] });
    expect(html.match(/<tr>/g)).toHaveLength(3);
    expect(html).toContain('<td>a</td>');
    expect(html).toContain('<td>c</td>');
  });

  it('does not leak content from a cell covered by a merge', () => {
    const html = sheetModelToHtml({
      rows: [['origin', 'leak', null]],
      merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }],
    });
    expect(html).toContain('>origin<');
    expect(html).not.toContain('leak');
  });
});
