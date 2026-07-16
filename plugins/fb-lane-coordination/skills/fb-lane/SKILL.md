---
name: fb-lane
description: Use when concurrent Codex work needs board-aware FB lanes, locks, handoffs, and Product integration.
---

# FB coordination

Read [the FB harness](../../docs/fb/README.md), then the project board, handoff
index, linked handoff, and relevant workstream card. Use the smallest mode:
normal work for isolated tasks, FB light for durable coordination, and
Product/BFM for approval, sequencing, sensitive surfaces, or reconciled lanes.

- [Start and clarify an objective](../../docs/fb/start.md)
- [Coordinate lanes and approved BFM work](../../docs/fb/workflow.md)
- [Prepare review evidence](../../docs/fb/evidence.md)
- [Respect safety, sidechat, recovery, and escalation rules](../../docs/fb/guardrails.md)
- [Resume durable sessions and curate checkpoint evidence](../../docs/fb/sessions.md)

`PROJECT_BOARD.md` is truth; `docs/handoffs/index.md` is routing; detailed
handoffs are detail. Ordinary lanes plan only. Use `node tools/fb-lane.cjs
status` to inspect current coordination state; claims and source changes occur
only in an approved Product-launched BFM run.
