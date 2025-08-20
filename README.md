# DocumentsManager

A full-stack application for managing document generation, email sending, and data management.

## Overview

DocumentsManager is a comprehensive solution that allows you to:

- Generate PDF documents using HTML templates populated with data
- Send emails with optional document attachments
- Manage multiple datasets that serve as variables for documents and emails

## Features

- **Document Generation**: Create PDF documents from HTML templates
- **Email Management**: Compose and send emails with attachments
- **Data Management**: Organize and maintain datasets for use in documents and emails
- **Cloud Infrastructure**: Serverless architecture for scalability and reliability

## Tech Stack

### Frontend

- **React**: Modern UI library for building the web application
- **React Router**: Client-side routing for single-page application
- **Shadcn UI**: Component library for consistent and attractive UI

### Backend & Infrastructure

- **NX Monorepo**: Workspace management for multiple applications and packages
- **Pulumi**: Infrastructure as Code (IaC) for cloud resource management
- **Cloudflare Services**:
  - **D1**: Serverless relational database for data storage
  - **R2**: Object storage for generated documents (S3-compatible)

### CI/CD

- **GitHub Actions**: Automated testing, building, and deployment

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Cloudflare account with API token

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/documents-manager.git
   cd documents-manager
   ```
2. Give permissions to post-create script:
    ```bash
      chmod +x .devcontainer/post-create.sh
    
    ```
3. Create `.devcontainer/.env`
    ```bash
    CLOUDFLARE_TOKEN=
    CLOUDFLARE_ACCOUNT_ID=
    GIT_AUTHOR_NAME=
    GIT_AUTHOR_EMAIL= 
    ```
4. Create `apps/web/.env`
    ```bash
    NODE_ENV=
    CLOUDFLARE_ENV=
    CLOUDFLARE_TOKEN=
    CLOUDFLARE_ACCOUNT_ID=
    DATABASE_ID=
    VITE_GOV_API=
    ```
5. Create `apps/web/.dev.vars`
```bash
WRANGLER_DATABASE_ID=
WRANGLER_ROUTES_PATTERN=
```

6. Build the Dev Container. See VSCode/WebStorm/etc. guides for particular details.
7. TODO (needs update) Configure Cloudflare credentials:
   Create a `Pulumi.dev.yaml` file in the `packages/infra` directory with your Cloudflare API token:
   ```yaml
   config:
     cloudflare:apiToken: your-api-token-here
   ```

### Development

Run the web application locally:

```bash
nx serve web
```

Run linting across all projects:

```bash
npm run lint
```

### ESLint Configuration

The project uses ESLint for code quality and consistency. The root `.eslintrc.json` provides base configuration for all subprojects.

#### Subproject-specific ESLint Configuration

Subprojects can extend or override the root configuration by creating their own `.eslintrc.json` file. Example:

```json
{
  "extends": ["../../.eslintrc.json"],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        // Add or override rules specific to this subproject
        "no-console": "off"
      }
    }
  ]
}
```

#### Managing ESLint Dependencies

Each subproject should manage its own ESLint plugin dependencies in its `package.json` if it requires specific plugins not included in the root configuration.

### Prettier Configuration

The project uses Prettier for code formatting. The root `.prettierrc.json` provides base configuration for all files.

Run formatting across all projects:

```bash
npm run format
```

Check if files are formatted correctly:

```bash
npm run format:check
```

### Pre-commit Hooks

The project uses Husky and lint-staged to run linting and formatting on pre-commit. This ensures that all committed code meets the project's quality standards.

When you commit changes, the pre-commit hook will:

1. Run ESLint with auto-fix on affected files
2. Format uncommitted files using Prettier

This setup helps maintain code quality and consistency across the project.

### Deployment

Deploy the infrastructure and web application:

```bash
cd packages/infra
npm run deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
