# TASK-053 version-2 independent methodology review

## Verdict

**Rejected as a fair or causal 95% first-pass readiness benchmark.**

The nine saved candidates and their SHA-256 values reproducibly score as
recorded under the frozen version-2 grader. That artifact fact does not
validate the readiness interpretation.

## Blocking findings

| Severity | Finding | Why it matters |
|---|---|---|
| Critical | The hidden input omitted an automated-check state, while the graph-only packet supplied the exact `Ready to ship` and `userInputNeeded: none` answers. | This asymmetry exactly explains all six Vanilla/Broad misses and all three graph passes. |
| Critical | The blocker grader checked only for an actionable blocked record, not that the same unsafe work was absent from `selected`. | An unsafe candidate could receive 8/8 blocker credit. |
| Important | Exact `severity`, `risk`, and blocked-row output keys were not fully defined in the public interface. | Subjects still had to guess hidden schema. |
| Important | Frozen prompts were not retained as per-run treatment receipts. | Executed treatment provenance depended on the orchestration transcript. |
| Important | The arms are complete prompt-package treatments, not a packet-only graph ablation. | Results can compare the named packages, but cannot isolate graph structure as the sole cause. |
| Important | The freeze test did not enforce every declared executable hash. | Later drift could leave the declaration stale while focused tests stayed green. |

## Positive verification

- Commit `6930a134275d14e5f1b277f9677e51cf8e11d299` preceded all
  version-2 runs.
- The declaration’s hashes were manually recomputed and matched.
- Every corrected fixture copy had identical public facts and public tests.
- All nine candidate hashes, grader outcomes, medians, ranges, and ordering
  recomputed exactly.
- Retained local execution evidence corroborated one public-test command,
  no post-test candidate edit, no visible outside access, and solo topology
  for every version-2 subject.
- Version 1 was correctly excluded because its hidden environment key
  invalidated the mandatory 8/8 blocker endpoint.

## Required correction

Publish the complete input/output schema and automated-check state to every
arm, require blocked items to be absent from selected work, derive per-run
treatment receipts mechanically, retain recorded public-test output and
candidate hashes, enforce every freeze hash, freeze again, and run wholly fresh
candidates.

