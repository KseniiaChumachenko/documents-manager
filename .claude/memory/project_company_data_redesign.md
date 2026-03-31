---
name: Company Data Source Redesign
description: Completed redesign of company/ФОП data model — split identifiers, FOP manual entry, schema migration 0005
type: project
---

## Company Data Fetching — IMPLEMENTED (2026-03-31)

**Goal:** Reliably fetch and maintain company data for ~500 counterparties (~460 ЄДРПОУ legal entities + ~40 ІК sole proprietors/ФОП).

### Data Sources
- **ЄДРПОУ (legal entities):** adm.tools API (integrated, free, no rate limits observed). Endpoint: `VITE_GOV_API` env var. Returns XML in Windows-1251 encoding.
- **ІК (ФОП/sole proprietors):** Manual entry via UI form (name, address, phone). adm.tools doesn't support ФОП. No commercial APIs in budget.

### Implemented Schema (migration 0005)
- Split identifier into: `egrpou TEXT(8) UNIQUE nullable` + `ik TEXT(10) UNIQUE nullable`
- Surrogate PK: `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `entity_type TEXT NOT NULL` ('legal' | 'fop') — inferred from code length (8 → legal, 9-10 → fop)
- `phone TEXT` nullable column
- `last_sync TEXT` (ISO timestamp, renamed from `last_update`)

### Implemented API Routes
- `search-company`: for 8-digit codes → calls adm.tools API; for 10-digit → checks D1 cache, returns null if not found (triggers manual form)
- `save-company`: upserts by `egrpou` (legal) or `ik` (fop); handles both entity types

### Implemented UI
- `add-company-dialog.tsx`: detects entity type from code length; shows data preview for legal entities; shows manual input form (name, address, phone) for ФОП not found in cache

### Still TODO
- Cron Refresh: monthly Cloudflare Cron Trigger to bulk-refresh legal entities from adm.tools
  - CSV of all codes in R2; sequential fetches (~460); skip if recently synced
  - ФОП codes skip (manual only)

**Why:** Previous schema used egrpou as PK, didn't support ФОП, had no entity_type distinction.

**How to apply:** Schema migration 0005 is written but may not be applied to staging yet. Check before assuming DB is up to date.
