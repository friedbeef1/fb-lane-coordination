# FB-Product Workstream Status

Last Updated: 2026-07-16
Lane: FB-Product

## Current Summary
TASK-021 is in Staging QA (local review only) on `codex/fb-documentation-rebrand`. `docs/fb/` is now the mirrored canonical harness pack; active instructions route into it; fresh/existing bootstrap preserves project-owned text while maintaining only managed route blocks; and opt-in harness-v2 reviewable handoffs require complete evidence. Fresh and migration smokes, the recovery contract, root/package 41-check suites, four syntax checks, source/test/five-page-pack parity, clean-clone validator, doctor Ready, and whitespace passed. Review state is `not reviewable` because there is no deployed UI. Product branch-diff review and any separately authorized merge/release decision remain; no push, publication, release, deployment, merge, or consumer-project change occurred.

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
- Implemented and locally verified TASK-021's compact mirrored harness, safe bootstrap migration, and opt-in v2 review-evidence gate without changing FB's ownership model, technical IDs, or external release state.

## Still Pending / Blocked

TASK-021 Product branch-diff review and any separately authorized merge/release decision remain. TASK-020 and TASK-019 have no internal gate. No publication, release, deployment, merge, or package/API migration is authorized.

## Evidence Links
- PROJECT_BOARD.md
- docs/handoffs/index.md
- docs/handoffs/TASK-017.md
- docs/handoffs/TASK-018.md
- docs/handoffs/TASK-019.md
- docs/handoffs/TASK-020.md
- docs/handoffs/TASK-021.md
- docs/evals/agent-behavior-scorecard-template.md
- docs/versioning.md

This card is a revisit summary only. PROJECT_BOARD.md remains the source of truth for status, owner, locks, approved goals, and sequencing. docs/handoffs/index.md remains the routing layer. Do not add full OKRs, QA logs, plans, rationale, or implementation details here.
