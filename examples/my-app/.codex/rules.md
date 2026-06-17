<!-- fb-lane-start -->
## FB-Lane Coordination

This project uses the FB-Lane Four-Lane Coordination Model.

### On every session start
1. Read `PROJECT_BOARD.md` — check active tasks and file locks.
2. Read `.codex/current_task.md` if it exists — it contains your task ID, branch, and locked files. Follow it exactly.
3. Confirm your active branch matches the task. If not, stop and notify the user.
4. Never modify files that are locked by another active task.

### Lane boundaries
- **FB-Tech**: backend, APIs, schemas, tests only. Never touch CSS or layout.
- **FB-Design**: CSS, tokens, layout only. Never touch backend logic or schemas.
- **FB-Business**: read-only on source code. Write to markdown docs only.
- **FB-Product**: orchestrates merges and deployments only.

### CLI commands (run from project root)
- `node tools/fb-lane.cjs status` — view all tasks and locks
- `node tools/fb-lane.cjs claim <id> <lane>` — claim task, checkout branch, lock files
- `node tools/fb-lane.cjs submit <id>` — run tests, push branch, mark Staging QA
- `node tools/fb-lane.cjs merge <id>` — merge to main, release locks (FB-Product only)

### Rules
- Never commit directly to `main`.
- Commit `PROJECT_BOARD.md` updates in a separate commit from code changes.
- Max 5 debug retries before marking task `Blocked` and notifying the user.
<!-- fb-lane-end -->
