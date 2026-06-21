// apps/web/app/lib/__tests__/default-layouts-seed.test.ts
//
// Drift guard: the `layout` embedded in each seeded template's schema_json must
// stay byte-for-byte equivalent (after JSON round-trip) to the TS layout
// constants the renderer actually uses. If someone edits one without the other,
// generated documents would silently diverge from the layout under test.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { BILL_LAYOUT, INVOICE_LAYOUT, POA_LAYOUT } from '../default-document-layouts';

const sql = readFileSync(new URL('../../../database/seed-templates.sql', import.meta.url), 'utf8');

/**
 * Extract the parsed schema_json object for a document type from the seed SQL.
 * Each INSERT row is `(id, 'name', 'type', '{...json...}', datetime(...), ...)`.
 * SQLite escapes single quotes by doubling them, so we unescape `''` → `'`.
 */
function schemaFromSeed(type: string): Record<string, unknown> {
  // Anchor on `'<type>', '{` then capture up to the closing `}'` that precedes
  // the trailing column (a comma + whitespace + `datetime`).
  const re = new RegExp(`'${type}',\\s*'(\\{[\\s\\S]*?\\})',\\s*datetime`);
  const m = sql.match(re);
  if (!m) throw new Error(`no seed schema_json for type ${type}`);
  return JSON.parse(m[1].replace(/''/g, "'"));
}

describe('seed layouts match TS constants', () => {
  it('invoices', () => expect(schemaFromSeed('invoices').layout).toEqual(INVOICE_LAYOUT));
  it('bills', () => expect(schemaFromSeed('bills').layout).toEqual(BILL_LAYOUT));
  it('poas', () => expect(schemaFromSeed('poas').layout).toEqual(POA_LAYOUT));
});
