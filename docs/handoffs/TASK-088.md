---
type: fb-lane-handoff
task: TASK-088
lane: fb-product
status: in-progress
approval: approved
okr_fit: aligned
record_model: normalized-v1
fb_harness: v3
worktree: /Users/jamesyeang/Projects/fb-lane-coordination/.worktrees/product-TASK-088-exact-receipt-rebind
sensitive: false
work_types: runtime, testing, plugin-package, local-installation
surface: strict onboarding receipt identity
---

# TASK-088 — Exact approved onboarding receipt rebind

## Status

Focused root/package candidate checks pass. Complete clean-candidate validation,
commit, exact local install, fresh-task reload, and Unmirror acceptance remain.
No merge, push, publication, or release is authorized.

## Project Start Brief

The fresh canonical `Unmirror · Product/BFM` task must replace its archived
predecessor in the strict receipt without a hand edit or a weaker duplicate
gate. Every other workstream identity remains unchanged.

## Goal Alignment Session

Product Goal: Resume deterministic Unmirror BFM intake from one exact current
Product/BFM task and seven exact pinned bindings.

Workstream Goal: Add one explicit approval-bound receipt identity repair route.

Lane OKR Fit: aligned.

User Approval Needed: no — James explicitly authorized replacing the predecessor
and continuing every recommended safe local recovery.

Mini-loop Evidence: 0.9.1 proves the exact seven-task native inventory but its
strict planner rejects the missing predecessor ID before it can record the new
Product task. The new regression reproduces that refusal first.

Evidence Against Product OKR: None. Wrong IDs, roles, pins, approval, duplicates,
or multiple-role changes remain blocking.

## Build Brief

- Add a normalized `receiptRebindings` packet containing role, exact prior ID,
  exact replacement ID, and durable approval reference.
- Accept only when the prior ID matches the receipt, is absent from active exact
  inventory, and the replacement is the one exact pinned same-role task.
- Preserve every unaffected binding and existing `attemptedActions` contract.
- Mechanically regenerate the package and install only the exact local build.

## Gates

Stop before merge, push, public publication, or release. Reload a fresh task
after local installation before the Unmirror receipt mutation.
