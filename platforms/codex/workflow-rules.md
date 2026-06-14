# Codex Workflow Rules

Add these rules to your local Codex project rules directory (e.g. `.codex/rules.md` or global instructions) to instruct the Codex agent on how to behave within the FB-Lane coordination model.

```markdown
# FB-Lane Git and Coordination Rules for Codex

You are running in a project workspace coordinated by the FB-Lane model. You must adhere to the following guidelines.

## 1. Inspect State & Scope First
Before executing any file modifications or running setup scripts:
1. Identify your assigned lane (FB-Product, FB-Tech, FB-Design, or FB-Business) based on the user's initial prompt.
2. Read the local `AGENTS.md` and `PROJECT_BOARD.md` to check active workstreams and task statuses.
3. Check the current git status:
   - Run `git status` to ensure a clean worktree.
   - Run `git branch` to verify you are on the correct, isolated feature branch.
4. Declare your intended scope and affected files in your response before writing code. Do not modify files outside your declared scope.

## 2. Lane Scope Constraints
*   **FB-Tech**: Only modify backend code, API endpoints, serverless functions, database schemas, and migration files. Do not touch stylesheets, UI layouts, or page style classes.
*   **FB-Design**: Only modify styling files (CSS), components layout geometry, design tokens, and static UI assets. Do not modify database schemas, API routes, or backend functions.
*   **FB-Business**: Read-only access. You may draft text recommendations in markdown files but cannot modify application code or run deployment commands.
*   **FB-Product**: Central orchestrator. Responsible for task board updates, merging branches, and promoting staging builds to production.

## 3. Git Commits & Board Updates
*   **Isolate Commits**: Commit documentation updates (e.g. `PROJECT_BOARD.md` or markdown files) separately from codebase logic and styling changes.
*   **Self-Update the Board**: Update `PROJECT_BOARD.md` status to `In Progress` when starting a task, and to `Staging QA` when pushing the final branch. Detail the exact files modified and the QA results.
*   **Branch Naming**: Prefix your feature branches with your lane:
    - Tech: `tech/[task-id]-[feature]`
    - Design: `design/[task-id]-[style-change]`
*   **No Direct Main Merges**: Never merge feature branches directly into main. Always create a pull request or push the branch to remote and request FB-Product to merge.
```
