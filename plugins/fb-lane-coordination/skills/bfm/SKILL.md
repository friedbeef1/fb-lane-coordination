---
name: bfm
description: Use when Product/Captain must take prepared FB-Lane handoff markdowns through full review, sequencing, lane routing, execution, verification, and closeout. Triggers include "BFM", "build from markdown", "process all handoffs", "sequence prepared handoffs", and "execute these handoffs to completion".
---

# BFM

BFM is the Product/Captain mode for turning prepared lane handoffs into an executable sequence.
It does not replace lane ownership: Product decides order and gates; Tech, Design, and Business own their surfaces.

## Required Sub-Skills

Use these skills before acting, in this order:

1. `fb-lane`
2. `fb-product`
3. `fb-tech`
4. `fb-design`
5. `fb-business`

## Intake

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, and `.codex/current_task.md` if present.
2. Run `fb_lane_status` or `node tools/fb-lane.cjs status`.
3. Identify the target task from the user request, current task file, board item, or handoff names.
4. Read all prepared markdown that belongs to the target:
   - board-linked files under `docs/handoffs/`
   - `docs/handoffs/<TASK-ID>.md`
   - handoffs named in the target board item's Links, QA, Modified Files, or Latest Update
   - linked `docs/superpowers/plans/` and `docs/superpowers/specs/`
5. If the target is ambiguous, read active `Ready`, `In Progress`, and `Staging QA` board items before choosing.

## Five-Lane Review

Create a short internal review with these slots:

- `FB-Lane`: task state, locks, branch/PR, handoff set, conflicts, missing owner.
- `FB-Product`: user value, sequencing, scope, merge/release gate, beta/staging/live decision.
- `FB-Tech`: implementation dependencies, tests/builds, reliability/security, blocked integrations.
- `FB-Design`: UI/UX dependencies, responsive/visual QA, screenshot evidence, unresolved visual gates.
- `FB-Business`: positioning/copy/pricing/privacy claims, approval state, source integration target.

Do not summarize a lane as done from delivery evidence alone. Use `delivered`, `lane-verification-passed`, `pending-gate`, `blocked`, or `superseded`.

## Sequence

Produce the next execution order before changing files:

1. Prerequisite gate decisions Product must make first.
2. Work that can run in parallel because locks do not overlap.
3. Work that must run serially because it changes shared files or depends on another lane.
4. Verification gates required before merge, staging, or live deploy.
5. Explicit stop points needing user approval, especially live deploys, secrets, payment credentials, or destructive changes.

## Execute

Proceed through the sequence without asking for repeated permission when authority is clear.

- Claim or create scoped board items before durable writes.
- Respect active locks; do not edit files owned by another active lane.
- Use the owning lane for implementation: Tech for app logic/tests, Design for UI/visual QA, Business for copy/positioning, Product for sequencing/merge/release decisions.
- For code-writing work, use worktrees or isolated branches when overlap risk exists.
- After each lane finishes, update its handoff and board status before moving to the next dependent step.
- Product reads all resulting handoffs together before sequencing merges.
- Do not deploy live, add production secrets, change payment credentials, or run destructive operations without explicit current approval.

## Completion Contract

Finish with a Product closeout note:

`Closeout note - <TASK-ID>: <status>. Delivered: ... Evidence: ... Remaining: ... Handoff: docs/handoffs/<TASK-ID>.md.`

Also update `PROJECT_BOARD.md` with final status, links, modified files, checks, risks, and next owner.
If completion is blocked, record the exact blocker and the lane responsible for clearing it.
