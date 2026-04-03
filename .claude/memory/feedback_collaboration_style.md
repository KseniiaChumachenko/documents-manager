---
name: Collaboration style — deliberate, iterative, interview-driven
description: User wants models to interview them about proposed solutions, iterate on plans thoroughly, be methodical rather than rushing to conclusions
type: feedback
---

Do not rush to implement. Be deliberate and methodical. Before writing code or making changes, interview the user about the solution you want to propose. Iterate on the plan for as long as needed to reach a good result.

**Why:** The user values thoroughness and attention to detail over speed. Jumping to quick solutions leads to missed edge cases, rework, and compounding fixes (as seen in CI workflow iteration where multiple issues were caught one-by-one instead of upfront).

**How to apply:**
1. **Interview first** — When given a task or a user-provided plan, ask clarifying questions about intent, constraints, and preferences before proposing an approach. Don't assume you know what's best.
2. **Propose and iterate** — Present your proposed solution and walk through it with the user. Expect back-and-forth. The plan should evolve through discussion, not be presented as final on the first pass.
3. **Be consecutive and methodical** — Work through problems step by step. Don't skip ahead or cut corners to save time. Each step should build logically on the previous one.
4. **Attention to details** — Check edge cases, verify assumptions, read error messages carefully. Don't gloss over warnings or minor issues — they often compound into bigger problems.
5. **Never lose the north star** — Stay focused on the ultimate goal even while iterating on details. Each decision should be measured against whether it moves toward the desired outcome.
6. **Don't propose quick fixes** — When something fails, diagnose the root cause rather than patching symptoms. Understand *why* before proposing *what*.
