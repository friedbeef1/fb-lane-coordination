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
| TASK-Q-8688 | Done | FB-Tech | Quick-Fix | Quick test hooks | (None) | [Branch](https://github.com/friedbeef1/fb-lane-coordination/tree/quick/TASK-Q-8688-quick-test-hooks) |
| TASK-001 | Done | FB-Tech | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) |
| TASK-002 | Done | FB-Tech | Core | Implement user authentication endpoints | (None) | (None) |
| TASK-003 | In Progress | FB-Design | UI | Design responsive dashboard navigation | `src/navigation.css` | (None) |
| TASK-004 | Done | FB-Product | Codex | Package FB-Lane as a Codex plugin | (None) | PR #7 |
| TASK-005 | Done | FB-Product | Codex Docs | Clarify Codex plugin pain point and value | (None) | `codex/pain-point-docs` |
| TASK-006 | Done | FB-Product | Codex Docs | Explain how FB-Lane works with Codex worktrees | `README.md`, `FAQ.md`, `platforms/codex/README.md` | `codex/pain-point-docs` |
| TASK-007 | Done | FB-Tech | CLI | Fix quick-task ID parsing for `TASK-Q-####` board rows | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs` | `codex/quick-task-id-parser-fix` |
| TASK-008 | Done | FB-Product | Documentation | Refresh plugin docs after merged Codex and quick-task work | `README.md`, `FAQ.md`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `PROJECT_BOARD.md` | `codex/docs-refresh-after-merges` |
| TASK-009 | Done | FB-Product | Documentation | Trim front page and move setup/platform details to focused docs | `README.md`, `docs/setup.md`, `platforms/codex/README.md`, `PROJECT_BOARD.md` | `codex/front-page-docs-trim` |

---

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
*   **Status**: In Progress
*   **Owner / Thread**: FB-Design
*   **Area**: UI
*   **Scope**: Design a responsive sidebar navigation menu.
*   **Out of Scope**: Editing database schemas or APIs.
*   **Affected Screens / Locks**:
    *   **Screens**: Dashboard
    *   **Locked Files**: `src/navigation.css`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: (None)
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [ ] Sidebar collapses cleanly on mobile viewports.
    *   [ ] Colors align with the design system.


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
    *   [ ] Changes compile without error.
    *   [ ] Modified files are verified and checked.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *2026-06-21*: Initialized quick edit task.
