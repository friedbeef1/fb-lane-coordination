---
type: fb-lane-handoff
task: TASK-BUG-FB-CONFIDENCE-20260818
lane: fb-bugs
status: accepted
okr_fit: aligned
---

# TASK-BUG-FB-CONFIDENCE-20260818 — Smooth, trustworthy FB-Lane recovery reporting

Date: 2026-08-18
Owner: Product / BFM
Source: FB · Bugs; direct user feedback

## Purpose

Restore confidence in FB-Lane by keeping internal safety machinery out of the
ordinary user journey and by preventing success-like progress statements before
the exact real project snapshot has passed the same verification boundary.

## Observable Defect

Product/BFM described an intermediate focused result as green while the exact
105-handoff Unmirror/MirrorCam snapshot remained pending. The same focused
offline-quarantine test then failed after its fixture changed. Safety remained
fail-closed, but the progress wording communicated confidence before the
evidence checkpoint was stable.

## Goal Alignment Session

Product Goal: Make FB-Lane a reliable control centre that safely coordinates
work without requiring the user to understand its internals.

Workstream Goal: Prevent premature success language and warning-heavy recovery
narration.

Lane OKR Fit: aligned.

User Approval Needed: no for Product intake and local candidate work; existing
release gates remain unchanged.

Mini-loop Evidence: Timestamped Product/BFM wording was followed by a failure
of the same named focused path.

Evidence Against Product OKR: James explicitly reported reduced confidence and
an experience that did not feel smooth.

## Product Contract

Ordinary progress exposes only **Ready**, **Safely paused**, or **Need your
decision**. Ready requires exact-real-snapshot proof. Fixture-only success is
reported as `candidate checks passed; exact project proof pending`. Any later
edit or failure supersedes the prior claim. Technical receipt, quarantine,
hash, and drift evidence remains complete in diagnostics and QA.

## Acceptance Criteria

- No consumer success wording before the exact real snapshot passes the same
  final command and no later mutation invalidates it.
- Later failure returns the visible state to **Safely paused**.
- **Need your decision** is reserved for a genuine authority boundary.
- Automated contracts cover all three states and the exact-project boundary.
- Fail-closed safety is unchanged.

## Product/BFM Closeout

Status: Accepted — absorbed into TASK-087.

Actioned By: FB-Product / BFM.

Result: TASK-087 now owns the three-state user contract, exact-project
completion boundary, canonical/package guidance, and structural regression.

Evidence: [Bugs QA](../qa/TASK-BUG-FB-CONFIDENCE-20260818.md) and
[TASK-087 QA](../qa/TASK-087.md).

Remaining: Exact local install and real Unmirror freeze must pass before the
visible state can become **Ready**.

Closeout Note: No fail-closed check or release boundary changed.

Loop Learning: Intermediate fixture proof is candidate evidence, never
consumer-ready evidence.
