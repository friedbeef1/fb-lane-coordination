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
- A circuit breaker stops automatic workers, not Product/BFM ownership.
  Product/BFM may direct one concrete, scope-preserving recovery without asking
  the user again; material product decisions and safety gates still stop.

## Acceptance

- All 30 ordered non-self workstream pairs validate.
- A queued handoff never grants source or delivery authority.
- Doctor reports malformed cross-workstream artifacts without applying
  Product-ready handoff rules to them.
- Root and packaged plugin guidance remain mechanically aligned.

## Closeout

- Review state: not reviewable
- Changelog: updated — [FB 0.5.5-beta](../../CHANGELOG.md#055-beta--2026-08-04)
- Changelog approval: approved — James approved the revised Product-directed
  recovery wording on 2026-08-04.
- Verification: [TASK-071 QA](../qa/TASK-071.md)
- External delivery: PR #54 passed GitHub readiness and merged as `2c3dc4c`.
  The marketplace was refreshed and the exact release build was installed,
  enabled, and checked from its live cache.
- Remaining owner/action: start a new Codex task to load the refreshed plugin.

## Product/BFM Closeout

Status: Done — released and installed.
Actioned By: FB-Product / BFM.
Result: Canonical runtime, skills, public guidance, and packaged mirrors now
support passive workstream-to-workstream planning handoffs.
Evidence: Focused root/package contracts, the complete final release validator,
GitHub readiness, merge, marketplace refresh, reinstall, and live-cache checks
passed; see [TASK-071 QA](../qa/TASK-071.md).
Remaining: Existing Codex tasks do not hot-reload; use a new task.

## Loop Learning

- Feedback captured: Product should not be a relay for every planning question,
  but handoff arrival must not trigger work automatically.
- Pattern repeated: no; this is the first explicit cross-workstream route.
- Tooling needed: a small deterministic Markdown validator and doctor check.
- Escalation: app-level task routing remains out of scope unless repeated manual
  routing failures produce evidence that guidance is insufficient.
