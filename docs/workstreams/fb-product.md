# FB-Product Workstream Status

Last Updated: 2026-07-27
Lane: FB-Product

## TASK-051 — Context and repair efficiency

- Status: Staging QA.
- Outcome: the sole authoritative modeled run used 310,358 token units against
  the frozen 298,080 maximum (fail); modeled elapsed time passed at 555.375 of
  557.3 minutes. Readiness was 231/288 (80.2%), missed required controls were
  zero, immediate safety response was 100%, and unresolved failures were 57.
- Decision: the all-predicate decision remains reject. The frozen model assumed
  privacy passed, but whole-branch probes disproved that assumption; privacy is
  unverified/failed as implementation evidence, and the modeled time pass is
  not implementation proof. Task 4 and adoption remain closed.
- Final-tree boundary: the experimental runtime was removed from the final
  tree while its Git history and frozen evidence remain. The plugin tree has no
  diff from Task 1 base `e5bc1f5`; package parity is not claimed.
- Review: the [superseding independent review](../benchmarks/control-loop/context-efficiency-independent-review.md)
  replaces earlier privacy and whole-branch approval claims.
- Links: [Handoff](../handoffs/TASK-051.md), [QA](../qa/TASK-051.md), and
  [plan](../superpowers/plans/2026-07-27-fb-context-repair-efficiency.md).

## TASK-050 — Generic agent control loop and FB 0.5.0-beta

- Status: Done; published build installed and enabled.
- Outcome target: add rules-first routing, flat clone-local events, pairwise
  comparison, layered gates, bounded diagnosis, and evidence-bound isolated
  configuration evolution without autonomous production changes.
- Release candidate: `0.5.0-beta+codex.20260726130257`.
- Current publication build: `0.5.0-beta+codex.20260728113402`.
- Release gate: changelog wording, whole-branch review, release checkpoint,
  marketplace upgrade, install, and active cache verification passed.
- Links: [Handoff](../handoffs/TASK-050.md), [control loop](../fb/control-loop.md),
  [QA](../qa/TASK-050.md), and
  [quantified experiment](../benchmarks/control-loop/README.md).

## TASK-048 — FB graduated project graph

- Status: Ready; focused pilot plan complete.
- Blockers: Execution approach selection only.
- Next action: Execute the [pilot plan](../superpowers/plans/2026-07-26-fb-graduated-project-graph-pilot.md), including its six-concurrent-workstream comparison.
- Links: [Handoff](../handoffs/TASK-048.md), [design](../superpowers/specs/2026-07-26-fb-graduated-project-graph-design.md), [normalized records](../fb/records.md).

## TASK-047 — Durable efficiency and evidence normalization

- Status: Local Staging QA; focused gate passed.
- Blockers: None. The previous local checkout is offloaded and unreadable, so this isolated branch starts from current GitHub `main` without recreating unavailable benchmark history.
- Next action: Optional Product review. No release checkpoint or external action is requested.
- Links: [Handoff](../handoffs/TASK-047.md), [Plan](../superpowers/plans/2026-07-23-fb-durable-efficiency-evidence-normalization.md), [QA](../qa/TASK-047.md).

## TASK-049 — Graph-directed context and FB 0.4.0-beta

- Status: Checking.
- Outcome target: route known project tasks to compact authoritative context,
  preserve safe fallback, support repository-specific IDs such as `MEJA-*`,
  and publish the verified Codex plugin.
- Release candidate: `0.4.0-beta+codex.20260726101229`.
- Release gate: full checkpoint plus explicit approval of refreshed changelog
  wording; **Push Live** is approved for the green candidate.

## TASK-031 — Full BFM changelog closeout and FB 0.3.1-beta

- Status: In Progress on PR #48.
- Outcome target: v3 Full BFM closeout cannot reach Ready to ship without a candidate-matched changelog decision; Quick, Normal, and historical v2 work remain compatible.
- Release candidate: `0.3.1-beta+codex.20260718021942`.
- Release gate: stop at Ready to ship; only Push Live authorizes merge, marketplace upgrade, and installed-plugin verification.

## TASK-030 — FB 0.3.0-beta release

