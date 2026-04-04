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
  priceInputVATFree: integer().notNull(),
  priceOutputVATFree: integer().notNull(),
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

export const documentTemplate = sqliteTable('document_template', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'act' | 'invoice' | 'delivery_note'
  schemaJson: text('schema_json').notNull(),
  stampImageKey: text('stamp_image_key'),
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
  documentType: text('document_type').notNull(), // matches R2 bucket: 'poas' | 'invoices' | 'bills'
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
