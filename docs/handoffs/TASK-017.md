# TASK-017 - Progressive Disclosure And Framework OKR Hardening

## Goal Alignment Session

Product Goal: Keep FB-Lane lightweight while making goal approval and return-loop evidence durable across Product/BFM and workstream handoffs.
Workstream Goal: Add the smallest reusable guidance so `/goal` routes Product/BFM into the existing Goal Alignment Session and workstream handoffs carry goal fit for Product/user approval.
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: Root/package syntax, parity, JSON parse, regression tests, stale-wording scan, doctor, and whitespace checks passed. Full validator reaches doctor and fails only because this branch is intentionally dirty before commit.
Evidence Against Product OKR: None identified

## Scope

Harden FB-Lane progressive disclosure so bootstrapped projects keep:

- `PROJECT_BOARD.md` as truth for status, ownership, sequencing, gates, and locks.
- `docs/handoffs/index.md` as routing for which detailed handoffs to open.
- Detailed handoff files as evidence, rationale, plans, QA, and implementation detail.

## Requirements

- Default index columns: Task / Topic, Lane, Status, Depends / Blocks / Gate, Checks / Evidence, Detail.
- `doctor` stays read-only.
- `doctor` warns for missing indexes and old-style indexes without dependency/gate columns.
- Fix text points to bootstrap or Product/BFM lookup repair; it must not silently create files.
- Product/BFM refreshes the index before non-quick sequencing when handoffs exist and lookup state is missing, stale, or too vague.
- Do not hard-block submit.
- Do not require this for `TASK-Q-*` quick tasks.
- Keep anti-bloat guidance explicit: no full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.
- Add one FB-Lane framework OKR as a north star, not a per-project ritual.
- Use directional Key Results and Product/BFM health flags instead of brittle numeric scoring.
- Product/BFM closeout health flags are `healthy`, `watch`, `needs Product review`, and `blocked`.
- Explicitly avoid per-task OKR generation, giant `doctor` behavior, second-board handoff indexes, and quick-task ceremony.
- Add objective mode selection so future agents default to normal/simple coding unless coordination, Product/BFM, security/payment/release, core product flow, lock, multi-thread, or durable-context triggers appear.
- Clarify the escalation ladder: normal/simple coding, FB-Lane light, then Product/BFM.
- Add the awareness/isolation/integration rule: board plus handoff index create shared awareness, branches/worktrees isolate execution, and BFM integrates outcomes.
- Make clear that worktrees do not replace coordination: no private-worktree disappearance, huge unannounced diff, source edits without board/lock awareness, or closeout without BFM reconciliation when multiple outputs exist.
- Require BFM to run a Story Split Pass before prioritizing: split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work into smaller stories, or say `No split needed`.
- Require closeout to name whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty, and record session-boundary action for intentional dirt.
- Require closeout to name external-service test mode, created records/resources, cleanup evidence, or a pending cleanup gate when checks touch real providers.
- Require Product/BFM to proactively propose one small guardrail when repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework appears. The proposal names the observed pattern, guardrail, cost, benefit, affected files/rules, and approval needed; it does not silently change the process.
- When `Loop Learning` chooses `propose eval`, use a generic Markdown scorecard under `docs/evals/` with sections for non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules without separate approval.
- Add phased approval autonomy: start Product/BFM in Shadow Approval, let Product/BFM recommend Phase 2 or Phase 3 only after safe matching decisions, require user approval for phase changes, and never self-approve risky surfaces.
- Add Product/BFM execution continuation: once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked.
- Preserve hard stops for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, scope or OKR revisions, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.
- Add lightweight Sidechat-to-Main Prompt Handoff guidance: sidechats are discussion/planning spaces that ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready Product/BFM prompt; Product/BFM owns board updates, handoff files, source changes, commits, validation, and closeout; sidechat prompts are not source of truth until Product/BFM records them in the board, handoff, or docs; no command, dashboard, `doctor` expansion, source behavior, or required tiny-question ceremony is added.
- Name the current documentation line `FB-Lane 0.2.0-beta: Loop Engineering public beta` and explain the v1-to-latest before/after without changing the plugin manifest yet.
- Treat `/goal` as a Product/BFM shortcut into the existing Goal Alignment Session, not a second goal system or `/goals` flow.
- Require workstream handoffs to include `Product Goal`, `Workstream Goal`, and `User Approval Needed` so Product/BFM can reconcile goal fit before execution.
- Require frontend/UI handoffs to default to a pre-build visual preview: `browser screenshot/mockup`, `imagegen asset/style option`, or `skip with reason`, with skip reserved for non-visual/tiny changes and imagegen reserved for brand, logo, hero/illustration, camera/lens, and style-option exploration.

