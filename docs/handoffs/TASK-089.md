---
type: fb-lane-handoff
task: TASK-089
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
fb_harness: v3
worktree: /private/tmp/fb-task-089
sensitive: false
work_types: tooling, reliability
surface: linked-worktree handoff audit and packaged Codex plugin
---

# TASK-089 — Linked-worktree handoff delta audit

## Status

FB `0.9.3-beta+codex.20260820032957` candidate implemented and focused
verification passed. Exact Unmirror
comparison removed two untouched stale handoffs while preserving nineteen
handoffs changed by the active branch; that remaining real drift still blocks
Unmirror intake and was not hidden or mutated by this task.

## Project Start Brief

Keep real worktree-authored handoffs visible while ignoring untouched files
that differ only because canonical coordination moved forward after branching.

## Goal Alignment Session

Product Goal: Make cross-project FB intake reliable without weakening durable
handoff discovery or drift protection.

Workstream Goal: Derive linked-worktree evidence from exact Git deltas instead
of treating every historical branch snapshot as independently authored work.

Lane OKR Fit: aligned.

User Approval Needed: no — James authorized autonomous backward-compatible
enhancement in the current Product/BFM task.

Mini-loop Evidence: Installed 0.9.2 proves exact task receipt repair on real
Unmirror, then exact freeze reports untouched older worktree copies as drift.

Evidence Against Product OKR: None. The proposed filter remains fail-closed for
branch-authored, dirty, untracked, former-root, and quarantined evidence.

## Build Brief

- Use exact Git merge-base, branch-unique diff, dirty diff, and untracked paths
  to select handoffs contributed by a linked worktree.
- Ignore an existing worktree handoff only when Git proves the branch did not
  change it and the current worktree has no dirty or untracked change.
- Preserve complete canonical, configured former-root, and quarantined-manifest
  auditing.
- Fail closed when linked-worktree delta provenance cannot be established.
- Add focused proof for untouched stale snapshots and true branch-authored
  changes, then rerun the exact Unmirror freeze.

Changelog expectation: required.

## Brief Validation

Result: pass.

Satisfied criteria and evidence: The exact failure names one linked worktree
and many files that changed only in canonical after branch creation; Git can
deterministically distinguish those from branch-authored changes.

Missing criteria and next actions: No implementation criterion is missing.
Versioning, release validation, publication, and installation belong to a
later explicitly authorized release.

Approved scope-change references: Current Product/BFM authorization to improve
FB from repeated cross-project evidence without weakening compatibility.

## Task Receipt

Approved brief and decisions: Apply one bounded linked-worktree provenance
repair and preserve all existing safety and release gates.

Confirmed assumptions and approved scope changes: TASK-087 and TASK-088 source
is inherited unchanged. No consumer source or coordination record is edited.

Branch, source commits, and changed surfaces: Branch `codex/TASK-089-worktree-delta-audit`,
source stack `947852b`, `ca53bd3`, and
`3da06b6`, versioned as `0.9.3-beta+codex.20260820032957`; runtime, focused
regression, generated mirror, and TASK-087–089 evidence only.

Checks, failures, recovery, and results: Exact Unmirror onboarding reports all
seven pinned bindings and no reconciliation need. RED reproduced untouched
stale-snapshot drift. Focused proof now passes for ignored stale snapshots,
dirty and committed branch-authored drift, former-root drift, and missing-root
fail-closed behavior. Root/package intake and migration suites pass. Against
the current Unmirror checkout, the candidate removed two untouched stale
handoffs and preserved nineteen branch-authored conflicts from the active
Android reactivation worktree.

Review state, direct links, limits, and external gates: not reviewable —
nonvisual coordination behavior. See [TASK-089 QA](../qa/TASK-089.md). James
has authorized **Push Live** for this exact candidate; publication still
depends on the passing release checkpoint and exact installed-runtime proof.

Repository state: Isolated candidate branch; only TASK-089 runtime, focused
test, canonical guidance, changelog, durable evidence, and generated mirrors
changed.

Remaining owner and action: Product/BFM runs the one release checkpoint,
publishes the exact build, then refreshes only Product/BFM in each verified
active project. Existing six workstream tasks remain unchanged. Unmirror must
reconcile the nineteen genuine active-branch handoffs separately.

Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#093-beta--2026-08-20).

## Verification Handoff

- QA: [TASK-089 QA](../qa/TASK-089.md)
- Board: [TASK-089 board record](../../PROJECT_BOARD.md#task-089---linked-worktree-handoff-delta-audit)
- System verification: passed for the bounded candidate. Exact Unmirror remains
  safely blocked by real active-branch evidence, not untouched snapshot noise.
