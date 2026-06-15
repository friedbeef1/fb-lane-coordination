# CLAUDE.md — FB-Lane Coordination Rules

> **How to use this file**: Copy this file into your project root as `CLAUDE.md`.  
> Claude Code and Claude Desktop automatically read this file on every session.  
> For Claude web (Projects), paste the contents into your Project's Custom Instructions.

---

## Framework

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

Use `node tools/fb-lane.js` for all task lifecycle management:

```bash
node tools/fb-lane.js status               # View all tasks and locks
node tools/fb-lane.js claim <id> <lane>    # Claim a task, checkout branch, lock files
node tools/fb-lane.js submit <id>          # Submit for QA, push branch
node tools/fb-lane.js merge <id>           # Merge to main, release locks (FB-Product only)
```

## Rules

- **Never commit directly to `main`** — always work on a feature branch.
- **Commit docs separately** — keep `PROJECT_BOARD.md` updates in their own commit.
- **Run tests before submitting** — the `submit` command does this automatically.
- **Max 5 debug retries** — if tests still fail after 5 attempts, mark task `Blocked` and notify the user.
- **Do not revert others** — if another lane touched a shared file, merge `main` into your branch first.
