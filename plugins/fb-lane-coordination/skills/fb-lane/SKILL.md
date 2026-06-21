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

## User-Facing Quickstart

When the user asks how to start, what to do after install, or says `@fb-lane status`, keep the answer short and immediately actionable:

```text
Start with @fb-lane status.
Then describe the work normally.
Product splits the work, lanes claim files, code-writing lanes can use worktrees, each lane writes a handoff, and Product sequences what is ready to merge.
```

Useful examples:

```text
@fb-lane
Split this across Product, Tech, Design, and Business.
Use worktrees for code-writing lanes where helpful.
Each lane should claim files, write a handoff, and return to Product.
Product should sequence the final integration and tell me what is ready to merge.

@fb-product what is ready to merge?
@fb-design improve the prep-screen icons.
@fb-tech check whether this auth flow is safe.
@fb-business rewrite the onboarding copy.
```

## Start Of Work

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, and `.codex/current_task.md` if present.
2. Run or request FB-Lane status:
   - MCP: call `fb_lane_status` with `workspacePath` set to the active repo root when needed.
   - CLI fallback: `node tools/fb-lane.cjs status`.
3. Identify whether the user is asking Product to orchestrate lanes or directly addressing lane threads.
4. Before any write, claim or create one scoped board item and declare locked files.
5. Do not modify files locked by another active lane.

## Direct Lane Prompt Convention

Treat prompts like these as lane routing instructions:

```text
@fb-design create prep-screen icon options.
@fb-tech check whether the auth flow is safe.
@fb-business rewrite onboarding copy.
@fb-product decide whether this should go to staging.
```

Codex may run safe independent pieces concurrently. Product/Captain remains responsible for sequencing, conflict resolution, staging decisions, and final merge.

## Handoff Rule

Any non-trivial lane output must create or update `docs/handoffs/<TASK-ID>.md` with:

- task ID and scope
- files changed or proposed
- checks performed
- decisions and tradeoffs
- risks, blockers, and dependencies
- next owner

Product must read handoffs before integration.

## Finish

End by updating `PROJECT_BOARD.md` with status, modified files, checks, links, risks, and next owner. Use Product/Captain as the final endpoint for multi-lane work.
