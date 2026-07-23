<!-- fb-lane-start -->
## FB Coordination

This project uses the FB coordination model.

### Mode selection
Default to normal/simple coding for one-thread work with no listed coordination trigger. Escalate only when the objective mentions handoffs, board items, lanes, Product, Design, Business, BFM, coordination files, board-locked files, multiple threads/agents/workstreams, durable context, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets, deploy/staging/live, camera/capture/save/export or another core product flow, or decisions to build, sequence, defer, approve, merge, or release.

Use **FB light** for narrow triggered work: read the board/locks, keep the task lightweight, and avoid extra ceremony. Use **Product/BFM** when sequencing, approval, merge/release, provider/security/payment gates, core UX, or multiple lane outputs must be reconciled before source changes.

### On every session start
1. Read `PROJECT_BOARD.md` — check active tasks and file locks.
2. Read `.codex/current_task.md` if it exists — it contains your task ID, branch, and locked files. Follow it exactly.
3. Confirm your active branch matches the task. If not, stop and notify the user.
4. Never modify files that are locked by another active task.
5. For handoff discovery, read `docs/handoffs/index.md` first and open only the relevant detailed handoff files. If non-quick handoffs exist and the index is missing, stale, or too vague, Product/BFM should create or refresh the compact lookup before sequencing.
6. For lane revisit status, read `docs/workstreams/<lane>.md` after the board and handoff index. Treat it as a summary only, not truth.
7. Before source execution, confirm board/status/locks and the relevant handoff index.

### Lane boundaries
- **FB Tech**: backend, APIs, schemas, tests only. Never touch CSS or layout.
- **FB Design**: CSS, tokens, layout only. Never touch backend logic or schemas.
- **FB Business**: read-only on source code. Write to markdown docs only.
- **FB Product**: direction, sequencing, BFM launch, integration, merges, and deployments. Product is read-only on application/source code and may write coordination markdown only.
- **All workstreams**: plan-only by default. They may ask questions, investigate, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.
- If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, confirm whether to prepare the Product/BFM handoff or execute here as an explicit one-off exception before editing source.
- **Workstream status cards**: Product/BFM refreshes `docs/workstreams/<lane>.md` after executing or explicitly deferring a lane handoff. Returning lanes use it to report already-executed work, pending or blocked work, and evidence links without reopening every detailed handoff.

### Awareness, isolation, integration
- `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup.
- `docs/workstreams/<lane>.md` adds a compact revisit summary; it must not duplicate the board, OKRs, QA logs, plans, or implementation detail.
- Follow `docs/fb/records.md`: each durable fact has one authoritative home; cards, recaps, and chat link instead of copying decisions, scope, or test output.
- Branches/worktrees isolate execution like separate desks.
- BFM integrates outcomes like Product/release review.
- Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.
- During isolated work, name the task, branch/worktree, lane, and locked files. At closeout, report whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If intentionally dirty, record exact files, owner, reason, next gate, and session-boundary action in `PROJECT_BOARD.md`. At the next session boundary, Product/BFM must continue that exact task, commit it, revert it, archive it into a handoff, or mark it `blocked`/`deferred` before starting new source work. If checks touched external services, also report test mode, created records/resources, cleanup evidence, or the pending cleanup gate.

### Sidechat-to-Main Prompt Handoff
Sidechats are discussion and planning spaces by default. Use them to ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready handoff for their originating parent main thread. They do not own board updates, handoff files, source changes, commits, validation, or closeout; Product/BFM retains those execution and durable-record responsibilities.

Parent-thread routing is mandatory: read `docs/sidechat-parent-thread-routing.md` from the project root. Do not infer another destination from role, project, name, recency, or Product/BFM status. If the parent is unavailable, return the handoff to the user; a non-parent main treats it as ordinary user-provided context.

A sidechat prompt is not source of truth until Product/BFM records it in `PROJECT_BOARD.md`, the relevant handoff, or durable docs. Keep tiny questions lightweight: no new command, dashboard, `doctor` expansion, source behavior, or required ceremony is needed for a quick clarification.

Sidechat output format: Decision summary, Scope, Out of scope, Recommended owner/lane, Files/docs likely affected, Acceptance criteria, Gates/risks, Exact instruction for Product/BFM.


### Goal Alignment Session
- For non-trivial work, FB Product/BFM owns the approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream or BFM-target OKR plus stable lane OKRs where relevant.
- BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree.
- `/goal` is a Product/BFM shortcut into this same Goal Alignment Session. It shows, creates, clarifies, or asks approval for the current goal; it must not create a second goal system or a separate `/goals` flow.
- Workstream chats do not own `/goal`; when they prepare a handoff, they propose or challenge goal fit for Product/BFM to reconcile.
- If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKR tree and recommends one; it does not dynamically create or edit OKRs during execution.
- Lane handoffs include `## Goal Alignment Session`, `Product Goal`, `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR`.
- Reuse or clarify approved OKRs; do not generate one per task. Skip this ceremony for `TASK-Q-*` quick tasks.

