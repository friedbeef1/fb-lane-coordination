---
type: fb-lane-handoff
task: TASK-Q-20260713-SIDECHAT-PARENT
lane: fb-product
status: staging-qa
okr_fit: aligned
---

# Sidechat Parent-Thread Routing

## Scope

Codify a parent-thread-only handoff rule for sidechats. A sidechat may hand off
only to the main thread from which it was opened. It must never infer another
destination from role, project, name, recency, or Product/BFM status.

When the parent cannot be identified or reached, return the existing
paste-ready handoff to the user, clearly name the missing parent context, and
do not send, redirect, or imply delivery to another main thread. A non-parent
main treats supplied material as ordinary user-provided context. Product/BFM
still records accepted decisions in the board, handoff, or durable docs before
they become source of truth.

## Delivered

- Added the canonical [`docs/sidechat-parent-thread-routing.md`](../sidechat-parent-thread-routing.md) contract.
- Linked or restated the rule in project instructions, root coordination/setup
  skill sources, every bundled lane skill, public documentation, templates, and
  Codex rules.
- Updated Codex bootstrap so new projects receive the canonical document and
  the matching parent-only guidance in generated instructions and rules.
- Added mirrored root/package regression coverage for canonical wording,
  every active sidechat-facing entry point, the no-role-selection rule, and
  fresh-bootstrap output.

## Verification

- `node tools/fb-lane.test.cjs` — passed, 26 checks.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — passed, 26 checks.
- Root/package CLI and test files are byte-identical.
- Node syntax checks passed for both CLI copies.
- `node tools/fb-lane.validate.cjs` — passed on the clean committed worktree.
- `node tools/fb-lane.cjs doctor` — Ready on the clean committed worktree.
- `git diff --check` — passed.
- Independent read-only review found and this change resolves stale
  role-selected `main Product/BFM thread` wording in generated and public
  entry points.

## Gates

- No live routing, automatic routing, thread discovery, plugin publication,
  release, or paused-integration testing was attempted or authorized.
- Product review of the branch diff remains the next gate.

## Goal Alignment Session

Product Goal: Keep sidechat routing safe and deterministic without changing the four-lane model.
Workstream Goal: Publish one parent-thread-only instruction across the project and bundled Codex plugin.
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: Canonical-document, source/package-entry-point, and fresh-bootstrap regressions pass in both mirrored test suites.
Evidence Against Product OKR: None identified.
