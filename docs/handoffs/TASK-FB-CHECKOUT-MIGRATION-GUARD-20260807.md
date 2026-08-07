---
type: fb-lane-handoff
task: TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807
lane: fb-bugs
status: actioned
---

# Checkout migration guard

## Goal Alignment Session

- **Objective:** make checkout migration content-safe, visible, reversible, and impossible to close before task rebind.
- **Key Results:** same-path drift fails closed; noncanonical writes fail before mutation; lifecycle and task-rebind state are visible; existing orphan detection remains intact.
- **Definition of Done:** focused tests, full runtime tests, syntax, package parity, doctor, consumer smoke, and clean diff pass.
- **Gate / Review Point:** local verified candidate only; publication, installation, active-cache replacement, and retirement require explicit James approval.
- **Approval:** approved.
- **Justification:** James approved the Unmirror recovery and generic FB-Lane correction on 2026-08-07.
- **Lane OKR Fit:** aligned.
- **Mini-loop Evidence:** The focused red run reproduced filename-only intake,
  then 13 migration checks passed across SHA drift, unreadable and unique
  sources, lifecycle states, task rebind, status visibility, and pre-mutation
  guards.
- **Evidence Against Product OKR:** None identified.

## Build Brief

- Compare canonical and audit-root handoffs by raw SHA-256 plus task/status.
- Emit `HANDOFF_CONTENT_DRIFT` with roots, hashes, task, and reconciliation action.
- Keep `active`, `quarantined`, `retirement-pending`, and `retired` distinct in a machine-local manifest.
- Make status, claim, handoff routing, and source-write preparation fail `FB_CHECKOUT_NOT_CANONICAL` outside the active checkout.
- Expose current/canonical paths, lifecycle state, unresolved drift, and `awaiting-task-rebind` status.
- Never delete, clean, or retire a checkout implicitly.

## Product/BFM Closeout

- **Status:** Actioned - local candidate verified and committed; publication is
  not authorized.
- **Actioned By:** Product/BFM.
- **Result:** Added raw SHA-256 plus task/status drift detection, hash-bound
  routing receipts, machine-local lifecycle/rebind validation, visible checkout
  status, and fail-closed guards before bootstrap, claim, quick handoff, submit,
  and merge mutations. Root and generated package runtimes are byte-aligned.
- **Evidence:** [QA](../qa/TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807.md);
  focused migration checks 13/13; CLI regression 72/72; sessions 39/39; evals
  19/19; beginner 11/11; efficiency 25/25; package sync 61/61; syntax passed.
- **Remaining:** Explicit Product approval is required before publication,
  installation, active-cache replacement, merge, consumer rollout, or checkout
  retirement.
- **Closeout Note:** The branch is a local candidate only and was not pushed.
- **Loop Learning:** Checkout migration is complete only when content hashes,
  filesystem lifecycle, and visible task rebind agree; matching filenames are
  insufficient.
