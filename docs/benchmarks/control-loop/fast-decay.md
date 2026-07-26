# FB four-arm fast-decay benchmark

Experiment: `fb-fast-decay-control-050-repair-20260727`

This experiment preserves the reviewed Task 5 evidence unchanged. Its first three arms reproduce the reviewed aggregates and all 864 raw records exactly; Fast-decay FB v2 is the only new arm.

It supersedes invalid result `fef75ab0e470a0007f74210c34cea94aa1e936cd1c0818ee26c97b13931d3915` from `ebe22ed402cff2632d836be39e7ea69b5f30a42f`: The superseded candidate retained unresolved diagnosis evidence in its window but did not make that evidence hold persistent Level 3.

This deterministic simulation adds Fast-decay FB v2 to the exact reviewed Process-all, Full FB, and Graduated FB v1 workflows: 288 cases per arm and 1,152 arm/case records overall. Seeds are 11, 29, and 47. Outcomes are simulator observations. Token units and elapsed time are modeled, not observed Codex usage. See the [machine-readable evidence](fast-decay-results.json), the reviewed [graduated benchmark](graduated.md), and the earlier [fixed-treatment benchmark](README.md).

## Headline results

| Arm | Product-ready | Work units | Modeled token units | Modeled minutes | Tokens per ready outcome | Unnecessary processing | Unresolved failures |
|---|---:|---:|---:|---:|---:|---:|---:|
| Process-all | 183/288 (63.5%) | 3456 | 331200 | 619.2 | 1810 | 93 | 105 |
| Full FB | 229/288 (79.5%) | 4120 | 384160 | 640.3 | 1678 | 13 | 59 |
| Graduated FB v1 | 231/288 (80.2%) | 3706 | 347590 | 604.5 | 1505 | 13 | 57 |
| Fast-decay FB v2 | 231/288 (80.2%) | 3661 | 343900 | 600.6 | 1489 | 13 | 57 |

Graduated FB recorded 62.5% graduation accuracy, 108 false graduations, 0 missed graduations, 23/23 step-down successes, and 100.0% immediate safety-trigger response.

Fast-decay v2 recorded 85 excess-control cases, 173 excess-level units, 33 persistent promotions, 0 false persistent promotions, 72 temporary escalations, 0 missed levels, and 100.0% immediate safety response.

## Adoption gate

The thresholds were frozen for the replacement run; the bundle cannot independently prove absence of tuning. Guidance changes are allowed only if every predicate passes. Overall: **FAIL — reject**.

| Predicate | Actual | Required | Result |
|---|---:|---:|---|
| immediateSafety | 1 | 1 | Pass |
| zeroMissedLevels | 0 | 0 | Pass |
| readinessWithinOnePoint | 0.8020833333333334 | 0.7920833333333334 | Pass |
| noMoreUnresolvedFailures | 57 | 57 | Pass |
| excessControlReduction | 85 | 81 | Fail |
| lowerGrossModeledTokens | 343900 | 347590 | Pass |
| noPrivacyOrReleaseWeakness | true | true | Pass |

## Scenario results

| Scenario | Arm | Ready rate | Modeled token units | Unresolved failures |
|---|---|---:|---:|---:|
| media | Process-all | 62.5% | 82800 | 27 |
| media | Full FB | 83.3% | 97640 | 12 |
| media | Graduated FB v1 | 83.3% | 87490 | 12 |
| media | Fast-decay FB v2 | 83.3% | 86260 | 12 |
| product | Process-all | 62.5% | 82800 | 27 |
| product | Full FB | 79.2% | 90560 | 15 |
| product | Graduated FB v1 | 79.2% | 81670 | 15 |
| product | Fast-decay FB v2 | 79.2% | 81100 | 15 |
| software | Process-all | 66.7% | 82800 | 24 |
| software | Full FB | 79.2% | 105180 | 15 |
| software | Graduated FB v1 | 79.2% | 94180 | 15 |
| software | Fast-decay FB v2 | 79.2% | 92380 | 15 |
| support | Process-all | 62.5% | 82800 | 27 |
| support | Full FB | 76.4% | 90780 | 17 |
| support | Graduated FB v1 | 79.2% | 84250 | 15 |
| support | Fast-decay FB v2 | 79.2% | 84160 | 15 |