## Story Split Update - 2026-07-03

Added the BFM Story Split Pass across source and packaged plugin skills, generated Product/worker prompts, bootstrap templates, Codex rules, and user-facing docs. This makes BFM decide whether a broad run should be split into smaller stories before prioritizing, running dependency/lock classification, or claiming files.

Verification:
- `node --check tools/fb-lane.cjs`, packaged plugin CLI, and active Codex cache CLI passed.
- Root, packaged, and active-cache agent JSON parse checks passed.
- `node tools/fb-lane.cjs status` shows TASK-017 locks include agent, template, skill, Codex rule, and platform-doc surfaces touched by this rule.
- `node tools/fb-lane.cjs doctor` reports only the expected uncommitted-worktree warning.
- `git diff --check` passed.

## Proactive Loop Hardening Update - 2026-07-03

Added the proactive self-optimization rule across MirrorCam and generic FB-Lane surfaces. Product/BFM now proposes one small guardrail for approval when repeated coordination friction, stale state, missing evidence, or preventable rework appears, while skipping one-off or low-impact issues and avoiding silent process mutation.

Touched reusable surfaces include README/FAQ/loop docs, Codex platform docs, AGENTS/CLAUDE templates, PROJECT_BOARD template, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, and packaged plugin mirrors.

Verification after this update:
- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Root/package CLI and Product agent JSON parity
- Product agent JSON and plugin manifest parse
- `node tools/fb-lane.test.cjs` -> 15 checks passed
- `git diff --check`
- `node tools/fb-lane.cjs doctor` -> expected `Needs attention` because the branch has uncommitted changes
- `node tools/fb-lane.validate.cjs` -> reaches the doctor gate and fails only because doctor correctly does not report `Ready` on an uncommitted worktree

## Loop Learning Escalation Update - 2026-07-04

Added the compact Product/BFM `Loop Learning` closeout field so heavier tooling has an explicit trigger without adding a new command or expanding `doctor`.

Closeouts now record:

- feedback captured
- repeated pattern: `no` or `yes`
- tooling needed: `none`, `propose guardrail`, `propose automation`, or `propose eval`
- Product approval needed: `no` or `yes`

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, and packaged plugin mirrors.

## Generic Eval Scorecard Template Update - 2026-07-04

Added a reusable, Markdown-only agent-behavior scorecard template for the `Loop Learning: propose eval` path. The template is generic to FB-Lane projects and covers:

- non-Product execution gate
- BFM closeout accounting
- evidence honesty
- goal and scope fit

Updated source and packaged plugin docs, bootstrap templates, Product/BFM/coordination skills, generated Product prompts, packaged plugin mirrors, and bootstrap CLI output so `propose eval` points to the scorecard without adding eval runners, dashboards, numeric scoring, CI eval jobs, or larger `doctor` rules. New bootstrap runs now create `docs/evals/agent-behavior-scorecard-template.md` as a passive template.

Verification after this update:
- `node --check tools/fb-lane.cjs` and packaged plugin CLI passed.
- `node --check tools/fb-lane.test.cjs` and packaged plugin test copy passed.
- Root/package parity passed for CLI, tests, generated Product agent JSON, and scorecard template copies.
- Product agent JSON and plugin manifests parse.
- `node tools/fb-lane.test.cjs` passed 15 checks, including bootstrap creation of the optional eval scorecard template.
- `git diff --check` passed.
- `node tools/fb-lane.cjs doctor` reports `Needs attention` only because the branch has uncommitted TASK-017 work.
- `node tools/fb-lane.validate.cjs` reaches the doctor gate and fails only because `doctor` correctly does not report `Ready` on an intentionally dirty worktree.

## Approval Autonomy Phase Update - 2026-07-04

Added a lightweight phase model for Product/BFM self-approval:

