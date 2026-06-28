# CLAUDE.md — FB-Lane Coordination Rules

> **How to use this file**: Copy this file into your project root as `CLAUDE.md`.
> Claude Code automatically reads this file on every session.

---

## Plugin

This project uses the **FB-Lane Four-Lane Coordination Model**.
The source of truth for all active tasks and file locks is `PROJECT_BOARD.md` in the project root.

## Mode Selection

Default to normal/simple coding for one-thread work with no listed coordination
trigger. Escalate only when the objective mentions handoffs, board
items, lanes, Product, Design, Business, BFM, coordination files, board-locked
files, multiple threads/agents/workstreams, durable context,
pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets,
deploy/staging/live, camera/capture/save/export or another core product flow, or
decisions to build, sequence, defer, approve, merge, or release.

Use **FB-Lane light** for narrow triggered work: read the board/locks, keep the
task lightweight, and avoid extra ceremony. Use **Product/BFM** when sequencing,
approval, merge/release, provider/security/payment gates, core UX, or multiple
lane outputs must be reconciled before source changes.

## Your Lane

When you are invoked in a lane thread, you will be told your lane at the top of the conversation (e.g. `You are FB-Tech`). Operate strictly within your lane's boundaries:

| Lane | You own | You never touch |
|------|---------|----------------|
| **FB-Product** | Backlog, merges, deployments, release gates | Feature code |
| **FB-Tech** | APIs, DB schemas, serverless functions, tests | CSS, layout, copy |
| **FB-Design** | CSS, tokens, layout geometry, visual QA | Backend, schemas |
| **FB-Business** | Copy, docs, marketing text | Source code (read-only) |

## Plan-Only Workstreams

Normal workstream threads are read-only planning lanes. Product, Tech, Design,
and Business may ask questions, investigate, critique, and write markdown
plans/handoffs. They must not edit application/source code, create
implementation branches, commit, submit, merge, deploy, or change provider state
from ordinary workstream chat.

Product may edit coordination markdown: `PROJECT_BOARD.md`, plans, handoffs,
OKRs, Definition of Done, sequencing notes, and closeout notes. Product must not
edit application/source code directly.

Source changes happen only inside a Product-launched BFM execution run.

## Handoff Index

`PROJECT_BOARD.md` stays the source of truth for status, sequencing, gates,
ownership, and file locks. `docs/handoffs/index.md` is routing, and detailed
handoffs are detail.

Read or refresh the index before opening detailed handoffs, then open only the
files relevant to the active task unless Product/BFM is doing a full closeout
audit. Before non-quick Product/BFM sequencing, create or refresh the index when
handoffs exist and the lookup is missing, stale, or too vague. Use compact
columns: `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`,
`Checks / Evidence`, and `Detail`. Do not put full OKRs, full QA checklists,
plans, logs, rationale, copy variants, or implementation detail in the index.

Awareness, isolation, integration: `PROJECT_BOARD.md` and
`docs/handoffs/index.md` create shared awareness like a standup;
branches/worktrees isolate execution like separate desks; BFM integrates
outcomes like Product/release review. Worktrees do not replace coordination: no
private-worktree disappearance, no huge unannounced diff, no source edits
without board/lock awareness, and no closeout without BFM reconciliation when
multiple outputs exist.

## Starting a Session

1. Read `PROJECT_BOARD.md` to understand the current task state and active file locks.
2. Read `.codex/current_task.md` if it exists — it contains your exact task, branch, and locked files.
3. Confirm your branch: `git rev-parse --abbrev-ref HEAD`.
4. Never modify files that are locked by another active task.
5. Before source execution, read board/status/locks and the relevant handoff index.
6. During isolated work, name the task, branch/worktree, lane, and locked files.

## Goal Alignment Session

Use a Goal Alignment Session for non-trivial handoffs and sequencing work only. Product/BFM owns the approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream or BFM-target OKR with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`, plus stable lane OKRs where relevant.

Worker lanes read the approved OKR tree first. Mini-loops do not create new OKRs; they return evidence against the lane OKR and the Product/workstream OKR. Product/BFM may propose an OKR addition or change only when the current OKRs are missing, stale, or blocking clarity, and must stop for explicit user approval before applying it. Do not generate a fresh OKR for every task.

- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`

Lane handoffs should include:

```md
## Goal Alignment Session

Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
Mini-loop Evidence: <lane evidence from its smallest real verification loop>
Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
```

Product/BFM reconciles those fields before sequencing execution or merge. BFM blocks before execution when approval is missing, OKRs are unclear, or handoffs conflict with the approved OKR tree. If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKRs and recommends one; it must not dynamically create or edit OKRs during execution.

## BFM Return Loop

When processing all lane handoffs, Product/BFM must not close until every handoff is marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.

Return to:

- `PROJECT_BOARD.md` after reading handoffs.
- Each handoff after coding.
- Source, docs, and board after tests.
- Lane status after board/doc updates.
- `git status` after commit/push, plus branch/worktree state.

Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded. Report whether the branch/worktree is clean, merged, stale, blocked, or intentionally left open. Add one loop health flag: `healthy`, `watch`, `needs Product review`, or `blocked`; do not numeric-score the loop.

## CLI Tool

Use `node tools/fb-lane.cjs` for all task lifecycle management:

```bash
node tools/fb-lane.cjs status               # View all tasks and locks
node tools/fb-lane.cjs claim <id> <lane>    # BFM execution worker claims task, branch, locks
node tools/fb-lane.cjs submit <id>          # BFM execution worker submits for QA
node tools/fb-lane.cjs merge <id>           # Merge to main, release locks (FB-Product only)
```

## Rules

- **Never commit directly to `main`** — always work on a feature branch.
- **Commit docs separately** — keep `PROJECT_BOARD.md` updates in their own commit.
- **Run tests before submitting** — the `submit` command does this automatically.
- **Max 5 debug retries** — if tests still fail after 5 attempts, mark task `Blocked` and notify the user.
- **Do not revert others** — if another lane touched a shared file, merge `main` into your branch first.

## Lane Subagents (Claude Code)

The non-orchestrator lanes are available as Claude Code subagents in `.claude/agents/`. You can
invoke any of them directly, or let the main session delegate to them:

- **`fb-tech`** — backend/APIs/schemas/migrations/security/tests (CLI lane `Tech`)
- **`fb-design`** — CSS/tokens/layout geometry/visual QA (CLI lane `Design`)
- **`fb-business`** — copy/docs/positioning; read-only on code (CLI lane `Business`)

The **main session acts as FB-Product** (the orchestrator): scope tasks on `PROJECT_BOARD.md`,
collect markdown plans from the owning lanes, launch BFM for execution, review the result, then
merge. Individual workstream threads stay plan-only unless they are explicitly acting as BFM
execution workers. Full lane ownership boundaries and the board/locking protocol live in `AGENTS.md`.
