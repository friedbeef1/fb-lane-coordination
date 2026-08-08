# Graph-directed context

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

Markdown records and Git history remain authoritative. The graph is a derived,
repository-local delivery map that routes context, dependencies, sequencing,
invalidation, and readable projections. Product/BFM owns decisions and
priorities, while Codex executes only the approved sequence. **Push Live**
remains the only release authority. This hybrid authority model adds no graph
database and creates no second source of truth.

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

## Optional structured relationships

New handoffs may declare relationships when Product has authoritative evidence:

```yaml
graph:
  depends_on:
    - TASK-101
  conflicts_with:
    - DECISION-023
  affects:
    - FEATURE-EXPORT
  supersedes:
    - REQUIREMENT-011
```

These fields are optional. Existing handoffs and historical records remain
valid without migration. Missing or ambiguous relationships remain unknown;
the compiler never guesses approval, verification success, or release
authority.

## Change invalidation

Propagation follows only cited graph relationships and never reopens unrelated
completed work:

- A changed decision reopens only affected implementation and verification.
- A failed verification blocks its connected implementation and release.
- A superseded requirement retires only its unstarted implementing tasks.
- A fixed bug requires its connected regression check.
- A changed dependency recalculates only downstream sequencing.

Every invalidation cites the changed authoritative source and explains why the
affected node became stale. Product/BFM records the resulting decision in the
normal board, handoff, QA, or release record.

## Product/BFM delivery projection

After `$bfm`, Product records the consolidated Build Brief before scheduler
execution, refreshes the graph, freezes an active-subgraph snapshot, resolves
conflicts and missing evidence, applies Product priorities, and records one
integration pass. Status projects **Current**, **Next**, **Blocked**,
**Deferred**, **Conflicts**, **Recently invalidated**, and **Ready to ship**.
Handoffs remain queued Product inputs, not executable instructions.

If refresh fails, status must say that the authoritative fallback is active and
must not claim graph-driven sequencing.

## Historical retrieval

Historical work is excluded from routine context, not from investigation.

Retrieve archived records progressively when the question names a referenced
task, touches a shared surface, investigates a regression or conflicting
decision, reuses evidence, checks release history, or follows an explicit user
request. Cite the exact archive, handoff, QA artifact, or changelog entry that
answers the question. Shared classification nodes such as workstreams are
facets, not paths to unrelated sibling history.

If graph evidence is missing, stale, ambiguous, or contradictory, use the
authoritative route in order: `PROJECT_BOARD.md` → `docs/handoffs/index.md` →
the exact handoff → Git history. The graph never supplies approval authority.

## Refresh and storage

The context tool refreshes deterministic Level 1 relationships from normalized
FB records and writes derived artifacts under `.fb/graph/`. These artifacts are
ignored by Git and may be deleted or rebuilt safely. Refresh is incremental
when sources are unchanged.

Missing, stale, corrupt, unsafe, or insufficient graph output must never block
normal FB. The authoritative normalized-record route remains the safe fallback.

The graph may select matching active lessons from
[project-local continuous learning](learning.md). It links to unchanged lesson
evidence instead of copying the learning registry into every context packet.

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
