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
