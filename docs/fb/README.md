# FB Harness — Graph Engineering for Everyday People

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

FB is an open-source Codex plugin that turns scattered AI conversations into a
living repository-local product-delivery graph. The graph connects workstreams,
decisions, evidence, dependencies, implementation, verification, and release
state. FB has six evidence-producing workstreams plus one Product/BFM control
centre and seven pinned repository-scoped Codex tasks. The workstreams run
focused learning loops; `$bfm` navigates, reconciles, prioritizes, and executes
the graph from Product/BFM, then stops at **Ready to
ship**. Only **Push Live** authorizes release.

This graph is a delivery map, not a graph database, knowledge graph, or GraphQL
requirement. See the [Full FB Graph Diagram](full-loop.md).

Durable facts follow the [normalized records and efficient evidence contract](records.md):
one authoritative home per fact, direct links elsewhere, deterministic
verification reuse, and compact closeout.

For a known task and concrete question, agents first use
`fb_project_context` as described in [graph.md](graph.md). A healthy graph
routes to at most three relevant authoritative files. An insufficient or
unhealthy result uses the safe fallback route below. The graph never becomes a
source of truth.

## Source of truth

Read the smallest relevant layer, in this order:

1. `node tools/fb-lane.cjs status --context` or MCP
   `fb_lane_status({context:true})` — bounded active scope, ownership, locks,
   gates, and links.
2. `docs/handoffs/index.md` — compact routing to the relevant handoff.
3. The linked detailed handoff — plan, rationale, evidence, and closeout.
4. `docs/workstreams/<lane>.md` — a revisit summary only.
5. `PROJECT_BOARD.md` — authoritative fallback when compact context is
   missing, contradictory, truncated, or insufficient.
6. These FB pages — reusable operating policy; they do not replace project facts.

Completed board history is preserved in monthly Markdown archives after the
board crosses its size threshold. Routine orientation therefore reads genuine
current state. When earlier work matters, follow the archive, index, exact
handoff, QA artifact, and Git history through the
[historical retrieval route](graph.md#historical-retrieval). See also
[why compact context does not hide important work](records.md#why-compact-context-does-not-hide-important-work).

`AGENTS.md` is a navigator into this pack. Project rules and task-specific
instructions take precedence when they are stricter.

## Start with the matching workstream

When planning or evidence is useful, start in whichever evidence-producing
workstream matches the question: User, Business, Design, Tech, Discovery, or
Bugs. Product/BFM is the control centre, not universal intake. Relevant workstreams
create handoffs ready for Product intake. Ready means queued for Product
review, not approval or execution. Only `$bfm` freezes that intake, makes
Product disposition and sequence every candidate, records the consolidated
Build Brief, and then starts execution of the included scope. FB keeps its
risk and execution classification internal; the user never chooses a mode.
See [start.md](start.md) for the public sequence and [workflow.md](workflow.md)
for internal execution budgets and stop predicates.

Four reliability rules keep that beginner flow honest: FB mutates only the
active canonical checkout; `$bfm` shows a complete intake ledger across the six
evidence workstreams plus the Product/BFM control centre before execution;
checkout moves use a transactional migration that keeps former roots
quarantined and recoverable; and only **Push Live** authorizes release. The
runtime owns checkout and intake scanning, so these pages explain the outcome
without recreating scanner rules.

Verification has three levels: focused check, immediate safety gate, and
release checkpoint. A full validator is eligible only when a Product-owned
handoff explicitly requests that release checkpoint; a handoff artifact,
owner transfer, staging, or review does not request one.

## Read by task

- Seeing the complete workstream-to-release system: [Full FB Loop Diagram](full-loop.md)
- Comparing FB with vanilla Codex or Kurrent Capacitor: [Why FB](../why-fb.md)
- Starting a project or explaining the plan: [start.md](start.md)
- Coordinating lanes or running approved work: [workflow.md](workflow.md)
- Asking someone to review or proving work: [evidence.md](evidence.md)
- Safety, recovery, sidechats, and loop escalation: [guardrails.md](guardrails.md)
- Resuming durable work, checkpoints, recall, review, or closeout: [sessions.md](sessions.md)
- Selecting harness/product evals, recording Quality Gaps, or closing revision loops: [evals.md](evals.md)
- Normalizing durable facts, reusing verification, or closing compactly: [records.md](records.md)
- Reducing broad orientation through source-cited targeted reading: [graph.md](graph.md)
- Adding rules-first routing, pairwise QA, layered gates, or diagnosed
  configuration evolution: [control-loop.md](control-loop.md)
- Turning verified project outcomes into bounded lessons for later relevant
  work: [learning.md](learning.md)
