---
name: fb-lane
description: Use when concurrent Codex work needs board-aware FB lanes, locks, handoffs, and Product integration.
---

# FB coordination

Read [the FB harness](../../docs/fb/README.md), then the project board, handoff
index, linked handoff, and relevant workstream card. Use the smallest mode:
Normal Codex for isolated low-risk tasks, one-record Quick BFM for approved
bounded corrections, and Full BFM for approval, sensitive surfaces, ambiguity,
or reconciled lanes.
Build For Me (BFM) is the execution mode used only after approval and explicit
`$bfm`.

The one loop has six planning/evidence workstreams: Product/User (technical slug
`product`), Business, Design, Tech, Discovery, and Bugs. Each relevant
workstream runs a mini-loop and records a ready or blocked
`docs/handoffs/<TASK-ID>.md`. BFM scans relevant ready handoffs and treats
inactive workstreams as `None relevant`; it stops at **Ready to ship**. Only
**Push Live** authorizes merge or deployment.

- [Start and clarify an objective](../../docs/fb/start.md)
- [Coordinate lanes and approved BFM work](../../docs/fb/workflow.md)
- [Prepare review evidence](../../docs/fb/evidence.md)
- [Respect safety, sidechat, recovery, and escalation rules](../../docs/fb/guardrails.md)
- [Resume durable sessions and curate checkpoint evidence](../../docs/fb/sessions.md)
- [Select evals and record Quality Gap revision evidence](../../docs/fb/evals.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

`PROJECT_BOARD.md` is truth; `docs/handoffs/index.md` is routing; detailed
handoffs are detail. Ordinary lanes plan only. Use `node tools/fb-lane.cjs
status` to inspect current coordination state; claims and source changes occur
only in an approved Product-launched BFM run.
Selected evals never self-promote and never replace Product or user judgment.
