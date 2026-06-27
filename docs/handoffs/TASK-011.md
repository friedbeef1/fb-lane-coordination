# TASK-011 - BFM Return-Loop Closeout Checks

## Goal Alignment

Goal Alignment: aligned
Goal Challenge / Caveat: No caveat identified
Evidence Against Goal: The previous guidance covered Goal Alignment and completion-audit language, but did not explicitly force BFM/Product to return to board, handoffs, source/docs/tests, lane status, and git status before closeout.

## Closeout Status

Status: implemented

Every handoff/accounting disagreement must now be marked:

- `implemented`
- `already done`
- `blocked`
- `out of scope`
- `explicitly deferred`

## What Changed

- Added BFM return-loop guidance to BFM, Product, Lane Coordination, and lane-specific skill files.
- Added lane return checks for Tech, Design, and Business closeouts.
- Updated bootstrap templates and generated CLI prompts so new projects inherit the rule.
- Regenerated source and packaged Antigravity agent JSON from the patched CLI.
- Bumped the Codex plugin build suffix to `0.1.2+codex.20260627163830`.
- Updated README, Codex guide, plugin README, changelog, and quickstart/setup guidance.
- Added the visible Mermaid return-loop diagram to the root README, packaged plugin README, and BFM skill so the loop is captured in the reusable FB-Lane repo, not only in project handoffs.

## Verification Evidence

- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `diff -q tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs`
- JSON parse check for plugin manifests and generated source/package agent JSON files
- Codex bootstrap smoke in a temporary repo confirmed generated `AGENTS.md`, `PROJECT_BOARD.md`, and `.codex/rules.md` include the return-loop wording
- `node tools/fb-lane.cjs doctor` passed setup checks; the only warning was expected while TASK-011 had uncommitted in-progress changes
- `git diff --check`
- `node tools/fb-lane.cjs doctor`

## Remaining Gates

- Product review/merge of PR #25.
- Plugin marketplace refresh/reinstall after merge.

## Product Status Recommendation

lane-verification-passed; pending Product merge.

Closeout note - TASK-011: implemented. Delivered: BFM return-loop closeout checks and visible return-loop diagram across skills, docs, templates, generated prompts, and packaged plugin files. Evidence: CLI syntax, manifest/agent JSON parse, bootstrap smoke, doctor setup checks, CLI parity, whitespace checks, and PR #25. Remaining: Product merge and plugin reinstall/refresh after merge. Handoff: docs/handoffs/TASK-011.md.
