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
| TASK-001 | Done | FB-Tech | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) |
| TASK-002 | Ready | FB-Tech | Core | Implement user authentication endpoints | `src/auth.ts`, `src/db.ts` | (None) |
| TASK-003 | Ready | FB-Design | UI | Design responsive dashboard navigation | `src/navigation.css` | (None) |

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
*   **Status**: Ready
*   **Owner / Thread**: FB-Tech
*   **Area**: Core
*   **Scope**: Implement user registration and login API endpoints.
*   **Out of Scope**: Unrelated styling edits.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: `src/auth.ts`, `src/db.ts`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: (None)
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [ ] Registration works and hashes passwords.
    *   [ ] Session tokens generated securely.
    *   [ ] Unit tests pass.


### TASK-003 - Design responsive dashboard navigation
*   **Status**: Ready
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
