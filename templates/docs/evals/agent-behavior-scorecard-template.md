# FB-Lane Agent Behavior Scorecard

Use this only when `Loop Learning` shows a repeated agent-behavior failure or Product/BFM wants a non-quick closeout check. Do not use it for routine quick tasks.

Do not add an eval runner, dashboard, numeric score, CI eval job, larger `doctor`, or per-task OKRs from this scorecard. If the same failure repeats after the scorecard, Product/BFM proposes one heavier guardrail with pros, cons, affected files/rules, and explicit approval needed.

Result: `healthy` | `watch` | `needs Product review` | `blocked`

Task / run:
Observed repeated pattern:
Product approval for heavier tooling: `not requested` | `pending` | `approved`

## Non-Product Execution Gate

- [ ] Source/runtime files stayed untouched unless Product/BFM explicitly approved a one-off exception.
- [ ] The lane created or updated a Product/BFM handoff MD instead.
- [ ] `PROJECT_BOARD.md` points to the handoff with the next owner/gate.
- [ ] Any exception is named plainly with the approving Product decision.

## BFM Closeout Accounting

- [ ] Every handoff is marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
- [ ] `PROJECT_BOARD.md`, `docs/handoffs/index.md`, workstream cards, and repo state agree.
- [ ] Staging/live status is explicit.
- [ ] Remaining gates are named instead of hidden.

## Evidence Honesty

- [ ] Checks run are named with current results, or the missing check is recorded as a gate.
- [ ] Visual changes have screenshot/viewport evidence, or visual QA is explicitly pending.
- [ ] Repo state is classified as `clean`, `intentionally dirty`, or `blocked`.
- [ ] Dirty state names files, owner, reason, next gate, and session-boundary action.

## Goal And Scope Fit

- [ ] Work maps to the approved goal or a plain-language Product decision.
- [ ] Scope changes stop for Product/user approval before implementation.
- [ ] Mini-loops produce evidence against the existing goal; they do not invent new OKRs.
- [ ] Quick tasks stay lightweight unless the same failure is repeating.
