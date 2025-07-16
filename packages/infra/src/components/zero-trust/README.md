# Cloudflare Zero Trust Components

This directory contains Pulumi components for setting up Cloudflare Zero Trust for the Document Manager application.

## Components

### Access Application

The `access-application.ts` file defines a Cloudflare Zero Trust Access Application that protects the self-hosted Document Manager application. It includes:

- A login page with custom branding
- Authentication settings with Google SSO integration
- CORS configuration for the application
- An Access Policy that controls who can access the application based on email addresses

### Google SSO Identity Provider

The implementation includes a Google SSO identity provider that allows users to log in using their Google accounts. This provides a more user-friendly authentication experience and leverages Google's security features.

## Configuration

To use these components, you need to add the following configuration values to your Pulumi configuration:

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

You can add these configurations to your environment-specific Pulumi YAML files (e.g., `Pulumi.staging.yaml`, `Pulumi.production.yaml`).

### Setting up Google OAuth Credentials

To obtain the Google OAuth credentials needed for SSO:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Set the application type to "Web application"
6. Add authorized redirect URIs for your Cloudflare Access domains (typically `https://your-team-name.cloudflareaccess.com/cdn-cgi/access/callback`)
7. Copy the generated Client ID and Client Secret to use in your Pulumi configuration

## Usage

The Access Application, Access Policy, and Google Identity Provider are automatically created and exported from the main `index.ts` file. No additional steps are required to use them.

## Customization

You can customize the Access Application by modifying the `access-application.ts` file. For example, you can:

- Change the session duration
- Add more authentication providers (e.g., GitHub, Okta)
- Customize the login page further
- Modify the Access Policy to use different authentication methods or rules
