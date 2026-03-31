---
name: Database Schema
description: All D1/SQLite tables, columns, relationships, and migration history
type: project
---

## Tables

### `unit`
| Column | Type | Notes |
|--------|------|-------|
| name | TEXT | PRIMARY KEY |

Default values: штуки, метри, кілограми, години, доби, гривні

### `item_type`
| Column | Type | Notes |
|--------|------|-------|
| name | TEXT | PRIMARY KEY |

User-defined categories for items (товари/послуги types)

### `item`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | UNIQUE, NOT NULL |
| type | TEXT | FK → item_type.name, NOT NULL |
| unit | TEXT | FK → unit.name, nullable |
| priceInputVATFree | INTEGER | NOT NULL (cents) |
| priceOutputVATFree | INTEGER | NOT NULL (cents) |
| priceRetailInclVAT | INTEGER | NOT NULL (cents) |

### `company_type`
| Column | Type | Notes |
|--------|------|-------|
| name | TEXT | PRIMARY KEY |

Seeded values: "client", "source"

### `company`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| egrpou | TEXT(8) | UNIQUE, nullable (legal entity ЄДРПОУ code) |
| ik | TEXT(10) | UNIQUE, nullable (ФОП/sole-proprietor ІК code) |
| entity_type | TEXT | NOT NULL, enum: 'legal' \| 'fop' |
| type | TEXT | FK → company_type.name, NOT NULL |
| name | TEXT | NOT NULL |
| name_short | TEXT | nullable |
| address | TEXT | nullable |
| phone | TEXT | nullable |
| director | TEXT | nullable (nominative case) |
| director_gen | TEXT | nullable (genitive case, for documents) |
| kved | TEXT | nullable (business activity description) |
| kved_number | TEXT | nullable (KVED code) |
| inn | TEXT | nullable (VAT number / ІПН) |
| inn_date | TEXT | nullable (VAT registration date) |
| last_sync | TEXT | nullable (last sync ISO timestamp) |

Exactly one of (egrpou, ik) should be non-null per row.

## Migration History
Located at `apps/web/database/migrations/`
1. `0000_*` — Initial schema setup
2. `0001_*` — Items, item_type, unit tables
3. `0002_*` — Added companies table
4. `0003_*` — Created company_type, refactored company.type relationship
5. `0004_*` — Foreign key constraints and performance indexes
6. `0005_company_split_identifiers` — Split `egrpou` PK into `id` PK + `egrpou TEXT(8)` + `ik TEXT(10)`, added `entity_type`, `phone`, renamed `last_update` → `last_sync`

## ORM
- Drizzle ORM schema at `apps/web/app/database/schema.ts`
- DB accessed via `context.db` in loaders/actions (bound in root)
- Migration command: `npm run db:migrate:stg`
