<!-- fb-lane-start -->
## FB-Lane Coordination

This project uses the FB-Lane Four-Lane Coordination Model.

### Mode selection
Default to normal/simple coding for one-thread work with no listed coordination trigger. Escalate only when the objective mentions handoffs, board items, lanes, Product, Design, Business, BFM, coordination files, board-locked files, multiple threads/agents/workstreams, durable context, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets, deploy/staging/live, camera/capture/save/export or another core product flow, or decisions to build, sequence, defer, approve, merge, or release.

Use **FB-Lane light** for narrow triggered work: read the board/locks, keep the task lightweight, and avoid extra ceremony. Use **Product/BFM** when sequencing, approval, merge/release, provider/security/payment gates, core UX, or multiple lane outputs must be reconciled before source changes.

### On every session start
1. Read `PROJECT_BOARD.md` — check active tasks and file locks.
2. Read `.codex/current_task.md` if it exists — it contains your task ID, branch, and locked files. Follow it exactly.
3. Confirm your active branch matches the task. If not, stop and notify the user.
4. Never modify files that are locked by another active task.
5. For handoff discovery, read `docs/handoffs/index.md` first and open only the relevant detailed handoff files. If non-quick handoffs exist and the index is missing, stale, or too vague, Product/BFM should create or refresh the compact lookup before sequencing.
6. Before source execution, confirm board/status/locks and the relevant handoff index.

### Lane boundaries
- **FB-Tech**: backend, APIs, schemas, tests only. Never touch CSS or layout.
- **FB-Design**: CSS, tokens, layout only. Never touch backend logic or schemas.
- **FB-Business**: read-only on source code. Write to markdown docs only.
- **FB-Product**: direction, sequencing, BFM launch, integration, merges, and deployments. Product is read-only on application/source code and may write coordination markdown only.
- **All workstreams**: plan-only by default. They may ask questions, investigate, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.

### Awareness, isolation, integration
- `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup.
- Branches/worktrees isolate execution like separate desks.
- BFM integrates outcomes like Product/release review.
- Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.
- During isolated work, name the task, branch/worktree, lane, and locked files. At closeout, report whether the branch/worktree is clean, merged, stale, blocked, or intentionally left open. If checks touched external services, also report test mode, created records/resources, cleanup evidence, or the pending cleanup gate.

### Goal Alignment Session
- For non-trivial work, FB-Product/BFM owns the approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream or BFM-target OKR plus stable lane OKRs where relevant.
- BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree.
- If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKR tree and recommends one; it does not dynamically create or edit OKRs during execution.
- Lane handoffs include `## Goal Alignment Session`, `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR`.
- Reuse or clarify approved OKRs; do not generate one per task. Skip this ceremony for `TASK-Q-*` quick tasks.

### BFM return loop
- When processing all lane handoffs, Product/BFM must mark every handoff `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
- Return to `PROJECT_BOARD.md` after reading handoffs, to each handoff after coding, to source/docs/board after tests, to lane status after board/doc updates, and to `git status` after commit/push with branch/worktree state named.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded.
- Add one loop health flag at closeout: `healthy`, `watch`, `needs Product review`, or `blocked`. Do not numeric-score the loop.

### CLI commands (run from project root)
- `node tools/fb-lane.cjs status` — view all tasks and locks
- `node tools/fb-lane.cjs claim <id> <lane>` — BFM execution worker claims task, checkout branch, lock files
- `node tools/fb-lane.cjs submit <id>` — run tests, push branch, mark Staging QA
- `node tools/fb-lane.cjs merge <id>` — merge to main, release locks (FB-Product only)

### Rules
- Never commit directly to `main`.
- Commit `PROJECT_BOARD.md` updates in a separate commit from code changes.
- Max 5 debug retries before marking task `Blocked` and notifying the user.
- If tests, builds, browser checks, `git add`, or `.git/*.lock` files stall Product, record `pending-gate` or `blocked` and return execution to BFM sequencing.
<!-- fb-lane-end -->
