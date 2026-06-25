# TASK-010 - Lightweight Goal Alignment

## Task
- **ID**: TASK-010
- **Owner**: FB-Product
- **Scope**: Add one canonical Working Goal per non-trivial FB-Lane task, keep lane handoffs lightweight, and make BFM reconcile goal drift before sequencing work.
- **Out of Scope**: Hard-blocking `submit`, changing quick-task behavior, or creating a standalone goal-management framework.

## Goal Alignment
- **Goal Alignment**: aligned
- **Working Goal**: Make non-trivial FB-Lane handoffs preserve a clear Product/BFM-owned Working Goal while preserving lane caveats and evidence.
- **Success Measure**: Skills, bootstrap guidance, packaged plugin files, and doctor checks consistently express the Goal Alignment contract, with quick tasks exempt.
- **Gate / Review Point**: Source validation, plugin validation, CLI syntax checks, and doctor fixture checks pass before submit.
- **Goal Challenge / Caveat**: No caveat identified.
- **Evidence Against Goal**: The implemented guidance and doctor fixture checks prove the goal-alignment loop is present without changing `submit` behavior.

## What Changed
- Added lightweight Goal Alignment guidance to Product, BFM, lane skills, root coordination skills, project setup guidance, and AGENTS/templates.
- Updated generated CLI bootstrap guidance in both root and packaged CLI copies so new projects inherit the Working Goal, compact lane handoff fields, goal drift record, good/bad examples, and micro quick-task exemption.
- Added advisory `doctor` warnings for non-quick handoffs missing a `## Goal Alignment` heading while exempting `TASK-Q-*` handoffs.
- Bumped plugin metadata to `0.1.2+codex.20260625082239` so installs can distinguish this build after merge.

## Modified Files
- `AGENTS.md`
- `templates/AGENTS.md`
- `templates/PROJECT_BOARD.md`
- `skills/fb-lane-coordination/SKILL.md`
- `skills/project-coordination-setup/SKILL.md`
- `skills/quickstart/SKILL.md`
- `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
- `plugins/fb-lane-coordination/plugin.json`
- `plugins/fb-lane-coordination/skills/bfm/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`
- `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
- `tools/fb-lane.cjs`
- `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `docs/handoffs/TASK-010.md`
- `PROJECT_BOARD.md`

## Verification Evidence
- `quick_validate.py` passed for all plugin skills under `plugins/fb-lane-coordination/skills/*`.
- `quick_validate.py` passed for root `skills/fb-lane-coordination` and `skills/project-coordination-setup`.
- `validate_plugin.py plugins/fb-lane-coordination` passed.
- `node --check tools/fb-lane.cjs` passed.
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` passed.
- `diff -q tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs` passed.
- `git diff --check` passed.
- Temporary doctor fixture matrix passed:
  - valid `TASK-###` handoff with `## Goal Alignment`: no warning
  - missing `TASK-###` handoff: warning
  - missing `TASK-Q-####` handoff: no warning
- Subagent review approved the CLI doctor slice.
- Subagent review flagged one minor missing example in the root coordination skill; fixed in `693fddf`.
- Subagent review approved the generated bootstrap guidance slice.
- Final whole-branch review found two consistency gaps; both were addressed in the manual board template and quickstart skill.

## Remaining Gates
- Re-run final whole-branch review after the consistency fixes.
- Branch push / PR review by Product before merge to `main`.
- Installed plugin cache refresh after merge.

## Product Status Recommendation
lane-verification-passed

Closeout note - TASK-010: lane-verification-passed. Delivered: lightweight Goal Alignment guidance, BFM reconciliation rules, generated bootstrap guidance, plugin metadata bump, and doctor advisory warnings. Evidence: skill/plugin/CLI validation, doctor fixture matrix, and focused subagent reviews. Remaining: final branch review, branch push/PR, merge, and installed plugin cache refresh. Handoff: docs/handoffs/TASK-010.md.
