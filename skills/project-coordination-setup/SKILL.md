---
name: project-coordination-setup
description: >-
  Bootstraps a project with the product-agnostic four-lane multi-agent coordination model,
  PROJECT_BOARD.md template, and registers the FB-Product, FB-Tech, FB-Design,
  and FB-Business subagents.
---

# Project Coordination Bootstrapper

## Overview
This skill instantiates the **Four-Lane Multi-Thread Coordination Model** in any software project directory (SaaS, backend API, mobile/web app, dev tool, etc.). It sets up the project board, updates configuration files safely, and registers specialized subagents to coordinate creative design, technical engineering, and product orchestration without context bleeding.

For non-trivial work, the bootstrap must leave an approved OKR tree slot on the board: a Product/workstream or BFM-target OKR (`Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, `Justification`) plus stable lane OKRs where relevant. Handoffs use compact `Product Goal`, `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` fields. Product/BFM owns OKR reconciliation and changes OKRs only after discussion and explicit user approval; do not generate a fresh OKR for every task. Bootstrap also creates `docs/handoffs/index.md` so agents discover handoffs through a compact routing table before opening detailed files; `PROJECT_BOARD.md` is truth, the index is routing, `docs/workstreams/<lane>.md` cards are revisit summaries, and detailed handoffs are detail.
Bootstrap creates `docs/workstreams/fb-product.md`, `docs/workstreams/fb-tech.md`, `docs/workstreams/fb-design.md`, and `docs/workstreams/fb-business.md`. Product/BFM updates the detailed handoff with `## Product/BFM Closeout`, then refreshes the relevant card after executing or explicitly deferring a lane handoff. Worker lanes read the board, handoff index, then their card before opening detailed handoffs. Cards must stay compact and not contain full OKRs, QA logs, plans, rationale, copy variants, or implementation detail.
For BFM/all-handoff processing, Product must also leave the return loop: a five-lane handoff ledger checks `FB-Lane`, `FB-Product`, `FB-Tech`, `FB-Design`, and `FB-Business`; every matching handoff is `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`; missing lane handoffs are recorded as `no handoff found`; board/source/docs/tests agree before closeout; and the closeout includes one health flag: `healthy`, `watch`, `needs Product review`, or `blocked`.

Bootstrap guidance must also include objective mode selection: default to normal/simple coding unless the objective mentions coordination triggers. Use FB-Lane light for handoffs, board/lane/BFM/Product/Design/Business mentions, coordination files, board locks, multiple threads/agents/workstreams, or durable context. Escalate to Product/BFM for build/sequence/defer/approve/merge/release decisions, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets/deploy/staging/live, camera/capture/save/export or another core product flow, or multiple lane outputs that must be reconciled before source changes.

Bootstrap guidance must include awareness, isolation, integration: `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup; branches/worktrees isolate execution like separate desks; BFM integrates outcomes like Product/release review. Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.

Bootstrap guidance must include the BFM Visible Card and Approval Fix: before execution BFM shows a visible card snapshot; if approval is missing, pending, stale, changed, or unclear, BFM stops and asks; after action BFM summarizes the card outcome.

Bootstrap guidance must include Story Split Pass, Dependency And Lock Pass, Unblocked Sequence, and Recheck Before Claim: before BFM prioritizes, decide whether the run should be split into smaller stories; split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work, or say `No split needed`; classify each five-lane ledger item or child story from status, owner, locks, dependencies, blockers, gates, approval, and required checks as exactly one of `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`; execute only `ready now`; do not claim/touch files locked by another active lane; split unlocked work or defer with the blocking task named; stop with a next unblock action if everything is blocked; rerun lane status immediately before claiming/editing and resequence if locks changed.

Bootstrap guidance must include Proactive Loop Hardening: when Product/BFM sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework, it proposes one small guardrail with observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed. It must not silently change the process and should skip one-off or low-impact issues.

Bootstrap guidance must include optional eval scorecards: when `Loop Learning` chooses `propose eval`, create a small Markdown scorecard under `docs/evals/` with sections for non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules without explicit approval.

Bootstrap guidance must include approval autonomy phases: start with Phase 1 Shadow Approval where Product/BFM asks the user but records `Would self-approve: yes/no`; Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate. The user approves phase changes. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.

Bootstrap guidance must include Product/BFM execution continuation: once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. It reports after closeout rather than asking before each routine step, while still stopping for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.

Bootstrap guidance must include frontend visual planning: frontend/UI plans and handoffs include `Visual Preview Decision` with `skip`, `browser screenshot/mockup`, or `imagegen asset/style option`. Skip tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for actual UI layout, responsive, component, or flow decisions. Use imagegen only for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options where generated bitmap exploration helps. If visual uncertainty is meaningful, Product/BFM includes or requests the visual artifact before source execution so the user can adjust the plan.

## Dependencies
None.

## Quick Start
To bootstrap a workspace, run through the **Execution Steps** in the Workflow below.

---

## Workflow

### Phase 1: Inspect the Environment
1.  **Check for Existing Files**: Inspect the root directory of the project for:
    -   `AGENTS.md`
    -   `PROJECT_BOARD.md`
    -   `docs/agents/`
2.  **Read Existing Configs**: If `AGENTS.md` or `PROJECT_BOARD.md` exist, **DO NOT overwrite them**. Read their contents to understand the current project-specific rules, plugins, or active milestones.

### Phase 2: Merge or Create AGENTS.md
*   **Case A: AGENTS.md does NOT exist**: Create it using the template below.
*   **Case B: AGENTS.md exists**: Append the **FB-Lane Coordination Rules** section to the end of the file, preserving all original content.

#### **AGENTS.md Template / Append Block:**
```markdown
## FB-Lane Coordination Rules

This project uses the standard **FB-Lane Four-Lane Coordination Model** to enable safe concurrent development.

### 0. Mode Selection Trigger Rule
- Default to normal/simple coding for one-thread work with no listed coordination trigger.
- Use FB-Lane light for handoffs, board/lane/BFM/Product/Design/Business mentions, coordination files, board locks, multiple threads/agents/workstreams, or durable context. Keep quick tasks lightweight.
- Escalate to Product/BFM for build/sequence/defer/approve/merge/release decisions, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets/deploy/staging/live, camera/capture/save/export or another core product flow, or multiple lane outputs that must be reconciled before source changes.

### 1. Lane Scopes & Boundaries
- **FB-Product (PM / Integration User Value)**: Owns final product decisions, the approved Product/workstream OKR and relevant stable lane OKRs, task prioritization, scoping, BFM launch, staging/live deployments, and release gates. Prioritizes the backlog on the project board, sequencing tasks based on OKR alignment and value-vs-effort mix. Product is read-only on application/source code and may write coordination markdown only.
- **FB-Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, security rules, and functional test suites. *Does not make styling, layout geometry, or visual changes.*
- **FB-Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
- **FB-Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only code capacity.*
- **The User (Supervisor / Reviewer)**: Gives instructions to Product or directly to specific lanes, and reviews staging outputs. The Product agent prompts the user for approval before promoting backlog items to Ready.

### 2. The Board Loop & Resource Locking
- `PROJECT_BOARD.md` in the project root is the source of truth.
- **Plan First / BFM Claim & Lock**: Product scopes the item; workstreams write markdown plans or handoffs instead of editing source. If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, the lane confirms whether to prepare the Product/BFM handoff or execute there as an explicit one-off exception before editing source. BFM execution workers claim task/files in `PROJECT_BOARD.md` only after Product launches execution. For non-trivial tasks, Product reads existing approved OKRs first, proposes only missing Product/workstream or lane OKRs needed for clarity, and records or changes them only after the user explicitly approves before execution moves to `In Progress` with declared Affected Screens and Locked Files.
- **Pre-Execution Card Snapshot**: Before BFM claims files, edits, deploys, or completes work, show card ID, status, lane/owner, area, scope, locks, linked handoffs, blockers, gates, checks, branch/PR/staging URL if known, intentional dirty state, and goal details: objective, key results, definition of done, approval state, and justification.
- **Goal Approval Gate**: If multiple cards match, show candidates and recommend one. If approval is missing, pending, stale, changed, or unclear, stop and ask. No claiming files, edits, deploys, or completion before approval.
- **Push & QA**: When complete, BFM execution workers push feature branches (e.g. `bfm/[task]`, `tech/[task]`, or `design/[task]`), update board status to `Staging QA`, and list modified files/QA checks.
- **Post-Action Card Summary**: After BFM acts, summarize card ID, final status, changed files, checks run, remaining gates, next owner, and whether live deploy is still blocked.
- **Workstream Status Card**: After Product/BFM executes or explicitly defers a lane handoff, update `docs/workstreams/<lane>.md` with `Last Updated`, `Lane`, `Current Summary`, `Already Executed By Product/BFM`, `Still Pending / Blocked`, and `Evidence Links`.
- **Frontend Visual Planning**: Frontend/UI plans and handoffs include `Visual Preview Decision`: `skip`, `browser screenshot/mockup`, or `imagegen asset/style option`. Skip tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for actual UI layout, responsive, component, or flow decisions. Use imagegen only for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options where generated bitmap exploration helps. If visual uncertainty is meaningful, Product/BFM includes or requests the visual artifact before source execution.
- **Five-Lane Handoff Ledger**: For BFM/all-handoff processing, check `FB-Lane`, `FB-Product`, `FB-Tech`, `FB-Design`, and `FB-Business` before sequencing. Name matching handoff files or show `no handoff found`; do not silently skip a lane.
- **Story Split Pass**: Before prioritizing, decide whether the run should be split into smaller stories. Split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work; otherwise say `No split needed`.
- **Dependency And Lock Pass**: For each five-lane ledger item or child story, capture status, owner, locks, dependencies, blockers, gates, approval, and required checks. Classify it as exactly one of `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`.
- **Unblocked Sequence**: Execute only `ready now`. Do not claim or touch files locked by another active lane. If work overlaps locked files, split independent unlocked work or defer with the blocking task named. If everything is blocked, stop with the recommended next unblock action.
- **Recheck Before Claim**: Rerun lane status immediately before claiming or editing. If locks changed, resequence instead of using stale assumptions.
- **Isolated Execution Naming**: Before source execution, workers read board/status/locks and the relevant handoff index. During isolated work, they name the task, branch/worktree, lane, and locked files.
- **Handoff, Unlock & Clean**: Product reviews staging, reconciles `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` from lane handoffs, proposes aligned alternatives when work conflicts with approved OKRs, merges the branch, removes resource locks (marking the task `Done`), and notifies the lane thread. Closeout names whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty, plus external-service cleanup evidence when tests created provider records/resources.
- **Proactive Loop Hardening**: When repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework appears, Product/BFM proposes one small guardrail with observed pattern, cost, benefit, affected files/rules, and approval needed before changing the process. Skip one-off or low-impact issues.
- **Optional Eval Scorecards**: When `Loop Learning` chooses `propose eval`, create a small Markdown scorecard under `docs/evals/` with sections for non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules without explicit approval.
- **Approval Autonomy Phases**: Start with Phase 1 Shadow Approval. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams can mark `safe to auto-accept`, but Product/BFM owns actual self-approval and never self-approves risky surfaces.
- **Execution Continuation**: Once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. Report after closeout instead of asking before each routine step, while still stopping for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.

### 3. Safety & Git Hygiene
- **Never commit directly to main**. All work goes through feature branches.
- **Commit Docs Separately**: Commit updates to `PROJECT_BOARD.md` and documentation files in separate commits from codebase logic and styling changes.
- **Product Direction / BFM Execution**: If tests, builds, Git staging, or browser verification hang in Product, stop the retry loop, record `pending-gate` or `blocked` with evidence, and return execution to BFM sequencing.
- **Rejection & Rectification**: If Product rejects a branch due to failing test suites, visual QA issues, or strategic misalignment, Product marks the task `Blocked` or `Rejected` on `PROJECT_BOARD.md` (attaching the failure logs) and alerts the user and the lane agent. The lane agent then resolves the bugs locally on its feature branch until all tests pass before resubmitting. If the changes are permanently rejected, Product closes the PR, deletes the feature branch, and removes the task and resource locks from the board.
```

### Phase 2b: Create Workstream Status Cards
Create `docs/workstreams/` with one compact card per lane:

- `docs/workstreams/fb-product.md`
- `docs/workstreams/fb-tech.md`
- `docs/workstreams/fb-design.md`
- `docs/workstreams/fb-business.md`

Each card uses only:

```markdown
Last Updated:
Lane:
Current Summary:
Already Executed By Product/BFM:
Still Pending / Blocked:
Evidence Links:
```

Cards are summaries only. Do not put full OKRs, QA logs, plans, rationale, copy variants, or implementation detail there.

### Phase 3: Create PROJECT_BOARD.md
If `PROJECT_BOARD.md` does not exist, create it with the following structure:
```markdown
# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Features deployed to staging, awaiting visual/functional verification.
- `Done`: Checked, verified, and merged to production by FB-Product.

## Active Workstreams
| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Ready | FB-Product | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) \| [PR #1](https://github.com/example/repo/pull/1) |

### TASK-001 - Project Setup & Bootstrap
*   - Status: Ready
*   - Owner / Thread: FB-Product
*   - Area: Setup
*   - Scope: Create initial files, initialize repository layout.
*   - Out of Scope: Writing application business logic.
*   - Goal Alignment Session:
*       - Objective: Bootstrap FB-Lane safely so future non-trivial tasks have a stable approved Product/workstream OKR, relevant lane OKRs, clear locks, and durable handoffs.
*       - Key Results:
*           - Board, rules, CLI, and handoff folder exist.
*           - `doctor` reports no blocking setup errors.
*       - Definition of Done: The board, rules, CLI, and handoff folder are present and ready for lane claims.
*       - Gate / Review Point: Product confirms setup is ready to move into the first non-trivial task.
*       - Approval: approved
*       - Justification: Setup work needs a small approved Product/workstream OKR so future lanes can see the expected coordination baseline.
*   - Affected Screens / Locks:
*       - Screens: (None)
*       - Locked Files: `AGENTS.md`, `PROJECT_BOARD.md`
*   - Links & Deliverables:
*       - Git Branch / PR: [Branch Link](https://github.com/example/repo/tree/main)
*       - Staging URL: [Staging Link](https://staging.example.com)
*   - QA Checklist:
*       - [x] AGENTS.md created or updated
*       - [x] PROJECT_BOARD.md created
*       - [x] Subagents defined

### Goal Alignment Session (non-trivial tasks only)
- Product/BFM owns the approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream or BFM-target OKR with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`, plus stable lane OKRs where relevant.
- `/goal` is a Product/BFM shortcut into this same Goal Alignment Session. It shows, creates, clarifies, or asks approval for the current goal; it must not create a second goal system or a separate `/goals` flow. Workstream chats do not own `/goal`; they propose or challenge goal fit in their handoff.
- Mini-loops produce evidence against existing lane OKRs; they do not create new OKRs.
- OKRs are added or changed only after discussion and explicit user approval. Do not generate a fresh OKR for every task.
- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`
- Lane handoffs stay compact and use a real heading:
  ```md
  ## Goal Alignment Session

  Product Goal: <existing approved Product/workstream goal, if known>
  Workstream Goal: <plain-language lane contribution for Product/user approval>
  Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
  User Approval Needed: yes | no
  Mini-loop Evidence: <lane evidence from its smallest real verification loop>
  Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
  ```

### BFM Return Loop
- Every processed handoff is marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
- Every BFM/all-handoff run checks `FB-Lane`, `FB-Product`, `FB-Tech`, `FB-Design`, and `FB-Business`; lanes without matching handoffs are recorded as `no handoff found`.
- Story Split Pass: before prioritizing, decide whether to split into smaller stories; split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work, or say `No split needed`.
- Dependency And Lock Pass: classify each five-lane ledger item or child story from status, owner, locks, dependencies, blockers, gates, approval, and required checks as exactly one of `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`.
- Unblocked Sequence: execute only `ready now`; split independent unlocked work, defer locked overlap with the blocking task named, or stop with the recommended next unblock action when everything is blocked.
- Recheck Before Claim: rerun lane status immediately before claiming or editing; resequence if locks changed.
- Product/BFM returns to board, handoffs, source/docs/tests, lane status, and git status before closeout.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded. Name whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If checks touched external services, also name test mode, created records/resources, cleanup evidence, or the pending cleanup gate.
- Add one loop health flag: `healthy`, `watch`, `needs Product review`, or `blocked`; do not numeric-score the loop.

### Handoff Index
- `PROJECT_BOARD.md` stays the source of truth for current status, sequencing, gates, ownership, and file locks.
- `docs/handoffs/index.md` is the first-read routing table for handoff discovery.
- Use compact index columns: `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`.
- Product/BFM should create or refresh the index before non-quick sequencing when handoffs exist and the lookup layer is missing, stale, or too vague.
- Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.
- Open detailed handoffs only when they are relevant to the active task or Product/BFM closeout.

### Awareness, Isolation, Integration
- `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup.
- Branches/worktrees isolate execution like separate desks.
- BFM integrates outcomes like Product/release review.
- Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.
```

### Phase 4: Register the Subagents
Run the `define_subagent` tool to register the four specialized workstreams in the current workspace using these definitions:

1.  **FB-Product**: PM and Integration User Value Optimizer. Scopes tasks, spawns subagent threads, merges code, runs release gates, and manages deployments.
2.  **FB-Tech**: Tech Lead and Core Developer. Implements backend migrations, serverless functions, security logic, and runs development tests.
3.  **FB-Design**: UI/UX Designer and Layout Auditor. Edits frontend styles, handles page geometry layout, and performs visual audits on staging.
4.  **FB-Business**: Business copywriter and positioning strategist. Focuses on onboarding text, documentation, user-facing messaging, and pricing/marketing copy. (Set `enable_write_tools = false`).

---

## Common Mistakes
-   **Destructive Overwrite**: Overwriting an existing `AGENTS.md` containing custom project variables or Deno/Vite compiler rules. Always read and merge.
-   **Missing Subagent Definitions**: Bootstrapping the Markdown files but forgetting to call `define_subagent` to register the active workstream instances.
