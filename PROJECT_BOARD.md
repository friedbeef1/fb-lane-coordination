# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Features deployed to staging, awaiting visual/functional verification.
- `Done`: Checked, verified, and merged to production by FB-Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-014 | Done | FB-Product | Cleanup | Ponytail cleanup: move rendered demo videos out of git and clarify canonical/generated maintenance surfaces | `codex-lane-demo/renders/*.mp4`, `platforms/*/how-to-interact-demo/renders/*.mp4`, `.gitignore`, `README.md`, `CHANGELOG.md`, `docs/maintenance.md`, `codex-lane-demo/README.md`, `platforms/claude-code/how-to-interact-demo/README.md`, `platforms/antigravity/how-to-interact-demo/README.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-014.md` | [PR #28](https://github.com/friedbeef1/fb-lane-coordination/pull/28) |
| TASK-013 | Done | FB-Product | CI | Add CI readiness automation loop for FB-Lane validation evidence | `.github/workflows/fb-lane-readiness.yml`, `tools/fb-lane.validate.cjs`, `.gitignore`, `.codex/rules.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-013.md` | `codex/ci-readiness-loop`, `docs/handoffs/TASK-013.md` |
| TASK-012 | Done | FB-Product | Coordination | Clarify stable OKR alignment so OKRs anchor the loop instead of multiplying during execution | `AGENTS.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/loop-engineering.md`, `docs/handoffs/TASK-012.md`, `templates/*.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/**`, `skills/**/*.md`, `agents/**`, `.claude/agents/**` | `codex/stable-okr-alignment`, `docs/handoffs/TASK-012.md` |
| TASK-011 | Done | FB-Product | Coordination | Add BFM return-loop closeout checks | `AGENTS.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/handoffs/TASK-011.md`, `templates/*.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/**`, `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`, `agents/**`, `.claude/agents/**`, `platforms/*/README.md` | [PR #25](https://github.com/friedbeef1/fb-lane-coordination/pull/25), `docs/handoffs/TASK-011.md` |
| TASK-Q-5624 | Done | FB-Product | Quick-Fix | Document plugin upgrade process and changelog | (None) | [PR #20](https://github.com/friedbeef1/fb-lane-coordination/pull/20) |
| TASK-Q-5217 | Done | FB-Tech | Quick-Fix | Improve Codex plugin setup UX | (None) | [PR #17](https://github.com/friedbeef1/fb-lane-coordination/pull/17) |
| TASK-Q-8688 | Done | FB-Tech | Quick-Fix | Quick test hooks | (None) | [Branch](https://github.com/friedbeef1/fb-lane-coordination/tree/quick/TASK-Q-8688-quick-test-hooks) |
| TASK-001 | Done | FB-Tech | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) |
| TASK-002 | Done | FB-Tech | Core | Implement user authentication endpoints | (None) | (None) |
| TASK-003 | Done | FB-Design | UI | Design responsive dashboard navigation | (None) | (None) |
| TASK-004 | Done | FB-Product | Codex | Package FB-Lane as a Codex plugin | (None) | PR #7 |
| TASK-005 | Done | FB-Product | Codex Docs | Clarify Codex plugin pain point and value | (None) | `codex/pain-point-docs` |
| TASK-006 | Done | FB-Product | Codex Docs | Explain how FB-Lane works with Codex worktrees | `README.md`, `FAQ.md`, `platforms/codex/README.md` | `codex/pain-point-docs` |
| TASK-007 | Done | FB-Tech | CLI | Fix quick-task ID parsing for `TASK-Q-####` board rows | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs` | `codex/quick-task-id-parser-fix` |
| TASK-008 | Done | FB-Product | Documentation | Refresh plugin docs after merged Codex and quick-task work | `README.md`, `FAQ.md`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `PROJECT_BOARD.md` | `codex/docs-refresh-after-merges` |
| TASK-009 | Done | FB-Product | Documentation | Trim front page and move setup/platform details to focused docs | `README.md`, `docs/setup.md`, `platforms/codex/README.md`, `PROJECT_BOARD.md` | `codex/front-page-docs-trim` |
| TASK-010 | Done | FB-Product | Coordination | Add lightweight goal alignment to FB-Lane handoffs and BFM sequencing | (None) | [PR #19](https://github.com/friedbeef1/fb-lane-coordination/pull/19) |
| TASK-011 | Done | FB-Tech | Security | Harden fb-lane CLI against shell command injection | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs` | [PR #21](https://github.com/friedbeef1/fb-lane-coordination/pull/21) |

---

### TASK-014 - Ponytail cleanup pass
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Cleanup
*   **Scope**: Keep FB-Lane behavior intact while moving rendered demo MP4s out of git and documenting the canonical vs packaged/generated maintenance surfaces.
*   **Out of Scope**: CLI rewrite, plugin behavior changes, new generator framework, removal of packaged plugin copies, or changes to `claim`, `submit`, `merge`, `doctor`, BFM, OKR, or CI behavior.
*   **Goal Alignment Session**:
    *   **Objective**: Make the FB-Lane repo lighter and easier to maintain without changing the installed plugin or coordination behavior.
    *   **Key Results**:
        *   Rendered demo MP4s are hosted as GitHub release assets and no longer tracked in git.
        *   Future rendered demo video/contact-sheet outputs are ignored by default.
        *   Maintainers can quickly tell which files are canonical and which are packaged/generated copies.
    *   **Definition of Done**: CI readiness validation, repo doctor, whitespace check, and release-asset link checks pass with no behavior changes.
    *   **Gate / Review Point**: Product verifies the diff only removes repo weight and adds maintenance guidance.
    *   **Approval**: approved
    *   **Justification**: The user approved a Ponytail cleanup pass that keeps all functionality while making the repo more elegant and moving demo videos out of git.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and repository maintenance only
    *   **Locked Files**: `codex-lane-demo/renders/*.mp4`, `platforms/*/how-to-interact-demo/renders/*.mp4`, `.gitignore`, `README.md`, `CHANGELOG.md`, `docs/maintenance.md`, `codex-lane-demo/README.md`, `platforms/claude-code/how-to-interact-demo/README.md`, `platforms/antigravity/how-to-interact-demo/README.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-014.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #28](https://github.com/friedbeef1/fb-lane-coordination/pull/28), `codex/ponytail-cleanup-fb-lane`
    *   **GitHub Release Assets**:
        *   [codex-lane-demo.mp4](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/codex-lane-demo.mp4)
        *   [claude-code-how-to-interact.mp4](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/claude-code-how-to-interact.mp4)
        *   [antigravity-how-to-interact.mp4](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/antigravity-how-to-interact.mp4)
*   **QA Checklist**:
    *   [x] Demo release asset links resolve.
    *   [x] No tracked MP4 render outputs remain.
    *   [x] CI readiness validator passes on a clean worktree.
    *   [x] Repo doctor passes on a clean worktree.
    *   [x] Git diff whitespace check passes.
*   **Modified Files**:
    *   `codex-lane-demo/README.md`
    *   `platforms/claude-code/how-to-interact-demo/README.md`
    *   `platforms/antigravity/how-to-interact-demo/README.md`
    *   `codex-lane-demo/renders/codex-lane-demo.mp4`
    *   `platforms/claude-code/how-to-interact-demo/renders/claude-code-how-to-interact.mp4`
    *   `platforms/antigravity/how-to-interact-demo/renders/antigravity-how-to-interact.mp4`
    *   `.gitignore`
    *   `docs/maintenance.md`
    *   `README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
    *   `docs/handoffs/TASK-014.md`
*   **Latest Update**:
    *   *2026-06-27*: Demo MP4 outputs now live in GitHub release assets and demo READMEs link them directly. Tracked render MP4 files were removed, render folders are ignored, and maintenance parity guidance was added. Release asset checks returned HTTP 200, `git ls-files '*renders/*.mp4'` returned no matches, `node tools/fb-lane.validate.cjs` passed, `node tools/fb-lane.cjs doctor` passed, and `git diff --check` passed.


### TASK-013 - Add FB-Lane CI readiness automation loop
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: CI
*   **Scope**: Add a GitHub Actions CI readiness loop that runs the repo's FB-Lane validation evidence on pull requests and pushes to `main`.
*   **Out of Scope**: Publishing packages, deploying docs, auto-tagging releases, or adding secrets-backed CD.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB-Lane produce automatic CI readiness evidence before Product/BFM uses a branch as merge-ready.
    *   **Key Results**:
        *   PRs and pushes to `main` run the same local validation script.
        *   The validation script covers CLI syntax, source/package parity, JSON parsing, skill metadata, regression tests, `doctor`, and whitespace checks.
        *   Docs explain that FB-Lane is not CI/CD, but now includes a CI readiness automation loop.
        *   CI passing is required before merge once `main` branch protection is enabled;
            the intended operating model is automated merge safety with manual release
            control (staging, live deploy, plugin release, and publish remain manual
            Product decisions).
    *   **Definition of Done**: The workflow and local runner pass locally without new dependencies or secrets, and docs/board/handoff record CI readiness as part of Loop Engineering evidence.
    *   **Gate / Review Point**: `node tools/fb-lane.validate.cjs`, `node --check tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` pass before closeout.
    *   **Approval**: approved
    *   **Justification**: The user approved adding a real automation loop after choosing CI readiness on PR and `main` pushes, with CD intentionally deferred.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and CI only
    *   **Locked Files**: `.github/workflows/fb-lane-readiness.yml`, `tools/fb-lane.validate.cjs`, `.gitignore`, `.codex/rules.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-013.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/ci-readiness-loop`
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Local CI runner passes.
    *   [x] CI runner syntax check passes.
    *   [x] Repo doctor passes.
    *   [x] Git diff whitespace check passes.
    *   [x] Workflow has no secrets requirement.
*   **Modified Files**:
    *   `.github/workflows/fb-lane-readiness.yml`
    *   `tools/fb-lane.validate.cjs`
    *   `.gitignore`
    *   `.codex/rules.md`
    *   `README.md`
    *   `FAQ.md`
    *   `docs/loop-engineering.md`
    *   `CHANGELOG.md`
    *   `docs/handoffs/TASK-013.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Implemented the CI readiness automation loop. `node tools/fb-lane.validate.cjs`, runner syntax, repo doctor, workflow sanity, and whitespace checks passed.
    *   *2026-06-27*: Fixed the GitHub Actions doctor mismatch by tracking `.codex/rules.md`; the CI readiness gate now runs against the same repo state as local validation.


### TASK-012 - Clarify stable OKR alignment in FB-Lane
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Refine Loop Engineering so Product/workstream OKRs and lane OKRs stay stable, mini-loops produce evidence against those OKRs, and BFM stops for explicit approval before any OKR addition or change.
*   **Out of Scope**: Creating more per-task OKR ceremony, changing submit behavior, hard-blocking work, or adding dynamic OKR generation during execution.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB-Lane treat OKRs as stable, plain-English alignment anchors that reduce rework instead of becoming dynamic planning clutter.
    *   **Key Results**:
        *   Docs, skills, templates, generated prompts, and packaged plugin copies distinguish Product/workstream OKRs, lane OKRs, and mini-loop evidence.
        *   Handoff guidance uses `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR`.
        *   `doctor` remains advisory, warns on missing approved OKR alignment or implied unapproved new goals, and keeps `TASK-Q-*` quick tasks exempt.
    *   **Definition of Done**: Source and packaged guidance consistently require stable OKR reuse, explicit approval before OKR additions/changes, PM-readable wording, and mini-loop evidence instead of dynamic OKR creation.
    *   **Gate / Review Point**: Wording scans, CLI syntax/parity, manifest/generated JSON parsing, doctor fixture checks, repo doctor, and `git diff --check` pass before closeout.
    *   **Approval**: approved
    *   **Justification**: The user approved the implementation plan after clarifying that OKRs should be for everyone, stable by default, and added only when they make clarity better after discussion.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and plugin coordination behavior only
    *   **Locked Files**: `AGENTS.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/loop-engineering.md`, `docs/handoffs/TASK-012.md`, `templates/*.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/**`, `skills/**/*.md`, `agents/**`, `.claude/agents/**`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/stable-okr-alignment`
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Stable OKR wording scan passes.
    *   [x] Root and packaged CLI pass syntax checks.
    *   [x] Root and packaged CLI stay byte-identical.
    *   [x] `doctor` fixture checks cover aligned, implied new goal, and quick-task cases.
    *   [x] Plugin manifests and generated agent JSON parse.
    *   [x] Repo `doctor` and `git diff --check` pass.
*   **Modified Files**:
    *   `README.md`, `FAQ.md`, `docs/loop-engineering.md`
    *   `AGENTS.md`, `CLAUDE.md`, `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/PROJECT_BOARD.md`
    *   `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/**`, `plugins/fb-lane-coordination/agents/**`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/plugin.json`, `plugins/fb-lane-coordination/README.md`
    *   `tools/fb-lane.cjs`, `agents/**`, `.claude/agents/**`
    *   `docs/handoffs/TASK-002.md`, `docs/handoffs/TASK-003.md`, `docs/handoffs/TASK-010.md`, `docs/handoffs/TASK-011.md`, `docs/handoffs/TASK-012.md`
    *   `CHANGELOG.md`, `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Implemented stable OKR alignment across docs, skills, templates, generated prompts, packaged plugin files, and advisory doctor checks. Verification passed: wording scan, CLI syntax/parity, doctor fixture matrix, JSON parse, skill validation, repo doctor, regression tests, and `git diff --check`.


### TASK-001 - Project Setup & Bootstrap
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Setup
*   **Scope**: Create initial files, initialize repository layout.
*   **Out of Scope**: Writing application business logic.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/example/repo/tree/main)
    *   **Staging URL**: [Staging Link](https://staging.example.com)
    *   **Design Specs**: (None)
    *   **Decision Memo**: [docs/decisions/001-setup.md](file:///./docs/decisions/001-setup.md)
*   **QA Checklist**:
    *   [x] Repository structure is clean and follows design guidelines.
    *   [x] File names and paths are correct.
    *   [x] Documentation has zero typos or placeholders.
*   **Modified Files**:
    *   `docs/decisions/001-setup.md`
*   **Latest Update**:
    *   *2026-06-15*: Completed repository bootstrapping and documented layout decisions.


### TASK-002 - Implement user authentication endpoints
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Core
*   **Scope**: Implement user registration and login API endpoints.
*   **Out of Scope**: Unrelated styling edits.
*   **Goal Alignment Session**:
    *   **Objective**: Provide a minimal local authentication surface for registration, login, logout, and current-session lookup.
    *   **Key Results**:
        *   Auth routes validate input and return expected success/error states.
        *   Passwords are hashed and session tokens expire.
        *   A self-contained auth smoke passes.
    *   **Definition of Done**: `src/auth.ts` and `src/db.ts` support the documented auth endpoints with runnable local verification.
    *   **Gate / Review Point**: FB-Tech verification evidence is present in `docs/handoffs/TASK-002.md`.
    *   **Approval**: approved
    *   **Justification**: Legacy completed work needs approved OKRs so non-quick handoff doctor checks remain actionable.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: (None)
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Registration works and hashes passwords.
    *   [x] Session tokens generated securely.
    *   [x] Unit tests pass.
*   **Modified Files**:
    *   `src/auth.ts`
    *   `src/db.ts`
*   **Latest Update**:
    *   *2026-06-22*: Implemented password hashing, session tokens, in-memory DB interface, HTTP handlers, and self-contained integration tests.


### TASK-003 - Design responsive dashboard navigation
*   **Status**: Done
*   **Owner / Thread**: FB-Design
*   **Area**: UI
*   **Scope**: Design a responsive sidebar navigation menu.
*   **Out of Scope**: Editing database schemas or APIs.
*   **Goal Alignment Session**:
    *   **Objective**: Provide responsive dashboard sidebar styling that stays contained across desktop, tablet, and mobile widths.
    *   **Key Results**:
        *   Sidebar desktop, collapsed, and mobile states are documented.
        *   Text containment rules prevent label spill.
        *   Visual QA notes cover representative viewport sizes.
    *   **Definition of Done**: `src/navigation.css` contains the responsive sidebar styling and the handoff records viewport evidence.
    *   **Gate / Review Point**: FB-Design verification evidence is present in `docs/handoffs/TASK-003.md`.
    *   **Approval**: approved
    *   **Justification**: Legacy completed work needs approved OKRs so non-quick handoff doctor checks remain actionable.
*   **Affected Screens / Locks**:
    *   **Screens**: Dashboard
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: (None)
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Sidebar collapses cleanly on mobile viewports.
    *   [x] Colors align with the design system.
*   **Modified Files**:
    *   `src/navigation.css`
*   **Latest Update**:
    *   *2026-06-22*: Designed responsive sidebar navigation styling with collapsible states, text containment, and design system color mappings.



### TASK-004 - Package FB-Lane as a Codex plugin
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex
*   **Scope**: Add a repo-local Codex plugin package that bundles FB-Lane skills, MCP configuration, and install documentation so Codex users can install the coordination workflow with minimal setup.
*   **Out of Scope**: Changing Antigravity runtime behavior or replacing the existing Claude Code plugin.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: PR #7
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Codex plugin manifest validates.
    *   [x] Marketplace entry points at the plugin package.
    *   [x] Docs explain install and usage.
*   **Modified Files**:
    *   `.agents/plugins/marketplace.json`
    *   `plugins/fb-lane-coordination/`
    *   `tools/fb-lane.cjs`
    *   `README.md`
    *   `FAQ.md`
    *   `platforms/codex/README.md`
*   **Latest Update**:
    *   *2026-06-19*: Added and validated the Codex plugin package, including bundled skills and MCP workspace-path support.


### TASK-005 - Clarify Codex plugin pain point and value
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex Docs
*   **Scope**: Update Codex-facing docs to make the real pain point explicit and avoid overstating Codex limitations.
*   **Out of Scope**: Changing plugin code, videos, or non-Codex platform behavior.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/pain-point-docs`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Codex claims are verified against current Codex docs/manual.
    *   [x] Pain point is framed as coordination risk, not missing Codex capability.
    *   [x] Fix/value proposition is clear and practical.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `platforms/codex/README.md`
*   **Latest Update**:
    *   *2026-06-21*: Clarified that Codex already provides subagents/worktrees/plugins/skills/MCP; FB-Lane solves the cross-lane product coordination layer.


### TASK-006 - Explain how FB-Lane works with Codex worktrees
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex Docs
*   **Scope**: Update Codex-facing docs to explain, in non-technical terms, when to use FB-Lane alone, Codex worktrees alone, or both together.
*   **Out of Scope**: Changing plugin code, videos, or non-Codex platform behavior.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `FAQ.md`, `platforms/codex/README.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/pain-point-docs`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Current Codex worktree behavior is reflected accurately.
    *   [x] Docs clearly separate physical workspace isolation from product coordination.
    *   [x] Docs show how Product/Captain uses worktrees and lane handoffs together.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `platforms/codex/README.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Added Codex worktrees guidance and clarified that worktrees provide Git/workspace isolation while FB-Lane provides product coordination, claims, handoffs, and Product sequencing.


### TASK-007 - Fix quick-task ID parsing for `TASK-Q-####` board rows
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: CLI
*   **Scope**: Update board parsing and rewriting so quick tasks created as `TASK-Q-####` are visible to status, submit, merge, and plugin MCP flows.
*   **Out of Scope**: Example icon assets from draft PR #4.
*   **Affected Screens / Locks**:
    *   **Screens**: CLI / MCP behavior only
    *   **Locked Files**: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/quick-task-id-parser-fix`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Root CLI parses `TASK-Q-####` rows and detail headers.
    *   [x] Plugin-packaged CLI parses `TASK-Q-####` rows and detail headers.
    *   [x] Normal `TASK-###` IDs still parse.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Applied the parser-only fix from draft PR #4 to both CLI copies and verified quick-task read/write behavior without merging optional example icon assets.


### TASK-008 - Refresh plugin docs after merged Codex and quick-task work
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Documentation
*   **Scope**: Update user-facing docs so the repo reflects the merged Codex worktree guidance, immediate post-install usage, quick-task parser support, and remaining draft PR state.
*   **Out of Scope**: Changing runtime behavior, videos, platform-specific claims, or draft PR #3 content.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `FAQ.md`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/docs-refresh-after-merges`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Install-time docs include a first prompt that works without reading the full README.
    *   [x] Quick-task docs mention `TASK-Q-####` status/submit/merge support.
    *   [x] Outstanding draft PR state is documented without implying it is merged.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Added immediate Codex post-install prompts, quick-task lifecycle documentation, and Codex plugin metadata version `0.1.1`. Current repo state: PR #8 and PR #10 are merged; PR #4 is closed as superseded; PR #3 remains a conflicting draft and is not documented as merged.


### TASK-009 - Trim front page and move setup/platform details to focused docs
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Documentation
*   **Scope**: Make the front page shorter, remove platform-specific usage from the front page, move AI-powered/manual setup into a dedicated setup page, and keep Codex usage inside the Codex platform guide.
*   **Out of Scope**: Changing plugin behavior, generated videos, or platform runtime claims.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `docs/setup.md`, `platforms/codex/README.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/front-page-docs-trim`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Front page is shorter and links to platform guides instead of embedding platform-specific usage.
    *   [x] AI-powered bootstrap and manual CLI bootstrap live on a separate setup page.
    *   [x] Codex-specific usage prompts live in the Codex guide and are only linked from the front page.
*   **Modified Files**:
    *   `README.md`
    *   `docs/setup.md`
    *   `platforms/codex/README.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Reworked the front page into a concise overview and platform-router, moved AI-powered/manual bootstrap to `docs/setup.md`, and kept Codex first-use prompts in the Codex platform guide.


### TASK-Q-8688 - Quick test hooks
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Quick-Fix
*   **Scope**: Quick test hooks
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/friedbeef1/fb-lane-coordination/tree/quick/TASK-Q-8688-quick-test-hooks)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Changes compile without error.
    *   [x] Modified files are verified and checked.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *2026-06-21*: Initialized quick edit task.


### TASK-Q-5217 - Improve Codex plugin setup UX
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Quick-Fix
*   **Scope**: Improve Codex plugin setup UX
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #17](https://github.com/friedbeef1/fb-lane-coordination/pull/17)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Root and packaged CLI pass `node --check`.
    *   [x] Codex plugin manifest validates.
    *   [x] Codex-only bootstrap smoke creates no Claude or Antigravity artifacts.
    *   [x] `git diff --check` passes.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/plugin.json`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`
    *   `platforms/codex/README.md`
    *   `README.md`
    *   `docs/handoffs/TASK-Q-5217.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-23*: Added Codex-only bootstrap, read-only doctor, `$fb-lane` docs, plugin metadata alignment, and handoff; local verification passed.
    *   *2026-06-24*: Added thin-protocol guidance so FB-Lane is optional and skipped for simple single-thread Codex work.


### TASK-010 - Add lightweight goal alignment to FB-Lane handoffs and BFM sequencing
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Add a canonical Working Goal loop to non-trivial FB-Lane tasks, keep lane handoffs lightweight, and make BFM reconcile goal drift before sequencing execution.
*   **Out of Scope**: Hard-blocking `submit`, changing quick-task behavior, or creating a standalone goal-management framework.
*   **Goal Alignment Session**:
    *   **Objective**: Make non-trivial FB-Lane handoffs preserve a clear Product/BFM-owned OKR while preserving lane caveats and evidence.
    *   **Key Results**:
        *   Skills and bootstrap guidance describe the board OKR contract.
        *   Lane handoffs report fit without rewriting board OKRs.
        *   `doctor` warns on missing non-quick handoff alignment and keeps `TASK-Q-*` exempt.
    *   **Definition of Done**: Skills, bootstrap guidance, packaged plugin files, and doctor checks all consistently express the Goal Alignment contract, with quick tasks exempt.
    *   **Gate / Review Point**: Source validation, plugin validation, CLI syntax checks, and doctor fixture checks pass before submit.
    *   **Approval**: approved
    *   **Justification**: This merged coordination change established the predecessor contract this follow-up replaces with OKR language.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and CLI behavior only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #19](https://github.com/friedbeef1/fb-lane-coordination/pull/19)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Modified skills validate.
    *   [x] Plugin manifest validates.
    *   [x] Root and packaged CLI pass syntax checks.
    *   [x] `doctor` warns for missing Goal Alignment on non-quick handoffs and exempts `TASK-Q-*`.
*   **Modified Files**:
    *   `AGENTS.md`
    *   `templates/AGENTS.md`
    *   `templates/CLAUDE.md`
    *   `templates/PROJECT_BOARD.md`
    *   `README.md`
    *   `platforms/codex/README.md`
    *   `platforms/codex/workflow-rules.md`
    *   `platforms/antigravity/README.md`
    *   `agents/fb-product.md`
    *   `skills/fb-lane-coordination/SKILL.md`
    *   `skills/project-coordination-setup/SKILL.md`
    *   `skills/quickstart/SKILL.md`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/agents/FB-Business/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Design/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Product/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/plugin.json`
    *   `plugins/fb-lane-coordination/skills/bfm/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `docs/handoffs/TASK-002.md`
    *   `docs/handoffs/TASK-003.md`
    *   `docs/handoffs/TASK-010.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-25*: Product claimed the goal-alignment loop implementation and locked the skill, bootstrap, CLI, and handoff files.
    *   *2026-06-25*: Implemented lightweight Goal Alignment guidance, BFM reconciliation, generated/static bootstrap updates, doctor warnings, metadata bump, and handoff evidence; final review passed after fixes requiring real `## Goal Alignment` handoff headings, worker handoff-only goal feedback, full board-block wording (`Working Goal`, `Definition of Done`, `Gate / Review Point`), and doctor warnings for wrong heading levels.
    *   *2026-06-25*: Addressed final review gaps in the manual board template and quickstart entrypoint.
    *   *2026-06-25*: Backfilled legacy TASK-002/TASK-003 handoffs and completed setup skill example alignment so `doctor` can stay warning-clean.
    *   *2026-06-25*: Tightened generated prompts so Product/BFM owns board goal updates and worker lanes report goal feedback only in handoffs.
    *   *2026-06-26*: Tightened Product/Lane execution boundaries: Product gives direction, sets goals, assigns lanes, reviews handoffs, and integrates; individual Tech/Design/Business lanes claim and execute their own task/files. Added advisory doctor checks for stale Git lock files and long-running local lane git/test/build processes so Product can record a blocked/pending gate instead of looping on execution.
    *   *2026-06-26*: Follow-up Product/Lane boundary checks passed: skill/plugin/CLI validation, source/package CLI parity, JSON manifest parse, `git diff --check`, stale-lock doctor fixture, and repo doctor process/lock check.
    *   *2026-06-26*: PR #19 merged to `main`, local marketplace source refreshed, and `codex plugin add fb-lane-coordination@fb-lane` reinstalled active cache version `0.1.2+codex.20260625082239`.


### TASK-011 - Harden fb-lane CLI against shell command injection
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Security
*   **Scope**: Stop running `git` through a shell in `fb-lane.cjs`, and validate task IDs and lane names so attacker-controlled values (including MCP tool arguments) can no longer inject commands.
*   **Out of Scope**: Changing the coordination model, lane boundaries, or board protocol.
*   **Goal Alignment**:
    *   **Working Goal**: Remove the command-injection surface in the CLI without changing legitimate behavior.
    *   **Success Measure**: `git` runs with no shell, untrusted values are validated, and a regression suite proves shell metacharacters are inert.
    *   **Gate / Review Point**: CLI syntax check, regression tests, and source/packaged CLI parity pass before merge.
*   **Affected Screens / Locks**:
    *   **Screens**: CLI behavior only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #21](https://github.com/friedbeef1/fb-lane-coordination/pull/21)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] `git` is invoked via `execFileSync` with an args array (no shell).
    *   [x] Task IDs and lane names are validated at the CLI and MCP entry points.
    *   [x] `node tools/fb-lane.test.cjs` passes (validators + no-shell proofs).
    *   [x] Root and packaged CLI stay byte-identical and pass syntax checks.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `tools/fb-lane.test.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`
    *   `docs/fb-lane-upstream/0001-harden-fb-lane-cli.patch`
    *   `docs/fb-lane-upstream/README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Replaced shell `git ${args}` execution with `execFileSync('git', argv)`, de-shelled the `submit` fallback and `lsof` lookup, added task ID / lane allowlists and an option-like branch-name guard, made the CLI importable, and added `tools/fb-lane.test.cjs` (10 checks pass). Resynced the bundled plugin copy and captured the change as an upstream `git format-patch`.

### TASK-Q-5624 - Document plugin upgrade process and changelog
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Quick-Fix
*   **Scope**: Document plugin upgrade process and changelog
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #20](https://github.com/friedbeef1/fb-lane-coordination/pull/20)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Changes compile without error.
    *   [x] Modified files are verified and checked.
*   **Modified Files**:
    *   `README.md`
    *   `docs/setup.md`
    *   `platforms/codex/README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
    *   `docs/handoffs/TASK-Q-5624.md`
    *   `docs/handoffs/TASK-010.md`
*   **Latest Update**:
    *   *2026-06-25*: Initialized quick edit task.
    *   *2026-06-26*: Added changelog and documented the Codex plugin upgrade/reinstall process.
    *   *2026-06-26*: PR #20 merged to `main`; locks released.


### TASK-011 - Add BFM return-loop closeout checks
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Make BFM and lane execution close only after every relevant handoff has an explicit status that agrees with board, source, docs, and test evidence, or the mismatch is named; frame the public docs around Loop Engineering as the Product Lead operating model.
*   **Out of Scope**: Changing submit behavior, adding a new framework, or requiring return-loop ceremony for quick micro-tasks.
*   **Goal Alignment Session**:
    *   **Objective**: BFM and lane closeouts behave like a real loop: read handoffs, execute/route work, return to board/source/docs/tests, and close only when all handoffs are accounted for under approved OKRs.
    *   **Key Results**:
        *   BFM blocks before execution when OKR approval is missing, OKRs are unclear, or handoffs conflict with approved OKRs.
        *   Lane handoffs report `OKR Fit`.
        *   Skills, docs, templates, generated prompts, packaged plugin copies, changelog, and handoff docs consistently use `Goal Alignment Session`.
        *   `doctor` warns, without blocking, for missing/unapproved non-quick OKRs and missing handoff OKR Fit.
    *   **Definition of Done**: Skills, bootstrap guidance, generated CLI prompts, packaged plugin copies, changelog, and handoff docs consistently require approved Goal Alignment Session OKRs, explicit handoff status, and return checks.
    *   **Gate / Review Point**: Wording scans, skill/manifest validation, CLI syntax checks, and source/package parity checks pass before commit.
    *   **Approval**: approved
    *   **Justification**: This follow-up tightens BFM sequencing around approved OKRs without changing submit behavior or quick-task flow.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and plugin behavior guidance only
    *   **Locked Files**: `.claude/agents/fb-business.md`, `.claude/agents/fb-design.md`, `.claude/agents/fb-product.md`, `.claude/agents/fb-tech.md`, `AGENTS.md`, `CHANGELOG.md`, `FAQ.md`, `README.md`, `agents/FB-Business/agent.json`, `agents/FB-Design/agent.json`, `agents/FB-Product/agent.json`, `agents/FB-Tech/agent.json`, `agents/fb-business.md`, `agents/fb-design.md`, `agents/fb-product.md`, `agents/fb-tech.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/handoffs/TASK-011.md`, `platforms/antigravity/README.md`, `platforms/claude-code/README.md`, `platforms/codex/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/agents/FB-Business/agent.json`, `plugins/fb-lane-coordination/agents/FB-Design/agent.json`, `plugins/fb-lane-coordination/agents/FB-Product/agent.json`, `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`, `plugins/fb-lane-coordination/plugin.json`, `plugins/fb-lane-coordination/skills/bfm/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`, `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`, `templates/AGENTS.md`, `templates/CLAUDE.md`, `tools/fb-lane.cjs`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #25](https://github.com/friedbeef1/fb-lane-coordination/pull/25)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Modified skills validate by frontmatter/wording scan.
    *   [x] Plugin manifests parse.
    *   [x] Root and packaged CLI pass syntax checks.
    *   [x] Source/package CLI copies stay byte-identical.
    *   [x] Codex bootstrap smoke generated return-loop guidance.
    *   [x] Rewritten GitHub docs pass local Markdown link checks.
    *   [x] Stale primary-positioning scan passes.
    *   [x] Setup and platform docs retain install/bootstrap commands.
*   **Modified Files**:
    *   `.claude/agents/fb-business.md`
    *   `.claude/agents/fb-design.md`
    *   `.claude/agents/fb-product.md`
    *   `.claude/agents/fb-tech.md`
    *   `AGENTS.md`
    *   `CHANGELOG.md`
    *   `CLAUDE.md`
    *   `FAQ.md`
    *   `README.md`
    *   `agents/FB-Business/agent.json`
    *   `agents/FB-Design/agent.json`
    *   `agents/FB-Product/agent.json`
    *   `agents/FB-Tech/agent.json`
    *   `agents/fb-business.md`
    *   `agents/fb-design.md`
    *   `agents/fb-product.md`
    *   `agents/fb-tech.md`
    *   `docs/loop-engineering.md`
    *   `docs/setup.md`
    *   `docs/handoffs/TASK-002.md`
    *   `docs/handoffs/TASK-003.md`
    *   `docs/handoffs/TASK-010.md`
    *   `docs/handoffs/TASK-011.md`
    *   `platforms/antigravity/README.md`
    *   `platforms/claude-code/README.md`
    *   `platforms/codex/README.md`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/agents/FB-Business/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Design/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Product/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`
    *   `plugins/fb-lane-coordination/plugin.json`
    *   `plugins/fb-lane-coordination/skills/bfm/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `skills/fb-lane-coordination/SKILL.md`
    *   `skills/project-coordination-setup/SKILL.md`
    *   `skills/quickstart/SKILL.md`
    *   `templates/AGENTS.md`
    *   `templates/CLAUDE.md`
    *   `templates/PROJECT_BOARD.md`
    *   `tools/fb-lane.cjs`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Product claimed the return-loop coordination update and locked the process docs, skill files, bootstrap templates, generated CLI prompts, packaged CLI copy, changelog, handoff, and board.
    *   *2026-06-27*: Implemented BFM return-loop guidance across skills, docs, bootstrap templates, generated prompts, and packaged plugin files; syntax, manifest parse, CLI parity, Codex bootstrap smoke, doctor setup checks, and whitespace checks passed.
    *   *2026-06-27*: Opened PR #25 for Product review; remaining gate is merge and plugin reinstall/refresh after merge.
    *   *2026-06-27*: Added the visible BFM return-loop Mermaid diagram to the root README, packaged plugin README, and BFM skill; bumped the Codex plugin build suffix to `0.1.2+codex.20260627163830`.
    *   *2026-06-27*: Updated Codex plugin metadata/default prompts so installed plugin users see BFM as a return loop; bumped the Codex plugin build suffix to `0.1.2+codex.20260627164153`.
    *   *2026-06-27*: Renamed the canonical Goal Alignment evidence field to `Definition of Done` across docs, skills, templates, generated prompts, packaged plugin copies, and CLI output; bumped the Codex plugin build suffix to `0.1.2+codex.20260627171622`.
    *   *2026-06-27*: Implemented the BFM Goal Alignment Session with approved OKRs, `OKR Fit` handoffs, warning-only `doctor` checks for missing/unapproved non-quick OKRs, and packaged plugin build suffix `0.1.2+codex.20260627174151`.
    *   *2026-06-27*: Reframed the public GitHub docs around Loop Engineering for Product Leads, added `docs/loop-engineering.md`, shortened `FAQ.md`, and kept setup/platform pages tactical.
    *   *2026-06-27*: Merged PR #25, refreshed the Codex plugin, replaced user-specific approval wording with generic `the user` language, moved plugin display ownership to `FB-Lane Contributors`, and bumped the packaged plugin build suffix to `0.1.2+codex.20260627183826`.
