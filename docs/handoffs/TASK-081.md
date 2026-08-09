---
type: fb-lane-handoff
fb_harness: v3
task: TASK-081
lane: fb-product
status: implemented
review_state: completed build
---

# TASK-081 — Complete exact-project sidebar inventory

## Goal Alignment Session

Product Goal: Make FB setup safe and usable on a busy Codex host without
creating duplicate sidebar tasks.
Workstream Goal: Replace the capped global non-pinned inventory dependency with
a complete, read-only exact-root adapter joined to current native evidence.
Lane OKR Fit: aligned.
User Approval Needed: no — James delegated TASK-081 integration and authorized
Product/BFM to prepare the release candidate while retaining **Push Live**.
Approval: approved — James delegated this FB repair to Product/BFM.
Mini-loop Evidence: the capped-list RED fixture failed before the adapter,
then the complete join and every declared fail-closed case passed in root and
packaged contracts.
Evidence Against Product OKR: the live MÉJA smoke proved the adapter can
identify the one real pinned Product/BFM task while excluding its helper,
supporting safe creation of only the six genuinely missing roles after release.

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

Current: **Ready to ship** — `0.7.1-beta+codex.20260809105651`.
Next: wait for **Push Live** before push, merge, publication, or installation.
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
- Candidate build: `0.7.1-beta+codex.20260809105651`; implementation commit
  `b66502f` plus the pending release-candidate closeout commit.
- Changed surfaces: onboarding runtime and focused contract, setup skills,
  active setup/start guidance, package mirrors, board, handoff, and QA.
- Verification: [TASK-081 QA](../qa/TASK-081.md).
- Failures and recovery: initial RED proved the adapter absent; focused wording
  and fixture-order mismatches were corrected; the whole-candidate privacy
  finding received the one consolidated behavioral repair.
- Review state: completed build; optional review is limited to the local
  candidate records until a GitHub branch exists.
- Limits: local-host Codex only; it does not create, rename, pin, archive, merge,
  publish, install, or deploy anything by itself.
- External gates: explicit **Push Live**, publication, reinstall, and a new
  MÉJA task.
- Repository state: clean local release candidate in an isolated worktree; no
  push.
- Remaining owner/action: Product release sequencing, then rerun `$fb-setup` in
  a new MÉJA Product/BFM task after the refreshed plugin is installed.
- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#071-beta--2026-08-09).

## Brief Validation

Status: pass for the bounded candidate.

Satisfied criteria: complete capped inventory, exact project/root join,
helper/subagent exclusion, current native title/pin confirmation, metadata-only
evidence, fail-closed missing/contradictory/private evidence, package parity,
syntax, doctor, and whitespace all have focused proof.

Missing criteria and next action: none inside the local candidate. External
release remains gated by **Push Live**.

## Test This Now

What this is:
- Completed local plugin release candidate.

Open:
- [TASK-081 verification](../qa/TASK-081.md)
- [FB 0.7.1-beta changelog](../../CHANGELOG.md#071-beta--2026-08-09)

Test plan:
1. Run the focused root/package setup contract and expect the capped inventory
   to pass only with complete joined evidence.
2. Supply missing, contradictory, unknown-source, or transcript-bearing
   evidence and expect setup to fail before mutation.
3. Run the read-only adapter for the canonical MÉJA root and expect only the
   current pinned Product/BFM task, not its helper/guardian task.

Pass criteria:
- The exact-root candidate set is complete and helper-free.
- Native project, current task detail, and pinned membership agree.
- No task is created, renamed, pinned, archived, or otherwise mutated by the
  adapter.

Known limits:
- This candidate is not published or installed. It does not yet reconcile the
  six missing MÉJA workstream tasks.

If it fails:
- Record the failed proof and candidate commit in this handoff; do not weaken
  duplicate detection or use local state alone as authority.
