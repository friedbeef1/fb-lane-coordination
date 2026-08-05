# FB coordination navigator

Read this file, then use `node tools/fb-lane.cjs status --context` (or MCP
`fb_lane_status({context:true})`) for active work and locks. Follow its links to
`docs/handoffs/index.md`, the linked handoff, and the relevant workstream card.
Open the full `PROJECT_BOARD.md` only when the compact packet is insufficient.
The board is current truth; the index routes; handoffs hold detail; cards are
summaries. The reusable FB operating rules live in [docs/fb/](docs/fb/README.md).

## Route by task

- First project, user-facing plan, lanes, clarifications, progress, or approval:
  [start.md](docs/fb/start.md)
- Ownership, plan-only lanes, BFM execution, locks, board/index/handoff roles,
  and return-loop closeout: [workflow.md](docs/fb/workflow.md)
- Test This Now, Verification Handoff, visual QA, evidence wording, and cleanup:
  [evidence.md](docs/fb/evidence.md)
- Hard approvals, Git/lock safety, sidechat-parent-only routing, recovery, retry
  limits, and Loop Learning escalation: [guardrails.md](docs/fb/guardrails.md)
- Durable session intake, promotion, checkpoints, recall, review, and closeout:
  [sessions.md](docs/fb/sessions.md)
- Eval selection, authority, Quality Gaps, and revision closure:
  [evals.md](docs/fb/evals.md)
- Authoritative records, verification reuse, and compact closeout:
  [records.md](docs/fb/records.md)
- Graph-directed targeted reading and safe fallback:
  [graph.md](docs/fb/graph.md)
- Rules-first routing, pairwise QA, layered gates, and bounded configuration
  evolution: [control-loop.md](docs/fb/control-loop.md)

For a known task and concrete question, call MCP `fb_project_context` before
broad orientation. Open only its relevant cited authoritative records. The
graph is not a source of truth; use the normal board → index → handoff → card
fallback when the packet is insufficient or contradictory.

FB has six evidence-producing workstreams—User, Business, Design, Tech,
Discovery, and Bugs—plus one Product/BFM control centre and seven pinned
repository-scoped Codex tasks. Start planning or evidence in the matching
workstream. Relevant workstreams create ready handoffs; after they are ready,
`$bfm` in Product/BFM activates reconciliation and execution of approved scope.
Pinning never starts work. Project-specific instructions and stricter safety
rules always win.
