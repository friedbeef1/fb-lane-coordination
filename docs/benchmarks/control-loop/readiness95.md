# TASK-053 — Hardened 95% readiness benchmark

## Outcome

**Result: parity on the fixed benchmark.**

Vanilla, Broad FB, and Preventive Graph FB each met the predefined gate in all
three repetitions:

- at least 19 of 20 deliverable criteria; and
- all 8 mandatory blocker criteria.

Every recorded run actually scored 20/20 deliverables and 8/8 blockers. The
correct conclusion is not that FB beat vanilla. It is that a complete,
unambiguous public interface was sufficient for all three treatments on this
synthetic scenario.

| Arm | Combined passes | Deliverables, median (range) | Blockers, median (range) | Median elapsed (range) | Result |
|---|---:|---:|---:|---:|---|
| Vanilla | 3/3 | 20/20 (20–20) | 8/8 (8–8) | 207.61 s (161.28–266.11) | Met fixed 95% gate |
| Broad FB | 3/3 | 20/20 (20–20) | 8/8 (8–8) | 228.74 s (221.86–457.10) | Met fixed 95% gate |
| Preventive Graph FB | 3/3 | 20/20 (20–20) | 8/8 (8–8) | 189.06 s (158.68–217.08) | Met fixed 95% gate |

The graph median was 8.93% faster than vanilla and 17.35% faster than Broad
FB; Broad FB was 10.18% slower than vanilla. These are secondary local timings
from three runs per arm. Subject-selected topology varied, including one Broad
FB run with two read-only subagents that took 457.10 seconds. The timings are
not a reliable speed claim.

## What changed before this counted run

Two earlier nine-run executions are preserved but excluded:

1. Version 1 hid the exact unavailable-environment field, so it measured schema
   guessing.
2. Version 2 gave the graph treatment two scored answers unavailable to the
   other arms and allowed blocked work to remain selected.

Version 3 fixed those flaws before any counted subject ran:

- every scored field and output shape was public to all arms;
- `automatedChecksPassed: true` was common input;
- the graph packet contained only summaries entailed by the public documents;
- every blocker required an actionable record and absence from `selected`;
- frozen hashes covered the fixture, prompts, grader, hidden contract, test,
  one-shot runner, starting candidate, and package manifest;
- each fresh run received a mechanically derived treatment receipt;
- each subject produced one candidate, ran one recorded public test, and could
  not repair afterward.

An independent bounded [pre-run review](readiness95-v3-pre-run-review.md)
returned **GO** with zero Critical and zero Important findings.
An independent [result review](readiness95-v3-independent-review.md) returned
**ACCEPT** with zero Critical and zero Important findings after mechanically
regrading and rebinding all nine saved runs.

## Counted runs

| Run | Arm | Order | Deliverables | Blockers | Public test | Agents spawned | Elapsed | Combined pass |
|---|---|---:|---:|---:|---:|---:|---:|---|
| R1 | Vanilla | 1 | 20/20 | 8/8 | Pass | 0 | 207.61 s | Yes |
| R1 | Broad FB | 2 | 20/20 | 8/8 | Pass | 2 | 457.10 s | Yes |
| R1 | Preventive Graph FB | 3 | 20/20 | 8/8 | Pass | 0 | 217.08 s | Yes |
| R2 | Broad FB | 1 | 20/20 | 8/8 | Pass | 0 | 228.74 s | Yes |
| R2 | Preventive Graph FB | 2 | 20/20 | 8/8 | Pass | 0 | 189.06 s | Yes |
| R2 | Vanilla | 3 | 20/20 | 8/8 | Pass | 0 | 161.28 s | Yes |
| R3 | Preventive Graph FB | 1 | 20/20 | 8/8 | Pass | 0 | 158.68 s | Yes |
| R3 | Vanilla | 2 | 20/20 | 8/8 | Pass | 1 | 266.11 s | Yes |
| R3 | Broad FB | 3 | 20/20 | 8/8 | Pass | 0 | 221.86 s | Yes |

All candidate hashes matched their recorded public-test evidence. All treatment
receipt hashes matched preflight and test evidence. No run repaired or changed
its candidate after testing.

## What this tells us

The benchmark supports three narrow conclusions:

1. All three treatments can reach the fixed 95% readiness threshold without a
   repair loop when given a complete public contract.
2. Preventive graph guidance did not improve the measured quality outcome,
   because vanilla and Broad FB also achieved every criterion.
3. Clear, complete context appears more important than adding coordination
   ceremony for this small, self-contained implementation problem.

This result does **not** justify removing FB. The fixture does not exercise the
main situations where FB is intended to help: long-lived decisions, multiple
independently evolving workstreams, cross-session reconciliation, user
attention, or release ownership.

## Decision

Do not add more FB process, change the plugin, or publish a superiority claim
from this result. Keep the hardened benchmark as parity evidence. A future
incremental-benefit study would need a pre-registered, real-project workflow
with genuine cross-session state and decision changes; it should run only if
that evidence would change a product decision.

## Evidence and limitations

- [Machine-readable results](readiness95-results.json)
- [Frozen declaration](readiness95-frozen-declaration.json)
- [Treatment prompts](readiness95-prompts.json)
- [Version 2 rejection](readiness95-v2-rejected.md)
- [Independent result review](readiness95-v3-independent-review.md)
- [Hidden contract](../../../tools/fixtures/fb-readiness95-hidden-contract.json)
- [Grader](../../../tools/fb-readiness95-grader.cjs)

Limits:

- one synthetic fixture and three independent repetitions per arm;
- composite prompt-package comparison, not a pure graph ablation;
- exact provider model identifier, tokens, and cost were unavailable;
- wall-clock orchestration timing includes topology variability;
- passing means readiness against this frozen rubric, not 95% of real-world
  product work;
- no token-saving, production-readiness, or universal-superiority claim.
