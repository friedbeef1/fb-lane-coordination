# M-Lane on Codex

Codex is a local developer agent that operates directly on your filesystem and git workspace. It excels at codebase audits, local compilation checks, and terminal automation. To coordinate multiple Codex threads working on the same project, the M-Lane model relies on strict **branch isolation** and local **project board tracking**.

---

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
| M-Tech     |          | M-Design   |          | M-Business |
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
   git commit -m "docs: bootstrap M-Lane agent coordination rules and project board"
   ```

---

## The Codex Developer Loop

### Step 1: Claim Task
Before starting any coding task, Codex must:
1. Verify what branch it is on: `git branch`.
2. Inspect `PROJECT_BOARD.md` to claim a task ID (e.g., `TASK-002`).
3. Create a branch: `git checkout -b tech/TASK-002-logic-update`.
4. Update `PROJECT_BOARD.md` with:
   - Status: `In Progress`
   - Owner: `M-Tech` or `M-Design`
   - Commit the board update separately: `git commit PROJECT_BOARD.md -m "docs: claim TASK-002"`.

### Step 2: Implement & Test
*   Implement changes strictly within the lane scope.
*   Run local test suites (e.g. `npm run check`, `npm run test`, or equivalent test runners) to confirm logic compiles and is correct.

### Step 3: Audit & Handoff
1. Push the branch to remote: `git push origin [branch-name]`.
2. Update `PROJECT_BOARD.md`:
   - Status: `Staging QA`
   - Modified Files: List of changed files.
   - QA Checklist: Mark verified items as checked.
3. Commit and push the project board update.
4. Create a Pull Request and hand the PR link back to `M-Product` (Integration Captain) for review and merging.
