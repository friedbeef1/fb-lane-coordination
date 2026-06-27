---
name: fb-lane
description: Use when coordinating concurrent Codex work across Product, Tech, Design, and Business lanes with FB-Lane board claims, file locks, handoffs, and Product integration.
---

# FB-Lane Coordination

Use this skill when the user wants multiple Codex instructions to run concurrently without lanes stepping on each other.

Codex supplies the concurrency. FB-Lane supplies shared coordination:

- `PROJECT_BOARD.md` is the source of truth for tasks, owners, locks, links, and QA state.
- `.codex/current_task.md` records the active claimed task for a lane.
- `docs/handoffs/` carries lane plans and evidence back to Product/Captain.
- The `fb-lane` MCP server or `node tools/fb-lane.cjs` commands perform status, claim, submit, and merge operations.

## Scope Boundary

FB-Lane is a thin coordination protocol, not a default wrapper for all Codex work.

Use it when there are 2+ active lanes, overlapping file risk, staging/live gates, or handoffs that must survive context loss. Skip it for one-thread fixes, read-only questions, simple code explanations, or independent work where Codex worktrees are enough. When skipping, use ordinary Codex workflow and avoid creating board noise.

For non-trivial lane work, keep one stable Product/workstream OKR block in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`. Stable lane OKRs are standing Product, Tech, Design, and Business quality anchors. Product/BFM owns that OKR tree and adds or changes it only after discussion and explicit user approval. Do not apply this ceremony to `TASK-Q-*` quick tasks.

Normal workstream threads are read-only planning lanes. Product, Tech, Design, and Business may ask questions, investigate, critique, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.

## User-Facing Quickstart

When the user asks how to start, what to do after install, or says `$fb-lane status`, keep the answer short and immediately actionable:

```text
Start with $fb-lane status.
Then describe the work normally.
Product gives direction and splits the work. Workstreams write markdown plans/handoffs. Product launches BFM when execution should begin; BFM execution workers claim files, use worktrees where helpful, verify, and return evidence for Product sequencing.
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
- after commit/push, return to `git status`.

Close only when board, source, docs, and tests agree, or the disagreement is explicitly recorded.

## Product Completion Audit

Product/Captain must report lane status with separate evidence buckets:

- delivered work present
- lane-specific verification passed with named evidence
- required lane gate pending
- blocked
- superseded

Do not collapse those into a generic "executed" or "done" label. A lane can deliver work while its required gate remains pending: Tech may still lack tests, Design may still lack screenshot/viewport evidence, Business may still need copy approval or integration, and Product may still need staging/release evidence. Product must state that distinction clearly before merge or staging recommendations.

## Finish

End by updating `PROJECT_BOARD.md` with status, modified files, checks, links, risks, and next owner. Use Product/Captain as the final endpoint for multi-lane work.
