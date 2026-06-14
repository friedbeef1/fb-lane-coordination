# FB-Lane on Codex

Codex is a local developer agent that operates directly on your filesystem and git workspace. It excels at codebase audits, local compilation checks, and terminal automation. To coordinate multiple Codex threads working on the same project, the FB-Lane model relies on strict **branch isolation** and local **project board tracking**.

## The Problem This Solves in Codex
As a local, filesystem-active developer agent, Codex is prone to:
* **Merge Collisions**: If multiple Codex runs execute in the same workspace without branch isolation, they will overwrite each other's changes, corrupting the code state.
* **Dirty Git Logs**: Mixing project board tracking updates, markdown notes, and source code edits in a single commit makes PR reviews extremely difficult.
* **Scope Creep & Code Bleed**: Without rigid boundary constraints, a Codex run might aggressively modify stylesheets, schemas, and config files all in one go to solve a minor issue, introducing regressions.

**How FB-Lane fixes this:**
* **Mandatory Feature Branches**: Enforces the checkout of isolated branches (`tech/[feature]` or `design/[feature]`).
* **Atomic Documentation Commits**: Enforces committing `PROJECT_BOARD.md` updates separately from code changes.
* **Rigid Code Boundaries**: Prevents the agent from editing files or directories outside its assigned role (e.g., Tech lane cannot modify `.css` files).
* **Simulated Tool Sandboxing**: Enforces role restrictions in Codex's system instructions (e.g. `.codex/rules.md`), strictly prohibiting the agent from running write/deploy commands or modifying files outside its domain (such as keeping `FB-Business` read-only).

## Coordination Concept
Since Codex is a developer-centric CLI agent, its coordination model is built entirely around standard Git workflows and the local `PROJECT_BOARD.md`:

```
                    +--------------------+
                    |  PROJECT_BOARD.md  | (Local source of truth)
                    +---------+----------+
                              |
      +-----------------------+-----------------------+
      | (Tech Branch)         | (Design Branch)       | (Read-Only Copy)
      v                       v                       v
+-----+------+          +-----+------+          +-----+------+
| Codex as   |          | Codex as   |          | Codex as   |
| FB-Tech     |          | FB-Design   |          | FB-Business |
+------------+          +------------+          +------------+
```

1. **Board Claims**: Codex reads `PROJECT_BOARD.md` before writing code, claims a task by setting status to `In Progress`, and checks out a feature branch.
2. **Strict Git Isolation**: Codex creates a `tech/[feature]` or `design/[feature]` branch to isolate logic edits from styling edits.
3. **Separate Documentation Commits**: Updates to `PROJECT_BOARD.md` and documentation are committed separately from application code changes to keep diffs clean.
4. **Staging Gates**: Codex builds and tests the staging environment before handing off to the Integration Captain for merging.

---

## Setting Up Codex Rules
To configure Codex:
1. Copy [templates/AGENTS.md](../../templates/AGENTS.md) and [templates/PROJECT_BOARD.md](../../templates/PROJECT_BOARD.md) to your project root.
2. Copy [workflow-rules.md](workflow-rules.md) content into your Codex project instructions (e.g. inside `~/.Codex/rules/` or in your local workspace `.codex/rules.md`).
3. Commit `AGENTS.md` and the template `PROJECT_BOARD.md` to your repository:
   ```bash
   git add AGENTS.md PROJECT_BOARD.md
   git commit -m "docs: bootstrap FB-Lane agent coordination rules and project board"
   ```

---
## Operational Loop: Working with Codex

When working with Codex, the user can spin up concurrent terminal/file agent runs. While the user coordinates overall prioritization and staging merges as **FB-Product**, they can initiate concurrent tasks directly with Codex in **FB-Tech**, **FB-Design**, or **FB-Business** modes:


### Step 1: Task Initialization & File Locking
Before starting any coding task, Codex autonomously runs its pre-flight loop:
1. **Pre-flight Check**: Verifies workspace git status and reads `PROJECT_BOARD.md` to ensure target files/screens are not locked.
2. **Branch & Lock**: Checks out the isolated feature branch (e.g., `tech/TASK-002-logic`) and updates the board status to `In Progress` with the declared file locks, committing the board separately.

### Step 2: Implement & Test (Concurrent Execution)
*   Implement changes strictly within the lane scope. 
*   *Codex threads can run concurrently on different branches as long as they are working on separate tasks and non-overlapping locked resources.*
*   Run local test suites (e.g. `npm run check`, `npm run test`, or equivalent test runners) to confirm logic compiles and is correct.
*   If modifying UI, perform a **Visual QA Audit**:
    - Verify text containment across mobile/desktop viewports (zero text clipping or overflow).
    - Ensure aesthetic integrity (brand fonts and styling colors load correctly).

### Step 3: Staging QA & Merge
1. **Push & Staging QA**: Codex pushes the feature branch to the remote, updates the task on `PROJECT_BOARD.md` to `Staging QA` (documenting the modified files and checking off the QA checklist), and commits/pushes the board update in a separate, clean commit.
2. **Product Merge**: `FB-Product` (Integration Captain) reviews the staging environment, merges the branch to `main`, and removes the resource locks (marking the task `Done` on the board).
