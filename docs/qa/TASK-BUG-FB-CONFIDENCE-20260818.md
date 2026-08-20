---
type: fb-qa-evidence
task: TASK-BUG-FB-CONFIDENCE-20260818
lane: fb-bugs
status: reproduced
---

# TASK-BUG-FB-CONFIDENCE-20260818 QA

## Reproduction

At `2026-08-18T01:37:22.686Z`, Product/BFM called the focused suite green while
the exact Unmirror snapshot remained pending. At
`2026-08-18T01:38:57.686Z`, the same focused offline-quarantine path failed with
`TypeError: Cannot set properties of undefined (setting 'handoffs')` after its
fixture was changed.

## Expected

The visible state is **Safely paused** and the intermediate result is described
as `candidate checks passed; exact project proof pending`. Technical recovery
continues without asking James to interpret receipt or quarantine internals.

## Actual

Success-like wording preceded the exact consumer proof and was followed by a
failure in the same named focused path.

## Severity and Boundary

Moderate product-trust defect. No destructive action or release occurred, and
fail-closed behavior remained protective. This evidence does not establish the
runtime repair's eventual correctness; only the exact real-snapshot final
command can do that.