## Phase results

| Phase | Arm | Ready rate | Modeled token units | Repairs |
|---|---|---:|---:|---:|
| clean-start | Process-all | 100.0% | 41400 | 0 |
| clean-start | Full FB | 94.4% | 40880 | 0 |
| clean-start | Graduated FB v1 | 100.0% | 31350 | 0 |
| clean-start | Fast-decay FB v2 | 100.0% | 30390 | 0 |
| growing-volume | Process-all | 100.0% | 55200 | 0 |
| growing-volume | Full FB | 100.0% | 50960 | 0 |
| growing-volume | Graduated FB v1 | 100.0% | 37150 | 0 |
| growing-volume | Fast-decay FB v2 | 100.0% | 37390 | 0 |
| first-regression | Process-all | 41.7% | 41400 | 0 |
| first-regression | Full FB | 94.4% | 24380 | 0 |
| first-regression | Graduated FB v1 | 94.4% | 20450 | 0 |
| first-regression | Fast-decay FB v2 | 94.4% | 20120 | 0 |
| repeated-failure | Process-all | 0.0% | 55200 | 0 |
| repeated-failure | Full FB | 39.6% | 111080 | 34 |
| repeated-failure | Graduated FB v1 | 39.6% | 106480 | 34 |
| repeated-failure | Fast-decay FB v2 | 39.6% | 106480 | 34 |
| sensitive-event | Process-all | 33.3% | 41400 | 0 |
| sensitive-event | Full FB | 41.7% | 67480 | 12 |
| sensitive-event | Graduated FB v1 | 41.7% | 67480 | 12 |
| sensitive-event | Fast-decay FB v2 | 41.7% | 67480 | 12 |
| repaired-stability | Process-all | 75.0% | 55200 | 0 |
| repaired-stability | Full FB | 93.8% | 63700 | 11 |
| repaired-stability | Graduated FB v1 | 93.8% | 60500 | 11 |
| repaired-stability | Fast-decay FB v2 | 93.8% | 60500 | 11 |
| step-down-opportunity | Process-all | 100.0% | 41400 | 0 |
| step-down-opportunity | Full FB | 94.4% | 25680 | 0 |
| step-down-opportunity | Graduated FB v1 | 94.4% | 24180 | 0 |
| step-down-opportunity | Fast-decay FB v2 | 94.4% | 21540 | 0 |

## Seed ranges

The table preserves all three seed outcomes; no unfavorable result was removed or rerun. Process-all had no scenario/seed aggregate ready-rate win over Graduated FB; unfavorable component errors and unresolved outcomes still remain in the raw evidence. Full FB and Graduated FB use common random draws for every like-for-like component call.

| Seed | Arm | Ready rate | Modeled token units | Tokens per ready outcome |
|---:|---|---:|---:|---:|
| 11 | Process-all | 63.5% | 110400 | 1810 |
| 11 | Full FB | 81.3% | 129140 | 1656 |
| 11 | Graduated FB v1 | 81.3% | 116560 | 1494 |
| 11 | Fast-decay FB v2 | 81.3% | 115000 | 1474 |
| 29 | Process-all | 63.5% | 110400 | 1810 |
| 29 | Full FB | 77.1% | 120300 | 1626 |
| 29 | Graduated FB v1 | 78.1% | 108980 | 1453 |
| 29 | Fast-decay FB v2 | 78.1% | 108740 | 1450 |
| 47 | Process-all | 63.5% | 110400 | 1810 |
| 47 | Full FB | 80.2% | 134720 | 1750 |
| 47 | Graduated FB v1 | 81.3% | 122050 | 1565 |
| 47 | Fast-decay FB v2 | 81.3% | 120160 | 1541 |

