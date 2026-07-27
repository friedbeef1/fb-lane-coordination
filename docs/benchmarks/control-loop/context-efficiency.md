# FB context-efficiency modeled adoption experiment

Experiment: `fb-context-efficiency-051-20260727`

Decision: **rejected**. Failed predicates: modeledTokenUnits. Task 4 is not eligible. Active guidance and the plugin remain unchanged.

## Raw modeled results first

| Metric | Context-efficient FB | Frozen gate | Pass |
|---|---:|---:|:---:|
| Raw modeled token units | 310358 | ≤ 298080 | no |
| Raw modeled minutes | 555.375 | ≤ 557.3 | yes |
| Readiness | 231/288 (80.2%) | ≥ 79.2% | yes |
| Tokens per ready outcome | 1343.5 | descriptive | n/a |

## Control and boundary gates

| Predicate | Result | Gate | Pass |
|---|---:|---:|:---:|
| Missed required controls | 0 | 0 | yes |
| Immediate safety-trigger response | 100.0% | 100% | yes |
| Unresolved failures | 57 | ≤ 57 | yes |
| Privacy boundary preserved | true | true | yes |
| Release boundary preserved | true | true | yes |

## Frozen cost and reuse model

The candidate clones all 288 reviewed Graduated FB outcomes, calls, public observations, required levels, and common fallibility draws. It changes modeled cost only. The pre-existing compiler excerpt fraction of 0.75 is applied to focused, route, comparison, qa, safety, diagnosis, repair; process and human-decision costs remain unchanged. Token units are rounded up per call. The consolidated repair model reruns failed proofs only, but the reviewed records expose no per-proof rerun call, so no reviewed call was removed and no extra repair-reuse saving was claimed.

## Evidence integrity

All 864 reviewed first-three-arm records reproduced exactly. The reviewed evidence, model, thresholds, runner/grader, and complete declaration are SHA-256 bound in the machine result. The declaration permits exactly one authoritative modeled run, preserves unfavorable evidence, allows no selective rerun, and allows no post-result threshold or model tuning.

## Result handling and limitations

At least one modeled predicate failed. The candidate is rejected, Task 4 is not eligible, and active guidance/plugin behavior must remain unchanged. This is modeled evidence, not observed provider tokens or wall-clock time. The 0.75 multiplier is a declared conservative mapping from a source-excerpt bound to coordination-stage cost, not a production measurement. Hashes cannot prove external preregistration or unseen run history.

## Frozen hashes

| Input | SHA-256 |
|---|---|
| candidateModel | `99c05a97cc31674fa228efbdcfa88c36fc240c66bfbca040de06e9ca899049e4` |
| thresholds | `e8f891188e00c97146b542db65f5c4db0c8573e48425f15556cf3a446c739479` |
| runnerGraderImplementation | `227db66d61328638f35cc0f108816f8f1623ac259cea8e6df328129e3a312ee7` |
| reviewedEvidence | `2c1f53cda141aab0eba4f169452441a833e932932bcbd504e2434717758d6ada` |
| declaration | `7aec353751d0e215c5425945b66660723dd16829d53e3f525613a6b375d6f6ac` |
