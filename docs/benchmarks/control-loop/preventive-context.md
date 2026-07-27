# Preventive context diagnostic

This controlled diagnostic uses Features, Bugs, Tech, and Design fixtures. It does not assume that graph context prevents any particular percentage of failures. Token and time values are modeled, not observed Codex usage.

## First-pass baselines

| Arm | Ready deliverables | Readiness | Correct blockers | Modeled tokens | Modeled minutes | Later repairs excluded |
|---|---:|---:|---:|---:|---:|---:|
| Autonomous Vanilla diagnostic | 183/264 | 69.3% | 24/24 | 331200 | 619.2 | 0 |
| Broad-context FB diagnostic | 195/264 | 73.9% | 24/24 | 314880 | 524.6 | 56 |
| Graph-routed FB baseline | 197/264 | 74.6% | 24/24 | 280790 | 491.4 | 56 |

## Prevention sensitivity

| Prevention rate | Failures prevented | Ready deliverables | Readiness | Correct blockers |
|---:|---:|---:|---:|---:|
| 0% | 0 | 197/264 | 74.6% | 24/24 |
| 25% | 16 | 213/264 | 80.7% | 24/24 |
| 50% | 33 | 230/264 | 87.1% | 24/24 |
| 75% | 50 | 247/264 | 93.6% | 24/24 |
| 91% | 60 | 257/264 | 97.3% | 24/24 |
| 95% | 63 | 260/264 | 98.5% | 24/24 |
| 99% | 66 | 263/264 | 99.6% | 24/24 |
| 100% | 67 | 264/264 | 100.0% | 24/24 |

From the graph-routed first-pass baseline, the 91% milestone requires 44 of 67 avoidable failures to be prevented (65.7%). The 99% milestone requires 65 (97.0%).

## Limitation

The sensitivity curve is mathematical. It does not prove graph effectiveness. Autonomous real-Codex evidence must supply the observed prevention rate, agent topology, tokens, and elapsed time.

## Autonomous composite holdout

The counted holdout gave each arm the same composite Features, Bugs, Tech, and
Design project and freedom to choose its own agent topology. The initial
shakedown was excluded. Every counted run chose one inline agent, maximum
concurrency one, and one integration pass.

| Arm | Counted hidden results | Median readiness | Range |
|---|---|---:|---:|
| Autonomous Vanilla | 9/13, 9/13, 9/13 | 69.2% | 69.2%–69.2% |
| Autonomous broad-context FB | 9/13, 7/13, 9/13 | 69.2% | 53.8%–69.2% |
| Autonomous preventive graph FB | 13/13, 13/13, 12/13 | 100% | 92.3%–100% |

These scores are exploratory only. The autonomous fixture, prompts, graph
packet, grader, candidates, budgets, and run events were not frozen into an
auditable bundle before execution. The 13 checks were also not mapped to the
controlled deliverable/blocker denominator. Most importantly, one graph run
missed the independent privacy blocker gate.

Therefore **neither 91% nor 99% is demonstrated**. Authoritative provider
tokens, tool calls, context reads, and per-arm wall time were also unavailable.
See the [independent review](preventive-context-autonomous-independent-review.md).
No plugin adoption is authorized.
