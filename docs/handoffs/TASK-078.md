---
type: fb-lane-handoff
fb_harness: v3
task: TASK-078
lane: fb-product
status: done
review_state: completed build
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
- Candidate commit: `926440c`; [PR #61](https://github.com/friedbeef1/fb-lane-coordination/pull/61)
  merged to `main` as `414b191`.
- Candidate build: `0.5.12-beta+codex.20260808093008`
- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#0512-beta--2026-08-08)
- Changelog approval: approved through Product/BFM standing delegation.
- Changed surfaces: setup skills, public and packaged setup documentation,
  plugin metadata, focused contracts, release records, and generated mirrors.
- Verification: [TASK-078 QA](../qa/TASK-078.md).
- Review state: completed build — this plugin/setup release has complete
  automated verification and no application preview.
- Publication: `0.5.12-beta+codex.20260808093008` installed and enabled from
  marketplace `fb-lane`; all 12 skills and the relative bundled MCP route were
  verified from the installed cache.
- External gates: complete — James authorized **Push Live**.
- Remaining owner/action: open a new Codex task to load the refreshed skills
  and MCP server.

## Brief Validation

Status: pass.

Satisfied criteria and evidence: one-sentence setup, safe reruns, deterministic
task reuse, metadata, changelog, root/package guidance, 65-mirror parity,
doctor, and the complete release checkpoint agree.

Missing criteria and next actions: none. Publication and installed-bundle
verification passed after **Push Live**.

## Verification Handoff

- Focused setup contract: passed in root and packaged contexts.
- Onboarding: passed 26/26 in root and packaged contexts.
- Product/BFM setup guidance and metadata/release contracts: passed in root and
  packaged contexts.
- Package parity: 65/65 mirrors aligned.
- Complete release checkpoint: passed with CLI 72/72, migration 34/34,
  sessions 39/39, evals 19/19, beginner 11/11, and efficiency 25/25.
- Doctor: Ready on the committed candidate.
- Repository state: committed candidate; this closeout changes coordination
  records only and does not require another runtime validator.

## Product/BFM Closeout

Status: **Done**.

The plugin release is merged, published through the configured GitHub
marketplace, installed, enabled, and verified. A new Codex task is required to
load the refreshed plugin.
