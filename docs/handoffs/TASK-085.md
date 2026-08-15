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

Ready to ship — source candidate `b5a5394`. The focused RED/GREEN repair and
root/package suites, targeted candidate preflight, package parity, syntax,
whitespace, and Doctor pass. The
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

Approved brief and decisions: Repair the intake false negative, verify the
packaged plugin, and make the supported reload path ready without disturbing
Unmirror or weakening fail-closed gates.

Confirmed assumptions and approved scope changes: `fb-user` compatibility is
already correct; the approved correction is limited to aligning canonical
selection with the existing ready-like audit contract. The exact consumer
drift discovered by the smoke is routed back to Unmirror Product/BFM.

Branch, source commits, and changed surfaces: Candidate branch
`tech/TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`;
source commit `b5a539451f39f9222612e77b3be606b9b9249f91`;
root scanner/test plus mechanically synchronized packaged mirrors.

Checks, failures, recovery, and results: RED failed exactly on the skipped
Product `Ready to ship` handoff; GREEN passed the focused regression, root and
packaged intake suites, six-workstream/Product contracts, package parity,
syntax, whitespace, targeted candidate preflight, and Doctor. The bounded
Unmirror smoke then failed closed on exact iOS handoff drift.

Review state, direct links, limits, and external gates: Whole-candidate review
found no source defect. See [QA verification](../qa/TASK-085.md) and the
[Unreleased changelog](../../CHANGELOG.md#unreleased). The consumer drift and
exact **Push Live** release boundary remain external gates.

Repository state: Source and evidence are committed in the isolated TASK-085
worktree; canonical `main` contains only the authoritative claim/lock records
and is not merged, pushed, published, or installed with this candidate.

Remaining owner and action: Product/BFM runs candidate preflight and the final
release checkpoint, then stops at Ready to ship. After a future exact **Push
Live**, release installs the exact build, starts a fresh Codex task, reconciles
the stale Product binding and iOS handoff drift, and resumes Unmirror intake.

Changelog: Updated — [Unreleased TASK-085 entry](../../CHANGELOG.md#unreleased).

## Verification Handoff

- Source candidate: `b5a539451f39f9222612e77b3be606b9b9249f91` on the branch above.
- Test plan: [TASK-085 QA](../qa/TASK-085.md).
- Environment: local macOS source worktree; provider-dark; no consumer writes.
- Current Unmirror result: fail-closed `HANDOFF_CONTENT_DRIFT`, documented in
  QA with both exact paths and statuses.
- Manual gate: none for the source repair. A fresh Codex task is required only
  after an authorized installed-plugin replacement.

## Test This Now

Run the focused root and packaged intake-ledger suites plus package parity,
syntax, and whitespace checks listed in [TASK-085 QA](../qa/TASK-085.md).