| Arm | Median ready rate | Ready-rate range | Median modeled token units | Modeled-token range |
|---|---:|---:|---:|---:|
| Process-all | 63.5% | 63.5%–63.5% | 110400 | 110400–110400 |
| Full FB | 80.2% | 77.1%–81.3% | 129140 | 120300–134720 |
| Graduated FB v1 | 81.3% | 78.1%–81.3% | 116560 | 108980–122050 |
| Fast-decay FB v2 | 81.3% | 78.1%–81.3% | 115000 | 108740–120160 |

## Graduated-level use

| Arm | Level | Cases |
|---|---:|---:|
| Process-all | 0 | 288 |
| Full FB | 4 | 288 |
| Graduated FB v1 | 0 | 18 |
| Graduated FB v1 | 1 | 77 |
| Graduated FB v1 | 2 | 70 |
| Graduated FB v1 | 3 | 87 |
| Graduated FB v1 | 4 | 36 |
| Fast-decay FB v2 | 0 | 27 |
| Fast-decay FB v2 | 1 | 86 |
| Fast-decay FB v2 | 2 | 24 |
| Fast-decay FB v2 | 3 | 115 |
| Fast-decay FB v2 | 4 | 36 |

## Frozen declared settings

The policy thresholds, fixtures, fallibility, costs, and seeds were fixed for this replacement run. A pre-authoritative probe exposed accepted-repair clearing and was corrected before the first evidence write. Review then invalidated the first written fast-decay result because unresolved evidence did not actively hold Level 3. There is no external preregistration, and the bundle cannot independently prove historical execution count or absence of tuning.

Level 1 requires four prior cases plus visible already-good or ambiguous evidence. Level 2 requires one observed regression. Level 3 requires two classifiable failures. A visible privacy, auth, payment, destructive, provider, migration, or release trigger immediately applies Level 4. Three consecutive clean results permit one-level step-down. Current public ambiguity, regression, classifiable failure, or safety evidence sets a floor before any demotion. Fast-decay v2 requires two corroborating observations inside six cases, permits direct decay after two clean outcomes, and keeps active safety and unresolved evidence. Transitions use public observations only; hidden target levels and grading truth are grader-only.

## Evidence hashes

| Frozen input | SHA-256 |
|---|---|
| truth | `a3660cec3acd103e74a19fccad6a22844e2e71aae7097a79fdba0dbc295ce61d` |
| settings | `2824018dd397269af6f90b591e603b6bd49a6512663e524a59dcb9218f6376a0` |
| policy | `6661e10d4fd18bce627e7b5ac1f9fb076d3e393ed73d902ca58fdd4fc03a52f3` |
| fastDecayPolicy | `c8a8b26387190bcb9eae15279d5fde027416336f568fe954e0f002c160c964de` |
| costModel | `1a7307fdaf03c58b58266b8c400f1a13c842daa81288185baeed245a8a417971` |
| graderImplementation | `621c18027b36974f871dbdc962050a23310452c5c73259656ddaa0a7e68d41f6` |
| seeds | `8c3598742bd3db5b46521974773964aca87fb75c16a00efa90781758078b03fd` |

## Limitations

This is a deterministic modeled experiment, not production telemetry. It does not establish actual Codex token savings, wall-clock savings, human-attention savings, or population-wide percentages. The cost model and fallibility rates are declared assumptions. Four constructed scenario families cannot represent every project. The replacement-run declaration says no post-result tuning or selective rerun occurred, but the bundle cannot independently prove that history. The grader-implementation hash binds the exact executable target/grading/summary functions in this runner; it does not prove external preregistration, correctness, or production validity. Unfavorable outcomes remain in the evidence. Real projects require prospective observation before these figures can become product claims.
