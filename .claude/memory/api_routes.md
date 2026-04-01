---
name: API Routes
description: All server-side loader/action endpoints, their paths, methods, and behavior
type: project
---

React Router loaders/actions serve as the full API layer — no separate API server.

## Endpoints

### GET `/library/search-company`

- **File**: `apps/web/app/routes/library/_api/search-company.ts`
- **Input**: `?code=<8-10 digit code>`
- **Logic**: 8-digit → calls `VITE_GOV_API`, decodes Windows-1251 XML; 10-digit → checks D1 cache for existing ФОП
- **Output**: `{ data: CompanyObject | null, error: string | null, entity_type: 'legal' | 'fop' | null }`

### GET `/library/save-company`

- **File**: `apps/web/app/routes/library/_api/save-company.ts`
- **Input**: query params: type, egrpou OR ik, name, name_short, address, phone, director, director_gen, kved, kved_number, inn, inn_date
- **Logic**: Auto-creates company_type if missing; upserts by egrpou (legal) or ik (fop)
- **Output**: `{ data: Company[], error: string | null }`
- **Note**: Uses GET (loader) for a mutation — unusual pattern

### POST `/library/item-management`

- **File**: `apps/web/app/routes/library/_api/item-management.ts`
- **Input**: FormData with: id?, name, type, unit, priceInputVATFree, priceOutputVATFree, priceRetailInclVAT
- **Logic**: If `id` present → UPDATE; otherwise → INSERT
- **Output**: `{ data: Item[], error: string | null }`

### POST/PUT/DELETE `/library/enums/:key/:id?`

- **File**: `apps/web/app/routes/library/_api/enums-management.ts`
- **Key values**: `unit` | `type`
- **POST**: Create new enum value `{ name }`
- **PUT**: Rename enum value (`:id` = old name, body has new name)
- **DELETE**: Delete enum value by name
- **Output**: `{ data: Row[], error: string | null }`

## Data Access Pattern

```typescript
// In loaders/actions:
context.db.select().from(table)...
// context.db is Drizzle instance bound to D1 in root loader
```

## Route File Conventions

- API-only routes live in `_api/` subdirectory (no default export / no React component)
- Loaders = server-side GET handlers
- Actions = server-side mutation handlers (POST/PUT/DELETE from forms/fetchers)
