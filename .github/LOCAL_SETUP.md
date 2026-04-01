# Local Development Setup

## Prerequisites

- macOS with Homebrew (for local setup) OR Dev Container support (recommended)
- GitHub account with repository access
- Cloudflare account

## Recommended: Dev Container Setup

All development tooling (Node.js, Playwright, Pulumi, Wrangler) is pre-installed in the devcontainer.

### 1. Create environment file

Create `.devcontainer/.env`:

```bash
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
GIT_AUTHOR_NAME=Your Name
GIT_AUTHOR_EMAIL=your@email.com
```

### 2. Build the Dev Container

Open the project in VSCode or WebStorm and build the devcontainer. This will:

- Install Node.js 22
- Install Playwright with Chromium browser
- Install Pulumi CLI
- Install Wrangler CLI
- Run `npm install` and `npx husky` (installs pre-commit hooks)

### 3. Create app environment file

```bash
cp apps/web/.env.staging apps/web/.env
```

### 4. Run development server

```bash
npm run dev
```

### 5. Run E2E tests

```bash
cd apps/web
npm run test:e2e           # headless (CI-friendly)
npm run test:e2e:headed    # with browser visible
npm run test:e2e:ui        # Playwright interactive UI
```

**Note:** E2E tests must run inside the devcontainer. Playwright browsers are pre-installed.

## Alternative: Local Setup (without Dev Container)

### 1. Install Node.js

```bash
brew install node@22
```

### 2. Clone and install dependencies

```bash
git clone https://github.com/KseniiaChumachenko/documents-manager.git
cd documents-manager
npm install
```

### 3. Install Playwright browsers

```bash
cd apps/web
npx playwright install --with-deps chromium
```

### 4. Install Husky (for pre-commit hooks)

```bash
npx husky
```

### 5. Create environment files

```bash
cp apps/web/.env.staging apps/web/.env
```

### 6. Run development server

```bash
npm run dev
```

**Note:** Without devcontainer, you'll need to install Pulumi CLI separately for infrastructure management.

## Pulumi Infrastructure

Pulumi uses git-based state storage. State files are committed to `packages/infra/state/`.

### Setup Pulumi (first time)

```bash
cd packages/infra

# Login to local file backend (stores in ./state/)
pulumi login file://./state

# Select stack
pulumi stack select staging

# Set secrets (encrypted with passphrase)
pulumi config set --secret cloudflare:apiToken YOUR_TOKEN
pulumi config set --secret cloudflare:apiKey YOUR_KEY
pulumi config set --secret cloudflare:email YOUR_EMAIL

# Deploy
npm run deploy:staging
```

### Passphrase for CI

Set `PULUMI_CONFIG_PASSPHRASE` in GitHub Actions secrets. This decrypts secrets in stack config files.

## Available Commands

| Command                                       | Description                   |
| --------------------------------------------- | ----------------------------- |
| `npm run dev`                                 | Start development server      |
| `npm run lint`                                | Run ESLint                    |
| `npm run test:e2e`                            | Run E2E tests (from apps/web) |
| `npm run deploy:staging`                      | Deploy Worker to staging      |
| `npm run deploy:production`                   | Deploy Worker to production   |
| `cd packages/infra && npm run deploy:staging` | Deploy Pulumi infrastructure  |

## Environment Files

- `apps/web/.env.staging` - Staging environment config
- `apps/web/.env.production` - Production environment config
- `apps/web/.env` - Local development (copy from .env.staging)
- `.devcontainer/.env` - Devcontainer environment (for container setup)

## GitHub Actions Secrets

Set these secrets at: `https://github.com/KseniiaChumachenko/documents-manager/settings/secrets/actions`

| Secret                     | Description                                 |
| -------------------------- | ------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`     | Cloudflare API token for Worker deployments |
| `PULUMI_CONFIG_PASSPHRASE` | Passphrase to decrypt Pulumi stack secrets  |

## Deployed Environments

- **Staging**: https://staging.aeroclime.com
- **Production**: https://app.aeroclime.com
