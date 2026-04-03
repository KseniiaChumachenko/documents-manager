---
name: Tech Stack
description: Full technology stack — frontend, backend, infra, build tools, versions
type: project
---

## Frontend

- **React 19.1.0** + **React Router 7.7.0** (SSR enabled by default)
- **Tailwind CSS v4** (via @tailwindcss/vite plugin — different config approach than v3)
- **Shadcn UI** (New York style) with **Radix UI** primitives
- **Lucide React** icons (v0.525.0)
- **TanStack React Table v8** — used for all data tables (DataTable component in `app/components/ui/data-table.tsx`)
- **Monaco Editor** (@monaco-editor/react v4.7.0) — installed but not yet used
- **clsx** + **tailwind-merge** + **class-variance-authority** for dynamic classes

## Backend / Runtime

- **Cloudflare Workers** (serverless, edge runtime)
- **Cloudflare D1** (SQLite) — relational database
- **Cloudflare R2** — object storage for documents and templates
- **Drizzle ORM v0.44.3** — type-safe SQL queries, migrations in `apps/web/database/migrations/`
- React Router loaders/actions serve as the API layer (no separate API server)

## Build & Dev

- **Vite v7.0.5** (via @cloudflare/vite-plugin for Workers compatibility)
- **TypeScript 5.8.2** strict mode
- **NX v21.2.1** monorepo orchestration with caching
- **Wrangler v4.25.0** for Cloudflare deployment
- **Playwright** — 61 E2E tests in `apps/web/e2e/`, enforced by Husky pre-push hook
- **Vitest v3.0.0** configured (workspace setup) for unit tests
- **ESLint 8** + **Prettier 3.6.2**
- **Husky** — pre-commit (lint + typecheck) and pre-push (E2E tests) hooks

## Infrastructure

- **Pulumi v3** in `packages/infra/` — manages R2 buckets, D1 databases, Zero Trust Access
- **Cloudflare Zero Trust** (Access) for authentication — OTP (one-time pin), email domain whitelist (aeroclime.com)
- **GitHub Actions** — CI/CD for staging (PR to main) and production (push to main)

## Path Aliases (tsconfig)

- `~/components` → `app/components`
- `~/database` → `app/database`
- `~/i18n` → `app/i18n.ts`
- `~/lib` → `app/lib`

## Key Config Files

- `apps/web/wrangler.jsonc` — Worker config, D1/R2 bindings, routes
- `apps/web/drizzle.config.ts` — DB migration config
- `apps/web/react-router.config.ts` — SSR config
- `apps/web/components.json` — Shadcn config
- `apps/web/vite.config.ts` — modified to add `VITE_GOV_API` env passthrough
- `apps/web/playwright.config.ts` — E2E test config
