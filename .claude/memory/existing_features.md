---
name: Existing Features
description: Detailed inventory of all implemented features and what remains as stubs
type: project
---

## IMPLEMENTED FEATURES

### Authentication

- Cloudflare Zero Trust (Access) with Google OAuth
- User email from `cf-access-authenticated-user-email` header → `context.user.email`
- Sidebar shows authenticated user email and stub sign-out button
- No RBAC yet

### Navigation / Layout

- Two-column layout: sidebar + main content
- Sidebar with navigation to: Home, Documents (with sub-items), Library (with sub-items)
- Settings gear icons in sidebar nav items for quick access
- App branding: "AeroClime" with Waves icon

### Library Module (`/library`)

#### Clients (`/library/client`) & Sources/Suppliers (`/library/source`)

- **Same component**, differentiated by route param `type`
- DataTable listing all companies of given type
- **Add company dialog**: two-step flow:
  1. User enters ЄДРПОУ (8 digits for legal entities) or ІК (10 digits for ФОП)
  2. For legal (8-digit): app calls `VITE_GOV_API` → parses Windows-1251 XML → displays preview
  3. For ФОП (10-digit): checks D1 cache first; if not cached, shows manual entry form (name, address, phone)
  4. User confirms → company saved/updated in D1
- Upsert logic: update if egrpou/ik already exists, insert otherwise
- `entity_type` inferred from code length: 8 → 'legal', 9-10 → 'fop'

#### Items (`/library/items`)

- DataTable of all inventory items with columns: name, type, unit, prices
- Add Item button → **ItemDialog** in create mode
- Row click → **ItemDialog** in edit mode
- ItemDialog: form with name, type (select), unit (select), 3 price fields (input VAT-free, output VAT-free, retail incl VAT)
- Prices stored as integers (cents)
- POST to `/library/item-management` creates or updates (based on presence of `id`)

#### Settings (`/library/settings`)

- Two sections: **Units** (одиниці виміру) and **Types** (типи товарів/послуг)
- SectionTable component: lists all enum values with inline edit/delete per row
- Add new value form at bottom of each section
- Full CRUD via inline fetchers → `/library/enums/:key/:id?`
  - key = `unit` or `type`
  - POST creates, PUT updates, DELETE deletes
- Default units seeded: штуки, метри, кілограми, години, доби, гривні

### E2E Tests (`apps/web/e2e/`)

- Playwright config at `apps/web/playwright.config.ts`
- Uses Chromium, baseURL `http://127.0.0.1:5173`, single worker, sequential
- `webServer` runs `e2e/start-dev.sh` with `VITE_LOCAL=true`
- Test files: home-and-documents, library-companies, library-items, library-settings, navigation
- Helper utilities in `e2e/helpers.ts`

### UI Components Available (in `app/components/ui/`)

- button, dialog, input, label, table, data-table, sidebar, avatar, dropdown-menu
- separator, skeleton, sheet, tooltip, select, typography

### i18n (`app/i18n.ts`)

- All UI strings in Ukrainian
- Covers: navigation, library sections, company form (incl. ФОП fields), items form, settings, document types

---

## STUB / PLACEHOLDER FEATURES (to be implemented)

### Documents Module (`/documents`)

- Routes exist: `/documents/:type`, `/documents/:type/:id`, `/documents/:type/settings`
- Currently renders `Hello, {type}!` placeholder
- Three document types defined in sidebar: POAs (Довіренності), Bills (Видаткові накладні), Invoices (Рахунки фактури)
- R2 buckets pre-created: staging-poa, staging-invoice, staging-bill, staging-template
- **Monaco Editor** installed — likely intended for template editing

### Home Page (`/`)

- Minimal, just shows a loader data message
- No dashboard content yet

---

## External Integrations

- **Ukrainian State Registry API** (`VITE_GOV_API`): `https://adm.tools/action/gov/api/`
  - Called with `egrpou` param (8-digit codes only)
  - Returns Windows-1251 encoded XML
  - Parsed with `fast-xml-parser` + `windows-1251` decoder
  - ФОП (10-digit ік codes) are NOT supported by this API — manual entry only
