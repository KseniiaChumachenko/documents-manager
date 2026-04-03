# Project Rules

## Git Workflow

- **Create feature branch at start of session** — Use prefixes: `feat/`, `fix/`, `chore/`, `docs/`
- **Never push to main directly** — Always use Pull Requests
- **Always ask before pushing** — Require explicit user confirmation before any `git push`
- **Commit in sensible chunks** — Group related changes with descriptive messages

## Testing Policy

- **Write E2E tests for every change.** Before committing any feature, bug fix, or refactor, create or update Playwright E2E tests in `apps/web/e2e/` that cover the changed behavior.
- **Run all tests before committing.** Execute `npm run test:e2e --workspace=@documents-manager/web` before every `git commit`. The Husky pre-commit hook enforces this automatically.
- **If tests fail, fix before committing.** Never bypass failing tests. Diagnose the failure, fix the implementation or the test, re-run, and only commit when green.
- **Never use `--no-verify`.** The pre-commit hook exists for a reason.

## Running Tests

```bash
cd apps/web
npm run test:e2e           # headless (CI-friendly)
npm run test:e2e:headed    # with browser visible
npm run test:e2e:ui        # Playwright interactive UI
```

## Secrets Management

- **NEVER commit secrets to git** — This includes API tokens, passwords, private keys
- **NEVER display secret values in output** — Show placeholder like `<REDACTED>` or `<TOKEN>`
- **NEVER write secrets to documentation files** — Use descriptions instead of actual values
- **Secret files are gitignored** — `**/.env`, `**/.env.*`, `**/.dev.vars`
- **If a secret is exposed** — Alert user immediately and help rotate it

## Dev Environment

This project uses a **devcontainer** — Node.js and Playwright browsers are only available inside it. All `npm` and test commands must run within the devcontainer.
