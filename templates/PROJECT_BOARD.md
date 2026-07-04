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
    *   **Objective**: Bootstrap FB-Lane safely so future non-trivial tasks have a stable Product/workstream OKR, relevant lane OKRs, clear locks, and durable handoffs.
    *   **Key Results**:
        *   Board, rules, CLI, and handoff folder exist.
        *   `doctor` reports no blocking setup errors.
    *   **Definition of Done**: The board, rules, CLI, and handoff folder are present and ready for lane claims.
    *   **Gate / Review Point**: Product confirms setup is ready to move into the first non-trivial task.
    *   **Approval**: approved
    *   **Justification**: Setup work needs a small approved Product/workstream OKR so future lanes can see the expected coordination baseline.
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
Use the approved Product/workstream or BFM-target OKR as the stable anchor, with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`. Stable lane OKRs are standing Product, Tech, Design, and Business quality anchors. Product/BFM owns the OKR tree and records additions or changes only after discussion and explicit user approval. Do not generate a fresh OKR for every task. BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree.

Lane handoffs stay compact and use a real heading:

```md
## Goal Alignment Session

Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
Mini-loop Evidence: <lane evidence from its smallest real verification loop>
Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
```

### Handoff Index
- `PROJECT_BOARD.md` stays the source of truth for current status, sequencing, gates, ownership, and file locks.
- `docs/handoffs/index.md` is the first-read routing table for handoff discovery.
- Use compact index columns: `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`.
- Product/BFM should create or refresh the index before non-quick sequencing when handoffs exist and the lookup layer is missing, stale, or too vague.
- Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.
- Open detailed handoffs only when they are relevant to the active task or Product/BFM closeout.

### Proactive Loop Hardening
If Product/BFM sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework, it should propose one small guardrail with observed pattern, cost, benefit, affected files/rules, and approval needed before changing the process. Skip one-off or low-impact issues.

### Awareness, Isolation, Integration
- `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup.
- Branches/worktrees isolate execution like separate desks.
- BFM integrates outcomes like Product/release review.
- Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.
- Before source execution, read board/status/locks and the relevant handoff index.
- During isolated work, name the task, branch/worktree, lane, and locked files.
- At closeout, report whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If intentionally dirty, record exact files, owner, reason, next gate, and session-boundary action; at the next session boundary, continue, commit, revert, archive, or block/defer it before starting new source work.

### Loop Health Flag
At closeout, Product/BFM records one flag: `healthy`, `watch`, `needs Product review`, or `blocked`. Use this instead of numeric loop scoring.

### Loop Learning
At closeout, Product/BFM also records whether feedback was captured, whether the pattern repeated, whether tooling is needed (`none`, `propose guardrail`, `propose automation`, or `propose eval`), and whether Product approval is needed. Heavier tooling starts from this field; it is not added automatically.

If `Loop Learning` chooses `propose eval`, create a small Markdown scorecard under `docs/evals/` with sections for non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules unless Product/BFM proposes that heavier option with pros/cons and the user explicitly approves it.

### Approval Autonomy
Start in Phase 1 Shadow Approval: Product/BFM still asks the user, but records `Would self-approve: yes/no` and the reason. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.
