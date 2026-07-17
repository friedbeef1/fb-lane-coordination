# BFM Two-Speed Efficiency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved two-speed Product/BFM efficiency rules to the existing FB CLI, session ledger, status, documentation, and mirrors.

**Architecture:** Focused helpers classify work, parse Git's worktree registry, summarize the queue, and decide whether verified runtime evidence may be reused. Existing claim, quick, status, session, and submit flows call those helpers; root/package sources and tests stay byte-identical.

**Tech Stack:** Node.js, Git worktrees, Markdown harness, existing JSON project hooks.

## Global Constraints

- Keep Quick BFM Patch internal and fail ambiguous work to Full BFM.
- Keep all public commands and board statuses unchanged.
- Project preflight is optional and runtime-agnostic.
- No global Node pin, release, publication, deployment, merge, or plugin install.

### Task 1: Classification, worktrees, and preflight

- [ ] Add failing focused tests for Quick/Full boundaries, exact matching-worktree reuse, primary `.worktrees` placement, nested-worktree prevention, and optional preflight failure.
- [ ] Add minimal shared helpers and route claim/quick through them.
- [ ] Run focused and mirrored tests green.

### Task 2: Queue and proportional verification

- [ ] Add failing tests for `Current`, `Next ready`, `External blocks`, and explicit empty states.
- [ ] Add failing tests that reuse a verification checkpoint only when later changes are coordination-only.
- [ ] Implement queue rendering and submit-time verification reuse; source/runtime changes continue to run the broad gate.

### Task 3: Documentation and closeout

- [ ] Update canonical/package workflow, sessions, guardrails, BFM guidance, and configuration examples without duplicating a second workflow.
- [ ] Run root/package CLI, session, eval, beginner, positioning, validator, doctor, parity, and whitespace checks.
- [ ] Record exact evidence in TASK-026 and stop before release/publish/install/merge.
