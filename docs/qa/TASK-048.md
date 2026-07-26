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

## Final graph-first experiment

The separately approved final comparison used equal isolated snapshots and six
concurrent read-only Codex workers per arm. Both arms answered 6/6 correctly.
The graph-first arm used 33.9% fewer uncached input tokens, 54.6% fewer
tool-output orientation characters, and 27.3% less concurrent wall time.

Every graph worker opened cited authoritative evidence, but none used the broad
board/index fallback. The demonstrated behavior is narrow routing to product
truth, not replacing product truth with the graph.

## Decision

Focused verification and the controlled efficiency hypothesis passed. Status
is **demonstrated for the controlled orientation scenario**. Plugin
integration, publication, release, and deployment remain separately
unauthorized.
