---
name: fb-lane-coordination
description: Coordinates task claiming, staging submissions, and merges on the project board using the fb-lane CLI tool.
---

# FB-Lane Task Coordination Skill

## Overview
This skill allows the Antigravity agent to manage task lifecycles, git branches, and resource locks autonomously using the local `tools/fb-lane.js` command-line utility. By running this CLI utility, the agent performs all git checkouts, commits, pushes, and project board markdown updates with zero external tool dependencies, saving token space compared to registering full MCP server protocols.

## Preconditions
- The workspace must have `PROJECT_BOARD.md` and `tools/fb-lane.js` initialized (use `project-coordination-setup` skill to initialize if missing).
- The agent must have permission to run `run_command` to execute node scripts.

---

## Workflow Commands

### 1. View Active Tasks & Locks
When asked to show the board status, active locks, or workstream listings, execute:
```bash
node tools/fb-lane.js status
```

### 2. Claim a Task
When claiming a task (e.g. `TASK-102`) for a specific lane (e.g., `Tech`, `Design`, `Business`) and locking specific files (e.g., `src/auth.ts, src/db.ts`):
1. Execute the claim command:
   ```bash
   node tools/fb-lane.js claim <task-id> <lane> "[locked_files]"
   ```
   *Example*: `node tools/fb-lane.js claim TASK-102 Tech "src/auth.ts, src/db.ts"`
2. Verify that the command succeeds, which checks out the feature branch, locks the files on the board, and commits the board update separately.
3. Note: The CLI claim command also automatically writes task context to `.codex/current_task.md` for local editors.

### 3. Submit a Task for Staging QA
When a task's implementation is complete and ready for review:
1. Execute the submit command:
   ```bash
   node tools/fb-lane.js submit <task-id> "[staging_url]"
   ```
   *Example*: `node tools/fb-lane.js submit TASK-102 "https://staging.example.com"`
2. **Pre-Submission Testing**: This command automatically detects and runs `npm test` before committing/pushing. If tests fail, it exits with error code `1` and blocks submission.
3. **Bypass Flag**: To bypass tests temporarily, add the `--no-tests` flag:
   ```bash
   node tools/fb-lane.js submit <task-id> "[staging_url]" --no-tests
   ```

### 4. Merge & Complete a Task (Product Merge)
When a task has passed staging verification and is ready to be merged:
1. Execute the merge command:
   ```bash
   node tools/fb-lane.js merge <task-id>
   ```
   *Example*: `node tools/fb-lane.js merge TASK-102`
2. This command merges the branch into `main`, releases the locks, sets status to `Done` on `PROJECT_BOARD.md`, commits, pushes `main`, and deletes the feature branch.

### 5. Autonomous Debugging, Retry Limits & Auto-Proceed
When executing code updates and running test/lint commands:
1. **Auto-Fixing Loop**: If a test/compilation run fails, analyze the stderr logs, make code adjustments, and rerun the tests locally.
2. **Token Burn Protection (5-Retry Cap)**: Limit your debugging iterations to a maximum of **5 retries** per task to prevent token waste in infinite loops.
3. **Escalation**: If tests still fail after the 5th attempt:
   - Stash or commit the current changes.
   - Update the task status in `PROJECT_BOARD.md` to `Blocked` (marked as `Blocked - Debug Retry Limit Exceeded`), appending the current failure logs.
   - Notify the user of the blockage.
4. **Auto-Proceed Loop**: Immediately scan the `PROJECT_BOARD.md` `Ready` queue and claim the **next independent task** (verifying that it does not edit locked files or depend on the blocked task). Checkout a new branch for the new task and continue development.
