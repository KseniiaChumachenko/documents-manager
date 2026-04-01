# GitHub Actions Secrets

This file documents the required GitHub secrets

| Secret Name                | Description                                         | How to Set                                                                                 |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`     | Cloudflare API token with D1/R2/Workers permissions | Go to Cloudflare dashboard → Create token → https://dash.cloudflare.com/profile/api-tokens |
| `PULUMI_CONFIG_PASSPHRASE` | Passphrase for Pulumi state encryption              | Use a strong passphrase (recommended)                                                      |
| `CLOUDFLARE_ACCOUNT_ID`    | Cloudflare account ID (optional, for CI)            | Find in Cloudflare dashboard → https://dash.cloudflare.com → Copy Account ID               |

## How to Set Secrets

### Option 1: Using GitHub CLI (requires `gh` auth)

```bash
gh auth login
```

### Option 2: Manually via GitHub web interface

1. Go to repo Settings → Secrets and variables → Actions
2. Add `CLOUDFLARE_API_TOKEN`
3. Add `PULUMI_CONFIG_PASSPHRASE`
