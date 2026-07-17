---
name: project-coordination-setup
description: Use when bootstrapping an FB-coordinated project with board, handoff, workstream, and harness routes.
---

# Set up an FB-coordinated project

The bootstrap installs the canonical seven-page [FB harness](../../docs/fb/README.md)
pack and adds or updates a thin managed route in `AGENTS.md` and
`.codex/rules.md`. Fresh projects receive the pack and routes. On reruns, the
bootstrap preserves project-owned text and replaces only a complete block from
`<!-- fb-harness-route-start -->` through `<!-- fb-harness-route-end -->`;
unmatched markers and all text outside that exact boundary remain untouched.

The installed [start.md](../../docs/fb/start.md) defines Build For Me (BFM) as
the post-approval execution mode and remains the first-project source.

- [First-project contract and approval boundary](../../docs/fb/start.md)
- [Board/index/handoff/workstream roles and execution](../../docs/fb/workflow.md)
- [Review and verification evidence](../../docs/fb/evidence.md)
- [Safety, recovery, sidechat, and escalation policy](../../docs/fb/guardrails.md)
- [Repository-local session lifecycle and privacy boundary](../../docs/fb/sessions.md)
- [Markdown eval lifecycle and Quality Gaps](../../docs/fb/evals.md)

After setup, Product owns current goals and task sequencing; lanes use the
board and index before detailed handoffs; source-changing execution starts only
through approved BFM.
