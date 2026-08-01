# TASK-059 QA

Status: complete

## Required evidence

| Proof | Required result | Status |
|---|---|---|
| Historical registry | 18 traceable tasks, 6 per tier | Passed |
| Immutable reuse | Six TASK-056 pairs reused without result mutation | Passed |
| Graders | Historical start fails and accepted state passes | Passed |
| Protocol correction | Granular scoring, semantic alternatives, equal facts, different treatment structure | Passed |
| Selected-tier calibration | Medium and Difficult graders accept semantic outcomes and reject unsafe mutations | Passed |
| Pilot preservation | Eight v1 checkpoints remain byte-identical and are excluded from claims | Passed |
| Directional profile | One easy, medium, and difficult task per arm; six new runs | Passed |
| Isolation | Source repositories receive no writes | Passed at every counted checkpoint |
| Controller | Equal arms, bounded repair, checkpoints, privacy, and 30M directional ceiling | Passed |
| Comparative runs | Six directional runs after one excluded shakedown | Passed |
| Results | Tier-level wall time, tokens, acceptance, readiness, and limitations | [Passed](../benchmarks/difficulty-tiers/TASK-059-directional-results.md) |
| Production-adjacent follow-up | Web, Android, standalone, iOS simulator, and physical-iPhone target compilation for both arms | [Passed with real-camera gate remaining](../benchmarks/difficulty-tiers/TASK-059-production-adjacent-verification.md) |
| Independent review | Arithmetic, treatment fairness, safety mutations, limits, and package parity | Approved |

## Directional result

| Measure | Vanilla | Efficient Graph | Difference |
|---|---:|---:|---:|
| Wall time | 13m 04s | 12m 07s | Graph 7.3% lower |
| Raw provider tokens | 3,384,809 | 1,894,419 | Graph 44.0% lower |
| Defined local outcomes | 3/3 | 3/3 | no difference |
| Repair passes | 3 | 3 | no difference |

The original result remains directional evidence. Follow-up executable checks
passed on Web, Android, standalone MÉJA, and iOS simulator surfaces, and both
iOS candidates compile for the connected physical-iPhone target. A signed
install and real-camera/permission smoke remain unverified, as do
provider-backed, visual, store, and production readiness.

## External gates

No merge, plugin publication, installation, release, or deployment is part of
this benchmark.
