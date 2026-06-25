# TASK-Q-5624 - Documentation and Changelog Update

## Task
- **ID**: TASK-Q-5624
- **Owner**: FB-Product
- **Scope**: Document the Codex plugin upgrade process and add release notes for the merged Goal Alignment / Product-Lane boundary update.
- **Out of Scope**: Plugin behavior changes, cache version bumps, or unrelated documentation rewrites.

## What Changed
- Added `CHANGELOG.md` with release notes for `0.1.2+codex.20260625082239` and the prior Codex setup build.
- Linked the changelog from `README.md`.
- Added Codex plugin upgrade/reinstall guidance to `README.md`, `docs/setup.md`, and `platforms/codex/README.md`.
- Updated `PROJECT_BOARD.md` and `docs/handoffs/TASK-010.md` to record that PR #19 merged and the active Codex cache was reinstalled.

## Verification Evidence
- `git diff --check` passed.
- `node tools/fb-lane.cjs doctor` passed all setup/lock/handoff checks; only expected uncommitted-branch warning remained before commit.
- `rg` check confirmed the mistaken quick-task lock reference and obsolete TASK-010 remaining-gate wording were removed.

## Product Status Recommendation
lane-verification-passed

Closeout note - TASK-Q-5624: done. Delivered: changelog and Codex plugin upgrade documentation. Evidence: PR #20 merged, `git diff --check`, `node tools/fb-lane.cjs doctor`, and stale-reference `rg` check passed. Remaining: none. Handoff: docs/handoffs/TASK-Q-5624.md.
