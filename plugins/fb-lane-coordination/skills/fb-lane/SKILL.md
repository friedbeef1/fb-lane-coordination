---
name: fb-lane
description: Use when coordinating concurrent Codex work across Product, Tech, Design, and Business lanes with FB-Lane board claims, file locks, handoffs, and Product integration.
---

# FB-Lane Coordination

Use this skill when the user wants multiple Codex instructions to run concurrently without lanes stepping on each other.

Codex supplies the concurrency. FB-Lane supplies shared coordination:

- `PROJECT_BOARD.md` is the source of truth for tasks, owners, locks, links, and QA state.
- `.codex/current_task.md` records the active claimed task for a lane.
- `docs/handoffs/index.md` is the first-read routing table for handoff discovery.
- `docs/handoffs/` carries lane plans and evidence back to Product/Captain.
- The `fb-lane` MCP server or `node tools/fb-lane.cjs` commands perform status, claim, submit, and merge operations.

## Scope Boundary

FB-Lane is a thin coordination protocol, not a default wrapper for all Codex work.

Default to normal/simple coding for one-thread work with no listed coordination trigger. Skip FB-Lane for read-only questions, simple code explanations, tiny fixes, isolated edits, or independent work where Codex worktrees are enough. When skipping, use ordinary Codex workflow and avoid creating board noise.

Use FB-Lane light when the objective mentions handoffs, board items, lanes, BFM, Product, Design, Business, coordination files such as `PROJECT_BOARD.md`, `docs/handoffs/`, or `.codex/current_task.md`, board-locked files, multiple threads/agents/workstreams, or durable context that must survive chat loss. Keep quick tasks lightweight: read the board/locks, claim or note only the exact files needed, and avoid Goal Alignment or handoff ceremony unless another lane or Product must continue it.

Escalate to Product/BFM when the work requires deciding what to build, sequence, defer, approve, merge, release, stage, or launch; crosses pricing, payments, trials, subscriptions, promo codes, auth, privacy, analytics, secrets, deploy, staging, or live gates; touches camera/capture/save/export or another core product flow; or needs multiple lane outputs reconciled before source changes.

For non-trivial lane work, use the approved Product/workstream or BFM-target OKR in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`. Stable lane OKRs are standing Product, Tech, Design, and Business quality anchors. Product/BFM owns that OKR tree and adds or changes it only after discussion and explicit user approval. Do not generate a fresh OKR for every task, and do not apply this ceremony to `TASK-Q-*` quick tasks.

Normal workstream threads are read-only planning lanes. Product, Tech, Design, and Business may ask questions, investigate, critique, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.

Awareness, isolation, integration: `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup; branches/worktrees isolate execution like separate desks; BFM integrates outcomes like Product/release review. Worktrees do not replace coordination: no disappearing into a private worktree, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.

## User-Facing Quickstart

When the user asks how to start, what to do after install, or says `$fb-lane status`, keep the answer short and immediately actionable:

```text
Start with $fb-lane status.
Then describe the work normally.
Product gives direction and splits the work. Workstreams write markdown plans/handoffs. Product launches BFM when execution should begin; BFM execution workers read board/status/locks and the handoff index, claim files, name the task/branch/worktree/lane/locks, use worktrees where helpful, verify, and return evidence for Product sequencing.
```

Objective examples:

- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`

Useful examples:

```text
$fb-lane
Split this across Product, Tech, Design, and Business.
Workstreams should write markdown plans/handoffs and return to Product.
Product should launch BFM when execution is approved.
Product should sequence the final integration and tell me what is ready to merge.
Product and normal workstream threads should not edit source directly.

