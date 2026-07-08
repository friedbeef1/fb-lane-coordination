# CLAUDE.md — FB-Lane Coordination Rules

> **How to use this file**: Copy this file into your project root as `CLAUDE.md`.
> Claude Code automatically reads this file on every session.

---

## Plugin

This project uses the **FB-Lane Four-Lane Coordination Model**.
The source of truth for all active tasks and file locks is `PROJECT_BOARD.md` in the project root.
Lane revisit summaries live in `docs/workstreams/<lane>.md`; they are compact status cards, not a second board.

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

If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, confirm whether to prepare the Product/BFM handoff or execute here as an explicit one-off exception before editing source.

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

## Workstream Status Cards

`docs/workstreams/<lane>.md` helps a returning Product, Tech, Design, or
Business lane see what Product/BFM already executed, what remains pending or
blocked, and where the evidence lives.

Product/BFM updates the detailed handoff with `## Product/BFM Closeout`, then
refreshes the relevant card after executing or explicitly deferring a lane
handoff. Worker lanes read `PROJECT_BOARD.md`, then `docs/handoffs/index.md`,
then their status card before opening detailed handoffs. Keep cards compact: no
full OKRs, QA logs, plans, rationale, copy variants, or implementation detail.

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
5. Read `docs/handoffs/index.md` for routing and `docs/workstreams/<lane>.md` for lane revisit status.
6. Before source execution, read board/status/locks and the relevant handoff index.
7. During isolated work, name the task, branch/worktree, lane, and locked files.

## Goal Alignment Session

Use a Goal Alignment Session for non-trivial handoffs and sequencing work only. Product/BFM owns the approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream or BFM-target OKR with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`, plus stable lane OKRs where relevant.

Worker lanes read the approved OKR tree first. Mini-loops do not create new OKRs; they return evidence against the lane OKR and the Product/workstream OKR. Product/BFM may propose an OKR addition or change only when the current OKRs are missing, stale, or blocking clarity, and must stop for explicit user approval before applying it. Do not generate a fresh OKR for every task.

`/goal` is a Product/BFM shortcut into this same Goal Alignment Session. It shows, creates, clarifies, or asks approval for the current goal; it must not create a second goal system or a separate `/goals` flow. Workstream chats do not own `/goal`; they propose or challenge goal fit in their handoff for Product/BFM to reconcile.

- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`

Lane handoffs should include:

```md
## Goal Alignment Session

Product Goal: <existing approved Product/workstream goal, if known>
Workstream Goal: <plain-language lane contribution for Product/user approval>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <lane evidence from its smallest real verification loop>
Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
```

Product/BFM reconciles those fields before sequencing execution or merge. BFM blocks before execution when approval is missing, OKRs are unclear, or handoffs conflict with the approved OKR tree. If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKRs and recommends one; it must not dynamically create or edit OKRs during execution.

## BFM Return Loop

When processing all lane handoffs, Product/BFM must not close until every handoff is marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.

Before prioritizing, Product/BFM must run the Story Split Pass: split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work into smaller stories, or say `No split needed`.

Return to:

- `PROJECT_BOARD.md` after reading handoffs.
- Each handoff after coding.
- Source, docs, and board after tests.
- Lane status after board/doc updates.
- `git status` after commit/push, plus branch/worktree state.

Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded. Report whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If intentionally dirty, record exact files, owner, reason, next gate, and session-boundary action on `PROJECT_BOARD.md`; at the next session boundary, Product/BFM must continue that task, commit it, revert it, archive it into a handoff, or mark it `blocked`/`deferred` before starting new source work. If checks touched external services, also report test mode, created records/resources, cleanup evidence, or the pending cleanup gate. Add one loop health flag: `healthy`, `watch`, `needs Product review`, or `blocked`; do not numeric-score the loop.

Add `Loop Learning` at closeout: feedback captured, repeated pattern (`no|yes`), tooling needed (`none|propose guardrail|propose automation|propose eval`), and Product approval needed (`no|yes`). Heavier tooling starts from that field, not from assumption.

When `Loop Learning` chooses `propose eval`, use a small Markdown scorecard under `docs/evals/` with generic sections for non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules unless Product/BFM proposes that heavier option with pros/cons and the user explicitly approves it.

Approval autonomy is phased. Phase 1 is Shadow Approval: Product/BFM still asks the user, but records `Would self-approve: yes/no` and the reason. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.

Once the user has approved a safe Product/BFM task or problem, keep going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. Report after closeout, not before every routine step. Stop and ask only for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence that needs risk acceptance, or an explicit user pause.

## Frontend Visual Planning

Frontend/UI plans and handoffs default to a pre-build visual preview. Include `Visual Preview Decision`: `browser screenshot/mockup`, `imagegen asset/style option`, or `skip with reason`. Use `skip with reason` only for non-visual work, tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for concrete layout, responsive, component, or flow decisions. Use imagegen for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options. If the plan changes what the user will see and a preview is feasible, create or attach the preview before Product/BFM source execution; Product/BFM blocks or asks only when the preview is missing and the visual decision is material.

Product/BFM should proactively propose loop hardening when it sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework. Propose one small guardrail at a time with the observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed. Do not silently change the process; skip one-off or low-impact issues.

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
