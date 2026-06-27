---
name: fb-lane
description: Use when coordinating concurrent Codex work across Product, Tech, Design, and Business lanes with FB-Lane board claims, file locks, handoffs, and Product integration.
---

# FB-Lane Coordination

Use this skill when the user wants multiple Codex instructions to run concurrently without lanes stepping on each other.

Codex supplies the concurrency. FB-Lane supplies shared coordination:

- `PROJECT_BOARD.md` is the source of truth for tasks, owners, locks, links, and QA state.
- `.codex/current_task.md` records the active claimed task for a lane.
- `docs/handoffs/` carries lane output back to Product/Captain.
- The `fb-lane` MCP server or `node tools/fb-lane.cjs` commands perform status, claim, submit, and merge operations.

## Scope Boundary

FB-Lane is a thin coordination protocol, not a default wrapper for all Codex work.

Use it when there are 2+ active lanes, overlapping file risk, staging/live gates, or handoffs that must survive context loss. Skip it for one-thread fixes, read-only questions, simple code explanations, or independent work where Codex worktrees are enough. When skipping, use ordinary Codex workflow and avoid creating board noise.

For non-trivial lane work, keep one canonical `Goal Alignment Session` block in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`. Product/BFM owns that block. Do not apply this ceremony to `TASK-Q-*` quick tasks.

## User-Facing Quickstart

When the user asks how to start, what to do after install, or says `$fb-lane status`, keep the answer short and immediately actionable:

```text
Start with $fb-lane status.
Then describe the work normally.
Product gives direction and splits the work. Individual lanes claim and execute their own files, code-writing lanes can use worktrees, each lane writes a handoff, and Product sequences what is ready to merge.
```

Objective examples:

- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`

Useful examples:

```text
$fb-lane
Split this across Product, Tech, Design, and Business.
Use worktrees for code-writing lanes where helpful.
Each lane should claim files, write a handoff, and return to Product.
Product should sequence the final integration and tell me what is ready to merge.
Product should not claim or execute Tech/Design/Business source changes for the lanes.

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
5. Before any write, claim or create one scoped board item and declare locked files. If acting as Product, assign source-changing execution to the owning lane; do not claim Tech/Design/Business files on that lane's behalf.
6. For non-trivial work, confirm the task detail block has one approved `Goal Alignment Session` block in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, and `Justification`. Product/BFM writes or changes that block; worker lanes report missing, unclear, or misaligned OKRs in handoffs.
7. Keep lane handoffs compact and include a real Markdown heading so `doctor` can validate it:
   ```md
   ## Goal Alignment Session

   OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
   Goal Challenge / Caveat: <real caveat> | No caveat identified
   Definition of Done Evidence: <lane evidence that proves, weakens, or blocks the approved OKR>
   ```
8. Product/BFM reconciles those fields before sequencing execution or merge. If a handoff conflicts with approved OKRs, BFM proposes aligned alternatives for approach, scope, or sequence and recommends one; it does not edit approved OKRs.
9. Do not modify files locked by another active lane.

## Direct Lane Prompt Convention

Treat prompts like these as lane routing instructions:

```text
$fb-design create prep-screen icon options.
$fb-tech check whether the auth flow is safe.
$fb-business rewrite onboarding copy.
$fb-product decide whether this should go to staging.
```

Codex may run safe independent pieces concurrently. Product/Captain remains responsible for sequencing, conflict resolution, staging decisions, and final merge. Individual lanes remain responsible for their own claim, execution, verification, handoff, and closeout.

## Handoff Rule

Any non-trivial lane output must create or update `docs/handoffs/<TASK-ID>.md` with:

- task ID and scope
- `## Goal Alignment Session` with `OKR Fit` from `AGENTS.md`
- files changed or proposed
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
