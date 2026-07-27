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

The excluded shakedown scored Vanilla 11/13, broad FB 10/13, and preventive
graph FB 13/13.

Three counted repetitions produced:

| Arm | Results | Median | Range |
|---|---|---:|---:|
| Vanilla | 9, 9, 9 of 13 | 69.2% | 69.2% |
| Broad-context FB | 9, 7, 9 of 13 | 69.2% | 53.8%–69.2% |
| Preventive graph FB | 13, 13, 12 of 13 | 100% | 92.3%–100% |

- Every arm chose one inline agent, concurrency one, and one integration pass.
- No counted arm received repair credit.
- The aggregate scores do not establish either milestone. One graph run missed
  the independent privacy blocker gate, and the 13 checks were not mapped to
  the controlled deliverable/blocker denominator.
- Autonomous inputs, prompts, candidates, grader, budgets, and run events were
  not frozen into a reproducible repository bundle before execution.
- Provider tokens and elapsed wall time: unavailable from the autonomous
  execution interface.
- Independent verdict: rejected as comparative evidence.
- Adoption: rejected.
