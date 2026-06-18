# How to Interact — Codex

Codex is a local, filesystem-active developer agent. The FB-Lane model coordinates multiple Codex
runs through **git branch isolation** and the local `PROJECT_BOARD.md`. Each lane runs in its own
Codex session; **you act as FB-Product** to review and merge.

## What Codex reads

| Artifact | Role |
|----------|------|
| `.codex/rules.md` | lane boundaries + board/lock protocol (system rules) |
| `.codex/current_task.md` | the active task, branch, and locked files (written by `claim`) |
| `PROJECT_BOARD.md` | single source of truth for tasks + file locks |

## Two ways to interact

**1. Zero-friction via MCP.** Register `tools/fb-lane.cjs mcp` as an MCP server in Codex Desktop
(**Settings -> MCP Servers**). Codex then has `fb_lane_status` / `claim` / `submit` / `merge` and
manages its own branch, locks, and board — just say *"Claim TASK-102 for Tech locking src/auth.ts"*.

**2. Local context injection (CLI).** Run `claim` — it writes `.codex/current_task.md`:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
```

`.codex/rules.md` already tells Codex to read that file on startup, so when you launch Codex Desktop
it picks up the branch, locks, and task and starts working — no prompt needed.

## The task loop

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-102 Tech "src/auth.ts"          # writes .codex/current_task.md
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge  TASK-102                             # as FB-Product
```

*(With MCP enabled, ask Codex to run each step instead of typing the CLI.)*

## One session per lane; FB-Product merges

Run one Codex session per lane on its own `tech/...` or `design/...` branch, and commit board / doc
updates separately from code. As **FB-Product**, review each submission and `merge` — Product is the
only role that merges, and it cross-reads the submitted branches to catch cross-lane drift (API/UI
mismatches, copy referencing unbuilt features) before integrating.

## Context hygiene

Clearing the Codex session per task is encouraged. In a fresh session, type **`status`** or
**`SOP`** — Codex inspects `.codex/current_task.md`, `PROJECT_BOARD.md`, and `git branch
--show-current` to recover its lane, task, and locked files.
