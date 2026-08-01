# Graph-directed context

Use the repository-local project graph to reduce broad orientation reads in
long-lived work. The graph is a derived navigation layer. It never replaces or
overrides the board, handoffs, QA evidence, Git, approvals, or release gates.

## Agent route

When the current task ID and question are known:

1. Call MCP `fb_project_context` with `taskId`, `question`, and the workspace
   path when needed.
2. If the response route is `project-graph`, inspect its compact facts and open
   only the listed `readableSources` required for the answer.
3. Cite the authoritative files actually used.
4. If the packet is ambiguous, incomplete, contradictory, unhealthy, or returns
   `normalized-record-fallback`, read `PROJECT_BOARD.md`, then
   `docs/handoffs/index.md`, the linked handoff, and the relevant workstream
   card.

Do not load broad project history merely because it exists. Do not treat a
graph label or relationship as approval, product truth, test evidence, or
release authority.

## Refresh and storage

The context tool refreshes deterministic Level 1 relationships from normalized
FB records and writes derived artifacts under `.fb/graph/`. These artifacts are
ignored by Git and may be deleted or rebuilt safely. Refresh is incremental
when sources are unchanged.

Missing, stale, corrupt, unsafe, or insufficient graph output must never block
normal FB. The authoritative normalized-record route remains the safe fallback.

## Graduation

Project age and record count do not trigger deeper mapping. Level 2 may be
recommended only after source-cited retrieval friction: two repeated
occurrences, or one material missed dependency or unresolved contradiction.
Sensitive or cross-project corpora require explicit approval.

The controlled TASK-048 experiment demonstrated that capped graph-directed
targeted reading can reduce orientation context without reducing correctness.
It does not establish a universal token or time saving.

## Directional real-Codex evidence

A later three-pair Easy/Medium/Difficult simulation gave Vanilla and
Efficient-Graph FB identical public facts and one bounded repair:

| Observed total | Vanilla | Efficient Graph | Graph difference |
|---|---:|---:|---:|
| Raw provider tokens | 3,384,809 | 1,894,419 | **44.0% fewer** |
| Wall time | 13m 04s | 12m 07s | **7.3% less** |
| Defined local outcomes passed | 3/3 | 3/3 | no difference |
| Repair passes | 3 | 3 | no difference |

Graph was faster on the Easy and Medium tasks but 18.2% slower on the Difficult
native-iOS task. Treat this as directional support for selective-context token
efficiency, not proof that Graph is always faster. The 100% result covers only
the frozen static/local requirements; it excludes physical-device,
provider-backed, visual, and production readiness. See the
[full measurements, grader correction, and limitations](https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/benchmarks/difficulty-tiers/TASK-059-directional-results.md).