### BFM return loop
- When processing all lane handoffs, Product/BFM must mark every handoff `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
- Before prioritizing, Product/BFM must run the Story Split Pass: split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work into smaller stories, or say `No split needed`.
- Return to `PROJECT_BOARD.md` after reading handoffs, to each handoff after coding, to source/docs/board after tests, to lane status after board/doc updates, and to `git status` after commit/push with branch/worktree state named.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded.
- Add one loop health flag at closeout: `healthy`, `watch`, `needs Product review`, or `blocked`. Do not numeric-score the loop.
- Add `Loop Learning` at closeout: feedback captured, repeated pattern (`no|yes`), tooling needed (`none|propose guardrail|propose automation|propose eval`), and Product approval needed (`no|yes`).
- When `Loop Learning` chooses `propose eval`, use a small Markdown scorecard under `docs/evals/` with the generic sections from `docs/evals/agent-behavior-scorecard-template.md`. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules without a Product/BFM proposal and explicit user approval.
- Approval autonomy is phased. Phase 1 is Shadow Approval: Product/BFM still asks the user, but records `Would self-approve: yes/no` and the reason. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.
- Once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. Report after closeout, not before every routine step. Stop for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.

### Verification Handoff

Before asking the user to test, Product/BFM adds `## Verification Handoff` to the task handoff with the candidate branch or commit, a Test plan: link, exact commands, environment, results, runnable evidence links, manual pass criteria, and any recovery attempted. Product/BFM records the Next Product/BFM recovery action and completes safe recovery itself. A missing or stalled check remains pending or blocked; the user is asked only for a real approval or external manual, device, or account gate.

Workspace recovery: when Git, file reads, worktrees, or test runners repeatedly stall or return implausible data, run a bounded workspace-health preflight before further claims. It checks available disk capacity against a documented project threshold; unless a stricter policy is documented, use a 15 GiB free-capacity threshold. It also checks File Provider or synchronized-storage ancestry where relevant, stable double-read hashes for representative files, and bounded Git status/diff probes with a 15-second timeout per probe. On a second consecutive failure in the same checkout, stop using it and enter clean-clone recovery. Preserve commits and explicitly owned artifacts through normal Git operations; never copy damaged .git, index, or worktree metadata, and never treat manual object plumbing or an unbounded temporary runner as passing evidence.

### Frontend visual planning
- Frontend/UI plans and handoffs default to a pre-build visual preview.
- Include `Visual Preview Decision`: `browser screenshot/mockup`, `imagegen asset/style option`, or `skip with reason`.
- Use `skip with reason` only for non-visual work, tiny copy, spacing, or single-control fixes.
- Use browser screenshots/mockups for concrete layout, responsive, component, or flow decisions.
- Use imagegen for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options.
- If the plan changes what the user will see and a preview is feasible, create or attach the preview before Product/BFM source execution; Product/BFM blocks or asks only when the preview is missing and the visual decision is material.

### Proactive loop hardening
- Product/BFM should proactively propose one small guardrail when it sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework.
- Proposal format: observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed.
- Do not silently mutate the process. Skip one-off or low-impact issues.

### CLI commands (run from project root)
- `node tools/fb-lane.cjs status` — view all tasks and locks
- `node tools/fb-lane.cjs claim <id> <lane>` — BFM execution worker claims task, checkout branch, lock files
- `node tools/fb-lane.cjs submit <id>` — run tests, push branch, mark Staging QA
- `node tools/fb-lane.cjs merge <id>` — merge to main, release locks (FB Product only)

### Rules
- Never commit directly to `main`.
- Commit `PROJECT_BOARD.md` updates in a separate commit from code changes.
- Max 5 debug retries before marking task `Blocked` and notifying the user.
- If tests, builds, browser checks, `git add`, or `.git/*.lock` files stall Product, record `pending-gate` or `blocked` and return execution to BFM sequencing.
<!-- fb-lane-end -->
