---
name: quickstart
description: How to use FB right now — a 30-second orientation. Run this after installing the plugin if you don't want to read the docs first.
disable-model-invocation: true
---

# FB Quickstart

Give the user a concise orientation. Do **not** read files first — just explain this, then offer to start.

**FB organizes work as four role-isolated planning lanes plus a Product-launched BFM execution gate, so concurrent AI threads do not step on each other:**

- **FB Product** — the orchestrator (normally the main thread). Scopes tasks, reviews, and merges. Talk to it to drive everything.
- **FB Tech** — backend, APIs, schemas, migrations, tests.
- **FB Design** — CSS, layout, design tokens, visual QA.
- **FB Business** — copy, docs, positioning (read-only on code).

**The loop:** describe a feature to FB Product → it runs a Goal Alignment Session for non-trivial work, records approved Product/workstream OKRs and relevant stable lane OKRs on `PROJECT_BOARD.md`, or uses `/goal` as a shortcut into that same session → workstreams write markdown plans/handoffs with proposed `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` → Product/BFM launches execution when approved → BFM claims tasks and locks files, dispatches implementation workers, and verifies evidence → FB Product marks each handoff `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred` → you smoke-test → FB Product merges in dependency order.

**Two ways to work:**
1. **Hands-off** — just tell FB Product what you want; approve the plan at the start and smoke-test at the end.
2. **Hands-on planning** — talk to a lane directly, e.g. *"use the fb-design subagent to plan how to warm up the prep screen."* It answers questions and writes markdown plans; source edits wait for Product-launched BFM execution.


**Sidechat handoff:** sidechats are for questions, options, tradeoffs, recommendations, and a paste-ready handoff for their originating parent main thread only. Read `docs/sidechat-parent-thread-routing.md`; never infer another destination from role, project, name, recency, or Product/BFM status. If the parent is unavailable, return the handoff to the user; a non-parent main treats it as ordinary user-provided context. The prompt is not source of truth until Product/BFM records it in `PROJECT_BOARD.md`, a handoff, or durable docs. Use: Decision summary, Scope, Out of scope, Recommended owner/lane, Files/docs likely affected, Acceptance criteria, Gates/risks, Exact instruction for Product/BFM.

**Handy commands:**
- `status` — show the board (active tasks, owners, file locks) anytime.
- `node tools/fb-lane.cjs claim <id> <lane> "[files]"` — BFM execution worker claims a task and locks files. Add `--worktree` to run concurrent execution workers on separate branches in isolated directories.
- `node tools/fb-lane.cjs submit <id>` → `merge <id>` — submit for QA, then (FB Product) merge.

Then ask: **"Want me to scope your first task now?"**

For the full details — platform setup, the board lifecycle, lane boundaries, and worktrees — point them to `README.md` and the guide for their tool under `platforms/`. They only need the docs if they want depth.
