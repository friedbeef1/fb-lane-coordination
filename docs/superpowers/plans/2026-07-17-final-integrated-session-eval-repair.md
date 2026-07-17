# Final Integrated Session and Eval Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the five final TASK-022/023 reviewer findings without expanding runtime scope or weakening existing crash, recovery, authority, privacy, and evidence contracts.

**Architecture:** Keep authoritative state transitions inside the existing session and board mutation boundaries, adding one session-scoped lock around checkpoint/close read-validate-write sequences. Extend the existing Markdown eval validator rather than adding a runner, and preserve root/package mirrors as exact copies. MCP claim delegates to the same linked-worktree claim path as CLI so there is one execution contract.

**Tech Stack:** Node.js CommonJS, filesystem-backed Git/session fixtures, Markdown validation, root/package mirrored CLI tests.

## Global Constraints

- Strict regression-first RED/GREEN for every finding.
- Preserve checkpoint crash/resume and failed-push behavior.
- Do not force harness, build, brief, or environment failures into Product Quality Gaps.
- No external action, release, authority promotion, or scope expansion.

---

### Task 1: Atomic same-session lifecycle

**Files:**
- Modify: `tools/fb-session.test.cjs`
- Modify: `tools/fb-session.cjs`
- Mirror both under `plugins/fb-lane-coordination/tools/`

**Interfaces:**
- Consumes: existing clone-wide mutation lock, `checkpointSession`, and `closeSession` state transitions.
- Produces: one session-scoped mutation boundary that serializes authoritative read, validation, pending checkpoint, commit/push completion, and close.

- [ ] Add deterministic two-checkpoint and checkpoint-versus-close concurrency fixtures.
- [ ] Run the focused session suite and preserve the stale-read/state-overwrite RED.
- [ ] Add the smallest session-scoped lock wrapper without weakening stale-lock recovery.
- [ ] Rerun crash/resume, failed-push, concurrency, and complete session suites.

### Task 2: Subjective Product Quality Gap closeout

**Files:**
- Modify: `tools/fb-eval.test.cjs`
- Modify: `tools/fb-session.test.cjs`
- Modify: `tools/fb-eval.cjs`
- Modify: `tools/fb-session.cjs`
- Modify: `docs/fb/evals.md`
- Mirror runtime, tests, and docs under `plugins/fb-lane-coordination/`

**Interfaces:**
- Consumes: `validateQualityGaps`, `assertSelectedEvalCloseout`, failure classification, eval type/judgment/result.
- Produces: selected closeout/doctor enforcement for open failed/blocked subjective Product `Eval failure` only.

- [ ] Add missing, incomplete, private, and complete Quality Gap close/submit regressions plus calibration controls.
- [ ] Capture focused eval/session REDs.
- [ ] Require exact Checking and complete private-safe gap for functional-insufficient subjective Product eval failures.
- [ ] Call Quality Gap validation from selected closeout and retain harness/environment/build controls.

### Task 3: Concrete blocked/deferred close evidence

**Files:**
- Modify: `tools/fb-session.test.cjs`
- Modify: `tools/fb-session.cjs`
- Mirror both under `plugins/fb-lane-coordination/tools/`

**Interfaces:**
- Consumes: promotion-generated recap Closeout and blocked Brief Validation defaults.
- Produces: non-actionable generated placeholders and close validation that requires changed, concrete reason/owner/next action.

- [ ] Add immediate blocked/deferred close regressions.
- [ ] Capture the generic-default acceptance RED.
- [ ] Generate explicit placeholders or compare against recorded baselines.
- [ ] Verify concrete close evidence remains accepted.

### Task 4: MCP linked-worktree claim parity

**Files:**
- Modify: `tools/fb-lane.test.cjs`
- Modify: `tools/fb-lane.cjs`
- Mirror both under `plugins/fb-lane-coordination/tools/`

**Interfaces:**
- Consumes: `fb_lane_claim` MCP request and the existing default linked-worktree CLI claim implementation.
- Produces: MCP response containing task, branch, and worktree details with execution promotion usable from that worktree.

- [ ] Add an MCP claim fixture that asserts linked worktree creation and direct execution promotion.
- [ ] Capture the current-checkout claim RED.
- [ ] Route MCP claim through the shared linked-worktree path while preserving compatibility aliases and board safety.
- [ ] Run root/package CLI and session integration suites.

### Task 5: Resolvable walkthrough anchors

**Files:**
- Modify: `tools/fb-eval.test.cjs`
- Modify: `tools/fb-eval.cjs`
- Modify: `docs/evals/TASK-023-walkthroughs.md`
- Modify: `docs/evals/eval-record-template.md`
- Mirror template/runtime/tests as required.

**Interfaces:**
- Consumes: selected-record evidence references.
- Produces: explicit unique Markdown headings/anchors and resolver-backed validation.

- [ ] Add broken-anchor and valid explicit-anchor regressions.
- [ ] Capture the string-only evidence RED.
- [ ] Add explicit headings for both walkthrough IDs and resolve anchors in selected closeout.
- [ ] Run selected-record, doctor, and mirror parity checks.

### Task 6: Integrated verification and evidence

**Files:**
- Modify only necessary TASK-022/TASK-023 board, index, handoff, workstream, and ignored execution report evidence.

- [ ] Run root/package focused session, eval, and CLI suites plus recovery.
- [ ] Commit implementation from a clean mirrored state.
- [ ] Run the complete validator, doctor, parity, and whitespace gate.
- [ ] Commit durable evidence separately and append the integrated repair report section.

## Self-Review

- Spec coverage: all five findings map one-to-one to Tasks 1-5; Task 6 covers the requested verification and separate commits.
- Placeholder scan: checklist steps describe exact fixtures, behavior, and commands; runtime placeholder wording is an intentional test subject.
- Interface consistency: session locking stays in `fb-session.cjs`; eval quality/anchor validation stays in `fb-eval.cjs`; MCP worktree behavior stays in `fb-lane.cjs`.
