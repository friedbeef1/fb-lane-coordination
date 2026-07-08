---
name: fb-lane-coordination
description: Coordinates task claiming, staging submissions, and merges on the project board using the fb-lane CLI tool.
---

# FB-Lane Task Coordination Skill

## Overview
This skill manages FB-Lane task lifecycles, git branches, and resource locks with the local `tools/fb-lane.cjs` utility. Normal workstream chats stay plan-only: they produce markdown plans or handoffs. Source-changing claims happen only inside Product-launched BFM execution. For non-trivial work, Product/BFM uses the approved Product/workstream or BFM-target OKR in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, and `Justification`; lanes report `Product Goal`, `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` in handoffs.

Default to normal/simple coding when the request is one-thread and has no listed coordination trigger. Use FB-Lane light for handoffs, board/lane/BFM/Product/Design/Business mentions, coordination files, board locks, multiple threads/agents/workstreams, or durable context. Escalate to Product/BFM for build/sequence/defer/approve/merge/release decisions, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets/deploy/staging/live, camera/capture/save/export or another core product flow, or multiple lane outputs that must be reconciled before source changes.

Awareness, isolation, integration: `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup; branches/worktrees isolate execution like separate desks; BFM integrates outcomes like Product/release review. Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.

Frontend/UI handoffs include `Visual Preview Decision`: `skip`, `browser screenshot/mockup`, or `imagegen asset/style option`. Skip tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for actual UI layout, responsive, component, or flow decisions. Use imagegen only for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options where generated bitmap exploration helps. If visual uncertainty is meaningful, Product/BFM includes or requests the visual artifact before source execution.

## BFM Visible Workflow

Product/BFM must run this workflow before and after BFM/all-handoff execution:

1. **Pre-Execution Card Snapshot**: show card ID, status, lane/owner, area, scope, locks, linked handoffs, blockers, gates, checks, branch/PR/staging URL if known, intentional dirty state, objective, key results, definition of done, approval state, and justification.
2. **Goal Approval Gate**: if multiple cards match, show candidates and recommend one. If approval is missing, pending, stale, changed, or unclear, stop before claiming files, editing, deploying, or completing.
3. Build a **five-lane handoff ledger** for `FB-Lane`, `FB-Product`, `FB-Tech`, `FB-Design`, and `FB-Business`; name matching handoffs or record `no handoff found`; end every found handoff as `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
4. **Story Split Pass**: before prioritizing, decide whether the run should be split into smaller stories. Split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work; otherwise say `No split needed`.
5. **Dependency And Lock Pass**: classify each ledger item or child story from status, owner, locks, dependencies, blockers, gates, approval, and required checks as `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`.
6. **Unblocked Sequence**: execute only `ready now` work; split independent unlocked work, defer locked overlap with the blocking task named, or stop with the next unblock action when everything is blocked.
7. **Recheck Before Claim**: rerun lane status immediately before claiming or editing; resequence if locks changed.
8. **Post-Action Card Summary**: before closeout, summarize card ID, final status, changed files, checks run, remaining gates, next owner, and whether live deploy is still blocked.

## Proactive Loop Hardening

When Product/BFM sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework, propose one small guardrail before changing the process. Include the observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed. Skip one-off or low-impact issues.

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

### 2. Claim a Task
When Product launches BFM execution and the BFM execution worker claims a task (e.g. `TASK-102`) for the relevant lane context (e.g. `Tech`, `Design`, `Business`) and locks specific files (e.g. `src/auth.ts, src/db.ts`):
1. Execute the claim command:
   ```bash
   node tools/fb-lane.cjs claim <task-id> <lane> "[locked_files]"
   ```
   *Example*: `node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts, src/db.ts"`
2. Verify that the command succeeds, which checks out the feature branch, locks the files on the board, and commits the board update separately.
3. Note: The CLI claim command also automatically writes task context to `.codex/current_task.md` for local editors.
4. For source-changing BFM execution, prefer `--worktree` when Product must stay free for direction, review, or integration. Before source execution, read board/status/locks and the relevant handoff index; during isolated work, name the task, branch/worktree, lane, and locked files.
5. For non-trivial tasks, confirm the board item has one approved `Goal Alignment Session` block (`Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, `Justification`) before implementation begins. Do not create or change OKRs during execution.

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

Ordinary Product and workstream chats do not run this implementation loop; only Product-launched BFM execution workers do. If Product sees repeated runner hangs, stale `.git/*.lock` files, or stuck `git add` / test / build processes, run `node tools/fb-lane.cjs doctor`, mark the relevant lane gate `pending-gate` or `blocked`, and return execution to BFM sequencing.

## Handoff Index Notes

`doctor` is read-only. When it warns that `docs/handoffs/index.md` is missing or old-style, do not silently create files from the health check. Product/BFM should run bootstrap or repair the lookup before non-quick sequencing. Keep `PROJECT_BOARD.md` as truth, the index as routing, and detailed handoffs as detail.

## Goal Alignment Session Notes

Use a Goal Alignment Session for non-trivial handoffs only. Do not create extra ceremony for `TASK-Q-*` quick tasks.

- Product/BFM owns the approved Product/workstream or BFM-target OKR in `PROJECT_BOARD.md`, with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`.
- Stable lane OKRs are standing Product, Tech, Design, and Business quality anchors; mini-loops return evidence against those anchors.
- `/goal` is a Product/BFM shortcut into this same Goal Alignment Session. It shows, creates, clarifies, or asks approval for the current goal; it must not create a second goal system or a separate `/goals` flow. Workstream chats do not own `/goal`; they propose or challenge goal fit in their handoff for Product/BFM to reconcile.
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
- If a handoff conflicts with approved OKRs, BFM proposes aligned alternatives for approach, scope, or sequence and recommends one. BFM does not dynamically create or edit OKRs during execution.

## BFM Return Loop

When Product/BFM processes all lane handoffs, do not close until every handoff has one explicit status: `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.

Return checks:

- after reading handoffs, return to `PROJECT_BOARD.md`;
- after coding, return to each handoff;
- after tests, return to source, docs, and board;
- after board/doc updates, return to `node tools/fb-lane.cjs status`;
- after commit/push, return to `git status` and name whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty.

Close only when board, source, docs, and tests agree, or every disagreement is explicitly marked. Add one loop health flag: `healthy`, `watch`, `needs Product review`, or `blocked`; do not numeric-score the loop. Add `Loop Learning`: feedback captured, repeated pattern (`no|yes`), tooling needed (`none|propose guardrail|propose automation|propose eval`), and Product approval needed (`no|yes`).

When `Loop Learning` chooses `propose eval`, propose a small Markdown scorecard under `docs/evals/` using the generic sections from `docs/evals/agent-behavior-scorecard-template.md`. Do not create an eval runner, dashboard, numeric score, CI eval job, or larger `doctor` rule unless that heavier option is separately approved.
A retro or scorecard may produce at most one small guardrail for each repeated pattern. Keep quick tasks lightweight unless the same failure pattern repeats; do not add per-task OKRs from a retro.

Approval autonomy is phased. Product/BFM starts with Shadow Approval, may recommend Phase 2 after one day or three matching decisions with no material miss, and may recommend Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate. The user approves phase changes. Workstreams may mark `safe to auto-accept`, but Product/BFM owns actual self-approval and never self-approves risky surfaces.

Once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. It still stops for hard gates such as live deploy, secrets, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.