$fb-product what is ready to merge?
$fb-design improve the prep-screen icons.
$fb-tech check whether this auth flow is safe.
$fb-business rewrite the onboarding copy.
```

## Start Of Work

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, and `.codex/current_task.md` if present.
2. Run or request FB-Lane status:
   - MCP: call `fb_lane_status` with `workspacePath` set to the active repo root when needed.
   - CLI fallback: `node tools/fb-lane.cjs status`.
3. If setup looks suspect, run `node tools/fb-lane.cjs doctor` before claiming work.
4. Identify whether the user is asking Product to orchestrate lanes or directly addressing lane threads.
5. Before any ordinary workstream output, keep changes to markdown plans/handoffs. Source writes, file claims, branches, commits, submits, merges, deploys, and provider changes happen only inside Product-launched BFM execution.
6. For non-trivial work, confirm the task detail block has one approved `Goal Alignment Session` block in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, and `Justification`. Product/BFM writes or changes that block only after explicit user approval; worker lanes report missing, unclear, or misaligned OKRs in handoffs.
7. Keep lane handoffs compact and include a real Markdown heading so `doctor` can validate it:
   ```md
   ## Goal Alignment Session

   Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
   Mini-loop Evidence: <lane evidence from its smallest real verification loop>
   Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
   ```
8. Product/BFM reconciles those fields before sequencing execution or merge. If a handoff conflicts with approved OKRs, BFM proposes aligned alternatives for approach, scope, or sequence and recommends one; it does not dynamically create or edit OKRs during execution.
9. Do not modify files locked by another active lane.

## Handoff Lookup

Use progressive disclosure. `PROJECT_BOARD.md` stays the source of truth for current status, ownership, sequencing, gates, and file locks. `docs/handoffs/index.md` is routing, and detailed handoffs are detail. Read or refresh the index before opening detailed handoffs, then open only the files relevant to the active task unless Product/BFM is doing a full closeout audit.

Before non-quick Product/BFM sequencing, create or refresh the index when handoffs exist and the lookup layer is missing, stale, or too vague. Keep the index compact with `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`. Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.

## Direct Lane Prompt Convention

Treat prompts like these as lane routing instructions:

```text
$fb-design create prep-screen icon options.
$fb-tech check whether the auth flow is safe.
$fb-business rewrite onboarding copy.
$fb-product decide whether this should go to staging.
```

Codex may discuss safe independent pieces concurrently. Product/Captain remains responsible for sequencing, conflict resolution, BFM launch, staging decisions, and final merge. Individual workstream threads remain responsible for their plans, evidence, handoffs, and closeout; BFM execution workers handle claims, source changes, verification, and submit steps.

## Handoff Rule

Any non-trivial lane output must create or update `docs/handoffs/<TASK-ID>.md` with:

- task ID and scope
- `## Goal Alignment Session` with `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` from `AGENTS.md`
- files changed in BFM execution or proposed by workstream planning
- checks performed
- decisions and tradeoffs
- risks, blockers, and dependencies
- next owner

Product must read handoffs before integration.

## Return-Loop Rule

When the user says "run BFM" or "process all lane handoffs", Product must not close until every discovered handoff has one explicit status: `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.

Return checks are mandatory for non-trivial handoff execution:

- after handoff intake, return to `PROJECT_BOARD.md`;
- after coding, return to the handoff contracts;
- after tests, return to source, docs, and board;
- after board/doc updates, return to lane status;
- after commit/push, return to `git status` and name whether the branch/worktree is clean, merged, stale, blocked, or intentionally left open.

Close only when board, source, docs, and tests agree, or the disagreement is explicitly recorded.
Add one loop health flag at closeout: `healthy`, `watch`, `needs Product review`, or `blocked`. Use this instead of numeric loop scoring.

## Product Completion Audit

Product/Captain must report lane status with separate evidence buckets:

- delivered work present
- lane-specific verification passed with named evidence
- required lane gate pending
- blocked
- superseded

Do not collapse those into a generic "executed" or "done" label. A lane can deliver work while its required gate remains pending: Tech may still lack tests, Design may still lack screenshot/viewport evidence, Business may still need copy approval or integration, and Product may still need staging/release evidence. Product must state that distinction clearly before merge or staging recommendations.
Product must also state the loop health flag so directional misses are visible without turning the loop into a scorecard.

## Finish

End by updating `PROJECT_BOARD.md` with status, modified files, checks, links, risks, and next owner. Use Product/Captain as the final endpoint for multi-lane work.
