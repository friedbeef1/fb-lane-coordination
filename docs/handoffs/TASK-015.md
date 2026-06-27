# TASK-015 Handoff - Workstream Plan-Only BFM Gate

## Task
- **ID**: TASK-015
- **Scope**: Make Product, Tech, Design, and Business workstream threads read-only planning/conversation lanes by default, with source-code changes happening only inside a Product-launched BFM execution run.
- **Owner**: FB-Product

## Goal Alignment Session
Lane OKR Fit: aligned
Mini-loop Evidence: Wording scan reduced stale direct-lane-execution language to historical handoff evidence only; active docs, skills, templates, agents, manifests, and generated CLI text now describe plan-only workstreams and Product-launched BFM execution.
Evidence Against Product OKR: None identified.

## What Changed
- Added the plan-only workstream rule to the core repo guidance, Product/Tech/Design/Business lane skills, BFM skill, quickstart, setup skill, Codex rules, templates, and platform docs.
- Reframed Product as source-read-only in normal Product chat, while allowing coordination markdown updates such as board rows, handoffs, plans, OKRs, Definition of Done, sequencing notes, and closeout notes.
- Reframed Tech and Design as planning lanes unless explicitly acting as BFM execution workers.
- Reframed Business as markdown/copy planning only, with source copy changes recorded as BFM integration targets.
- Synced generated agent JSON and packaged plugin copies so newly bootstrapped or reloaded plugin users inherit the same rule.
- Updated plugin metadata/default prompts to advertise plan-only workstreams plus Product-launched BFM execution.
- Ran a Ponytail documentation pass: shortened platform guides, removed duplicate direct-lane execution tutorials, and made quick tasks explicit as BFM execution slices.

## Modified Files
- `AGENTS.md`, `CLAUDE.md`, `.codex/rules.md`
- `README.md`, `FAQ.md`, `CHANGELOG.md`, `docs/loop-engineering.md`, `docs/setup.md`
- `platforms/codex/README.md`, `platforms/codex/workflow-rules.md`, `platforms/claude-code/README.md`, `platforms/antigravity/README.md`
- `templates/AGENTS.md`, `templates/CLAUDE.md`
- `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`
- `agents/**`, `.claude/agents/**`
- `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`
- `plugins/fb-lane-coordination/**`
- `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `PROJECT_BOARD.md`

## Verification Evidence
- `node --check tools/fb-lane.cjs` passed.
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` passed.
- Root/package CLI parity passed with `diff -q tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs`.
- Generated agent JSON parity passed for Product, Tech, Design, and Business.
- Plugin manifests, marketplace JSON, and generated agent JSON parsed successfully.
- Skill metadata validation passed for 11 skills.
- `node tools/fb-lane.test.cjs` passed 10 checks.
- `git diff --check` passed.
- Documentation contradiction scan passed; only historical handoff evidence still contains the earlier direct-lane-execution wording.
- `node tools/fb-lane.cjs doctor` passed every coordination check except the expected uncommitted-worktree warning while this patch is being staged.

## Remaining Gates
- User review of the staged diff.
- Commit, push, PR, and plugin reload are not done in this step.

## Product Status Recommendation
- `lane-verification-passed`

## Return Check
- Board, docs, skills, templates, generated prompts, packaged plugin copies, and platform docs agree on the new rule: normal workstreams plan in markdown; Product launches BFM; BFM execution workers claim/edit/verify source changes.

## Known Risks / Caveats
- Historical handoffs still contain the earlier direct lane-execution wording as old evidence. Active board guidance marks that older board note as superseded by TASK-015.

## Closeout Note
Closeout note - TASK-015: lane-verification-passed. Delivered: plan-only workstream rule, Product source-read-only boundary, BFM source-change execution gate, generated/package sync, plugin metadata update, and Ponytail documentation clarity pass. Evidence: wording scan, CLI syntax, root/package parity, generated JSON parity, JSON parse, skill metadata validation, regression tests, `git diff --check`, and doctor with expected dirty-worktree warning. Remaining: user review, commit/push/PR, and plugin reload. Handoff: docs/handoffs/TASK-015.md.
