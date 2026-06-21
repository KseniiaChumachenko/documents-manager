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
});
