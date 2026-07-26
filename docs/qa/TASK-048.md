---
type: fb-qa
task: TASK-048
status: passed
record_model: normalized-v1
---

# TASK-048 Focused QA

## Candidate

Repository-local graduated project-graph prototype and evidence only. The graph
is derived from normalized records and stored in ignored `.fb/graph/` artifacts.
It is not included in bootstrap or the packaged plugin.

## Automated checks

- Core and pilot contracts: 13/13 passed.
- Node syntax: graph runtime and pilot controller passed.
- Package synchronization: existing declared mirrors remain aligned.
- Whitespace: candidate diff passed.

The contracts cover deterministic construction, refresh, safe fallback,
privacy and authority boundaries, evidence-gated graduation, six concurrent
logical workers, hidden answer isolation, cost accounting, and result
recomputation.

## Experiment evidence

- Deterministic ongoing navigation bytes: 66.9% lower.
- Deterministic repeated reads: 73.7% lower.
- Deterministic correctness: 6/6 in both arms.
- Real-agent correctness: 6/6 in both arms.
- Real-agent graph input tokens: 2.5% higher.
- Real-agent graph wall time: 12.3% higher.

See the [experiment record](../experiments/TASK-048-graduated-project-graph-pilot.md)
for exclusions, accounting, limitations, and the signed measures.

## Decision

Focused verification passed, but the product hypothesis is not yet
demonstrated in real Codex use. Status is **promising but inconclusive**.
Plugin integration, publication, release, deployment, and further automatic
repairs are not authorized.
