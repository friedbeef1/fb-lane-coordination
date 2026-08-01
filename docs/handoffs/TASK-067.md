---
type: fb-lane-handoff
task: TASK-067
lane: fb-product
status: done
okr_fit: aligned
---

# TASK-067 — Sidechat execution authority

Release candidate: `0.5.4-beta+codex.20260801143809`

## Goal Alignment Session

Product Goal: Keep execution authority predictable without adding ceremony to approved Product/BFM work.
Workstream Goal: Make sidechat mutation require an explicit named one-use exception while ordinary workstreams stay plan-only.
Lane OKR Fit: aligned
User Approval Needed: no — James supplied and routed the ready handoff to this Product/BFM parent task.
Mini-loop Evidence: The focused packaged-skill contract failed before the canonical authority section existed and passed after the canonical change and mechanical mirror generation.
Evidence Against Product OKR: None identified.

## Approved brief

Make execution authority predictable by conversation context. Product/BFM
parent tasks may execute approved scope; workstream parents plan and hand off;
sidechats remain read-only unless the user explicitly confirms one named,
one-use execution exception.

## Decisions and scope

- The canonical authority table and confirmation rule live in
  [guardrails](../fb/guardrails.md#execution-authority-by-conversation-context).
- BFM, Product/User, Business, Design, Tech, Discovery, Bugs, and coordination
  skills link to that authority instead of duplicating the full contract.
- Ordinary execution words do not authorize sidechat mutation.
- Existing release, provider, privacy, payment, destructive-operation, lock,
  and physical-device gates remain unchanged.
- No CLI, hook, database, state machine, dashboard, or permission subsystem was
  added.

## Acceptance

- All four contexts and defaults are stated once canonically.
- The required confirmation question and consumed-after-one-task behavior are
  explicit.
- Read-only inspection and paste-ready handoffs remain allowed.
- Root/package guidance remains mechanically aligned.

## Closeout

- Review state: not reviewable
- Changelog: updated — [FB 0.5.4-beta](../../CHANGELOG.md#054-beta--2026-08-01)
- Changelog approval: approved — James approved the drafted entry on
  2026-08-01.
- Verification: [TASK-067 QA](../qa/TASK-067.md)
- External gates: merge was requested; publication, marketplace upgrade, plugin
  reinstall, and consumer-project refresh were completed through the global
  plugin; dirty consumer worktrees were not rewritten.
- Remaining owner/action: start a new Codex task in an active repository to
  load the refreshed plugin snapshot.

## Product/BFM Closeout

Status: Done.
Actioned By: FB-Product / BFM.
Result: FB now enforces the conversation authority contract through canonical
and packaged guidance.
Evidence: The complete release validator and GitHub CI passed; PR #53 merged as
`cfa1632`; the marketplace upgrade and reinstall succeeded; and the installed
cache reports `0.5.4-beta+codex.20260801143809` with the new guardrail and skill
references. See [TASK-067 QA](../qa/TASK-067.md).
Remaining: Existing open Codex tasks retain their loaded snapshot; new tasks
load FB 0.5.4. Active dirty repositories were inspected but not rewritten.

## Loop Learning

- Feedback captured: source metadata must not be mistaken for the current task
  context; the current parent task determines authority.
- Pattern repeated: yes, based on the supplied handoff.
- Tooling needed: none for this first guidance-only pass.
- Escalation: propose mechanical enforcement only if fresh-task evidence shows
  repeated failure after publication.
