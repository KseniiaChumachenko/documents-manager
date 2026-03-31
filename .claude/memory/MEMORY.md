# Memory Index

- [Project Overview](project_overview.md) — Monorepo: React Router 7 SSR + Cloudflare Workers/D1/R2, Ukrainian business document manager
- [Tech Stack](tech_stack.md) — React 19, React Router 7, Tailwind v4, Drizzle ORM, Shadcn UI, NX, Vitest, Pulumi
- [Existing Features](existing_features.md) — Library (clients/sources w/ FOP support, items, settings), E2E tests, Documents stub
- [Database Schema](database_schema.md) — Tables: unit, item_type, item, company_type, company; 6 migrations (0000–0005)
- [API Routes](api_routes.md) — search-company, save-company, item-management, enums CRUD endpoints
- [Project Structure](project_structure.md) — apps/web (React Router app), packages/infra (Pulumi IaC), e2e/, key file paths
- [Infrastructure & Deployment](infra_deployment.md) — Cloudflare Workers, D1, R2 buckets, wrangler, staging environment, Zero Trust SSO
- [Tests Before Commit](feedback_tests_before_commit.md) — Always write E2E tests + run full suite before committing; fix failures first
- [Company Data Redesign](project_company_data_redesign.md) — Split identifiers (egrpou/ik), FOP manual entry, migration 0005 implemented; cron refresh still TODO
