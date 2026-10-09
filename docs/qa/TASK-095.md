---
task: TASK-095
status: checking
---

# TASK-095 — Passive Product intake evidence

## Candidate

Scoped `0.10.3-beta+codex.20260928093237` plugin and project-harness guidance
candidate. No app build or public plugin publication is part of this phase.

## Focused verification

The new focused contract failed on the old Product task-message rule, then
passed after the passive unread-or-saved-only policy. Root focused behavior
and cross-workstream suite: **10/10 passed**. Four existing consumers received
only their `docs/fb/workflow.md` arrival-section change: Unmirror, MÉJA,
Tough Talks, and Memory App. Their exact project IDs and Product/BFM task IDs
were confirmed from their onboarding receipts; no task was created or messaged.
The fifth project is the FB framework candidate itself.

Mechanical package synchronization and parity: **94/94 mirrors aligned**.
Root focused policy, cross-workstream, and metadata tests: **11/11 passed**.
Packaged context of the same focused contracts: **11/11 passed**.
One fresh-context, read-only workstream pressure check chose the indexed queue
and optional unread cue; it did not treat “send now” as permission to wake
Product/BFM. No native message or app execution occurred.

Installed runtime remains `0.10.2-beta+codex.20260925083556`; this
`0.10.3-beta+codex.20260928093237` package is a local review candidate until
the separate publication and installation boundary.

## Release checkpoint

Not requested. A public plugin release still requires Push Live and a separate
checkpoint. Project-local guidance changes do not deploy consumer apps.
