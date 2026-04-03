---
name: Infrastructure & Deployment
description: Pulumi IaC, CI/CD workflows, Cloudflare resources, staging + production environments
type: project
---

## Environments

| Environment    | Domain                  | D1 Database ID                         | R2 Buckets Prefix |
| -------------- | ----------------------- | -------------------------------------- | ----------------- |
| **Staging**    | `staging.aeroclime.com` | `d63c46d8-807f-4ae2-a668-045b7e4e7d79` | `staging-*`       |
| **Production** | `app.aeroclime.com`     | `934e95cf-1a96-4be5-8def-007c95935922` | `production-*`    |

## Cloudflare Resources

- **Workers**: SSR React Router app (deployed via wrangler, environment baked into build via `--mode`)
- **D1**: SQLite database (binding name `DB`)
- **R2 Buckets**: {env}-web, {env}-poa, {env}-invoice, {env}-bill, {env}-template
- **Zero Trust / Access**: OTP authentication, email domain whitelist (aeroclime.com)
- **Custom Domains**: managed by wrangler via `routes` config (NOT Pulumi)

## Pulumi Infrastructure (packages/infra/)

- **Stacks**: `staging`, `production`
- **Backend**: File-based state in `packages/infra/state/.pulumi/`
- **Secrets**: Encrypted in `Pulumi.{stack}.yaml`, decrypted via `PULUMI_CONFIG_PASSPHRASE`
- **Resources per stack**: D1 database, 5 R2 buckets, Zero Trust Access Application, provider
- **What Pulumi does NOT manage**: Worker deployment, custom domains, DNS — wrangler handles these

### Pulumi Local Commands

```bash
cd packages/infra
export PULUMI_BACKEND_URL=file://./state
export PULUMI_CONFIG_PASSPHRASE="<passphrase>"
pulumi stack select staging
pulumi preview --stack staging
pulumi up --stack staging --yes
```

## CI/CD (GitHub Actions)

| Workflow                | Trigger        | Steps                                                       |
| ----------------------- | -------------- | ----------------------------------------------------------- |
| `ci.yml`                | PRs            | lint → typecheck → E2E tests                                |
| `deploy-staging.yml`    | PR to main     | pulumi up → typegen → build → wrangler deploy → migrations → commit state |
| `deploy-production.yml` | push to main   | pulumi up → typegen → build → wrangler deploy → migrations → commit state |

### Required GitHub Secrets

| Secret                     | Description                          |
| -------------------------- | ------------------------------------ |
| `CLOUDFLARE_API_TOKEN`     | Cloudflare API token for deployments |
| `PULUMI_CONFIG_PASSPHRASE` | Passphrase to decrypt Pulumi secrets |

### CI Notes

- `react-router build --mode staging` bakes environment into build output — `wrangler deploy` needs NO `--env` flag
- `react-router typegen` must run before build (generates `.react-router/types/` which is gitignored)
- Pulumi state changes are committed back to the branch after each deploy

## Auth Flow

1. Request hits Cloudflare Zero Trust → OTP email login (aeroclime.com domain)
2. On success: CF adds `cf-access-authenticated-user-email` header
3. React Router server reads header → `context.user.email`

## Deployment Commands

```bash
# Development
npm run dev                    # Vite dev server

# Build
npm run build:staging          # Staging build
npm run build:production       # Production build

# Database
npm run db:migrate:stg         # Apply migrations to staging D1
npm run db:migrate:prod        # Apply migrations to production D1
```

## Local Development

```bash
npm install
npx playwright install --with-deps chromium
cp apps/web/.env.staging apps/web/.env
npm run dev
```

See `.github/LOCAL_SETUP.md` for detailed instructions.
