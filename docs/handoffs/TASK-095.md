---
type: fb-lane-handoff
task: TASK-095
lane: fb-product
status: staging-qa
record_model: normalized-v1
approval: approved
---

# Passive Product intake signal

## Project Start Brief

James wants workstream handoffs to remain visible to Product/BFM without
starting a Product/BFM agent turn. A handoff arriving must never cause
reconciliation, prioritization, or execution before James invokes `$bfm`.
Existing project tasks and active source work remain intact.

## Build Brief

- Decision: index and save the handoff first. Do not send a native follow-up
  prompt to Product/BFM as an arrival notification.
- If an exact repository-scoped Product/BFM task is verified and Codex offers a
  read-state control, mark that existing task unread as the passive cue. This
  conveys no handoff content; the canonical handoff and index remain the queue.
- If exact identity or read-state control is unavailable, report saved-only
  honestly. Do not create a task, guess a target, or claim delivery.
- Only James invoking `$bfm` starts Product/BFM reconciliation; queue preview
  and its specific approval remain before source execution.
- Apply the focused managed policy to the five active FB-managed project groups
  without overwriting app-owned instructions or unrelated changes.
- Changelog expectation: required for this user-visible plugin workflow change.
- Out of scope: app source, automatic task messaging, backlog execution,
  marketplace publication, merge, deployment, and plugin installation before
  the distinct release boundary.

## Goal Alignment Session

Product Goal: Predictable Product-controlled intake with low coordination cost.
Workstream Goal: Preserve awareness without waking Product/BFM.
Lane OKR Fit: aligned.
User Approval Needed: no for the scoped implementation; Push Live remains the release gate.
Mini-loop Evidence: Codex task messaging sends a follow-up prompt; existing
workflow text incorrectly calls that a passive notice.
Evidence Against Product OKR: An unread cue contains no handoff details; the
indexed file must remain complete and discoverable.

## Status

Local Staging QA candidate `0.10.3-beta+codex.20260928093237`.
Public publication, marketplace upgrade, and installed runtime remain pending
the separate **Push Live** boundary.

## Brief Validation

pass — focused arrival contract passed; all four consumer repositories received
the narrow project-local workflow update without new chats or app source edits.
Public plugin release and fresh-task runtime proof remain external gates.

## Task Receipt

- Approved brief and decisions: James approved passive arrival, no Product/BFM wake-up, and rollout to active FB-managed projects.
- Confirmed assumptions and approved scope changes: the indexed handoff is authoritative; unread is only a visual cue and never an execution trigger.
- Branch, source commits, and changed surfaces: codex/TASK-095-passive-product-intake; `0.10.3-beta+codex.20260928093237` candidate, canonical policy, skills, package mirrors, focused test and managed consumer guidance.
- Checks, failures, recovery, and results: initial focused contract failed against task-message delivery; corrected contract passed 10/10 tests. Package synchronization and release-candidate proof are recorded in [QA evidence](../qa/TASK-095.md).
- Review state, direct links, limits, and external gates: not reviewable as an app build; [QA evidence](../qa/TASK-095.md); Push Live remains required for public plugin release.
- Repository state: isolated source branch; consumer app source untouched.
- Remaining owner and action: Product/BFM completes focused proof and records per-project adoption; public release remains separate.
- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#0103-beta--2026-09-28).
