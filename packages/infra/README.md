# Document Manager Infrastructure

This package contains the Infrastructure-as-Code (IaC) for the Document Manager application using Pulumi and Cloudflare.

## Components

The infrastructure includes the following components:

- **R2 Buckets**: Storage for web assets and documents
- **KV Namespaces**: Key-value storage for application data
- **Cloudflare Zero Trust**: Authentication and access control for the application

## State Management

This project uses **git-based state storage** for Pulumi. State files are stored in `./state/` and committed to the repository.

### Why git-based state?

- Simple setup for small teams
- No external service dependency
- State is versioned alongside code
- Secrets are encrypted with passphrase

### Setup (First Time)

```bash
cd packages/infra

# Login to local file backend (stores state in ./state/)
pulumi login file://./state

# Select or create stack
pulumi stack select staging  # or: pulumi stack init staging
```

### Set Secrets

Secrets are encrypted in `Pulumi.staging.yaml` and `Pulumi.production.yaml`. Set them with:

```bash
pulumi config set --secret cloudflare:apiToken YOUR_TOKEN --stack staging
pulumi config set --secret cloudflare:apiKey YOUR_KEY --stack staging
pulumi config set --secret cloudflare:email YOUR_EMAIL --stack staging
pulumi config set --secret DocumentManager:accountId YOUR_ACCOUNT_ID --stack staging
pulumi config set --secret DocumentManager:domainZoneId YOUR_ZONE_ID --stack staging
```

### Passphrase

The passphrase is required to decrypt secrets. Set it via environment variable:

```bash
export PULUMI_CONFIG_PASSPHRASE="your-passphrase"
```

For CI, set `PULUMI_CONFIG_PASSPHRASE` as a GitHub Actions secret.

### Deploy

```bash
npm run deploy:staging    # or: pulumi up --stack staging
npm run deploy:production # or: pulumi up --stack production
```

### Commit State Changes

After deploying, commit the updated state:

```bash
git add state/ Pulumi.*.yaml
git commit -m "chore: update Pulumi state"
git push
```

CI automatically commits state changes after deployments.

### Cloudflare Zero Trust Configuration

To set up Cloudflare Zero Trust for the application, you need to configure:

```bash
# Optional: URL to a logo image for the login page
pulumi config set logoUrl https://example.com/logo.png --stack staging

# Required: List of email addresses that are allowed to access the application
pulumi config set --path allowedEmails '[
  "user1@example.com",
  "user2@example.com"
]' --stack staging

# Required for Google SSO: Google OAuth Client ID
pulumi config set googleClientId YOUR_GOOGLE_CLIENT_ID --stack staging --secret

# Required for Google SSO: Google OAuth Client Secret
pulumi config set googleClientSecret YOUR_GOOGLE_CLIENT_SECRET --stack staging --secret
```

See the [Zero Trust README](./src/components/zero-trust/README.md) for more details on setting up Google OAuth credentials.

## CI Integration

GitHub Actions workflows automatically:

1. Run `pulumi preview` before deployment
2. Commit state changes after deployment (with `[skip ci]` to avoid loops)
3. Use `PULUMI_CONFIG_PASSPHRASE` secret to decrypt stack configs

## Scripts

| Script                      | Description                      |
| --------------------------- | -------------------------------- |
| `npm run deploy:staging`    | Deploy staging stack             |
| `npm run deploy:production` | Deploy production stack          |
| `npm run destroy:staging`   | Destroy staging stack            |
| `npm run refresh:staging`   | Refresh staging state from cloud |
| `npm run output:staging`    | Show stack outputs               |
