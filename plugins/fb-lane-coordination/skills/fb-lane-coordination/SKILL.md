---
name: fb-lane-coordination
description: Coordinates task claiming, staging submissions, and merges on the project board using the fb-lane CLI tool.
---

# FB-Lane Task Coordination Skill

## Overview
This skill manages task lifecycles, git branches, and resource locks using the local `tools/fb-lane.cjs` command-line utility. In Codex, prefer the bundled MCP tools when available and use the CLI as the reliable fallback for status, claim, submit, merge, bootstrap, and setup health checks. For non-trivial tasks, Product/BFM keeps one canonical Goal Alignment block in `PROJECT_BOARD.md` with `Working Goal`, `Success Measure`, and `Gate / Review Point`; lanes use compact goal-alignment fields in handoffs, and Product records any goal change in place.

## Preconditions
- The workspace must have `PROJECT_BOARD.md` and `tools/fb-lane.cjs` initialized (use `project-coordination-setup` skill to initialize if missing).
- The agent must have permission to run `run_command` to execute node scripts.

---

## Workflow Commands

### 1. View Active Tasks & Locks
When asked to show the board status, active locks, or workstream listings, execute:
```bash
node tools/fb-lane.cjs status
```

If setup appears incomplete or the user reports that the plugin is not smooth, run the read-only health check:

```bash
node tools/fb-lane.cjs doctor
```

For Codex-only project setup, avoid writing Claude or Antigravity artifacts:

```bash
node tools/fb-lane.cjs bootstrap --platform codex
```

### 2. Claim a Task
When claiming a task (e.g. `TASK-102`) for a specific lane (e.g., `Tech`, `Design`, `Business`) and locking specific files (e.g., `src/auth.ts, src/db.ts`):
1. Execute the claim command:
   ```bash
   node tools/fb-lane.cjs claim <task-id> <lane> "[locked_files]"
   ```
   *Example*: `node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts, src/db.ts"`
2. Verify that the command succeeds, which checks out the feature branch, locks the files on the board, and commits the board update separately.
3. Note: The CLI claim command also automatically writes task context to `.codex/current_task.md` for local editors.
4. For non-trivial tasks, confirm the board item has one canonical Goal Alignment block (`Working Goal`, `Success Measure`, `Gate / Review Point`) before implementation begins.

### 3. Submit a Task for Staging QA
When a task's implementation is complete and ready for review:
1. Execute the submit command:
   ```bash
   node tools/fb-lane.cjs submit <task-id> "[staging_url]"
   ```
   *Example*: `node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"`
2. **Pre-Submission Testing**: This command automatically detects and runs `npm test` before committing/pushing. If tests fail, it exits with error code `1` and blocks submission.
3. **Bypass Flag**: To bypass tests temporarily, add the `--no-tests` flag:
   ```bash
   node tools/fb-lane.cjs submit <task-id> "[staging_url]" --no-tests
   ```

### 4. Merge & Complete a Task (Product Merge)
When a task has passed staging verification and is ready to be merged:
1. Execute the merge command:
   ```bash
   node tools/fb-lane.cjs merge <task-id>
   ```
   *Example*: `node tools/fb-lane.cjs merge TASK-102`
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

## Goal Alignment Notes

Use lightweight goal alignment for non-trivial handoffs only. Do not create extra ceremony for micro quick tasks.

- Product/BFM owns one canonical Goal Alignment block per task in `PROJECT_BOARD.md`, ideally with `Working Goal`, `Success Measure`, and `Gate / Review Point`.
- Good: `Working Goal: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Working Goal: finish the feature.`
- Lane handoffs stay compact and use a real heading:
  ```md
  ## Goal Alignment

  Goal Alignment: aligned | suggest change: <proposed goal> | blocked by goal ambiguity: <reason>
  Goal Challenge / Caveat: <real caveat> | No caveat identified
  Evidence Against Goal: <lane evidence that proves, weakens, or blocks the current goal>
  ```
- If Product changes the goal after reconciliation, record: `Goal changed from X to Y because Z.`
