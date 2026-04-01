---
name: Infrastructure & Deployment
description: Cloudflare setup, deployment commands, environment variables, and staging/production configuration
type: project
---

## Environments

| Environment    | Domain                  | D1 Database                            | R2 Buckets Prefix |
| -------------- | ----------------------- | -------------------------------------- | ----------------- |
| **Staging**    | `staging.aeroclime.com` | `d63c46d8-807f-4ae2-a668-045b7e4e7d79` | `staging-*`       |
| **Production** | `app.aeroclime.com`     | `934e95cf-1a96-4be5-8def-007c95935922` | `production-*`    |

## Cloudflare Resources

- **Workers**: SSR React Router app runs as Cloudflare Worker
- **D1**: SQLite database (binding name `DB`)
- **R2 Buckets**: {env}-web, {env}-poa, {env}-invoice, {env}-bill, {env}-template
- **Zero Trust / Access**: Authentication gateway — Google OAuth + email whitelist
- **Custom Domains**: staging.aeroclime.com, app.aeroclime.com

## Pulumi Infrastructure

- **Stacks**: `staging`, `production` (local backend)
- **Resources per stack**: 7 (D1, 5 R2 buckets, provider)
- **State**: Stored locally in `~/.pulumi/stacks/DocumentManager/`

## Environment Variables

### Required in `.env.{env}` files

| Variable                | Purpose                    |
| ----------------------- | -------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token       |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID      |
| `DATABASE_ID`           | D1 database ID             |
| `VITE_GOV_API`          | Ukrainian gov registry API |

### Environment Files

- `apps/web/.env.staging` — staging environment config
- `apps/web/.env.production` — production environment config

## Deployment Commands

```bash
# Development
npm run dev                    # Vite dev server

# Build
npm run build:staging          # Staging build
npm run build:production       # Production build

# Deploy (from apps/web)
npm run deploy:staging         # Deploy to staging
npm run deploy:production      # Deploy to production

# Database
npm run db:migrate:stg         # Apply migrations to staging D1
npm run db:migrate:prod        # Apply migrations to production D1

# Pulumi (from packages/infra)
npm run deploy:staging         # Deploy staging infrastructure
npm run deploy:production      # Deploy production infrastructure
```

## Deployment Workflow

| Step           | Tool           | Notes                             |
| -------------- | -------------- | --------------------------------- |
| Infrastructure | Pulumi CLI     | Manual — local backend, not in CI |
| Worker code    | GitHub Actions | Automated on push to main/staging |
| Migrations     | GitHub Actions | Automated with worker deploy      |

## wrangler.jsonc Key Config

- Worker name: react-router-app
- Compatibility date: 2025-04-04
- D1 binding: `DB` → {env}-db
- R2 bindings: {env}-web, {env}-poa, {env}-invoice, {env}-bill, {env}-template
- Routes: staging.aeroclime.com, app.aeroclime.com
- Observability: enabled

## Auth Flow

1. Request hits Cloudflare Zero Trust → Google OAuth login
2. On success: CF adds `cf-access-authenticated-user-email` header
3. React Router server reads header → `context.user.email`
4. Email whitelist enforced at CF level (no code change needed to add/remove users)

## GitHub Actions

| Workflow                | Trigger           | Steps                        |
| ----------------------- | ----------------- | ---------------------------- |
| `ci.yml`                | PRs               | lint → typecheck → E2E tests |
| `deploy-staging.yml`    | Push to `staging` | build → deploy → migrate     |
| `deploy-production.yml` | Push to `main`    | build → deploy → migrate     |

### Required GitHub Secrets

| Secret                 | Description                          |
| ---------------------- | ------------------------------------ |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for deployments |

## Local Development

```bash
brew install node@22
npm install
cp apps/web/.env.staging apps/web/.env
npm run dev
```
