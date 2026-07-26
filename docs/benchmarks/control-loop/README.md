# FB control-loop benchmark

Experiment: `fb-control-loop-050-20260726`

This is a deterministic simulation. Counts are directly observed deterministic counts from the frozen cases. Token units and elapsed minutes are modeled, not observed Codex usage. See the [machine-readable result](results.json).

| Outcome | Process-all baseline | FB control loop | FB minus baseline |
|---|---:|---:|---:|
| Product-ready rate | 25.0% | 50.0% | 25.0% |
| Unnecessary processing rate | 25.0% | 12.5% | -12.5% |
| Worse candidate attempts | 2 | 1 | -1 |
| Already-good inputs retained as ready | 0/2 | 2/2 | 2 |
| Correct disposition rate | 75.0% | 75.0% | 0.0% |
| Diagnosis accuracy | n/a | 2/4 (50.0%) | n/a |
| Human-decision events | 0 | 1 | 1 |
| Unresolved failures | 6 | 4 | -2 |
| Deterministic work units | 96 | 126 | 30 |
| Modeled token units | 9200 | 11860 | 2660 |
| Modeled elapsed minutes | 17.20 | 21.20 | 4.00 |
| Work units per accepted outcome | 48.0 | 31.5 | -16.5 |
| Modeled token units per accepted outcome | 4600 | 2965 | -1635 |

The frozen set includes an unfavorable FB case: ambiguous routing makes the wrong skip decision while the process-all baseline succeeds. No valid outcome was discarded.

## Directly observed call counts

| Call type | Process-all baseline | FB control loop | FB minus baseline |
|---|---:|---:|---:|
| process | 8 | 6 | -2 |
| comparison | 0 | 6 | 6 |
| qa | 8 | 6 | -2 |
| safety | 0 | 6 | 6 |
| diagnosis | 0 | 4 | 4 |
| repair | 0 | 3 | 3 |
| humanDecision | 0 | 1 | 1 |

## Raw case outcomes

| Case | Arm | Disposition | Accepted | Unnecessary processing | Worse attempt | Delivered artifact | Diagnosis | Result |
|---|---|---|---:|---:|---:|---|---|---|
| good-preserve | baseline | process | no | yes | yes | none | none | rejected by final QA |
| good-preserve | fb-control-loop | skip | yes | no | no | baseline | none | preserved baseline |
| clear-improvement | baseline | process | yes | no | no | transformed-candidate | none | accepted transformed candidate |
| clear-improvement | fb-control-loop | process | yes | no | no | transformed-candidate | none | accepted transformed candidate |
| degradation-trap | baseline | process | no | yes | yes | none | none | rejected by final QA |
| degradation-trap | fb-control-loop | process | yes | yes | yes | baseline | none | comparison preserved better baseline |
| repairable-output | baseline | process | no | no | no | none | none | rejected by final QA |
| repairable-output | fb-control-loop | process | yes | no | no | repair-candidate | Build | accepted bounded repair |
| unresolved-output | baseline | process | no | no | no | none | none | rejected by final QA |
| unresolved-output | fb-control-loop | process | no | no | no | none | Build | bounded repair unresolved |
| ambiguous-wrong-skip | baseline | process | yes | no | no | transformed-candidate | none | accepted transformed candidate |
| ambiguous-wrong-skip | fb-control-loop | skip | no | no | no | none | none | preserved baseline |
| safety-block | baseline | process | no | no | no | none | none | rejected by final QA |
| safety-block | fb-control-loop | process | no | no | no | none | Environment | diagnosed failed candidate |
| misleading-quality | baseline | process | no | no | no | none | none | rejected by final QA |
| misleading-quality | fb-control-loop | process | no | no | no | none | Build | bounded repair unresolved |

## Fixed cost assumptions

These units are declared assumptions, not provider measurements.

| Operation | Work units | Modeled token units | Modeled minutes |
|---|---:|---:|---:|
| process | 10 | 1000 | 2 |
| comparison | 2 | 180 | 0.2 |
| qa | 2 | 150 | 0.15 |
| safety | 1 | 100 | 0.1 |
| diagnosis | 3 | 220 | 0.25 |
| repair | 8 | 800 | 1.5 |
| humanDecision | 0 | 0 | 1 |

A human judgment is calibrated as one modeled attention minute and intentionally has zero agent token and work units because it is human attention, not agent compute.

