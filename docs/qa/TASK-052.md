---
type: fb-qa
task: TASK-052
status: in-progress
---

# TASK-052 QA

## Controlled diagnostic

- New fixture families: Features, Bugs, Tech, and Design.
- Observations: 288 per arm; 864 total.
- Deliverable denominator: 264.
- Intentional blockers: 24.
- Post-failure repairs: excluded from first-pass readiness.
- Assumed preventive accuracy: none.

| Arm | First-pass ready | Readiness | Correct blockers |
|---|---:|---:|---:|
| Vanilla diagnostic | 183/264 | 69.3% | 24/24 |
| Broad-context FB diagnostic | 195/264 | 73.9% | 24/24 |
| Graph-routed FB baseline | 197/264 | 74.6% | 24/24 |

From the graph-routed baseline:

- 91% requires preventing 44/67 avoidable failures (65.7%).
- 99% requires preventing 65/67 avoidable failures (97.0%).

These figures are mathematical sensitivity evidence, not an observed claim
that graph context achieves either prevention rate.

## Autonomous holdout

Pending. The holdout will let each arm choose its own agent topology and will
report provider usage as unavailable if the execution environment does not
expose authoritative tokens.

