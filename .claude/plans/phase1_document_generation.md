# Phase 1: Document Generation Engine

## Goal
Generate business documents (acts, invoices, delivery notes) from JSON-schema templates stored in R2. Output XLSX via ExcelJS and PDF via jsPDF. Store generated documents in R2. Full audit trail in D1.

## Prerequisites
- Library module complete: `company`, `item` tables exist and are populated
- Migration 0005 applied (`company.id` is now a surrogate integer PK)
- `context.db` (Drizzle ORM) and R2 bindings available in route context

## Stack Decisions
- **Template format:** JSON schema in D1 (`schema_json` column), binary assets (stamp/signature images) in R2 under `templates/` prefix
- **XLSX generation:** `exceljs` package (runs in Cloudflare Workers, no native dependencies)
- **PDF generation:** `jspdf` package (pure JS, runs in Workers)
- **No Monaco Editor** — template editing is a structured form builder UI

---

## 1. Schema Changes

Add to `apps/web/app/database/schema.ts`:

```typescript
export const documentTemplate = sqliteTable('document_template', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'act' | 'invoice' | 'delivery_note'
  schemaJson: text('schema_json').notNull(),
  stampImageKey: text('stamp_image_key'), // R2 key, nullable
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const document = sqliteTable('document', {
  id: integer().primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').references(() => documentTemplate.id).notNull(),
  companyId: integer('company_id').references(() => company.id).notNull(),
  dataJson: text('data_json').notNull(), // serialized field values + price overrides
  createdBy: text('created_by').notNull(), // context.user.email
  createdAt: text('created_at').notNull(),
  exportedAt: text('exported_at'),
  exportFormat: text('export_format'), // 'xlsx' | 'pdf'
  r2Key: text('r2_key'), // key of generated file in R2
});

export const documentAuditLog = sqliteTable('document_audit_log', {
  id: integer().primaryKey({ autoIncrement: true }),
  documentId: integer('document_id').references(() => document.id).notNull(),
  action: text().notNull(), // 'created' | 'exported' | 'deleted'
  actorEmail: text('actor_email').notNull(),
  timestamp: text().notNull(),
});
```

After adding, run `npm run db:generate` to create the migration SQL, then apply it.

---

## 2. JSON Template Schema Format

Define a standard for `schema_json`. Example:

```json
{
  "fields": [
    { "key": "number", "label": "№ документа", "type": "text", "required": true },
    { "key": "date", "label": "Дата", "type": "date", "required": true },
    { "key": "company_id", "label": "Контрагент", "type": "company_ref", "required": true }
  ],
  "line_items": {
    "source": "items",
    "columns": ["name", "unit", "quantity", "price_override", "total"],
    "allow_price_override": true
  },
  "totals": [
    { "label": "Сума без ПДВ", "formula": "sum(line_items.total)" },
    { "label": "ПДВ 20%", "formula": "sum(line_items.total) * 0.2" },
    { "label": "Разом з ПДВ", "formula": "sum(line_items.total) * 1.2" }
  ],
  "stamp": { "conditional": true, "field": "include_stamp" }
}
```

---

## 3. API Routes to Create

All in `apps/web/app/routes/documents/_api/`:

### `template-management.ts`
- `GET ?action=list` → list all templates
- `GET ?action=get&id=X` → get single template with schema
- `POST action=create` → create template (name, type, schemaJson)
- `POST action=update` → update template
- `DELETE ?id=X` → delete template

### `stamp-upload.ts`
- `POST` → receive image file, upload to R2 under `templates/stamps/{id}`, update `documentTemplate.stampImageKey`

### `generate-document.ts`
- `POST` → receive `{ templateId, companyId, dataJson }`, run generation pipeline, store result in R2, write `document` row + audit log entry
- Returns `{ id, r2Key, downloadUrl }`

### `export-document.ts`
- `GET ?id=X&format=xlsx|pdf` → stream the R2 file as a download response, write audit log entry

---

## 4. Generation Pipeline (`apps/web/app/lib/generate-document.ts`)

```typescript
// Pseudocode flow
async function generateDocument(template, data, format: 'xlsx' | 'pdf', env) {
  const items = resolveLineItems(data, template.schemaJson);
  const totals = computeTotals(items, template.schemaJson);
  const stampBuffer = template.stampImageKey
    ? await env.STAGING_TEMPLATE.get(template.stampImageKey).arrayBuffer()
    : null;

  if (format === 'xlsx') {
    return generateXlsx(template, data, items, totals, stampBuffer);
  } else {
    return generatePdf(template, data, items, totals, stampBuffer);
  }
}
```

Key: all math (totals, VAT) must happen server-side in the generation function, not in the template JSON.

---

## 5. UI Routes to Implement

### `apps/web/app/routes/documents/$type/index.tsx`
- Replace current stub with a DataTable of all documents of that type
- Columns: number, date, company name, created by, export status
- "Новий документ" button → navigates to `/documents/$type/new`

### `apps/web/app/routes/documents/$type/new.tsx`
- Step 1: select template (from list for this type)
- Step 2: fill document fields (rendered from template `schema_json`)
  - Company selector (searches from `company` table)
  - Line items: select from `item` library with quantity + price override per line
  - Optional: stamp checkbox if template has `stamp.conditional`
- Submit → POST to `generate-document` API → redirect to document detail

### `apps/web/app/routes/documents/$type/$id.tsx`
- Show document detail (fields, line items, totals)
- "Завантажити XLSX" button → calls export-document API
- "Завантажити PDF" button → calls export-document API
- Audit log section at bottom

### `apps/web/app/routes/documents/$type/settings.tsx`
- Replace stub with template management UI
- List templates for this document type
- "Новий шаблон" → form to create template (name + schema builder)
- Edit/delete existing templates
- Stamp image upload per template

---

## 6. i18n Additions (`apps/web/app/i18n.ts`)

Add keys for:
- Document types: `акт виконаних робіт`, `рахунок-фактура`, `видаткова накладна`
- Document form labels, line item table headers
- Export button labels, audit log action labels

---

## 7. Dependencies to Add

In `apps/web/package.json` dependencies:
```json
"exceljs": "^4.4.0",
"jspdf": "^2.5.2"
```

Verify both run in Cloudflare Workers (no Node.js-specific APIs). If jsPDF has issues in Workers, fall back to HTML-based PDF via a Worker with puppeteer — but prefer pure-JS libraries.

---

## 8. E2E Tests (`apps/web/e2e/documents.spec.ts`)

Required test cases:
1. Navigate to `/documents/invoices` — verify document list page renders
2. Navigate to `/documents/invoices/settings` — verify template list renders
3. Create a template — fill name and basic schema, submit, verify it appears in list
4. Create a document — select template, select company, add line item with price override, submit
5. Verify created document appears in document list
6. Export document as XLSX — verify download response
7. Verify audit log entry appears on document detail page

---

## Definition of Done
- [ ] Migration generated and applied locally
- [ ] Templates can be created, listed, edited, deleted
- [ ] Documents can be created from a template with company + line items
- [ ] XLSX export downloads a valid file
- [ ] PDF export downloads a valid file
- [ ] Audit log records creation and each export
- [ ] All E2E tests pass
- [ ] Pre-commit hook passes
