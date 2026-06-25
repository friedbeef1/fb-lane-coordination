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

For non-trivial lane work, keep one canonical Goal Alignment block in `PROJECT_BOARD.md` with `Working Goal`, `Success Measure`, and `Gate / Review Point`. Product/BFM owns that block. Do not apply this ceremony to micro quick tasks.

## User-Facing Quickstart

When the user asks how to start, what to do after install, or says `$fb-lane status`, keep the answer short and immediately actionable:

```text
Start with $fb-lane status.
Then describe the work normally.
Product splits the work, lanes claim files, code-writing lanes can use worktrees, each lane writes a handoff, and Product sequences what is ready to merge.
```

Goal examples:

- Good: `Working Goal: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Working Goal: finish the feature.`

Useful examples:

```text
$fb-lane
Split this across Product, Tech, Design, and Business.
Use worktrees for code-writing lanes where helpful.
Each lane should claim files, write a handoff, and return to Product.
Product should sequence the final integration and tell me what is ready to merge.

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
5. Before any write, claim or create one scoped board item and declare locked files.
6. For non-trivial work, confirm the task detail block has one canonical Goal Alignment block in `PROJECT_BOARD.md` with `Working Goal`, `Success Measure`, and `Gate / Review Point`. Product/BFM writes or changes that block; worker lanes report missing, unclear, or misaligned goals in handoffs.
7. Keep lane handoffs compact and include a real Markdown heading so `doctor` can validate it:
   ```md
   ## Goal Alignment

   Goal Alignment: aligned | suggest change: <proposed goal> | blocked by goal ambiguity: <reason>
   Goal Challenge / Caveat: <real caveat> | No caveat identified
   Evidence Against Goal: <lane evidence that proves, weakens, or blocks the current goal>
   ```
8. Product/BFM reconciles those fields before sequencing execution or merge. If the goal changes, record: `Goal changed from X to Y because Z.`
9. Do not modify files locked by another active lane.

## Direct Lane Prompt Convention

Treat prompts like these as lane routing instructions:

```text
$fb-design create prep-screen icon options.
$fb-tech check whether the auth flow is safe.
$fb-business rewrite onboarding copy.
$fb-product decide whether this should go to staging.
```

Codex may run safe independent pieces concurrently. Product/Captain remains responsible for sequencing, conflict resolution, staging decisions, and final merge.

## Handoff Rule

Any non-trivial lane output must create or update `docs/handoffs/<TASK-ID>.md` with:

- task ID and scope
- `## Goal Alignment` with the compact fields from `AGENTS.md`
- files changed or proposed
- checks performed
- decisions and tradeoffs
- risks, blockers, and dependencies
- next owner

Product must read handoffs before integration.

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
