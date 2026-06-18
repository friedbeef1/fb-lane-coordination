# How to Interact — Claude Code

Claude Code (CLI, web, and the desktop / IDE extensions) runs the FB-Lane lanes as **native
subagents**. The **main session you are typing in acts as FB-Product** (the orchestrator).

## What Claude Code reads

| Artifact | Role |
|----------|------|
| `.claude/agents/*.md` | the four lanes as selectable subagents: `fb-product`, `fb-tech`, `fb-design`, `fb-business` |
| `.mcp.json` | registers the `fb-lane` MCP server -> `fb_lane_status` / `claim` / `submit` / `merge` |
| `CLAUDE.md` | auto-loaded lane boundaries + board/lock protocol |

> These load at **session start**. After bootstrapping (or pulling new lanes), **reload / start a
> fresh session**, then run **`/mcp`** once to approve the `fb-lane` server. The lanes are not
> hot-loaded into an already-running session.

## Two ways to interact

**1. Autonomous (hands-off).** Stay in the main session — it is FB-Product. Describe a goal; it
scopes tasks on `PROJECT_BOARD.md`, delegates to a lane, reviews, and merges. You approve the plan
up front and smoke-test at the end.

**2. Direct lane (pair-programming).** Invoke a specific lane yourself:

- Type **`@fb-tech`** (or `@fb-design`, `@fb-business`, `@fb-product`) in the chat — the `@`
  autocomplete lists them — or open the **`/agents`** picker and pick one.
- The lanes are **not** separate sidebar items; they are modes you switch into within a chat.
- For real concurrency, open **separate conversations**, invoke a different lane in each (e.g. one
  `@fb-tech`, one `@fb-design`), and rename the conversations to match.

## The task loop

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-101 Tech "src/api.ts"
node tools/fb-lane.cjs submit TASK-101
node tools/fb-lane.cjs merge  TASK-101                    # FB-Product only
```

With the `fb-lane` MCP server approved you can drive this in plain language ("claim TASK-101 for
Tech locking src/api.ts") instead of running the CLI by hand.

## FB-Product catches cross-lane drift

The main session (FB-Product) is the **only** lane that merges. Before merging it cross-reads every
submitted branch to catch API/UI contract mismatches, copy referencing unbuilt features, and
shared-file conflicts, then sends the offending lane back. See the checklist in
`.claude/agents/fb-product.md`.

## Install options

- **This repo opened directly** -> the lanes and `.mcp.json` are already here; just reload.
- **As a plugin in any project** -> `/plugin marketplace add friedbeef1/fb-lane-coordination`
  then `/plugin install fb-lane-coordination@fb-lane`.

## Context hygiene

Start a fresh conversation per task to keep context clean. If a conversation looks stale, type
**`status`** or **`SOP`** — the lane re-reads `PROJECT_BOARD.md`, `.codex/current_task.md`, and the
git branch to recover its task, lane, and locked files.
