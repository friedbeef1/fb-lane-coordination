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

This project uses the standard four-lane coordination model. Assume other threads or subagents may edit the codebase concurrently.

### 1. Lane Scopes & Boundaries:
- **FB-Product (Product / Captain / Integration)**: Owns final product decisions, task scoping, file merges, staging/live deployments, and release gates. Acts as the central captain.
- **FB-Tech (Technical & Development)**: Owns database schemas, serverless functions, APIs, security/auth hardening, and verifier check suites. *Does not make styling or UI layout changes.*
- **FB-Design (Design & UI/UX)**: Owns CSS styles, design tokens, visual assets, layout geometry, and responsive visual QA. Enforces text containment and typography alignment. *Does not modify backend schemas or core application logic.*
- **FB-Business (Business & Copy)**: Owns copy decks, onboarding flows, user-facing documentation, pricing, and marketing content. Operating in *read-only* code mode.

### 2. The Board Loop:
- `PROJECT_BOARD.md` is the local task tracker.
- Before coding, every subagent must claim or create an item on the board and set status to `In Progress`.
- When done, the subagent moves the status to `Staging QA` and lists the modified files.
- `FB-Product` reviews the changes, runs the verification checks, and moves the item to `Done`.

### 3. Safety & Deployment:
- Feature lanes work in isolated branches (e.g., `tech/[feature]` or `design/[feature]`).
- Do not push directly to main or merge your own branches.
- Staging-first is the default. Do not deploy live without explicit approval.
```

### Phase 3: Create PROJECT_BOARD.md
If `PROJECT_BOARD.md` does not exist, create it with the following structure:
```markdown
# Project Board

## Statuses
- `Inbox`, `Ready`, `In Progress`, `Staging QA`, `Done`

## Active Workstreams
| ID | Status | Owner | Area | Scope | Out Of Scope |
|---|---|---|---|---|---|
| PROJ-001 | Ready | FB-Product | Bootstrap | Coordination setup | Unrelated refactors |

### PROJ-001 - Coordination Setup
- Status: Ready
- Owner / Thread: FB-Product
- Area: Bootstrap
- Scope: Bootstrap coordination files
- Out of scope: Editing codebase logic
- QA checklist:
  - [x] AGENTS.md created or updated
  - [x] PROJECT_BOARD.md created
  - [x] Subagents defined
```

### Phase 4: Register the Subagents
Run the `define_subagent` tool to register the four specialized workstreams in the current workspace using these definitions:

1.  **FB-Product**: PM and Integration Captain. Scopes tasks, spawns subagent threads, merges code, runs release gates, and manages deployments.
2.  **FB-Tech**: Tech Lead and Core Developer. Implements backend migrations, serverless functions, security logic, and runs development tests.
3.  **FB-Design**: UI/UX Designer and Layout Auditor. Edits frontend styles, handles page geometry layout, and performs visual audits on staging.
4.  **FB-Business**: Business copywriter and positioning strategist. Focuses on onboarding text, documentation, user-facing messaging, and pricing/marketing copy. (Set `enable_write_tools = false`).

---

## Common Mistakes
-   **Destructive Overwrite**: Overwriting an existing `AGENTS.md` containing custom project variables or Deno/Vite compiler rules. Always read and merge.
-   **Missing Subagent Definitions**: Bootstrapping the Markdown files but forgetting to call `define_subagent` to register the active workstream instances.
