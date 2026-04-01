---
name: Infrastructure & Deployment
description: Cloudflare setup, deployment commands, environment variables, and staging configuration
type: project
---

## Cloudflare Resources

- **Workers**: SSR React Router app runs as Cloudflare Worker
- **D1**: SQLite database (binding name `DB`)
- **R2 Buckets**: staging-web, staging-poa, staging-invoice, staging-bill, staging-template
- **Zero Trust / Access**: Authentication gateway — Google OAuth + email whitelist
- **Custom Domain**: staging.aeroclime.com

## Environment Variables

### Required in `.env` / Cloudflare dashboard

| Variable                | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `CLOUDFLARE_TOKEN`      | Cloudflare API token                                            |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                                           |
| `CLOUDFLARE_ENV`        | Environment name (staging/production)                           |
| `WRANGLER_ENV`          | Wrangler environment                                            |
| `DATABASE_ID`           | D1 database ID                                                  |
| `VITE_GOV_API`          | Ukrainian gov registry API: `https://adm.tools/action/gov/api/` |

### Dev Variables (`.dev.vars` for wrangler local)

Same as above but for local development.

## Deployment Commands

```bash
# Development
npm run dev                    # Vite dev server

# Build
npm run build                  # Production build
npm run build:staging          # Staging build

# Deploy
npm run deploy                 # Deploy to Cloudflare
npm run deploy:staging         # Deploy to staging env

# Database
npm run db:generate            # Generate new migration from schema changes
npm run db:migrate:stg         # Apply migrations to staging D1
# Manual: npx wrangler d1 migrations apply DB --remote --env staging

# Infrastructure
cd packages/infra && npm run deploy  # Deploy Pulumi infrastructure
```

## wrangler.jsonc Key Config

- Worker name: documents-manager (staging)
- Compatibility date: recent (CF Workers)
- D1 binding: `DB` → staging-db
- R2 bindings: staging-web, staging-poa, staging-invoice, staging-bill, staging-template
- Routes: staging.aeroclime.com/\*
- Observability: enabled

## Auth Flow

1. Request hits Cloudflare Zero Trust → Google OAuth login
2. On success: CF adds `cf-access-authenticated-user-email` header
3. React Router server reads header → `context.user.email`
4. Email whitelist enforced at CF level (no code change needed to add/remove users)

## NX Build Targets (apps/web)

- `serve`: dev server
- `build`: production build
- `lint`: ESLint
- `test`: Vitest (passWithNoTests: true)
