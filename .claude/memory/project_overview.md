---
name: Project Overview
description: High-level description of documents-manager — what it is, domain, status, and primary goals
type: project
---

A Ukrainian business document management system (SaaS/internal tool). Manages clients, suppliers, inventory items, and business documents (Power of Attorney, Expense Invoices, Invoices). UI and all text are in Ukrainian. Domain is Ukrainian accounting/procurement workflow.

**Why:** Automates creation and management of Ukrainian business documents (довіренності, видаткові накладні, рахунки-фактури) and maintains a library of clients, suppliers, and goods/services.

**How to apply:** When planning features, think in terms of Ukrainian business process flows. Document types map to real Ukrainian legal/accounting documents.

## Current Status (as of 2026-03-31)

- Library module fully functional: clients, sources (suppliers), items, settings (enum management), FOP manual entry
- Documents module: routing structure exists, content is all placeholders — main area of future development
- Auth: Cloudflare Zero Trust with Google OAuth, email whitelist
- E2E tests: Playwright suite in `apps/web/e2e/`, enforced via Husky pre-commit hook

## Monorepo Structure

- `apps/web/` — Main application (React Router 7 SSR on Cloudflare Workers)
- `packages/infra/` — Pulumi IaC for Cloudflare infrastructure
- NX v21 manages the monorepo

## Staging URL

`staging.aeroclime.com`