- Phase 1 Shadow Approval: ask the user, but record `Would self-approve: yes/no` and the reason.
- Phase 2 Bounded Self-Approval: only low-risk continuation work after one day or three matching decisions with no material miss.
- Phase 3 Exception-Only Approval: only after five safe self-approvals with no rollback, stale dirty state, or hidden gate.

Product/BFM may recommend phase changes; the user approves them. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. The rule explicitly blocks self-approval for new scope, unapproved OKR additions or revisions, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, Codex rules, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, and packaged plugin mirrors.

## Version Positioning Update - 2026-07-04

Added `docs/versioning.md` as the public explanation of the naming shift:

- v1: four-lane coordination plugin.
- latest: `FB-Lane 0.2.0-beta: Loop Engineering public beta`.

The docs now explain that `0.1.2+codex.20260627210000` is the current Codex
plugin build ID until a release is cut, while `0.2.0-beta` is the model/release
line name. Updated README, FAQ, loop deep dive, setup, Codex platform guide, and
packaged plugin README to point to the versioning page.

## Goal Shortcut And Workstream Goal Handoff Update - 2026-07-04

Documented `/goal` as a Product/BFM shortcut into the existing Goal Alignment Session. It can show, create, clarify, or ask approval for the current goal, but it does not create a second goal system and does not introduce a `/goals` flow.

Workstream chats do not own `/goal`. When a workstream prepares a handoff, it now includes `Product Goal`, `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` so Product/BFM can reconcile the handoff before sequencing execution.

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, Codex rules, source and packaged CLI bootstrap prompts, generated Product and worker prompts, Product/BFM/coordination/workstream skills, and packaged plugin mirrors.

## Product/BFM Execution Continuation Update - 2026-07-05

Added the generic Product/BFM continuation rule so approved safe work does not pause before every routine step. Product/BFM now keeps going through diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked, then reports after closeout.

The rule still stops for hard gates: live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, scope or OKR revisions, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, Codex rules, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, project setup skill, packaged plugin mirrors, board, handoff, and changelog.

## Frontend Visual Planning Update - 2026-07-08

Tightened `Visual Preview Decision` across reusable FB-Lane surfaces. Visible frontend/UI plans and handoffs now default to a pre-build visual preview and choose one of:

- `browser screenshot/mockup`
- `imagegen asset/style option`
- `skip with reason`

The skip path is only for non-visual work, tiny copy, spacing, or single-control fixes. Browser screenshots or mockups are the default for concrete app layout, responsive, component, and flow decisions. Imagegen is reserved for brand direction, logos, hero/illustration assets, camera/lens concepts, and visual style options where generated bitmap exploration helps. If the plan changes what the user will see and a preview is feasible, Product/BFM creates or attaches the preview before source execution; Product/BFM blocks or asks only when the preview is missing and the visual decision is material.

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, Codex rules, Product/BFM/Design/coordination skills, project setup skill, generated Product prompts, packaged plugin mirrors, board, handoff, and changelog.

Closeout note - TASK-017: lane-verification-passed. Health: healthy. Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no, user explicitly requested the default rule. Delivered: frontend/UI planning now defaults to pre-build preview instead of merely naming a preview decision. Evidence: wording scan before final validation found no stale `skip`-first decision wording in the intended surfaces. Remaining: final validation, commit, PR/merge, and plugin cache refresh. Handoff: docs/handoffs/TASK-017.md.

## Retro Scorecard And Plugin Cache Refresh Update - 2026-07-08

Ported only the reusable last-48h retro lessons into generic FB-Lane docs:

- repeated workflow failures can trigger a compact retro scorecard
- each repeated pattern produces at most one small guardrail
- quick tasks stay lightweight unless the same failure pattern repeats
- eval runners, dashboards, numeric scoring, CI eval jobs, larger `doctor` checks, and per-task OKRs remain out of scope without a separate Product/BFM proposal and explicit approval
- same-version plugin reinstall/update work must verify the installed cache contains expected wording; stale caches should be refreshed by reinstalling while preserving plugin data where supported

Touched reusable surfaces include README, loop docs, setup and Codex platform upgrade docs, root/package/template scorecard templates, packaged plugin README, Product/BFM/coordination packaged skill guidance, board, handoff, and changelog. No runtime source, CLI behavior, eval runner, dashboard, CI eval job, or `doctor` behavior changed.

