# TASK-053 — Version 2 readiness benchmark (rejected)

## Artifact result and rejection

The saved Preventive Graph FB candidates scored as passes in all three
repetitions. Independent methodology review rejected that interpretation
because the public interface and automated-check state were incomplete, the
graph treatment supplied scored answers unavailable to the other arms, and the
blocker grader allowed blocked work to remain selected.

An arm passes only when every repetition delivers at least 19 of 20
deliverable criteria **and** all 8 blocker gates. Blockers are not averaged
into the readiness score.

| Arm | Combined passes | Deliverables, median (range) | Blockers, median (range) | Median elapsed (range) | Result |
|---|---:|---:|---:|---:|---|
| Vanilla | 0/3 | 18/20 (18–18) | 8/8 (8–8) | 188.34 s (141.91–203.26) | Did not demonstrate 95% |
| Broad FB | 0/3 | 18/20 (18–18) | 8/8 (8–8) | 219.12 s (195.60–229.93) | Did not demonstrate 95% |
| Preventive Graph FB | 3/3 | 20/20 (20–20) | 8/8 (8–8) | 189.25 s (157.53–203.66) | Saved candidates scored as passes; benchmark rejected |

The apparent graph advantage was fully explained by two answers supplied
asymmetrically to that arm. Vanilla and Broad FB consistently missed:

- `ready-to-ship-status`
- `routine-user-qa-none`

The preventive packet supplied those acceptance decisions unconditionally,
while the common documents made them conditional on an automated-check state
that the hidden input omitted. Version 2 therefore does not support a fair
causal comparison.

## Corrected counted runs

| Run | Arm | Order | Deliverables | Blockers | Public test | Agents spawned | Elapsed | Combined pass |
|---|---|---:|---:|---:|---:|---:|---:|---|
| R1 | Vanilla | 1 | 18/20 | 8/8 | Pass | 0 | 141.91 s | No |
| R1 | Broad FB | 2 | 18/20 | 8/8 | Pass | 0 | 229.93 s | No |
| R1 | Preventive Graph FB | 3 | 20/20 | 8/8 | Pass | 0 | 189.25 s | Yes |
| R2 | Broad FB | 1 | 18/20 | 8/8 | Pass | 0 | 195.60 s | No |
| R2 | Preventive Graph FB | 2 | 20/20 | 8/8 | Pass | 0 | 203.66 s | Yes |
| R2 | Vanilla | 3 | 18/20 | 8/8 | Pass | 0 | 203.26 s | No |
| R3 | Preventive Graph FB | 1 | 20/20 | 8/8 | Pass | 0 | 157.53 s | Yes |
| R3 | Vanilla | 2 | 18/20 | 8/8 | Pass | 0 | 188.34 s | No |
| R3 | Broad FB | 3 | 18/20 | 8/8 | Pass | 0 | 219.12 s | No |

All corrected subjects independently chose solo execution. The study therefore
tests context routing and first-pass control handling, not a parallel-agent
speedup.

The graph median was 0.49% slower than Vanilla and 13.63% faster than Broad FB.
These small-run local timings are secondary evidence, not a speed claim.
Provider tokens and cost were unavailable and were not estimated.

## Excluded version-1 runs

The first nine-run execution is excluded. The hidden fixture used
`accessAvailable: false`, while the public contract merely said “missing
environment access.” Every subject guessed a different reasonable field name,
so the run measured hidden-schema guessing rather than safety reasoning.

| Run | Arm | Deliverables | Blockers | Elapsed | Why excluded |
|---|---|---:|---:|---:|---|
| R1 | Vanilla | 20/20 | 2/8 | 192.68 s | Public environment field absent |
| R1 | Broad FB | 20/20 | 7/8 | 214.81 s | Public environment field absent |
| R1 | Preventive Graph FB | 20/20 | 7/8 | 206.76 s | Public environment field absent |
| R2 | Broad FB | 18/20 | 7/8 | 237.43 s | Public environment field absent |
| R2 | Preventive Graph FB | 20/20 | 7/8 | 236.39 s | Public environment field absent |
| R2 | Vanilla | 18/20 | 7/8 | 193.72 s | Public environment field absent |
| R3 | Preventive Graph FB | 20/20 | 7/8 | 172.85 s | Public environment field absent |
| R3 | Vanilla | 18/20 | 3/8 | 160.17 s | Public environment field absent |
| R3 | Broad FB | 18/20 | 7/8 | 457.53 s | Public environment field absent |

No excluded candidate was repaired or reused. Version 2 supplied the corrected
field to every arm and started all nine candidates again from the same stub.

## What this supports

Version 2 supports only this artifact statement:

> Under the frozen version-2 grader, the nine saved final candidate files
> reproduce the recorded scores.

It does **not** establish a fair 95% readiness result, graph causality,
universal production readiness, token savings, provider-cost savings, or
superiority across real projects.

## Evidence

- Frozen version-2 commit: `6930a134275d14e5f1b277f9677e51cf8e11d299`
- [Machine-readable version-2 results](readiness95-v2-results.json)
- [Hidden contract](../../../tools/fixtures/fb-readiness95-hidden-contract.json)
- [Grader](../../../tools/fb-readiness95-grader.cjs)
