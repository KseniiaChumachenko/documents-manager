import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const unit = sqliteTable('unit', {
  name: text().primaryKey(),
});

export type Unit = typeof unit.$inferSelect;

export const itemType = sqliteTable('item_type', {
  name: text().primaryKey(),
});

export type ItemType = typeof itemType.$inferSelect;

export const item = sqliteTable('item', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  type: text()
    .references(() => itemType.name)
    .notNull(),
  unit: text().references(() => unit.name),
  priceSaleVATFree: integer().notNull(), // Відпускна (sale) price, без ПДВ
  priceCostVATFree: integer().notNull(), // Вхідна (cost) price, без ПДВ
  priceRetailInclVAT: integer().notNull(),
});

export type Item = typeof item.$inferSelect;

export const companyType = sqliteTable('company_type', {
  name: text().primaryKey(),
});

export type CompanyType = typeof companyType.$inferSelect;

export const company = sqliteTable('company', {
  id: integer().primaryKey({ autoIncrement: true }),
  egrpou: text({ length: 8 }).unique(),
  ik: text({ length: 10 }).unique(),
  entity_type: text({ enum: ['legal', 'fop'] }).notNull(),
  type: text()
    .references(() => companyType.name)
    .notNull(),
  name: text().notNull(),
  name_short: text(),
  address: text(),
  phone: text(),
  director: text(),
  director_gen: text(),
  kved: text(),
  kved_number: text(),
  inn: text(),
  inn_date: text(),
  last_sync: text(),
});

export type Company = typeof company.$inferSelect;

// Single-row settings record describing the business issuing the documents
// (the "Постачальник" / "підприємство-одержувач" identity block). Always id=1.
export const myCompany = sqliteTable('my_company', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  egrpou: text(),
  inn: text(), // ІПН
  vatCertificate: text('vat_certificate'), // номер свідоцтва платника ПДВ
  iban: text(),
  bankName: text('bank_name'),
  mfo: text(),
  phone: text(),
  address: text(),
  taxNote: text('tax_note'), // e.g. "Не є платником податку на прибуток на загальних підставах"
  signatoryName: text('signatory_name'), // "Чумаченко І. В." for the signature line
});

export type MyCompany = typeof myCompany.$inferSelect;

export const stamp = sqliteTable('stamp', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  imageKey: text('image_key').notNull(), // R2 key in TEMPLATES bucket
  createdAt: text('created_at').notNull(),
});

export type Stamp = typeof stamp.$inferSelect;

export const documentTemplate = sqliteTable('document_template', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'poas' | 'invoices' | 'bills'
  schemaJson: text('schema_json').notNull(),
  stampId: integer('stamp_id').references(() => stamp.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type DocumentTemplate = typeof documentTemplate.$inferSelect;

export const document = sqliteTable('document', {
  id: integer().primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .references(() => documentTemplate.id)
    .notNull(),
  companyId: integer('company_id')
    .references(() => company.id)
    .notNull(),
  documentType: text('document_type').notNull(), // 'poas' | 'invoices' | 'bills' (also the R2 key prefix)
  dataJson: text('data_json').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  exportedAt: text('exported_at'),
  exportFormat: text('export_format'), // 'xlsx' | 'pdf'
  r2Key: text('r2_key'),
});

export type Document = typeof document.$inferSelect;

export const documentAuditLog = sqliteTable('document_audit_log', {
  id: integer().primaryKey({ autoIncrement: true }),
  documentId: integer('document_id')
    .references(() => document.id)
    .notNull(),
  action: text().notNull(), // 'created' | 'exported' | 'deleted'
  actorEmail: text('actor_email').notNull(),
  timestamp: text().notNull(),
});

export type DocumentAuditLog = typeof documentAuditLog.$inferSelect;
