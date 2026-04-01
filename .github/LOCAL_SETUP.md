# Local Development Setup

## Prerequisites

- macOS with Homebrew
- GitHub account with repository access
- Cloudflare account

## Installation

```bash
# 1. Install Node.js (if not installed)
brew install node@22

# 2. Clone repository
git clone https://github.com/KseniiaChumachenko/documents-manager.git
cd documents-manager

# 3. Install dependencies
npm install

# 4. Install Playwright browsers
cd apps/web && npx playwright install --with-deps chromium

# 5. Create environment file
cp apps/web/.env.staging apps/web/.env

# 6. Run development server
npm run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run E2E tests |
| `npm run deploy:staging` | Deploy to staging |
| `npm run deploy:production` | Deploy to production |

## Environment Files

- `apps/web/.env.staging` - Staging environment config
- `apps/web/.env.production` - Production environment config
- `apps/web/.env` - Local development (copy from .env.staging)

## GitHub Actions Secrets

Set these secrets at: https://github.com/KseniiaChumachenko/documents-manager/settings/secrets/actions

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token |

## Deployed Environments

- **Staging**: https://staging.aeroclime.com
- **Production**: https://app.aeroclime.com
