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

For non-trivial tasks, the bootstrap must leave one approved OKR tree slot on the board: a Product/workstream OKR (`Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, `Justification`) plus stable lane OKRs where relevant. Handoffs use compact `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` fields. Product/BFM owns OKR reconciliation and changes OKRs only after discussion and explicit user approval.
For BFM/all-handoff processing, Product must also leave the return loop: every handoff is `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`, and board/source/docs/tests agree before closeout.

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

### 1. Lane Scopes & Boundaries
- **FB-Product (PM / Integration User Value)**: Owns final product decisions, the approved Product/workstream OKR and relevant stable lane OKRs, task prioritization, scoping, BFM launch, staging/live deployments, and release gates. Prioritizes the backlog on the project board, sequencing tasks based on OKR alignment and value-vs-effort mix. Product is read-only on application/source code and may write coordination markdown only.
- **FB-Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, security rules, and functional test suites. *Does not make styling, layout geometry, or visual changes.*
- **FB-Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
- **FB-Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only code capacity.*
- **The User (Supervisor / Reviewer)**: Gives instructions to Product or directly to specific lanes, and reviews staging outputs. The Product agent prompts the user for approval before promoting backlog items to Ready.

### 2. The Board Loop & Resource Locking
- `PROJECT_BOARD.md` in the project root is the source of truth.
- **Plan First / BFM Claim & Lock**: Product scopes the item; workstreams write markdown plans or handoffs instead of editing source. BFM execution workers claim task/files in `PROJECT_BOARD.md` only after Product launches execution. For non-trivial tasks, Product reads existing approved OKRs first, proposes only missing Product/workstream or lane OKRs needed for clarity, and records or changes them only after the user explicitly approves before execution moves to `In Progress` with declared Affected Screens and Locked Files.
- **Push & QA**: When complete, BFM execution workers push feature branches (e.g. `bfm/[task]`, `tech/[task]`, or `design/[task]`), update board status to `Staging QA`, and list modified files/QA checks.
- **Handoff, Unlock & Clean**: Product reviews staging, reconciles `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` from lane handoffs, proposes aligned alternatives when work conflicts with approved OKRs, merges the branch, removes resource locks (marking the task `Done`), and notifies the lane thread. The lane agent (or developer) then performs a local clean-up, deleting the local feature branch.

### 3. Safety & Git Hygiene
- **Never commit directly to main**. All work goes through feature branches.
- **Commit Docs Separately**: Commit updates to `PROJECT_BOARD.md` and documentation files in separate commits from codebase logic and styling changes.
- **Product Direction / BFM Execution**: If tests, builds, Git staging, or browser verification hang in Product, stop the retry loop, record `pending-gate` or `blocked` with evidence, and return execution to BFM sequencing.
- **Rejection & Rectification**: If Product rejects a branch due to failing test suites, visual QA issues, or strategic misalignment, Product marks the task `Blocked` or `Rejected` on `PROJECT_BOARD.md` (attaching the failure logs) and alerts the user and the lane agent. The lane agent then resolves the bugs locally on its feature branch until all tests pass before resubmitting. If the changes are permanently rejected, Product closes the PR, deletes the feature branch, and removes the task and resource locks from the board.
```

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
- Product/BFM owns one approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream OKR with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`, plus stable lane OKRs where relevant.
- Mini-loops produce evidence against existing lane OKRs; they do not create new OKRs.
- OKRs are added or changed only after discussion and explicit user approval.
- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`
- Lane handoffs stay compact and use a real heading:
  ```md
  ## Goal Alignment Session

  Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
  Mini-loop Evidence: <lane evidence from its smallest real verification loop>
  Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
  ```

### BFM Return Loop
- Every processed handoff is marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
- Product/BFM returns to board, handoffs, source/docs/tests, lane status, and git status before closeout.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded.
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
