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
| TASK-001 | Ready | FB-Product | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) \| [PR #1](https://github.com/example/repo/pull/1) |

---

### TASK-001 - Project Setup & Bootstrap
*   **Status**: Ready
*   **Owner / Thread**: FB-Product
*   **Area**: Setup
*   **Scope**: Create initial files, initialize repository layout.
*   **Out of Scope**: Writing application business logic.
*   **Goal Alignment Session**:
    *   **Objective**: Bootstrap FB-Lane safely so future non-trivial tasks have one approved OKR, clear locks, and durable handoffs.
    *   **Key Results**:
        *   Board, rules, CLI, and handoff folder exist.
        *   `doctor` reports no blocking setup errors.
    *   **Definition of Done**: The board, rules, CLI, and handoff folder are present and ready for lane claims.
    *   **Gate / Review Point**: Product confirms setup is ready to move into the first non-trivial task.
    *   **Approval**: approved
    *   **Justification**: Setup work needs a small approved OKR so future lanes can see the expected coordination baseline.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: `AGENTS.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/example/repo/tree/main)
    *   **Staging URL**: [Staging Link](https://staging.example.com)
    *   **Design Specs**: (None)
    *   **Decision Memo**: [docs/decisions/001-setup.md](file:///./docs/decisions/001-setup.md)
*   **QA Checklist**:
    *   [ ] Repository structure is clean and follows design guidelines.
    *   [ ] File names and paths are correct.
    *   [ ] Documentation has zero typos or placeholders.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *2026-06-14*: Scoped task and marked ready for execution.

### Goal Alignment Session (non-trivial tasks only)
Use one canonical Goal Alignment Session block per task in the detail block above, with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`. Product/BFM owns that block. BFM blocks before execution when approval is missing, OKRs are unclear, or handoffs conflict with the approved OKR.

Lane handoffs stay compact and use a real heading:

```md
## Goal Alignment Session

OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
Goal Challenge / Caveat: <real caveat> | No caveat identified
Definition of Done Evidence: <lane evidence that proves, weakens, or blocks the approved OKR>
```
