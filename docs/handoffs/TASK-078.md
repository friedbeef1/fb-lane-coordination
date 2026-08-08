---
type: fb-lane-handoff
fb_harness: v3
task: TASK-078
lane: fb-product
status: checking
review_state: not reviewable
---

# TASK-078 — One-sentence GitHub setup and FB 0.5.12-beta

## Goal Alignment Session

Product Goal: Make FB installation and safe existing-project upgrades begin
with one ordinary sentence instead of terminal-command knowledge.
Workstream Goal: Combine task reuse, plain-language repeat setup, and the GitHub
entry point without changing FB's runtime interfaces or project topology.
Lane OKR Fit: aligned
User Approval Needed: no — James explicitly asked Product/BFM to complete this
setup experience.
Mini-loop Evidence: the existing plugin required users to remember marketplace
and install commands, while the two verified setup candidates already proved
safe task reuse and plain-language repeat setup independently.
Evidence Against Product OKR: Codex cannot hot-load a newly installed plugin in
the current task; the documented new-task transition remains necessary.

## Project Start Brief

User decision: installing or upgrading FB should begin with one memorable
sentence that points Codex to GitHub. Existing project work and task topology
must be preserved automatically.

Assumptions: Codex can manage configured Git marketplaces and plugins, but a
plugin cannot load itself before installation and refreshed skills require a new
task. No runtime command, MCP name, task topology, or release boundary changes.

Success: README, setup guidance, installed plugin guidance, and tests expose the
same one-sentence entry point; repeat setup is described in plain language;
existing tasks are reused and only missing roles are created.

## Build Brief

- Include now: integrate TASK-077 and TASK-Q-20260808-ONBOARDING-REUSE; add the
  GitHub install-or-update entry point; rebuild mirrors; publish a 0.5.12-beta
  candidate.
- Deferred: automatic hot-loading of a newly installed plugin in the current
  Codex task; Codex does not expose that capability.
- Verification: focused root/package setup contract, metadata/release contract,
  package parity, syntax, links, whitespace, doctor, and one release checkpoint.
- Changelog expectation: required.
- Release boundary: stop at **Ready to ship**. Only **Push Live** authorizes
  GitHub merge, marketplace publication, or reinstall.

## Product disposition

| Input | Disposition | Reason |
|---|---|---|
| TASK-Q-20260808-ONBOARDING-REUSE | Include now | Prevents duplicate tasks during upgrades. |
| TASK-077 | Include now | Replaces setup jargon with a safe-rerun explanation. |
| One-sentence GitHub request | Include now | Removes terminal-command memorization. |

## Task Receipt

- Branch: `codex/onboarding-reuse-permission`
- Candidate build: `0.5.12-beta+codex.20260808093008`
- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#0512-beta--2026-08-08)
- Changed surfaces: setup skills, public and packaged setup documentation,
  plugin metadata, focused contracts, release records, and generated mirrors.
- External gates: **Push Live** for publication and reinstall.
- Remaining owner/action: Product/BFM completes focused evidence and reports
  **Ready to ship**.

## Brief Validation

Status: pending verification.

Satisfied criteria and evidence: implementation is scoped to setup guidance,
metadata, tests, and generated mirrors; existing technical interfaces remain
unchanged.

Missing criteria and next actions: focused root/package setup, onboarding,
metadata, release, parity, syntax, and whitespace checks passed. Commit the
candidate, require doctor Ready, run the single final release checkpoint, then
update this handoff and QA artifact with exact evidence.
