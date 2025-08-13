# Document Manager Infrastructure

This package contains the Infrastructure-as-Code (IaC) for the Document Manager application using Pulumi and Cloudflare.

## Components

The infrastructure includes the following components:

- **R2 Buckets**: Storage for web assets and documents
- **KV Namespaces**: Key-value storage for application data
- **Cloudflare Zero Trust**: Authentication and access control for the application

## Setup

1. **Make sure your CI pipeline runs**
   `pulumi login --local`
   (if you use the local backend).
2. **Set config values using the Pulumi CLI:**

```bash
pulumi config set myKey myValue --stack dev
pulumi config set apiToken $API_TOKEN --stack dev --secret
```

- Use the `--secret` flag for sensitive values (like keys or passwords).
- The flag targets the correct environment/stack. `--stack`
- Substitute `$API_TOKEN` for your CI secrets mechanism.

### Cloudflare Zero Trust Configuration

To set up Cloudflare Zero Trust for the application, you need to configure:

```bash
# Optional: URL to a logo image for the login page
pulumi config set logoUrl https://example.com/logo.png --stack dev

# Required: List of email addresses that are allowed to access the application
pulumi config set --path allowedEmails '[
  "user1@example.com",
  "user2@example.com"
]' --stack dev

# Required for Google SSO: Google OAuth Client ID
pulumi config set googleClientId YOUR_GOOGLE_CLIENT_ID --stack dev --secret

# Required for Google SSO: Google OAuth Client Secret
pulumi config set googleClientSecret YOUR_GOOGLE_CLIENT_SECRET --stack dev --secret
```

The implementation includes Google SSO as a login option, allowing users to authenticate with their Google accounts. This provides a more user-friendly login experience and leverages Google's security features.

See the [Zero Trust README](./src/components/zero-trust/README.md) for more details on setting up Google OAuth credentials.

## **Example: Typical CI Script**

Supposing you’re doing this in a shell-based CI step:

```bash
# Ensure you're in the right directory!
cd packages/infra

# Log in to local backend (if not already done)
pulumi login --local

# Select the correct stack (if not creating anew)
pulumi stack select dev

# Set configuration values (read from environment variables or secrets in your CI)
pulumi config set apiToken "${PULUMI_API_TOKEN}" --stack dev --secret
pulumi config set bucketName "dev-bucket" --stack dev
pulumi config set --path allowedEmails "${ALLOWED_EMAILS}" --stack dev
...etc

# Deploy!
pulumi up --stack dev --yes
```
