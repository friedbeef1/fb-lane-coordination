---
type: fb-lane-handoff
task: TASK-071
lane: fb-product
status: implemented
okr_fit: aligned
---

# TASK-071 — Queued cross-workstream handoffs

Release candidate: `0.5.5-beta+codex.20260803212323`

## Goal Alignment Session

Product Goal: Move useful planning and evidence between FB workstreams without creating unplanned execution.
Workstream Goal: Add an explicit queue-and-wait route between any two distinct main workstreams.
Lane OKR Fit: aligned
User Approval Needed: no — James selected queue-and-wait behavior and approved implementation.
Mini-loop Evidence: The focused guidance contract failed before the routing contract existed and passed after canonical implementation and mechanical package generation.
Evidence Against Product OKR: None identified.

## Approved brief

Any main workstream may, on an explicit user request, create a queued planning
handoff for a different main workstream. The destination remains idle until the
user asks it to continue. The route grants planning authority only and never
enters `$bfm` directly.

## Decisions and scope

- `fb-workstream-handoff` is distinct from a Product-ready `fb-lane-handoff`.
- Valid states are `queued`, `in_review`, `consumed`, `deferred`, and
  `superseded`; `ready` is rejected for the planning artifact.
- The destination notice is passive and names the source, destination, and
  Markdown link.
- `$bfm` ignores every cross-workstream planning state.
- Sidechat routing remains restricted to its originating parent.
- When Codex task tools are unavailable, FB returns a paste-ready notice.
- No app-level routing, transcript capture, hosted service, or automatic task
  discovery was added.

## Acceptance

- All 30 ordered non-self workstream pairs validate.
- A queued handoff never grants source or delivery authority.
- Doctor reports malformed cross-workstream artifacts without applying
  Product-ready handoff rules to them.
- Root and packaged plugin guidance remain mechanically aligned.

## Closeout

- Review state: not reviewable
- Changelog: updated — [FB 0.5.5-beta](../../CHANGELOG.md#055-beta--2026-08-04)
- Changelog approval: approved — James approved the drafted entry on
  2026-08-04.
- Verification: [TASK-071 QA](../qa/TASK-071.md)
- External gates: release checkpoint, push, PR, merge, marketplace publication,
  reinstall, and live-cache verification remain unauthorized.
- Remaining owner/action: Product runs the approved release checkpoint and
  records its result before any external delivery.

## Product/BFM Closeout

Status: Checking — unreleased candidate.
Actioned By: FB-Product / BFM.
Result: Canonical runtime, skills, public guidance, and packaged mirrors now
support passive workstream-to-workstream planning handoffs.
Evidence: Focused root/package contracts, CLI regression, mechanical mirror
generation, syntax, and whitespace are recorded in [TASK-071 QA](../qa/TASK-071.md).
Remaining: The one complete release checkpoint precedes any push, merge,
publication, or reinstall.

## Loop Learning

- Feedback captured: Product should not be a relay for every planning question,
  but handoff arrival must not trigger work automatically.
- Pattern repeated: no; this is the first explicit cross-workstream route.
- Tooling needed: a small deterministic Markdown validator and doctor check.
- Escalation: app-level task routing remains out of scope unless repeated manual
  routing failures produce evidence that guidance is insufficient.
