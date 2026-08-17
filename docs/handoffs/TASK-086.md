---
type: fb-lane-handoff
task: TASK-086
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
fb_harness: v3
worktree: /private/tmp/fb-task-086
sensitive: false
work_types: documentation, plugin-guidance, coordination
surface: public workflow, canonical harness, skills, generated plugin mirrors
---

# TASK-086 — Graph Blueprint workflow simplification

## Status

Ready to ship. The source and generated plugin now present the approved
Graph Blueprint workflow while preserving TASK-085 and the existing safety,
authority, exact-project, and release gates.

## Project Start Brief

Make FB feel as direct as the shared Graph Blueprint: fan out only where useful,
verify and synthesize the evidence, build bounded slices, verify the integrated
candidate once, and return one clear result.

## Goal Alignment Session

Product Goal: Make graph engineering understandable and fast in ordinary use
without weakening durable coordination or release safety.

Workstream Goal: Align the public path, canonical operating guidance, skill
behavior, generated project harness, and packaged plugin.

Lane OKR Fit: aligned.

User Approval Needed: no — James explicitly approved the recommendation on
2026-08-17.

Mini-loop Evidence: The new focused contract failed against the former all-six,
multi-stage wording and passes after the canonical and packaged guidance were
aligned.

Evidence Against Product OKR: None identified.

## Build Brief

- Present one visible sequence: Goal, Split, relevant workstreams, Verify
  evidence, Merge findings, Implement, Verify candidate, One clear result.
- Activate only relevant workstreams and use **Send this to Product.** as the
  common handoff action.
- Distinguish the evidence graph from the post-synthesis execution graph.
- Give each bounded implementation slice focused proof, followed by one
  fresh-context integrated candidate verification.
- Keep board, receipts, hashes, worktrees, and route selection as diagnostic
  machinery rather than user-facing choices.
- Run full task discovery and identity reconciliation only on lifecycle or
  drift triggers; routine `$bfm` validates the healthy receipt and fails closed
  when it is not healthy.
- Preserve all sensitive-operation and **Push Live** gates.

Changelog expectation: required.

## Brief Validation

Result: pass.

Satisfied criteria and evidence: The focused root/package contract proves the
eight-step sequence, conditional workstream activation, shared CTA, graph
separation, lifecycle-only reconciliation, diagnostic internal machinery,
fresh candidate verification, package parity, and unchanged release authority.

Missing criteria and next actions: None for the candidate. Publication and
installation remain the separate **Push Live** gate.

Approved scope-change references: James approved the recommendation in the
current Product/BFM conversation.

## Task Receipt

Approved brief and decisions: Implement the recommended Graph Blueprint-aligned
workflow across the repository, plugin guidance, generated harness, and public
documentation.

Confirmed assumptions and scope: Keep six available workstreams but activate
only relevant ones. Keep the durable graph and existing gates under the simple
surface. Preserve TASK-085 unchanged.

Branch, commits, and changed surfaces: `codex/TASK-086-graph-blueprint-v2`,
based on TASK-085 commit `969d8fe`; final TASK-086 commit recorded in Git.
Changed public/harness graph pages, Product/BFM/coordination/setup/workstream
skills, generated bootstrap guidance, focused contracts, and package mirrors.

Checks, failures, recovery, and results: Initial RED produced ten expected
failures. The final focused suites, package synchronization, syntax, links, and
whitespace pass. Three stale assertions were updated to test the approved
separated workflow rather than the superseded all-six/collapsed-verification
wording.

Review state: not reviewable — this is documentation and agent-guidance
behavior with no runnable UI. GitHub diff review is optional after push.

Limits and external gates: No consumer project was upgraded and the plugin was
not published or installed. Mermaid rendering is intended for GitHub.

Repository state and remaining owner/action: The review candidate is committed
and pushed separately. Product/BFM may merge, publish, and reinstall only after
explicit **Push Live**.

Changelog: updated — [TASK-086 Unreleased entry](../../CHANGELOG.md#task-086--graph-blueprint-workflow).

## Verification Handoff

- QA: [TASK-086 QA](../qa/TASK-086.md)
- Board: [TASK-086 board record](../../PROJECT_BOARD.md#task-086---graph-blueprint-workflow-simplification)
- Changelog: [Unreleased entry](../../CHANGELOG.md#task-086--graph-blueprint-workflow)
- System verification: passed; see QA for exact commands and results.

