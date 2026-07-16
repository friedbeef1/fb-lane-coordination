# FB Session Ledger and Eval Loop Implementation Plan

> Execute with BFM, subagent-driven development, test-first behavior changes, task-scoped review after each task, and a final whole-branch review.

## Global constraints

- TASK-023 starts only after TASK-022 passes its complete local verification and task review.
- Root and packaged plugin behavior, source, tests, harness pages, and generated guidance remain aligned.
- The board and task handoff remain source of truth; live session metadata and recaps cannot create competing approval or scope decisions.
- No transcripts, hidden reasoning, hosted storage, external provider, dashboard, autonomous judge, numeric score, CI eval runner, publication, release, deployment, merge, or consumer-repository change.
- New behavior is test-first: observe the focused test fail for the missing behavior before implementation.

## Task 1 — TASK-022 Repository-Local Session Ledger

Implement the approved seven-command session interface: `intake`, `promote`, `status`, `checkpoint`, `recall`, `review`, and `close`. Resolve IDs as CLI flag, `CODEX_THREAD_ID`, then `FB_SESSION_ID`, rejecting unsafe values. Keep intake/sidechats read-only; planning/review require non-default branches; execution additionally requires approved active board work, declared locks, linked handoff, and linked worktree.

Create a focused mirrored `fb-session.cjs` module. Store per-session JSON atomically under the Git common directory with shared mutation locking and bounded dead-process recovery. Support active, blocked, reviewing, closed, and 24-hour computed stale states without releasing locks. Prove at least twelve concurrent promotions/mutations remain valid.

Write durable recaps to `docs/sessions/<session-id>.md`. Checkpoints validate the selected reason, refuse unrelated staging/default branches, commit only the recap and linked handoff, and push the non-default branch. Preserve failed-push commits and mark blocked without force/rebase/rollback. Recall searches committed curated Markdown in HEAD or already-fetched refs and cites exact source/ref/commit. Review emits Markdown to stdout and clipboard only.

Add canonical Task Receipt, Brief Validation, structured failure evidence, reciprocal recap/handoff/Verification Handoff links, completed/blocked/deferred closeout rules, submit enforcement, privacy rejection, and default claim/quick worktrees. Add `docs/fb/sessions.md`, packaged mirror, safe bootstrap routes, doctor checks, setup/removal guidance, focused tests, six-page parity, local bare-remote push smokes, creator-commerce/existing-project smokes, and full local verification.

## Task 2 — TASK-023 Markdown Eval Loop

From TASK-022's verified commit, add `docs/fb/evals.md`, its package mirror, and `docs/evals/eval-record-template.md`; keep the existing agent-behavior scorecard path as a compatibility entry point. Records require stable ID, harness/product type, shadow/advisory/blocking/mechanical authority, trigger/scenario/quality target, must-pass/must-not-happen, evidence, owner, result, failure classification, revision/rerun, promotion/demotion recommendation, and good/bad examples for subjective product evals.

New evals start shadow. Advisory failures require fix or explanation. Blocking failures stop closeout until the documented Product boundary resolves them. Mechanical checks stay deterministic. Product records authority changes; promotion to blocking/mechanical requires explicit approval; nothing self-promotes; no new blocking promotion occurs in this task.

Integrate selected relevant evals with Project Start/Build Brief, BFM checks, Verification Handoff, Test This Now, Task Receipt, verification checkpoint, and session close. Classify build, brief, eval, and environment failures before revision. Add complete Quality Gap records and keep insufficient products at `Checking — product quality target missed`. Close failures only with fresh evidence, root cause, regression case, consistent records/Git, and approval for changed user decisions.

Add the initial harness catalog and reusable product-quality categories. Extend validator/doctor only for deterministic structure, authority transitions, advisory explanations, blocking/mechanical closeout, Quality Gap completeness, regression/rerun evidence, and record consistency. Verify the missing-link harness walkthrough and generic-recommendation creator-commerce walkthrough plus root/package/template/bootstrap seven-page parity and the full local gate.
