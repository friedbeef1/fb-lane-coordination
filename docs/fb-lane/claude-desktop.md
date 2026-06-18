# How to Interact — Claude Desktop / Cursor / Projects

Claude Desktop, Cursor, and Claude Projects are single-threaded chat agents — they do not spawn
background subagents. You run the FB-Lane model by giving each lane **its own chat thread** and
acting as FB-Product (the coordinator) yourself.

## What this AI reads

| Artifact | Role |
|----------|------|
| `CLAUDE.md` (or the Project's Custom Instructions) | lane boundaries + board/lock protocol |
| `AGENTS.md` + `PROJECT_BOARD.md` | upload to Project Knowledge / add as `@` references in Cursor |
| `.claude/agents/<lane>.md` | the per-lane system prompt to paste into a fresh thread |
| `claude_desktop_config.json` | (Desktop only) registers the `fb-lane` MCP server |

## Two ways to interact

**1. Zero-friction via MCP (Claude Desktop).** Register the `fb-lane` MCP server (bootstrap does
this automatically on macOS / Windows). Claude then exposes `fb_lane_status` / `claim` / `submit` /
`merge`, so you just say *"Claim TASK-102 for Tech locking src/auth.ts"* and it manages the branch,
locks, and board for you.

**2. Low-friction via CLI + clipboard (Cursor / Web).** Run the claim command in your terminal — it
checks out the branch, locks files, and **copies a startup prompt to your clipboard**:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
```

Open a **fresh chat thread** for that lane and paste (Cmd/Ctrl+V) to start it. (You can also paste
the lane's prompt straight from `.claude/agents/<lane>.md`.)

## The task loop

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-102 Tech "src/auth.ts"          # copies a startup prompt to your clipboard
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge  TASK-102                             # as FB-Product
```

*(With MCP enabled, ask Claude to run each step instead of typing the CLI.)*

## One thread per lane; FB-Product merges

Always start a **new, empty chat** for each lane/task — never mix backend logic (`FB-Tech`) and
styling (`FB-Design`) in one thread. All threads share the same git branch, `PROJECT_BOARD.md`, and
`.codex/current_task.md`, so they stay in sync. Acting as **FB-Product**, you review each lane's
submission and run `merge` — Product is the only role that merges, and the place cross-lane
inconsistencies (API/UI mismatches, copy referencing unbuilt features) get caught.

## Context hygiene

Clearing a thread (`/clear`) per task is encouraged. In a fresh thread, type **`status`** or
**`SOP`** — the agent inspects `.codex/current_task.md`, `PROJECT_BOARD.md`, and `git branch
--show-current` to recover its lane, task, and locked files instantly.
