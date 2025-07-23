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
  egrpou: integer().primaryKey({ onConflict: 'replace' }), // = egrpou
  type: text()
    .references(() => companyType.name)
    .notNull(),
  name: text().notNull().unique(),
  name_short: text().notNull().unique(),
  address: text().notNull(),
  director: text(),
  director_gen: text(),
  kved: text(),
  kved_number: text(),
  inn: text(),
  inn_date: text(),
  last_update: text(),
});

export type Company = typeof company.$inferSelect;