Pre-commit verification after this update:
- `git diff --check` passed.
- `node tools/fb-lane.cjs status` confirmed TASK-017 remains `Staging QA`.
- Wording scan confirmed the repeated-pattern guardrail and same-version cache-refresh guidance in source docs, packaged plugin docs, scorecard templates, and packaged skills.
- `claude plugin validate .` passed.
- `node tools/fb-lane.cjs doctor` reported `Needs attention` only for the pre-commit uncommitted docs state.
- `node tools/fb-lane.validate.cjs` passed syntax, parity, manifest/JSON parsing, skill metadata validation, and 15 regression checks, then failed only at the expected doctor-ready assertion because the worktree was not committed yet.
- `npm run lane:status` could not run because this checkout has no local `package.json`; direct `node tools/fb-lane.cjs status` was used instead.

## Sidechat-to-Main Prompt Handoff Update - 2026-07-09

Added lightweight Sidechat-to-Main Prompt Handoff guidance across reusable FB-Lane docs, templates, source skills, packaged plugin docs/skills, generated agent prompts, source agent prompts, Codex rules, board template, board, handoff, changelog, and bootstrap-generated docs/prompts.

Sidechats are now defined as discussion and planning spaces by default. They can ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready prompt for the main Product/BFM thread. Product/BFM remains the execution owner for board updates, handoff files, source changes, commits, validation, and closeout.

The sidechat output shape is explicit:

- Decision summary
- Scope
- Out of scope
- Recommended owner/lane
- Files/docs likely affected
- Acceptance criteria
- Gates/risks
- Exact instruction for Product/BFM

A sidechat prompt is not source of truth until Product/BFM records it in `PROJECT_BOARD.md`, the relevant handoff, or durable docs. Tiny questions stay lightweight; this update adds no new command, dashboard, `doctor` expansion, runtime source behavior, or required ceremony for quick clarifications.

Review fix: the bootstrap CLI generator and packaged CLI mirror now emit the same Sidechat-to-Main Prompt Handoff guidance into fresh `PROJECT_BOARD.md`, `AGENTS.md`, Codex rules, Claude rules, and Antigravity agent JSON outputs.

## Current Verification Summary

- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `node --check tools/fb-lane.test.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.test.cjs`
- Root/package parity: `tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, `agents/FB-Product/agent.json`, and scorecard template copies
- Product agent JSON and plugin manifests parse
- `node tools/fb-lane.test.cjs` -> 15 checks passed
- `node tools/fb-lane.cjs status` -> TASK-017 remains `Staging QA`
- Wording scan confirms approval autonomy phases and never-self-approve boundaries across docs, templates, skills, generated prompts, packaged plugin mirrors, and CLI bootstrap output
- Wording scan confirms Product/BFM execution-continuation guidance across docs, templates, skills, generated Product prompts, packaged plugin mirrors, and CLI bootstrap output
- Wording scan confirms pre-build visual preview guidance across docs, templates, skills, generated Product prompts, packaged plugin mirrors, and CLI bootstrap output
- Wording scan confirms Sidechat-to-Main Prompt Handoff guidance across docs, templates, skills, generated prompts, packaged plugin mirrors, and CLI bootstrap output
- Wording scan confirms `0.2.0-beta` and the v1-to-latest before/after are documented on public docs
- Wording scan confirms `/goal` is Product/BFM-owned and workstream handoffs include `Product Goal`, `Workstream Goal`, and `User Approval Needed`
- `node tools/fb-lane.cjs doctor` -> `Needs attention` only for intentionally dirty TASK-017 work
- `node tools/fb-lane.validate.cjs` -> reaches the doctor gate and fails only because the worktree is intentionally dirty pending commit
- `git diff --check`

## Product/BFM Closeout

Status: Done.
Actioned By: FB-Product / BFM.
Result: The progressive-disclosure and framework hardening was merged in [PR #31](https://github.com/friedbeef1/fb-lane-coordination/pull/31); its current release bundle is included in [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39).
Evidence: The recorded root/package syntax, parity, regression, parsing, wording, validator, doctor, and diff checks passed. PR #31 and PR #39 are merged, and the refreshed Codex marketplace plugin installed as `0.2.0-beta+codex.20260716052513`.
Remaining: None for this release. New framework changes require a separately scoped task.
Closeout Note: Historical staging labels and dirty-worktree gates are superseded by the merged release evidence.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no.
