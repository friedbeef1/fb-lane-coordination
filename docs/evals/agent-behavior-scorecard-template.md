# FB Agent Behavior Scorecard

Use this only when `Loop Learning` shows a repeated agent-behavior failure or Product/BFM wants a non-quick closeout check. Do not use it for routine quick tasks unless the same failure pattern repeats.

Do not add an eval runner, dashboard, numeric score, CI eval job, larger `doctor`, or per-task OKRs from this scorecard. A retro or scorecard produces at most one small guardrail for each repeated pattern. If the same failure repeats after that guardrail, Product/BFM may propose one heavier option with pros, cons, affected files/rules, and explicit approval needed.

Result: `healthy` | `watch` | `needs Product review` | `blocked`

Task / run:
Observed repeated pattern:
Proposed small guardrail, if any:
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

## Verification Handoff

- [ ] The handoff has a `## Verification Handoff` section containing the candidate branch or commit, a Test plan: link, exact commands, environments, and current results.
- [ ] It links to each runnable staging, APK, mockup, screenshot, or other manual-check surface and gives concise pass criteria.
- [ ] A blocked check names the exact failure, affected environment, and recovery attempted; it never merely asks for a "healthy environment."
- [ ] Product/BFM records the Next Product/BFM recovery action and performs safe recovery before involving the user. Only an approval or external manual, device, or account gate reaches the user.
- [ ] A missing or stalled check is a pending or blocked gate, never passing evidence.
- [ ] Repeated workspace instability triggers a bounded workspace-health preflight covering available disk capacity (a 15 GiB free-capacity threshold unless a stricter documented policy applies), File Provider or synchronized-storage ancestry where relevant, stable double-read hashes, and bounded Git status/diff probes with a 15-second timeout per probe.
- [ ] A second consecutive failure in one checkout triggers clean-clone recovery. Product/BFM preserves commits and explicitly owned artifacts through normal Git operations; it must never copy damaged .git, index, or worktree metadata or count manual object plumbing as passing evidence.

## Goal And Scope Fit

- [ ] Work maps to the approved goal or a plain-language Product decision.
- [ ] Scope changes stop for Product/user approval before implementation.
- [ ] Mini-loops produce evidence against the existing goal; they do not invent new OKRs.
- [ ] Quick tasks stay lightweight unless the same failure is repeating.
