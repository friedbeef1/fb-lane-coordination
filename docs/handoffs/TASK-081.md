---
type: fb-lane-handoff
fb_harness: v3
task: TASK-081
lane: fb-product
status: implemented
review_state: not reviewable
---

# TASK-081 — Complete exact-project sidebar inventory

## Goal Alignment Session

Product Goal: Make FB setup safe and usable on a busy Codex host without
creating duplicate sidebar tasks.
Workstream Goal: Replace the capped global non-pinned inventory dependency with
a complete, read-only exact-root adapter joined to current native evidence.
Lane OKR Fit: aligned.
Approval: approved — James delegated this FB repair to Product/BFM.

## Project Start Brief

User decision: Fix the strict `$fb-setup` deadlock for the canonical MÉJA
repository. Do not weaken duplicate protection and do not touch MÉJA source.

Assumptions to verify: the host-local Codex state can enumerate every active
user-visible task ID for one exact canonical root; native `read_thread` can
provide current task titles and roots by ID; native `list_threads` remains the
authority for the complete pinned-task set.

Success: capped non-pinned results no longer block when the joined evidence is
complete, while missing identity, missing task detail, unsupported local row
types, source unavailability, or contradictory pin/root evidence still blocks
before any task mutation.

## Build Brief

- Include now: one read-only local candidate adapter, native-evidence join,
  focused fail-closed tests, setup guidance, generated package mirrors, and
  durable QA.
- Out of scope: application source, sidebar mutation during this FB task,
  transcript capture, hosted storage, publication, installation, and release.
- Verification: focused proof for complete capped inventory and every declared
  failure boundary; one whole-candidate review; package parity, syntax, links,
  and whitespace.
- Changelog expectation: required if this runtime change is released; defer
  version and changelog wording until Product sequences that release.
- Release boundary: stop at **Ready to ship**. Only **Push Live** authorizes
  merge, marketplace publication, or global reinstall.

## Intake disposition

Include now: the delegated setup-inventory repair.
Blocked: none in the local implementation slice.
Deferred: release metadata, publication, global reinstall, and the subsequent
MÉJA `$fb-setup` retry.
Duplicate: none.
Rejected: treating the SQLite thread table alone as project or pin authority;
blind creation from guessed titles.
Superseded: the capped-list-only path when a complete joined local inventory is
available; it remains the fallback on unsupported hosts.

## Current execution state

Current: Local candidate verified in Staging QA.
Next: Product prepares the release version and changelog, runs the release
checkpoint, and requests **Push Live** before publication and installation.
Blocked: none.
Deferred: publication and consumer-project reconciliation until **Push Live**.

## Task Receipt

- Approved brief: replace the capped-list-only stop with a complete read-only
  exact-root inventory route while retaining strict duplicate protection.
- Decisions: local state enumerates active candidate IDs only; native project,
  current task detail, and pinned-task evidence remain authoritative; unknown
  row kinds or contradictory evidence fail closed.
- Scope changes: the whole-candidate review added metadata-only evidence
  enforcement so previews, turns, messages, tool items, and rollout paths
  cannot enter the join bundle.
- Branch: `codex/fb-setup-complete-inventory`.
- Changed surfaces: onboarding runtime and focused contract, setup skills,
  active setup/start guidance, package mirrors, board, handoff, and QA.
- Verification: [TASK-081 QA](../qa/TASK-081.md).
- Failures and recovery: initial RED proved the adapter absent; focused wording
  and fixture-order mismatches were corrected; the whole-candidate privacy
  finding received the one consolidated behavioral repair.
- Review state: not reviewable; this is a local runtime/plugin candidate with no
  published build or consumer installation.
- Limits: local-host Codex only; it does not create, rename, pin, archive, merge,
  publish, install, or deploy anything by itself.
- External gates: changelog/version preparation, release checkpoint, explicit
  **Push Live**, publication, reinstall, and a new MÉJA task.
- Repository state: focused candidate in an isolated worktree; no push.
- Remaining owner/action: Product release sequencing, then rerun `$fb-setup` in
  a new MÉJA Product/BFM task after the refreshed plugin is installed.
- Changelog: pending — required if this user-visible runtime change is released.

## Brief Validation

Status: pass for the bounded candidate.

Satisfied criteria: complete capped inventory, exact project/root join,
helper/subagent exclusion, current native title/pin confirmation, metadata-only
evidence, fail-closed missing/contradictory/private evidence, package parity,
syntax, doctor, and whitespace all have focused proof.

Missing criteria and next action: release metadata and the release checkpoint
are intentionally deferred until Product sequences publication. They do not
invalidate the local implementation candidate.
