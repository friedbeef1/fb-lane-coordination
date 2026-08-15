---
type: fb-lane-handoff
task: TASK-085
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
fb_harness: v3
worktree: .worktrees/tech-TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin
sensitive: false
work_types: tooling, reliability
surface: canonical BFM intake scanner and packaged Codex plugin
---

# TASK-085 — Six-workstream intake false-negative repair

## Status

Ready to ship — candidate `075d5e8`. The focused RED/GREEN repair and
root/package suites pass. The
bounded Unmirror consumer scan now returns the next fail-closed gate:
`HANDOFF_CONTENT_DRIFT` between the canonical iOS `Device QA` record and its
retained implementation worktree's `Ready` record.

## Product Start Brief

Let Unmirror Product/BFM freeze all current intake without losing the User
handoff or already verified Ready-to-ship candidates.

## Goal Alignment Session

Product Goal: Keep the six-workstream intake complete, fail-closed, and usable
from the exact installed runtime.

Workstream Goal: Align canonical selection with the audit's existing
ready-like status contract while retaining current User compatibility.

Lane OKR Fit: aligned.

User Approval Needed: no — James explicitly authorized the repair and local
upgrade on 2026-08-15.

Mini-loop Evidence: A behavioral regression reproduces the exact
`READINESS_FALSE_NEGATIVE`; the minimal shared status predicate turns it green
in both root and packaged runtimes.

Evidence Against Product OKR: The candidate-runtime scan against the full
Unmirror checkout stops on exact same-path iOS handoff drift, so consumer intake
is not yet claimed as passing.

## Reconciled root cause

`fb-user` already maps correctly into the historical Product scanner slot. The
defect was narrower: canonical selection accepted only exact `ready`, while
the audit's ready-like detector also recognized `Ready to ship`. The audit
therefore rejected a valid Product handoff that selection had skipped.

## Build Brief

- Reuse one shared ready-status predicate for canonical selection and audit
  recognition.
- Prove one User `Ready` record and one Product `Ready to ship` record are both
  selected.
- Preserve duplicate-task, cross-root drift, exact-project, onboarding, and
  disposition gates.
- Synchronize package mirrors only after the root regression is green.
- Do not mutate Unmirror, installed cache, task bindings, credentials, or
  provider state from the implementation worktree.

Changelog expectation: Required — record candidate-faithful Unreleased wording;
versioning and release wording remain owned by a later explicit Push Live.

## Gate

James authorized the repair and local upgrade. The candidate must still stop
before merge, push, public marketplace publication, or release because the
current conversation does not contain the exact **Push Live** authorization.

## Task Receipt

- Approved brief: repair the intake false negative, verify the packaged plugin,
  and make the supported reload path ready without disturbing Unmirror.
- Branch: `tech/TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`.
- Locked source: `tools/fb-lane.cjs`,
  `tools/fb-bfm-intake-ledger.test.cjs`, and generated
  `plugins/fb-lane-coordination/` mirrors.
- Candidate: `075d5e8bff5d7ad313924d759f53a78df3d68275`.
- Verification: [TASK-085 QA](../qa/TASK-085.md).
- Consumer gate: reconcile the retained iOS worktree's `Ready` handoff with the
  canonical `Device QA` handoff through Unmirror Product/BFM; do not delete or
  overwrite either record blindly.
- Release boundary: no merge, push, publication, installation, or release has
  occurred.

## Verification Handoff

- Candidate: `075d5e8bff5d7ad313924d759f53a78df3d68275` on the branch above.
- Test plan: [TASK-085 QA](../qa/TASK-085.md).
- Environment: local macOS source worktree; provider-dark; no consumer writes.
- Current Unmirror result: fail-closed `HANDOFF_CONTENT_DRIFT`, documented in
  QA with both exact paths and statuses.
- Manual gate: none for the source repair. A fresh Codex task is required only
  after an authorized installed-plugin replacement.

## Test This Now

Run the focused root and packaged intake-ledger suites plus package parity,
syntax, and whitespace checks listed in [TASK-085 QA](../qa/TASK-085.md).
