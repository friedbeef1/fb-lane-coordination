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
- Tightened final review findings so the handoff instructions now require an actual `## Goal Alignment` Markdown heading, worker lanes report goal feedback only in handoffs, and the static Claude/Antigravity templates inherit the same rule.
- Bumped plugin metadata to `0.1.2+codex.20260625082239` so installs can distinguish this build after merge.
- Tightened Product/Lane execution boundaries across skills, prompts, platform docs, generated bootstrap templates, and both CLI copies: Product gives direction, sets goals, assigns lanes, reviews handoffs, and integrates; individual Tech/Design/Business lanes claim and execute their own task/files.
- Added advisory `doctor` diagnostics for stale Git lock files and long-running local lane git/test/build processes so Product can record a blocked or pending gate instead of absorbing execution work.

## Modified Files
- `AGENTS.md`
- `README.md`
- `platforms/antigravity/README.md`
- `platforms/codex/README.md`
- `platforms/codex/workflow-rules.md`
- `agents/fb-product.md`
- `templates/AGENTS.md`
- `templates/CLAUDE.md`
- `templates/PROJECT_BOARD.md`
- `skills/fb-lane-coordination/SKILL.md`
- `skills/project-coordination-setup/SKILL.md`
- `skills/quickstart/SKILL.md`
- `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
- `plugins/fb-lane-coordination/plugin.json`
- `plugins/fb-lane-coordination/README.md`
- `plugins/fb-lane-coordination/agents/FB-Business/agent.json`
- `plugins/fb-lane-coordination/agents/FB-Design/agent.json`
- `plugins/fb-lane-coordination/agents/FB-Product/agent.json`
- `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`
- `plugins/fb-lane-coordination/skills/bfm/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`
- `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
- `tools/fb-lane.cjs`
- `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `docs/handoffs/TASK-002.md`
- `docs/handoffs/TASK-003.md`
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
- Updated legacy TASK-002/TASK-003 handoffs with compact `Goal Alignment` sections so `doctor` stays useful on this repository.
- Final review found generated prompt ownership drift; fixed so Product/BFM updates board Goal Alignment and worker lanes report goal feedback only in handoffs.
- Follow-up final review found heading/template consistency gaps; fixed by requiring `## Goal Alignment` in skill/prompt/template handoff guidance, updating static `templates/CLAUDE.md`, and refreshing packaged Antigravity agent prompts.
- Final follow-up review found board-side wording still over-focused on `Working Goal` and doctor accepted wrong heading levels; fixed by naming the full board Goal Alignment block (`Working Goal`, `Success Measure`, `Gate / Review Point`) in Product/BFM-facing guidance and requiring an exact `## Goal Alignment` handoff heading.
- Fresh post-fix checks passed: packaged plugin skill validation, root coordination/setup skill validation, plugin manifest validation, CLI syntax/parity, `git diff --check`, bootstrap smoke for generated prompt text, and doctor fixture matrix.
- Stricter doctor matrix passed: valid `## Goal Alignment` no warning; missing heading warns; `# Goal Alignment` warns; `### Goal Alignment` warns; `TASK-Q-*` remains exempt.
- Final whole-branch review passed with no remaining actionable issues.
- Follow-up Product/Lane boundary checks passed: root and packaged CLI syntax, CLI parity, plugin validation, modified skill validation, JSON manifest parse, `git diff --check`, stale `.git/index.lock` doctor fixture, and repo `doctor` confirming no stale Git locks or long-running lane git/test/build processes.

## Remaining Gates
- None. PR #19 is merged, local `main` is synced, the FB-Lane marketplace source is refreshed, and `codex plugin add fb-lane-coordination@fb-lane` reinstalled active cache version `0.1.2+codex.20260625082239`.

## Product Status Recommendation
lane-verification-passed

Closeout note - TASK-010: done. Delivered: lightweight Goal Alignment guidance, BFM reconciliation rules, generated/static bootstrap guidance, plugin metadata bump, exact-heading doctor advisory warnings, and Product/Lane execution-boundary guidance. Evidence: PR #19 merged, plugin/skill/CLI validation, stricter doctor fixture matrix, bootstrap smoke, stale-lock doctor fixture, repo doctor process check, marketplace source refresh, and `codex plugin add fb-lane-coordination@fb-lane` reinstall. Remaining: none. Handoff: docs/handoffs/TASK-010.md.
