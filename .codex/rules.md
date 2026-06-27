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
- **FB-Product**: direction, Goal Alignment Session OKRs, sequencing, integration, merges, and deployments. Product is read-only on application/source code and may write coordination markdown only.
- **All workstreams**: plan-only by default. They may ask questions, investigate, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.

### Goal Alignment Session
- For non-trivial tasks, FB-Product/BFM owns one canonical Goal Alignment Session block in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`.
- BFM blocks before execution when approval is missing, OKRs are unclear, or handoffs conflict with the approved OKR.
- If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the OKR and recommends one; it does not edit approved OKRs.
- Lane handoffs include `## Goal Alignment Session` and `OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity`.
- Skip this ceremony for `TASK-Q-*` quick tasks.

### CLI commands (run from project root)
- `node tools/fb-lane.cjs status` — view all tasks and locks
- `node tools/fb-lane.cjs claim <id> <lane>` — BFM execution worker claims task, branch, and locks
- `node tools/fb-lane.cjs submit <id>` — BFM execution worker runs tests, pushes branch, marks Staging QA
- `node tools/fb-lane.cjs merge <id>` — merge to main, release locks (FB-Product only)

### Product completion audit
Before saying Tech, Design, Business, or Product handoffs are done, Product/Captain must enumerate active board links plus matching files in `docs/handoffs/`, `docs/superpowers/plans/`, and `docs/superpowers/specs/`. Search for plan titles and implementation markers such as component names, CSS classes, asset names, route names, event names, task titles, and visible labels. Mark every discovered item `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred` before reporting completion.

### BFM return loop
When processing all lane handoffs, Product/BFM must not close until every handoff is marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`. Return to `PROJECT_BOARD.md` after reading handoffs, to each handoff after coding, to source/docs/board after tests, to lane status after board/doc updates, and to `git status` after commit/push. Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded.

### Rules
- Never commit directly to `main`.
- Commit `PROJECT_BOARD.md` updates in a separate commit from code changes.
- Max 5 debug retries before marking task `Blocked` and notifying the user.
<!-- fb-lane-end -->
