# How to Interact — Antigravity 2.0

Antigravity is a multi-agent SDK: **FB-Product** is the main thread and spawns **FB-Tech**,
**FB-Design**, and **FB-Business** as sandboxed background subagents. The lanes appear in your
**left sidebar** automatically when you open the project.

## What Antigravity reads

| Artifact | Role |
|----------|------|
| `agents/FB-*/agent.json` | the four lane subagents (tools + system prompt per lane) |
| `PROJECT_BOARD.md` | single source of truth for tasks + file locks |
| `AGENTS.md` | lane boundaries + board/lock protocol |
| `skills/` | the `project-coordination-setup` + `fb-lane-coordination` skills |

> **Setup:** open the project folder in Antigravity 2.0 — the lane agents populate the left
> sidebar. If they do not appear, re-run `node tools/fb-lane.cjs bootstrap` to regenerate
> `agents/FB-*/agent.json`.

## Two ways to interact

**1. Autonomous background orchestration (main approach).** Talk only to the **FB-Product** thread.
Describe a feature; Product scopes tasks on the board, runs `claim`, then uses `invoke_subagent` to
spawn `FB-Tech` / `FB-Design` concurrently on isolated branches, and merges when verified. You
approve the plan and smoke-test staging.

**2. Direct lane threads (interactive).** Run a lane yourself in an interactive terminal loop with
the framework's runner:

```bash
python tools/run_lane.py <lane> <task-id> [locked_files]
# e.g.  python tools/run_lane.py Tech   TASK-102 "src/api.ts"
#       python tools/run_lane.py Design TASK-103 "src/App.css"
```

The runner auto-claims the task, checks out the branch, declares locks, and configures that lane's
sandbox before starting the `User:` / `Agent:` loop. (Requires `GEMINI_API_KEY` in your env.)

## The task loop

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-102 Tech "src/api.ts"
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge  TASK-102                    # FB-Product only
```

## FB-Product is the merge gate

Only FB-Product merges. It cross-reads the submitted branches first to catch cross-lane drift
(API/UI contract mismatches, copy referencing unbuilt features, shared-file conflicts) and sends
the offending lane back before integrating.

## Context hygiene

Start a fresh sidebar thread per lane/task; clearing context is encouraged. Type **`status`** or
**`SOP`** in a fresh thread to have the agent re-read `.codex/current_task.md`, `PROJECT_BOARD.md`,
and the git branch and resume instantly.
