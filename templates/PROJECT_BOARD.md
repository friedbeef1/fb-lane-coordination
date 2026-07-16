# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Features deployed to staging, awaiting visual/functional verification.
- `Done`: Checked, verified, and merged to production by FB Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Ready | FB Product | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) \| [PR #1](https://github.com/example/repo/pull/1) |

---

### TASK-001 - Project Setup & Bootstrap
*   **Status**: Ready
*   **Owner / Thread**: FB Product
*   **Area**: Setup
*   **Scope**: Create initial files, initialize repository layout.
*   **Out of Scope**: Writing application business logic.
*   **Goal Alignment Session**:
    *   **Objective**: Bootstrap FB safely so future non-trivial tasks have a stable Product/workstream OKR, relevant lane OKRs, clear locks, and durable handoffs.
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

`/goal` is a Product/BFM shortcut into this same Goal Alignment Session. It shows, creates, clarifies, or asks approval for the current goal; it must not create a second goal system or a separate `/goals` flow. Workstream chats do not own `/goal`; they propose or challenge goal fit in their handoff.

Lane handoffs stay compact and use a real heading:

```md
## Goal Alignment Session

Product Goal: <existing approved Product/workstream goal, if known>
Workstream Goal: <plain-language lane contribution for Product/user approval>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <lane evidence from its smallest real verification loop>
Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
```

### Sidechat-to-Main Prompt Handoff
Sidechats are discussion and planning spaces by default. Use them to ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready handoff for their originating parent main thread. They do not own board updates, handoff files, source changes, commits, validation, or closeout; Product/BFM retains those execution and durable-record responsibilities.

Parent-thread routing is mandatory: read `docs/sidechat-parent-thread-routing.md`. Do not infer another destination from role, project, name, recency, or Product/BFM status. If the parent is unavailable, return the handoff to the user; a non-parent main treats it as ordinary user-provided context.

A sidechat prompt is not source of truth until Product/BFM records it in `PROJECT_BOARD.md`, the relevant handoff, or durable docs. Keep tiny questions lightweight: no new command, dashboard, `doctor` expansion, source behavior, or required ceremony is needed for a quick clarification.

When a sidechat prepares work for Product/BFM, use this output shape:

- Decision summary:
- Scope:
- Out of scope:
- Recommended owner/lane:
- Files/docs likely affected:
- Acceptance criteria:
- Gates/risks:
- Exact instruction for Product/BFM:


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

If `Loop Learning` chooses `propose eval`, copy `docs/evals/eval-record-template.md` and follow `docs/fb/evals.md`. Every new record starts shadow; Product/BFM records authority decisions, and promotion to blocking or mechanical needs explicit Product approval evidence. Do not add eval runners, semantic judges, dashboards, numeric scoring, CI eval jobs, hosted capture, external integrations, or automatic promotion.

### Approval Autonomy
Start in Phase 1 Shadow Approval: Product/BFM still asks the user, but records `Would self-approve: yes/no` and the reason. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.

Execution continuation: once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. Report after closeout, not before every routine step. Stop for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.

### Frontend Visual Planning
Frontend/UI plans and handoffs default to a pre-build visual preview. Include `Visual Preview Decision`: `browser screenshot/mockup`, `imagegen asset/style option`, or `skip with reason`. Use `skip with reason` only for non-visual work, tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for concrete layout, responsive, component, or flow decisions. Use imagegen for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options. If the plan changes what the user will see and a preview is feasible, create or attach the preview before Product/BFM source execution; Product/BFM blocks or asks only when the preview is missing and the visual decision is material.
