---
name: Never expose secrets
description: Strict rules for handling API tokens, passwords, and other sensitive values
type: feedback
---

NEVER commit, display, or write secrets to any file that may be tracked in git.

**What counts as a secret:**

- API tokens (Cloudflare, GitHub, etc.)
- Passwords
- Private keys
- OAuth client secrets
- Database credentials

**What to do instead:**

- Use environment variables
- Reference secrets by name, not value
- Use `<REDACTED>` or `<TOKEN>` as placeholders in docs

**If you see a secret in a file:**

- Alert the user immediately
- Do not include it in any output
- Help the user rotate it if already committed

**Why:** Exposed secrets were found in `.github/secrets.md` — this must never happen again.
