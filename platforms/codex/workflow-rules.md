# Codex Workflow Rules

Add these rules to your local Codex project rules directory (e.g. `.codex/rules.md` or global instructions) to instruct the Codex agent on how to behave within the FB-Lane coordination model.

```markdown
# FB-Lane Git and Coordination Rules for Codex

You are running in a project workspace coordinated by the FB-Lane model. You must adhere to the following guidelines.

## 1. Inspect State & Scope First
Before executing any file modifications or running setup scripts:
1. Identify your assigned lane (FB-Product, FB-Tech, FB-Design, or FB-Business) based on the user's initial prompt.
2. Read the local `AGENTS.md` and `PROJECT_BOARD.md` to check active workstreams, task statuses, and **resource locks**. Ensure your target files/screens are not locked by other active tasks.
3. For handoff work, read `docs/handoffs/index.md` for routing and `docs/workstreams/<lane>.md` for lane revisit status before opening detailed handoffs.
4. Check the current git status:
   - Run `git status` to ensure a clean worktree.
   - Run `git branch` to verify you are on the correct, isolated feature branch.
5. Declare your intended scope, affected screens, and files in your response before writing code. Do not modify files outside your declared scope or locked by other threads.

## 2. Lane Scope Constraints
*   **FB-Tech**: Only modify backend code, API endpoints, serverless functions, database schemas, and migration files. Do not touch stylesheets, UI layouts, or page style classes.
*   **FB-Design**: Only modify styling files (CSS), components layout geometry, design tokens, and static UI assets. Do not modify database schemas, API routes, or backend functions.
*   **FB-Business**: Read-only access. You may draft text recommendations in markdown files but cannot modify application code or run deployment commands.
*   **FB-Product**: Direction and integration owner. Responsible for task scoping, sequencing, board goal updates, merge gates, staging/live decisions, and releasing resource locks. Product is read-only on application/source code and may write coordination markdown only.
*   **All Workstreams**: Plan-only by default. You may ask questions, inspect context, and write markdown plans/handoffs. Do not edit source, branch, commit, submit, merge, deploy, or change provider state from ordinary workstream chat. Source changes happen only inside a Product-launched BFM execution run.
*   **Explicit Plan Phrase Gate**: If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, confirm whether to prepare the Product/BFM handoff or execute here as an explicit one-off exception before editing source.
*   **Workstream Status Cards**: `docs/workstreams/<lane>.md` is a compact revisit summary. Product/BFM first updates the detailed handoff with `## Product/BFM Closeout`, then updates the card after executing or explicitly deferring a lane handoff. Do not put full OKRs, QA logs, plans, rationale, or implementation detail there.
*   **Story Split Pass**: Before BFM prioritizes, Product/BFM decides whether the run should be split into smaller stories. Split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work; otherwise say `No split needed`.
*   **Proactive Loop Hardening**: If repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework appears, Product/BFM proposes one small guardrail with cost, benefit, affected files/rules, and approval needed before changing the process. Skip one-off or low-impact issues.

## 3. Git Commits & Board Updates
*   **Isolate Commits**: Commit documentation updates (e.g. `PROJECT_BOARD.md` or markdown files) separately from codebase logic and styling changes.
*   **BFM Updates the Board**: Workstreams propose board/handoff changes in markdown. During approved execution, the BFM execution worker updates `PROJECT_BOARD.md` status to `In Progress`, declares Affected Screens and Locked Files, and later records `Staging QA`, modified files, and QA results.
*   **Runner Hangs**: If tests, builds, browser checks, `git add`, or `.git/*.lock` files stall Product/BFM, record `pending-gate` or `blocked` with exact evidence instead of patching from ordinary workstream chat.
*   **Branch Naming**: Prefix your feature branches with your lane:
    - Tech: `tech/[task-id]-[feature]`
    - Design: `design/[task-id]-[style-change]`
*   **No Direct Main Merges**: Never merge feature branches directly into main. Always create a pull request or push the branch to remote and request FB-Product to merge.
```