## Method

Both arms receive the same eight frozen inputs and transformation outcomes. The baseline processes every item once and runs one final QA check. FB routes first, compares candidate and baseline, applies separate quality and safety gates, diagnoses failure, and permits one bounded repair where declared. The FB arm receives only a public projection containing visible observations and declared outcomes. Hidden expected dispositions and failure classes are used only by the grader, never by routing or diagnosis. SHA-256 hashes bind fixtures, settings, cost assumptions, seeds, and grader rules. Aggregates are recomputed from the raw per-case records.

## Pre-registered sensitivity results

Pre-registered seeds `11, 29, 47` vary already-good share (25%, 50%, 75%) and transformation reliability (60%, 80%, 95%). The disclosed FB assumptions are 90.0% comparison accuracy and 94.0% gate accuracy; seeded comparison and gate errors affect outcomes. The machine result preserves every seed and reports median and range; none is selectively rerun.

| Already-good share | Transformation reliability | Arm | Median ready rate | Range | Median processed |
|---:|---:|---|---:|---:|---:|
| 25.0% | 60.0% | baseline | 57.5% | 42.5%–57.5% | 40 |
| 25.0% | 60.0% | fb-control-loop | 77.5% | 70.0%–77.5% | 28 |
| 25.0% | 80.0% | baseline | 77.5% | 75.0%–77.5% | 40 |
| 25.0% | 80.0% | fb-control-loop | 82.5% | 77.5%–85.0% | 29 |
| 25.0% | 95.0% | baseline | 97.5% | 97.5%–97.5% | 40 |
| 25.0% | 95.0% | fb-control-loop | 87.5% | 80.0%–90.0% | 30 |
| 50.0% | 60.0% | baseline | 50.0% | 50.0%–50.0% | 40 |
| 50.0% | 60.0% | fb-control-loop | 75.0% | 72.5%–85.0% | 22 |
| 50.0% | 80.0% | baseline | 70.0% | 70.0%–80.0% | 40 |
| 50.0% | 80.0% | fb-control-loop | 85.0% | 82.5%–95.0% | 21 |
| 50.0% | 95.0% | baseline | 95.0% | 95.0%–97.5% | 40 |
| 50.0% | 95.0% | fb-control-loop | 92.5% | 82.5%–95.0% | 20 |
| 75.0% | 60.0% | baseline | 65.0% | 55.0%–72.5% | 40 |
| 75.0% | 60.0% | fb-control-loop | 87.5% | 85.0%–95.0% | 10 |
| 75.0% | 80.0% | baseline | 82.5% | 77.5%–82.5% | 40 |
| 75.0% | 80.0% | fb-control-loop | 95.0% | 95.0%–95.0% | 15 |
| 75.0% | 95.0% | baseline | 95.0% | 95.0%–97.5% | 40 |
| 75.0% | 95.0% | fb-control-loop | 95.0% | 90.0%–95.0% | 10 |

The sensitivity results preserve every setting where the baseline wins: 25% already-good and 95% reliability (97.5% baseline versus 87.5% FB); 50% already-good and 95% reliability (95.0% baseline versus 92.5% FB). When transformation is already extremely reliable, routing, comparison, or gate errors can outweigh the loop's benefit.

## Evidence hashes

| Frozen input | SHA-256 |
|---|---|
| truth | `71a6e1243e41193200fe5aa2fdf8e005f0016119d0dae02f62689d7aaee6a410` |
| settings | `4cf5370a58a716d1b4bdf5eaeb2c5cb1d6568a3ac2bcb84dc830ebde470b3f81` |
| costModel | `012901a8e8311474bcaed165b9382f4dab38c9ea6281820588c31849acabe10e` |
| grader | `2dd82cbe9b371dc82f350e3a09ef81859b5c7378e50441a6d6cfc9952916fada` |
| seeds | `8c3598742bd3db5b46521974773964aca87fb75c16a00efa90781758078b03fd` |

## Limitations

This experiment does not establish actual Codex token savings, wall-clock savings, human-attention savings, production behavior, or population-wide percentages. The token and time figures depend entirely on the disclosed fixed cost model. Sensitivity outcomes depend on the disclosed router, comparison, gate, and repair-success assumptions; they are not measured production accuracies. The compact fixture set demonstrates mechanism-level tradeoffs, not general market performance.