- Status: Done
- Outcome: [PR #44](https://github.com/friedbeef1/fb-lane-coordination/pull/44) merged as `7e122ae`; the GitHub marketplace upgraded and Codex installed/enabled `0.3.0-beta+codex.20260717150502`.
- Verification: focused and full release gates, GitHub readiness, isolated install, independent review, live marketplace upgrade, and installed-cache six-skill/MCP/diagram proof passed.
- Release gate: complete. Start a new Codex task to load the refreshed plugin.

## TASK-029 — Six-workstream loop

- Status: Ready to ship
- Outcome: Product/User, Business, Design, Tech, Discovery, and Bugs are first-class planning/evidence workstreams; `$bfm` reconciles their ready handoffs and preserves None relevant/blocked dispositions.
- Verification: focused root/package runtime and skill contracts, 25 generated mirrors, syntax, and whitespace passed.
- Release gate: no merge, publication, deployment, or plugin install until explicit Push Live.

## Current Summary
TASK-028 is local Staging QA at `284e465`, not blocked. The release-first revision retains Normal Codex / Quick BFM / Full BFM routing, a single committed Quick Record, mechanical package generation, privacy-safe worker context, and resource/loop budgets while making focused checks the default. Sensitive work retains immediate safety/approval gates. A full validator is eligible only when a Product-owned handoff explicitly requests a release checkpoint; staging, integration, owner transfer, review, and a handoff artifact do not request one. System-run smoke is the default review contract. No release checkpoint, broad validator, repeated review, or external action is requested.

TASK-027 remains a local Staging QA candidate on `codex/fb-beginner-clarity`, with Product re-review pending. Final review found a stale current-task pointer, a TASK-026 link that did not resolve from the packaged distribution, and overstated whole-slice approval. The repaired root/package positioning contract now requires each delivered page to resolve the same mirrored `evidence/TASK-026-two-speed.md` destination in its own filesystem context. The focused RED/GREEN, root/package CLI 70/70, session 32/32, eval 18/18, beginner 10/10, positioning and two-speed suites, page/test/evidence parity, whitespace, clean-tree validator, and standalone doctor passed. Health: needs Product review. Branch/worktree state: clean local branch. Reconciliation, fetch, push, PR, merge, publication, release, deployment, install, runtime changes, and package-identifier changes remain out of scope.

TASK-026 is Product-accepted in local Staging QA on `codex/fb-beginner-clarity` at candidate `a6b00ab`. It sequences the approved MirrorCam two-speed lessons into the existing FB workflow: internal Quick/Full classification, exact matching-worktree reuse and primary `.worktrees` placement, compact queue visibility, proportional verification, and optional project-owned preflight. CLI 70/70, session 32/32, eval 18/18, beginner 10/10, positioning/two-speed contracts, validator, doctor Ready, parity, and whitespace passed. The MirrorCam Node pin remains project evidence, not an FB-wide requirement. All external-action gates remain closed.

TASK-025 is Product-accepted in local Staging QA on `codex/fb-beginner-clarity` at candidate `3af1f17`. It adds an honest, evidence-backed explanation of FB beside vanilla Codex and Kurrent Capacitor, including their overlap in session intelligence, two rendered Mermaid diagrams, real pain-point mapping, and concrete examples. Focused root/package positioning, CLI 70/70, session 31/31, eval 18/18, beginner 10/10, validator, doctor Ready, parity, and whitespace passed. Runtime, integration, publication, release, deployment, and merge remain out of scope.

TASK-024 is Product-accepted in local Staging QA on `codex/fb-beginner-clarity` at candidate `cc13389`. It adds distinct simple/planning/Build For Me entry messages, a beginner status card with explicit technical details mode, worktree-safe session selection, canonical Test This Now link resolution, one pause-card contract, and exactly three shadow eval scenarios. Root/package CLI 70/70, session 31/31, eval 18/18, beginner 10/10, recovery, validator, doctor Ready, parity, whitespace, task reviews, and final whole-branch re-review passed with no Critical, Important, or Minor finding. No eval authority changed and no push, merge, publication, deployment, plugin install, release, or consumer-project change is authorized.

TASK-022 and TASK-023 are Product-accepted and final-review-approved in local Staging QA on `codex/fb-eval-loop`. Final submit lifecycle repair `f94dce9` extends the same per-session transaction through CLI/MCP final validation, board commit, and push, with deterministic submit-versus-close/checkpoint and close-wins-first coverage. Root/package eval 18/18, root/package session 31/31, root/package CLI 45/45, recovery, selected closeout, the complete clean gate, committed-diff whitespace, and doctor Ready passed with `TASK_022_FINAL_SUBMIT_SERIALIZATION_FULL_GATE_OK`; the final 21-commit combined review found no Critical, Important, or Minor issue. No eval was promoted and no release, publication, deployment, merge, plugin install, or consumer-project change is authorized.

TASK-021 is in Staging QA (local review only) on `codex/fb-documentation-rebrand`. Final fix `8c54c1c` aligned setup guidance with the completed mirrored five-page bootstrap, made the canonical evidence page author the full opt-in v2 contract, and rejected placeholder-only/TODO/TBD/angle-bracket evidence plus non-actionable blocked next actions. Focused v2 suites passed 14 checks in each mirror; full suites passed 45 checks in each mirror; recovery, four syntax checks, source/test/setup/five-page parity, validator, doctor Ready, and diff checks passed. The final whole-branch re-review found no remaining Critical, Important, or Minor issue. Review state is `not reviewable` because there is no deployed UI. The Product local gate and any separately authorized merge/release decision remain; no push, publication, release, deployment, merge, plugin install, or consumer-project change occurred.

TASK-020 is in Staging QA (local review only) on `codex/fb-documentation-rebrand`. FB now gives new users a Project Start Brief and immediate four-step How FB works card before detailed lane guidance; it separates decisions from assumptions, explains adaptive lanes, makes `$bfm` the explicit post-approval build boundary, shows exact plain-language progress/blocked states, and supplies Test This Now review packets. Fresh creator-commerce bootstrap smoke, root/package 28-check suites, syntax/parity, validator, doctor Ready, whitespace, and final review passed. The branch remains local; no push, publication, release, deployment, or merge is authorized.

TASK-019 is also in Staging QA on the same branch. Active public/internal documentation, templates, examples, bootstrap-generated guidance, and visible package metadata now use FB. The tagline is limited to the root README, packaged plugin README, Codex platform guide, and bootstrap-generated project entry points. Historical records and `fb-lane` technical identifiers are unchanged. Root/package 27-check suites, syntax, parity, JSON parsing, demo check, scoped audit, clean-worktree validator, doctor Ready, whitespace checks, and independent whole-branch review passed. The branch remains local; no push, publication, or deployment is authorized.

TASK-018 is done and released in [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39). It carries the generic Verification Handoff contract and the proven TASK-Q-0736 workspace-recovery lesson: a bounded health preflight uses a 15 GiB free-capacity default and 15-second Git-probe timeout unless a stricter project policy applies, then checks File Provider ancestry and stable double reads; a second consecutive failure moves work to clean-clone recovery without copying damaged Git metadata. The focused recovery-contract test, root/package 27-check suites, syntax/parity, clean-clone validator/doctor proof, Product review, and marketplace installation all passed. MirrorCam changes, runners, dashboards, and `doctor` expansion remain out of scope.

TASK-CODEX-ONLY-001 is done and released in PR #39. Clean-checkout proof passed: root/package 24-check CLI suites, syntax, CLI/test byte parity, validator, doctor, whitespace check, manifest/MCP JSON parsing, and a refreshed marketplace/plugin install for `fb-lane-coordination@fb-lane` version `0.2.0-beta+codex.20260716052513`. Claude Code and Antigravity remain paused and out of scope.

TASK-017 is done: [PR #31](https://github.com/friedbeef1/fb-lane-coordination/pull/31) merged its reusable framework hardening, and PR #39 released the current plugin build. Product/BFM now has a generic Markdown-only eval scorecard path for repeated agent-behavior failures via `Loop Learning: propose eval`, phased approval-autonomy guidance that starts in Shadow Approval before any bounded self-approval, and public version positioning for `FB-Lane 0.2.0-beta: Loop Engineering public beta`.

## Already Executed By Product/BFM
- Added the compact `Loop Learning` closeout field across reusable FB-Lane surfaces.
- Added `docs/evals/agent-behavior-scorecard-template.md` and the packaged plugin mirror so Product/BFM can propose a lightweight scorecard before heavier tooling.
- Kept eval runners, dashboards, numeric scoring, CI eval jobs, and bigger `doctor` rules out of scope unless separately proposed and approved.
- Added approval-autonomy phases across docs, templates, Product/BFM skills, generated Product prompts, bootstrap output, and packaged plugin mirrors.
- Completed Codex-only proof in a clean checkout and a temporary Codex home; completed Product review, merged PR #39, and refreshed the installed marketplace plugin.
- Added `docs/versioning.md` with the v1-to-latest before/after and linked it from public docs.
- Added the generic Verification Handoff and safe-recovery contract across bootstrap output, root/package skills, scorecards, and public loop guidance; recorded its 27-check root/package regression proof.
- Transferred MirrorCam TASK-Q-0736's verified workspace-recovery lesson into TASK-018's reusable root/package guidance, templates, scorecards, bootstrap output, and a focused contract regression.
- Merged the release bundle to `main` in PR #39 and installed the Codex marketplace plugin build `0.2.0-beta+codex.20260716052513`.
- Rebranded active documentation and generated project guidance to FB, preserving historical records and all `fb-lane` technical identifiers.
- Added the first-project clarity contract across packaged skills, active guides, bootstrap-generated project instructions, and root/package tests; completed a creator-commerce smoke and final regression review without creating a new command or deploying anything.
- Implemented and locally verified TASK-021's compact mirrored harness, safe bootstrap migration, corrected setup guidance, canonical v2 authoring contract, and actionable-value enforcement; completed the clean final whole-branch re-review without changing FB's ownership model, technical IDs, or external release state.
- Implemented and locally verified TASK-023's canonical/package Markdown eval lifecycle, compatibility template, two shadow walkthroughs, deterministic validator/doctor/session closeout integration, and seven-page bootstrap without adding a judge, runner, score, dashboard, CI job, external integration, or authority promotion.
- Completed final integrated TASK-022/TASK-023 repair `fe733a1` with deterministic concurrency, Quality Gap close/submit, MCP linked-worktree, generated-placeholder, and selected-anchor regressions; all root/package mirrors and the clean full gate pass.
- Completed submit lifecycle serialization repair `f94dce9`; CLI and MCP retain pre-submit hook/test revalidation and now hold the same-session lock through their final board commit and push.
- Implemented and locally accepted TASK-024's beginner interaction, status, pause, review-link, and three-shadow-eval layer at `cc13389`; repaired all task and whole-branch findings with regression-first evidence and preserved the separate release gate.

## Still Pending / Blocked

TASK-028 needs no further local broad gate. Product may explicitly request a release checkpoint later; only then is a full validator eligible. TASK-027 needs complete local verification and Product re-review. TASK-024 has no remaining local implementation or review gate; its version/merge/install/release decision remains separate. TASK-022/TASK-023 have no remaining internal implementation or review gate. TASK-021's Product local gate and any separately authorized merge/release decision remain. TASK-020 and TASK-019 have no internal gate. No publication, release, deployment, merge, plugin install, or package/API migration is authorized.

## Evidence Links
- PROJECT_BOARD.md
- docs/handoffs/index.md
- docs/handoffs/TASK-027.md
- docs/handoffs/TASK-017.md
- docs/handoffs/TASK-018.md
- docs/handoffs/TASK-019.md
- docs/handoffs/TASK-020.md
- docs/handoffs/TASK-021.md
- docs/handoffs/TASK-022.md
- docs/handoffs/TASK-023.md
- docs/handoffs/TASK-024.md
- docs/evals/agent-behavior-scorecard-template.md
- docs/evals/TASK-023-walkthroughs.md
- docs/fb/evals.md
- docs/versioning.md

This card is a revisit summary only. PROJECT_BOARD.md remains the source of truth for status, owner, locks, approved goals, and sequencing. docs/handoffs/index.md remains the routing layer. Do not add full OKRs, QA logs, plans, rationale, or implementation details here.
