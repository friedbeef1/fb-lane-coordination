# FB three-arm graduated-control benchmark

Experiment: `fb-graduated-control-050-20260726`

This deterministic simulation compares Process-all, Full FB, and Graduated FB across four mixed-complexity scenarios with 24 sequential cases each: 96 cases per arm per seed, 288 cases per arm, and 864 arm/case records overall. Seeds are 11, 29, and 47. Outcomes are simulator observations. Token units and elapsed time are modeled, not observed Codex usage. See the [machine-readable evidence](graduated-results.json) and the earlier [fixed-treatment benchmark](README.md).

## Headline results

| Arm | Product-ready | Work units | Modeled token units | Modeled minutes | Tokens per ready outcome | Unnecessary processing | Unresolved failures |
|---|---:|---:|---:|---:|---:|---:|---:|
| Process-all | 192/288 (66.7%) | 3168 | 313920 | 604.8 | 1635 | 84 | 96 |
| Full FB | 226/288 (78.5%) | 4135 | 385740 | 643.2 | 1707 | 9 | 62 |
| Graduated FB | 213/288 (74.0%) | 3472 | 328390 | 575.4 | 1542 | 28 | 75 |

Graduated FB recorded 38.9% graduation accuracy, 106 false graduations, 70 missed graduations, 7/36 step-down successes, and 100.0% immediate safety-trigger response.

## Scenario results

| Scenario | Arm | Ready rate | Modeled token units | Unresolved failures |
|---|---|---:|---:|---:|
| media | Process-all | 66.7% | 78480 | 24 |
| media | Full FB | 80.6% | 98880 | 14 |
| media | Graduated FB | 75.0% | 76570 | 18 |
| product | Process-all | 66.7% | 78480 | 24 |
| product | Full FB | 76.4% | 91060 | 17 |
| product | Graduated FB | 72.2% | 83230 | 20 |
| software | Process-all | 66.7% | 78480 | 24 |
| software | Full FB | 80.6% | 101920 | 14 |
| software | Graduated FB | 77.8% | 87370 | 16 |
| support | Process-all | 66.7% | 78480 | 24 |
| support | Full FB | 76.4% | 93880 | 17 |
| support | Graduated FB | 70.8% | 81220 | 21 |

## Phase results

| Phase | Arm | Ready rate | Modeled token units | Repairs |
|---|---|---:|---:|---:|
| clean-start | Process-all | 100.0% | 39240 | 0 |
| clean-start | Full FB | 100.0% | 42400 | 0 |
| clean-start | Graduated FB | 100.0% | 39240 | 0 |
| growing-volume | Process-all | 100.0% | 52320 | 0 |
| growing-volume | Full FB | 93.8% | 54000 | 0 |
| growing-volume | Graduated FB | 93.8% | 44910 | 0 |
| first-regression | Process-all | 66.7% | 39240 | 0 |
| first-regression | Full FB | 94.4% | 21120 | 0 |
| first-regression | Graduated FB | 94.4% | 23240 | 0 |
| repeated-failure | Process-all | 0.0% | 52320 | 0 |
| repeated-failure | Full FB | 25.0% | 109340 | 34 |
| repeated-failure | Graduated FB | 16.7% | 72680 | 13 |
| sensitive-event | Process-all | 33.3% | 39240 | 0 |
| sensitive-event | Full FB | 63.9% | 69000 | 12 |
| sensitive-event | Graduated FB | 52.8% | 70960 | 12 |
| repaired-stability | Process-all | 75.0% | 52320 | 0 |
| repaired-stability | Full FB | 83.3% | 65720 | 10 |
| repaired-stability | Graduated FB | 75.0% | 54600 | 8 |
| step-down-opportunity | Process-all | 100.0% | 39240 | 0 |
| step-down-opportunity | Full FB | 100.0% | 24160 | 0 |
| step-down-opportunity | Graduated FB | 97.2% | 22760 | 0 |

## Seed ranges

The table preserves all three seed outcomes; no unfavorable result was removed or rerun. Process-all beat Graduated FB in product seed 11 (66.7% process-all versus 62.5% graduated); support seed 11 (66.7% process-all versus 62.5% graduated). Full FB had the highest aggregate and per-scenario ready rate, at greater modeled cost.

| Seed | Arm | Ready rate | Modeled token units | Tokens per ready outcome |
|---:|---|---:|---:|---:|
| 11 | Process-all | 66.7% | 104640 | 1635 |
| 11 | Full FB | 80.2% | 131660 | 1710 |
| 11 | Graduated FB | 70.8% | 102740 | 1511 |
| 29 | Process-all | 66.7% | 104640 | 1635 |
| 29 | Full FB | 80.2% | 130660 | 1697 |
| 29 | Graduated FB | 75.0% | 114080 | 1584 |
| 47 | Process-all | 66.7% | 104640 | 1635 |
| 47 | Full FB | 75.0% | 123420 | 1714 |
| 47 | Graduated FB | 76.0% | 111570 | 1528 |

| Arm | Median ready rate | Ready-rate range | Median modeled token units | Modeled-token range |
|---|---:|---:|---:|---:|
| Process-all | 66.7% | 66.7%–66.7% | 104640 | 104640–104640 |
| Full FB | 80.2% | 75.0%–80.2% | 130660 | 123420–131660 |
| Graduated FB | 75.0% | 70.8%–76.0% | 111570 | 102740–114080 |

## Graduated-level use

| Arm | Level | Cases |
|---|---:|---:|
| Process-all | 0 | 288 |
| Full FB | 4 | 288 |
| Graduated FB | 0 | 60 |
| Graduated FB | 1 | 60 |
| Graduated FB | 2 | 57 |
| Graduated FB | 3 | 75 |
| Graduated FB | 4 | 36 |

## Pre-registered policy

Level 1 requires four prior cases plus visible already-good or ambiguous evidence. Level 2 requires one observed regression. Level 3 requires two classifiable failures. A visible privacy, auth, payment, destructive, provider, migration, or release trigger immediately applies Level 4. Three consecutive clean results permit one-level step-down. Transitions use prior public observations only; hidden truth is grader-only.

## Evidence hashes

| Frozen input | SHA-256 |
|---|---|
| truth | `929d4c80ae7c0461db89733175a904531a6f50be3b4dc0df5edd4fc4b0b7debd` |
| settings | `298aff33ae7098ead9116c6207322ec13d7ca1e2e94f89c57495f1375f5ec667` |
| policy | `6661e10d4fd18bce627e7b5ac1f9fb076d3e393ed73d902ca58fdd4fc03a52f3` |
| costModel | `1a7307fdaf03c58b58266b8c400f1a13c842daa81288185baeed245a8a417971` |
| grader | `ef0cea8208b08c3e7d5d8823d378189c42fd622688fa3eeb9f981aa9e1ebfc83` |
| seeds | `8c3598742bd3db5b46521974773964aca87fb75c16a00efa90781758078b03fd` |

## Limitations

This is a deterministic modeled experiment, not production telemetry. It does not establish actual Codex token savings, wall-clock savings, human-attention savings, or population-wide percentages. The cost model and fallibility rates are declared assumptions. Four constructed scenario families cannot represent every project. The fixed thresholds were not tuned after results, and unfavorable outcomes remain in the evidence. Real projects require prospective observation before these figures can become product claims.
