---
name: Project Structure
description: Key file paths, directory layout, and where to find important code
type: project
---

## Top-Level Layout
```
documents-manager/
├── .claude/memory/        # Project-level Claude memories
├── apps/web/              # Main application
├── packages/infra/        # Pulumi IaC
├── nx.json                # NX monorepo config
├── package.json           # Root workspace
└── tsconfig.base.json     # Root TS config
```

## `apps/web/` Key Paths
```
apps/web/
├── app/
│   ├── root.tsx                    # HTML root, global error boundary
│   ├── i18n.ts                     # ALL Ukrainian UI strings
│   ├── routes/
│   │   ├── home/index.tsx          # Home page (stub)
│   │   ├── library/
│   │   │   ├── index.tsx           # Library outlet
│   │   │   ├── _api/
│   │   │   │   ├── search-company.ts   # API: gov registry lookup + FOP cache check
│   │   │   │   ├── save-company.ts     # API: upsert company (legal or FOP)
│   │   │   │   ├── item-management.ts  # API: create/update item
│   │   │   │   └── enums-management.ts # API: unit/type CRUD
│   │   │   ├── companies/
│   │   │   │   ├── index.tsx           # Clients/Sources list page
│   │   │   │   └── add-company-dialog.tsx  # Two-step add dialog (legal + FOP manual)
│   │   │   ├── items/
│   │   │   │   ├── index.tsx           # Items list page
│   │   │   │   └── item-dialog.tsx     # Create/edit item form
│   │   │   └── settings/index.tsx      # Units & types CRUD
│   │   └── documents/
│   │       └── index.tsx               # Documents outlet (stub)
│   ├── components/
│   │   ├── app-sidebar/index.tsx   # Sidebar navigation
│   │   └── ui/                     # Shadcn + custom components
│   ├── database/
│   │   └── schema.ts               # Drizzle schema definitions
│   └── lib/
│       └── utils.ts                # cn() helper
├── database/
│   └── migrations/                 # Drizzle SQL migrations (0000–0005)
├── e2e/                            # Playwright E2E tests
│   ├── helpers.ts
│   ├── start-dev.sh                # Dev server startup for tests
│   ├── home-and-documents.spec.ts
│   ├── library-companies.spec.ts
│   ├── library-items.spec.ts
│   ├── library-settings.spec.ts
│   └── navigation.spec.ts
├── playwright.config.ts            # Playwright config (Chromium, port 5173, VITE_LOCAL=true)
├── wrangler.jsonc                  # Cloudflare Worker config
├── drizzle.config.ts               # DB migration config
├── vite.config.ts                  # Build config
├── react-router.config.ts          # SSR config
└── components.json                 # Shadcn config
```

## `packages/infra/` Key Paths
```
packages/infra/
├── src/
│   ├── index.ts
│   └── components/
│       └── zero-trust/             # Cloudflare Access config
```

## R2 Bucket Bindings (wrangler.jsonc)
- `staging-web` — static assets
- `staging-poa` — Power of Attorney documents
- `staging-invoice` — Invoice documents
- `staging-bill` — Bill/expense documents
- `staging-template` — Document templates

## Important Conventions
- All route files in `app/routes/` — React Router auto-discovers them
- API-only routes in `_api/` subdirectory (no default export)
- `context.db` = Drizzle DB instance (D1 binding, set up in root loader)
- `context.cloudflare.env.[BUCKET_NAME]` = R2 bucket bindings
- `context.user.email` = authenticated user email from CF Zero Trust
