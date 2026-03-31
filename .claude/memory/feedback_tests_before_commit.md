---
name: Write tests and run before every commit
description: Always write E2E tests for new/changed features, run full test suite before committing, fix failures before retrying
type: feedback
---

Write E2E tests (Playwright) for every feature change or addition before committing.
Run the full test suite (`npm run test:e2e` in apps/web) before every commit.
If tests fail, do NOT commit — diagnose the failure, fix the implementation or the test, and retry the commit only after all tests pass.

**Why:** User explicitly requested this workflow. Tests must gate every commit to prevent regressions.

**How to apply:**
1. After implementing a feature or fix, write or update E2E tests in `apps/web/e2e/` covering the change.
2. Before running `git commit`, always run `cd apps/web && npx playwright test` first.
3. If any test fails: read the failure output, determine if the issue is in the implementation or the test, fix it, re-run tests, and only then commit.
4. Never skip tests or use `--no-verify` to bypass the pre-commit hook.
5. The Husky pre-commit hook also enforces this — it runs `npm run test:e2e --workspace=@documents-manager/web` automatically (inside devcontainer only).
