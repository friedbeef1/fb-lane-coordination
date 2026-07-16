# Submit Lifecycle Serialization Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serialize CLI and MCP submit's final validation, board commit, and push with checkpoint, close, and review mutations for the same session.

**Architecture:** Export one narrow synchronous session transaction from `fb-session.cjs`. It identifies the task's execution session, acquires that session's existing Git-common mutation lock, revalidates `assertSubmitReady` inside the lock, activates the deterministic lifecycle gate, and runs only the final submit mutation callback. Pre-submit hooks and tests remain outside the lock; unrelated sessions retain independent locks.

**Tech Stack:** Node.js CommonJS, synchronous Git CLI, Markdown fixtures, root/package mirrors.

## Global Constraints

- Strict regression-first implementation.
- Preserve final authority revalidation after hooks/tests.
- Preserve failed-push recovery and dead-owner lock recovery.
- Do not lock unrelated sessions.
- Keep root/package files byte-identical.
- No external action.

---

### Task 1: Deterministic concurrency REDs

**Files:**
- Modify: `tools/fb-session.test.cjs`
- Mirror after GREEN: `plugins/fb-lane-coordination/tools/fb-session.test.cjs`

**Interfaces:**
- Consumes: existing `FB_SESSION_TEST_LIFECYCLE_GATE`, `spawnRun`, `mcpCall`, session checkpoint/close commands.
- Produces: submit-versus-close, submit-versus-blocking-checkpoint, and close-wins-first regressions.

- [ ] Add a CLI submit fixture that pauses after final validation, starts completed close, and proves submit commits/pushes before close completes.
- [ ] Add an MCP submit fixture that pauses after final validation, starts a blocking checkpoint, and proves the submit commit is an ancestor of the later checkpoint push.
- [ ] Add CLI and MCP close-wins-first fixtures that prove submit fails before board mutation or push.
- [ ] Run `node tools/fb-session.test.cjs`; expect failure because submit never enters the lifecycle gate.

### Task 2: Narrow submit transaction GREEN

**Files:**
- Modify: `tools/fb-session.cjs`
- Modify: `tools/fb-lane.cjs`
- Mirror: corresponding files under `plugins/fb-lane-coordination/tools/`

**Interfaces:**
- Produces: `withSubmitLifecycleTransaction(cwd, taskId, fn, env)`.
- Contract: select the sole active execution session, acquire its per-session lock, rerun `assertSubmitReady`, pause at the deterministic lifecycle gate, then invoke `fn(record)` while still locked.

- [ ] Export the transaction helper without exposing the generic lock.
- [ ] Wrap CLI final board update/commit/push in the helper.
- [ ] Wrap MCP final board update/commit/push in the helper.
- [ ] Keep initial validation, hooks, and tests before the final transaction.
- [ ] Run focused root/package session tests and confirm all concurrency cases pass.

### Task 3: Full verification and evidence

**Files:**
- Modify: `PROJECT_BOARD.md`
- Modify: `docs/handoffs/index.md`
- Modify: `docs/handoffs/TASK-022.md`
- Modify: `docs/handoffs/TASK-023.md`
- Modify: `docs/workstreams/fb-product.md`
- Update ignored report: `.superpowers/sdd/task-2-report.md`

- [ ] Run root/package session, eval, and legacy CLI suites.
- [ ] Run recovery, complete validator, doctor/parity/whitespace, and selected closeout checks.
- [ ] Commit implementation.
- [ ] Record exact counts and the no-external-action boundary.
- [ ] Commit evidence separately.
