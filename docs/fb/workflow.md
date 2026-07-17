# Coordinate and execute

The beginner-facing mode and approval contract lives in [start.md](start.md).
Build For Me (BFM) is the execution mode only after approval and explicit
`$bfm`.

## Ownership and durable records

- **Product:** scopes, prioritizes, resolves conflicts, approves goals, launches BFM, reviews staging, and is the only lane authorized to merge to main or deploy. Product may update coordination markdown but is read-only on application source outside BFM.
- **Tech:** owns schemas, APIs, serverless/security/configuration, and tests; it does not make styling, layout, font, or appearance changes.
- **Design:** owns CSS, tokens, assets, layout geometry, and visual viewports; it does not edit schemas, API routes, or backend logic.
- **Business:** owns pricing/copy/onboarding/docs/help/marketing; it is read-only on application code and does not deploy.
- **All worker lanes:** investigate and write lane plans/handoffs in ordinary chats; none starts source execution without Product-launched BFM.
- **BFM execution workers:** may claim locked files, use an isolated branch/worktree, edit, verify, and submit only within an approved BFM run.

The board is truth; the handoff index is routing; detailed handoffs are detail;
workstream cards are compact revisit summaries. Awareness comes from the board
and index, isolation from branches/worktrees, and integration from BFM.

Every lane leaves a passive closeout with task ID, status, delivered work,
evidence, remaining gates, and handoff path. Product/BFM additionally records a
loop-health flag: `healthy`, `watch`, `needs Product review`, or `blocked`.
Never call a lane done or executed without its required evidence. Passive
closeouts contain no commands, invocations, or instructions to start another
lane; the board and handoffs remain the trigger source.

Read or refresh the index before detailed handoffs, then open only relevant
detail unless doing a full closeout. For non-quick sequencing, refresh a
missing, stale, or vague index. Its compact columns are `Task / Topic`, `Lane`,
`Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`; full
plans, OKRs, logs, and QA stay in the detailed handoff. Product/BFM adds
`## Product/BFM Closeout` to that handoff, then refreshes the relevant compact
workstream card after execution or explicit deferral.

## Internal approval record

For non-trivial work, Product owns one approved Goal Alignment Session on the
board: `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`,
`Approval`, and `Justification`. Each relevant lane handoff has a compact
`## Goal Alignment Session` with:

```md
Product Goal: <existing approved Product/workstream goal, if known>
Workstream Goal: <plain-language lane contribution for Product/user approval>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <smallest real verification evidence>
Evidence Against Product OKR: <weakening/blocking evidence> | None identified
```

Worker lanes return evidence against the existing goal; they do not create a
new OKR for every task. `/goal` is only a Product/BFM shortcut into this same
session. Quick `TASK-Q-*` work may skip this extra ceremony.

Before source-changing work, Product records the Build Brief and approval. The
Build Brief repeats the quality bar, selected eval IDs and authority,
mechanical versus judgment evidence, and remaining user judgment. See
[evals.md](evals.md). Product defines concrete product scenarios with Good and
Bad examples; reusable categories alone are not a test.

For a user-visible UI plan, record `browser screenshot/mockup`, `imagegen
asset/style option`, or `skip with reason`. Skip only for non-visual work or a
tiny copy, spacing, or single-control change. Attach a feasible material visual
preview before BFM source execution; Product/BFM blocks or asks only when that
material decision lacks a preview.

## Before an approved BFM run

1. Read `AGENTS.md`, board, current-task record if present, the handoff index, then only linked handoffs.
2. Show the target card: status, owner, scope, locks, blockers, gates, checks, links, intentional dirt, and approved goal.
3. If approval is missing, stale, changed, or unclear, stop before claim, edit, deploy, or closeout.
4. Make a five-lane ledger (`FB-Lane`, Product, Tech, Design, Business). Each
   lane is either linked to relevant output or explicitly recorded as `no relevant handoff/lane output found` with the locations checked. Each found handoff ends as `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`; do not silently omit a missing lane.
5. Run a Story Split Pass. Split mixed risks, locks, gates, review surfaces, blocked work, and ready work; otherwise say `No split needed`.
6. Classify work as `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`. Recheck status immediately before a claim.
7. Select only relevant eval IDs from [evals.md](evals.md), record their authority, and separate mechanical evidence from Product/user judgment.

Execute only ready, unlocked work within the same approved goal or scope. A
different board item needs Product approval. During execution, record task,
lane, branch/worktree, and locks. At closeout, name clean, merged, stale,
blocked, or intentionally dirty state; intentional dirt requires owner,
reason, next gate, and session-boundary action.

BFM blocks before execution, audit, or merge when approval is missing, stale,
or unclear; OKRs are unclear; or a handoff implies an unapproved OKR change or
conflicts with the approved OKR tree. Product must reconcile the conflict in
the board/handoff by choosing and recording an aligned approach, scope, or
sequence (and renewed approval when needed). BFM does not create or rewrite
OKRs dynamically to make a conflict disappear.

The board flow is: drift audit; plan/approved goal; story split; BFM claim and
exact affected screens/locks; isolated verification and staging QA; branch/PR/
staging links; structured handoff, unlock, and closeout. Before resuming, check
board status, outside changes, current deployment authorization, uncommitted
scope/dirt, and whether the next action still belongs to the assigned lane.

`Staging QA` is the internal board enum for a candidate awaiting verification;
it does not claim that the candidate is deployed to a staging host. Record the
actual review environment separately as local, sandbox, staging, or completed
build.

## Return loop

After each slice, return to the board. After coding, return to the handoff;
after checks, compare source, docs, and board; after coordination updates, run
the project status check; after commit/push, check Git state. Close only when
board, source, docs, evidence, and Git agree, or every disagreement is
explicitly marked. See [evidence.md](evidence.md) for review evidence and
[guardrails.md](guardrails.md) for stop points. Before revising a failed eval,
classify it as Build, Brief, Eval, or Environment failure. BFM does not weaken
the target; insufficient product output stays
`Checking — product quality target missed` with a complete Quality Gap.
