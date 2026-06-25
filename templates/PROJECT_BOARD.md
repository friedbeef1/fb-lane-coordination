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
*   **Goal Alignment**:
    *   **Working Goal**: Bootstrap FB-Lane safely so future non-trivial tasks have one canonical goal, clear locks, and durable handoffs.
    *   **Success Measure**: The board, rules, CLI, and handoff folder are present and ready for lane claims.
    *   **Gate / Review Point**: Setup is ready when `node tools/fb-lane.cjs doctor` reports no blocking setup errors.
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

### Goal Alignment (non-trivial tasks only)
Use one canonical `Working Goal` per task in the detail block above, together with `Success Measure` and `Gate / Review Point`. Product/BFM owns that goal and updates it in place when it changes: `Goal changed from X to Y because Z.`

Lane handoffs stay compact:
- `Goal Alignment`: `aligned`, `suggest change: <proposed goal>`, or `blocked by goal ambiguity: <reason>`
- `Goal Challenge / Caveat`: a real caveat, or `No caveat identified`
- `Evidence Against Goal`: lane evidence that proves, weakens, or blocks the current goal
