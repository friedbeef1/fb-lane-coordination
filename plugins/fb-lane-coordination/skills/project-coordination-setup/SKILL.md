---
name: project-coordination-setup
description: Use when bootstrapping an FB-coordinated project with board, handoff, workstream, and harness routes.
---

# Set up an FB-coordinated project

Bootstrap includes `docs/fb/control-loop.md`. Projects opt in through the Build
Brief and may configure repository-relative `controlLoop.profileManifest` and
`controlLoop.goldenManifest` paths in `.fb-lane.json`. Do not enable hosted
logging, transcript capture, or autonomous configuration promotion.

The bootstrap installs the canonical ten-page [FB harness](../../docs/fb/README.md)
pack and adds or updates a thin managed route in `AGENTS.md` and
`.codex/rules.md`. Fresh projects receive the pack and routes. On reruns, the
bootstrap preserves project-owned text and replaces only a complete block from
`<!-- fb-harness-route-start -->` through `<!-- fb-harness-route-end -->`;
unmatched markers and all text outside that exact boundary remain untouched.

Setup provisions the one six-workstream loop: Product/User (technical slug
`product`), Business, Design, Tech, Discovery, and Bugs. It preserves existing
project-owned cards and adds only missing cards. Each relevant workstream runs a
mini-loop and records a ready or blocked `docs/handoffs/<TASK-ID>.md` for the BFM
scanner; inactive workstreams need no manufactured work. BFM stops at **Ready to
ship**. Only **Push Live** authorizes merge or deployment.

The installed [start.md](../../docs/fb/start.md) defines the single public
workstream-first path. After relevant workstreams create ready handoffs, `$bfm`
activates Product reconciliation and execution of approved scope.

The installed [graph.md](../../docs/fb/graph.md) defines graph-directed
orientation. For a known task and question, agents call MCP
`fb_project_context` and open only its relevant cited authoritative records.
The graph is not a source of truth. Missing, stale, unhealthy, incomplete, or
contradictory packets fall back to the board → index → handoff → card route.

For routine session orientation, use CLI
`node tools/fb-lane.cjs status --context` or MCP
`fb_lane_status({context:true})`. It returns a bounded active-only board packet.
Open the full board only when that packet is insufficient or contradictory.
Completed-task closeout mechanically archives older terminal board history
after the board exceeds 64 KiB, while retaining the three most recent terminal
rows and every active or blocked row. This adds no user ceremony.

- [First-project contract and approval boundary](../../docs/fb/start.md)
- [Board/index/handoff/workstream roles and execution](../../docs/fb/workflow.md)
- [Review and verification evidence](../../docs/fb/evidence.md)
- [Safety, recovery, sidechat, and escalation policy](../../docs/fb/guardrails.md)
- [Repository-local session lifecycle and privacy boundary](../../docs/fb/sessions.md)
- [Markdown eval lifecycle and Quality Gaps](../../docs/fb/evals.md)
- [Normalized records, verification reuse, and compact closeout](../../docs/fb/records.md)

The installed `guardrails.md` is also the source for the canonical beginner pause card.
Use it for approval waits and genuine stops.

After setup, each matching workstream owns its investigation and ready handoff.
Product owns reconciliation and sequencing only after `$bfm`; source-changing
execution starts through that approved BFM boundary.

The installed harness retains private agent routing and keeps package mirrors
generated from canonical root files. Do not add a second
board/index/session record for Quick BFM; its single Quick Record and local
Efficiency Receipt are the durable boundary.

The harness distinguishes focused checks, immediate safety gates, and release
checkpoints. A full validator needs an explicit Product-owned release-checkpoint
request; a Markdown handoff artifact or review transfer alone is not one.
Its generated Quick Records state whether review is required: documentation and
coordination use zero reviewers after focused checks pass, runtime and test use
exactly one, and records without the field retain the legacy one-reviewer rule.
Projects may configure `hooks.focusedTest` and a
`timeouts.focusedTestMinutes` value of at most 10 in `.fb-lane.json`; otherwise
runtime Quick work uses bounded `npm test`.
The 5- or 15-minute target applies to one execution slice, not the complete
outcome. During `$bfm`, split predictable work up front into the smallest useful
dependency graph. Full BFM may coordinate many slices for hours and use parallel
agents or subagents for independent, non-overlapping locks. Keep dependent,
shared-file, sensitive, and unresolved-decision work sequential; verify each
slice narrowly and reserve broad validation for the release checkpoint.
