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

- **Stacks**: `staging`, `production`
- **Backend**: Git-based state storage (`packages/infra/state/`)
- **Resources per stack**: 7 (D1, 5 R2 buckets, provider)
- **Secrets**: Encrypted in `Pulumi.{stack}.yaml` with passphrase

### Pulumi Setup

```bash
cd packages/infra
pulumi login file://./state
pulumi stack select staging
pulumi config set --secret cloudflare:apiToken YOUR_TOKEN --stack staging
```

### Passphrase

Set `PULUMI_CONFIG_PASSPHRASE` environment variable (required for decryption).

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
- `.devcontainer/.env` — devcontainer environment (for container setup)

## Deployment Commands

```bash
# Development
npm run dev                    # Vite dev server

# Build
npm run build:staging          # Staging build
npm run build:production       # Production build

# Deploy Worker (from apps/web)
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

| Step           | Tool           | Notes                                      |
| -------------- | -------------- | ------------------------------------------ |
| Infrastructure | Pulumi CLI     | Git-based state, runs in CI (preview only) |
| Worker code    | GitHub Actions | Automated on push to main/staging          |
| Migrations     | GitHub Actions | Automated with worker deploy               |

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

| Workflow                | Trigger           | Steps                                     |
| ----------------------- | ----------------- | ----------------------------------------- |
| `ci.yml`                | PRs               | lint → typecheck → E2E tests              |
| `deploy-staging.yml`    | Push to `staging` | pulumi preview → build → deploy → migrate |
| `deploy-production.yml` | Push to `main`    | pulumi preview → build → deploy → migrate |

### Required GitHub Secrets

| Secret                     | Description                          |
| -------------------------- | ------------------------------------ |
| `CLOUDFLARE_API_TOKEN`     | Cloudflare API token for deployments |
| `PULUMI_CONFIG_PASSPHRASE` | Passphrase to decrypt Pulumi secrets |

## Local Development

### Recommended: Dev Container

All tooling pre-installed (Node.js, Playwright, Pulumi, Wrangler).

```bash
# Create .devcontainer/.env with credentials
# Build devcontainer in VSCode/WebStorm
cp apps/web/.env.staging apps/web/.env
npm run dev
```

### Alternative: Local Setup

```bash
brew install node@22
npm install
npx playwright install --with-deps chromium
npx husky
cp apps/web/.env.staging apps/web/.env
npm run dev
```

See `.github/LOCAL_SETUP.md` for detailed instructions.
