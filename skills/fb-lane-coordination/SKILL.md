---
name: fb-lane-coordination
description: Coordinates board-aware FB tasks, handoffs, staging submissions, and Product/BFM integration.
---

# FB task coordination

Read [the FB harness](../../docs/fb/README.md) before acting, then read the
board, index, linked handoff, and relevant workstream card. The harness owns
the durable policy:

- [Project Start Brief, lanes, and approval](../../docs/fb/start.md)
- [Source hierarchy, locks, BFM, and closeout](../../docs/fb/workflow.md)
- [Test This Now and Verification Handoff](../../docs/fb/evidence.md)
- [Hard stops, parent-only sidechats, recovery, and Loop Learning](../../docs/fb/guardrails.md)
- [Durable sessions, checkpoints, recall, review, and closeout](../../docs/fb/sessions.md)

Use `node tools/fb-lane.cjs status` for state. Claims, submissions, merges, and
source-changing work are BFM actions after Product clears the approval and lock
gates. For a durable task, intake is read-only and Product/BFM promotes the
approved session; submit and completed closeout require the reciprocal receipt,
validation, verification, and Test This Now evidence. Keep technical command
names unchanged; do not reproduce the manual here.
