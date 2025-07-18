import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const unit = sqliteTable('unit', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
});

export const itemType = sqliteTable('item_type', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
});

export const item = sqliteTable('item', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  typeId: integer()
    .references(() => itemType.id)
    .notNull(),
  priceInputVATFree: integer().notNull(),
  priceOutputVATFree: integer().notNull(),
  priceRetailInclVAT: integer().notNull(),
});
