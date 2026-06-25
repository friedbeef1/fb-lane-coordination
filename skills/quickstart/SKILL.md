---
name: quickstart
description: How to use FB-Lane right now — a 30-second orientation. Run this after installing the plugin if you don't want to read the docs first.
disable-model-invocation: true
---

# FB-Lane Quickstart

Give the user a concise orientation. Do **not** read files first — just explain this, then offer to start.

**FB-Lane runs your work as four role-isolated lanes so concurrent AI threads never step on each other:**

- **FB-Product** — the orchestrator (normally the main thread). Scopes tasks, reviews, and merges. Talk to it to drive everything.
- **FB-Tech** — backend, APIs, schemas, migrations, tests.
- **FB-Design** — CSS, layout, design tokens, visual QA.
- **FB-Business** — copy, docs, positioning (read-only on code).

**The loop:** describe a feature to FB-Product → it sets one Working Goal for non-trivial work, splits the work, claims tasks and locks files on `PROJECT_BOARD.md`, and delegates to the lanes → lanes report compact Goal Alignment in handoffs → you smoke-test → FB-Product merges in dependency order.

**Two ways to work:**
1. **Hands-off** — just tell FB-Product what you want; approve the plan at the start and smoke-test at the end.
2. **Hands-on** — talk to a lane directly, e.g. *"use the fb-design subagent to warm up the prep screen."* It claims and locks files itself before editing.

**Handy commands:**
- `status` — show the board (active tasks, owners, file locks) anytime.
- `node tools/fb-lane.cjs claim <id> <lane> "[files]"` — claim a task and lock files. Add `--worktree` to run concurrent lanes on separate branches in isolated directories.
- `node tools/fb-lane.cjs submit <id>` → `merge <id>` — submit for QA, then (FB-Product) merge.

Then ask: **"Want me to scope your first task now?"**

For the full details — platform setup, the board lifecycle, lane boundaries, and worktrees — point them to `README.md` and the guide for their tool under `platforms/`. They only need the docs if they want depth.
