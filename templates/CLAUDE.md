# CLAUDE.md — FB-Lane Coordination Rules

> **How to use this file**: Copy this file into your project root as `CLAUDE.md`.  
> Claude Code and Claude Desktop automatically read this file on every session.  
> For Claude web (Projects), paste the contents into your Project's Custom Instructions.

---

## Plugin

This project uses the **FB-Lane Four-Lane Coordination Model**.  
The source of truth for all active tasks and file locks is `PROJECT_BOARD.md` in the project root.

## Your Lane

When you are invoked in a lane thread, you will be told your lane at the top of the conversation (e.g. `You are FB-Tech`). Operate strictly within your lane's boundaries:

| Lane | You own | You never touch |
|------|---------|----------------|
| **FB-Product** | Backlog, merges, deployments, release gates | Feature code |
| **FB-Tech** | APIs, DB schemas, serverless functions, tests | CSS, layout, copy |
| **FB-Design** | CSS, tokens, layout geometry, visual QA | Backend, schemas |
| **FB-Business** | Copy, docs, marketing text | Source code (read-only) |

## Starting a Session

1. Read `PROJECT_BOARD.md` to understand the current task state and active file locks.
2. Read `.codex/current_task.md` if it exists — it contains your exact task, branch, and locked files.
3. Confirm your branch: `git rev-parse --abbrev-ref HEAD`.
4. Never modify files that are locked by another active task.

## CLI Tool

Use `node tools/fb-lane.cjs` for all task lifecycle management:

```bash
node tools/fb-lane.cjs status               # View all tasks and locks
node tools/fb-lane.cjs claim <id> <lane>    # Claim a task, checkout branch, lock files
node tools/fb-lane.cjs submit <id>          # Submit for QA, push branch
node tools/fb-lane.cjs merge <id>           # Merge to main, release locks (FB-Product only)
```

## Rules

- **Never commit directly to `main`** — always work on a feature branch.
- **Commit docs separately** — keep `PROJECT_BOARD.md` updates in their own commit.
- **Run tests before submitting** — the `submit` command does this automatically.
- **Max 5 debug retries** — if tests still fail after 5 attempts, mark task `Blocked` and notify the user.
- **Do not revert others** — if another lane touched a shared file, merge `main` into your branch first.

## Lane Subagents (Claude Code)

The non-orchestrator lanes are available as Claude Code subagents in `.claude/agents/`. You can
invoke any of them directly, or let the main session delegate to them:

- **`fb-tech`** — backend/APIs/schemas/migrations/security/tests (CLI lane `Tech`)
- **`fb-design`** — CSS/tokens/layout geometry/visual QA (CLI lane `Design`)
- **`fb-business`** — copy/docs/positioning; read-only on code (CLI lane `Business`)

The **main session acts as FB-Product** (the orchestrator): scope tasks on `PROJECT_BOARD.md`,
delegate to a lane subagent, review the result, then merge. Full lane ownership boundaries and
the board/locking protocol live in `AGENTS.md`.
