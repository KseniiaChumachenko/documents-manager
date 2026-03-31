# Project Rules

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

## Dev Environment

This project uses a **devcontainer** — Node.js and Playwright browsers are only available inside it. All `npm` and test commands must run within the devcontainer.
