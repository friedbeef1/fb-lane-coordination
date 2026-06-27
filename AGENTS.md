# Agent & Thread Coordination Rules

This project uses the standard **FB-Lane Four-Lane Coordination Model** to enable safe concurrent development. 

Instead of trying to discuss pricing copy, fix a backend bug, and tweak a UI button in a single bloated conversation—which leads to agent confusion and broken code—FB-Lane allows you to split concerns into clean, parallel workstreams:
*   Talk to **Business** about pricing options.
*   Direct **Tech** to fix the backend bug.
*   Instruct **Design** to style the UI button.

---

## 1. Lane Scopes & Boundaries

To prevent context window overload and git collisions, strictly adhere to your assigned lane:

### 👑 FB-Product (Product Manager / User Value Optimizer)
*   **Ownership**: Final product decisions, task prioritization, scoping, file merges, staging/live deployments, and release gates.
*   **Authority**: Only lane authorized to merge branches into main or execute deployments to staging/production.
*   **Workflow**: Reads user requests, writes one canonical Goal Alignment block for each non-trivial task in `PROJECT_BOARD.md` (`Working Goal`, `Success Measure`, `Gate / Review Point`), sequences tasks against that goal and value-vs-effort mix, records goal changes as `Goal changed from X to Y because Z.`, prompts the user for approval before promoting backlog items to `Ready`, assigns execution to the owning lanes, reviews PRs, verifies staging, and merges branches.
*   **Boundary**: Product gives direction and owns integration. Product does not claim or execute Tech/Design/Business source changes on their behalf; individual lanes claim and execute their own task/files.
*   **Completion Audit Rule**: Reports delivered work, lane-specific verification, and unresolved gates as separate statuses for every lane. Product must not call any workstream "done" or "executed" unless the required evidence exists for that lane; otherwise mark the missing gate as pending or blocked.

### ⚙️ FB-Tech (Technical Lead / Developer)
*   **Ownership**: Database schemas, APIs, serverless functions, database security (e.g., RLS), configuration scripts, and unit/integration test suites.
*   **Rule**: *Does not make styling, layout geometry, font, or UI appearance changes.*
*   **Workflow**: Creates feature branch (`tech/[feature-name]`), implements logic, runs tests, pushes, updates `PROJECT_BOARD.md` to `Staging QA`, writes the handoff, and leaves a passive closeout note.

### 🎨 FB-Design (UI/UX Designer / QA Auditor)
*   **Ownership**: CSS files, theme tokens, styling classes, asset management (SVGs, icons), page layout geometry, and visual viewports.
*   **Rule**: *Does not edit database schemas, API routes, or backend app logic.*
*   **Workflow**: Creates style branch (`design/[feature-name]`), modifies styling, performs visual checks on target viewports (mobile and desktop), updates `PROJECT_BOARD.md` to `Staging QA`, writes the handoff, and leaves a passive closeout note.

### 📝 FB-Business (Copywriter / Positioning)
*   **Ownership**: Pricing text, copywriting, onboarding copy, documentation, help desks, FAQs, and marketing text.
*   **Rule**: *Operates in a READ-ONLY capacity on application code.* Cannot modify source files or run deployments.
*   **Workflow**: Drafts proposed text directly in markdown documentation or inside `PROJECT_BOARD.md` entries, records the target integration owner, and leaves a passive closeout note.

### 🧾 Passive Closeout Notes
Every lane must leave a final informational closeout note in its thread when it stops work on a task. The note records task ID, status, delivered work, evidence, remaining gates, and the handoff path. It must not include commands, `@`/`$` invocations, or instructions to open, start, run, or ask another lane; `PROJECT_BOARD.md` and `docs/handoffs/` remain the trigger source.

### 🎯 Lightweight Goal Alignment
Use goal alignment for non-trivial handoffs and sequencing work. Product/BFM owns one canonical Goal Alignment block per task, ideally in the task detail block in `PROJECT_BOARD.md`, with `Working Goal`, `Success Measure`, and `Gate / Review Point`. Worker lanes read that block and challenge it in handoffs instead of rewriting it. Do not turn quick micro-tasks into a new ceremony.

Good goal example: `Working Goal: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`

Bad goal example: `Working Goal: finish the feature.`

Lane handoffs should use this compact form instead of a long SMART template:

```md
## Goal Alignment

Goal Alignment: aligned | suggest change: <proposed goal> | blocked by goal ambiguity: <reason>
Goal Challenge / Caveat: <real caveat> | No caveat identified
Evidence Against Goal: <lane evidence that proves, weakens, or blocks the current goal>
```

### 🔁 BFM Return Loop
When James says "run BFM" or "process all lane handoffs", Product/BFM must not close until every discovered handoff has one explicit status:

- `implemented`
- `already done`
- `blocked`
- `out of scope`
- `explicitly deferred`

That status must match `PROJECT_BOARD.md`, source files, docs, and test evidence. If they disagree, mark the disagreement as blocked, out of scope, or explicitly deferred before closeout.

Return checks for non-trivial handoff execution:
1. After reading handoffs, return to `PROJECT_BOARD.md` and confirm every handoff is represented, sequenced, or deferred.
2. After coding, return to each handoff and confirm the source satisfies the requested contract.
3. After tests, return to source, docs, and board to catch stale copy, missing wiring, or bad assumptions.
4. After board/doc updates, return to `node tools/fb-lane.cjs status`.
5. After commit/push, return to `git status` and close only with a clean worktree or named dirty state.

### 💬 The User's Role: Supervisor & Reviewer

The user (acting as the external supervisor) is shielded from manual project coordination, task tracking, or Git management. The plugin is optimized for **Main Approach: Autonomous Background Orchestration**, with **Optional Interaction: Interactive Direct Control** serving as a manual escape hatch or fallback mode for single-threaded platforms.

#### Main Approach: Autonomous Background Orchestration (<20% Involvement - Optimized Mode)
* **Status**: **Primary/Recommended**. This is the mode the plugin is designed and optimized for.
* **Workflow**: The user talks only to the main **`FB-Product`** thread to describe features and milestones. Product handles task planning and direction, then each owning lane claims its own files/branch and executes work in parallel where safe.
* **User Touchpoints**: Restricted to reviewing plans (Plan Gate) and verifying staging environments (Staging Gate) before final merges.
* **Sidebar Threads**: Used passively as detail desks. If the user opens a sidebar thread to check technical details, the agent reads local handoff files and schema states to present an update.

#### Optional Interaction: Interactive Direct Control (Pair-programming / Escape Hatch)
* **Status**: **Fallback/Manual**. Used when the user explicitly wishes to manually pair-program or debug code rather than delegate to background orchestration.
* **Workflow**: The user manually instructs and chats directly with individual sidebar threads (e.g. asking Tech to build a feature, or Design to update a button). 
* **User Touchpoints**: Higher involvement; the user reviews plans and approves task executions directly within the specific lane thread.
* **Multi-thread Crossing**: Lanes synchronize via `PROJECT_BOARD.md` and `docs/handoffs/`. When a lane finishes, they write a structured handoff document that the next lane automatically reads on session start.

#### Thread Synchronization & SOP alignment
Because the project board and git branch are the single source of truth:
* Sidebar threads do not get out of sync.
* If a thread shows stale history or a pending button from a background run, typing `status` or `SOP` in that thread forces the agent to read `PROJECT_BOARD.md` and instantly update its chat context.

Internal coordination is automated by the agents, but ownership stays split: Product scopes, sequences, and reviews; individual lanes claim files, check out branches or worktrees, write code/copy/styling, run verification, and push PRs. Product remains the User Value Optimizer who reviews staging and merges the final code, ensuring all changes align with the product's strategic direction and do not cause scope drift.

---

## 2. The Board Loop & Resource Locking (`PROJECT_BOARD.md`)

All tasks must be logged in `PROJECT_BOARD.md` in the project root to coordinate concurrent workstreams:
1. **Drift Audit**: Before starting, run the drift checklist to verify workspace state.
2. **Claim & Lock**: Product creates or scopes the item; the owning lane claims its own task/files before implementation. For non-trivial tasks, Product/BFM sets or confirms one canonical Goal Alignment block before implementation (`Working Goal`, `Success Measure`, `Gate / Review Point`). Worker lanes flag missing or unclear goals in handoffs instead of rewriting the board. Change status to `In Progress`. Declare the exact **Affected Screens** and **Locked Files** to establish a resource lock.
3. **Commit**: Work in an isolated branch (`tech/...` or `design/...`). Do not touch files locked by other active threads.
4. **QA**: Once complete, push your branch, set status to `Staging QA`, and document the modified files and QA verification results.
5. **Link**: Update the task details block and table row with direct links to the Git branch, Pull Request, and staging environment URL.
6. **Handoff, Unlock & Clean**: Write the structured handoff and passive closeout note. Product reads `PROJECT_BOARD.md` / `docs/handoffs/`, reconciles every lane's Goal Alignment before sequencing execution or merge, records any goal drift as `Goal changed from X to Y because Z.`, merges approved branches, removes resource locks (marking the task `Done`), and records its own passive closeout note. The lane agent (or developer) then performs a local clean-up, deleting the local feature branch.

---

## 3. Safety & Git Hygiene
*   **State-Driven Writing Gates**: In active chat sessions, worker agents (`FB-Tech`, `FB-Design`) operate strictly as read-only consultants by default. They are only authorized to use code-writing tools once a task is actively claimed (indicated by the presence of `.codex/current_task.md` matching their lane). If no task is claimed, they must suggest changes in markdown blocks only.
*   **Product Direction / Lane Execution**: Product should stop retrying implementation if tests, builds, Git staging, or browser checks hang. Record `pending-gate` or `blocked` with evidence and return the fix to the owning lane.
*   **File Lock Boundary**: Once a task is claimed and writing is unlocked, the agent must strictly restrict its edits/writes only to the files listed under "Locked Files" in `.codex/current_task.md`. Editing files outside of this declared lock is a boundary violation.
*   **Fast-Track Quick Edits**: For micro-edits (such as simple typos or minor styling tweaks), you can bypass the main Product triage and planning process. Run `node tools/fb-lane.cjs quick <lane> <locks> [desc]` to instantly generate a temporary task on the board, checkout a `quick/` branch, and unlock the lane agent's write ability in the sidebar for those locked files.
*   **Never commit directly to main**. All work must go through a branch.
*   **Commit Docs Separately**: When editing documentation, `PROJECT_BOARD.md`, design specifications, plans, or handoff notes, commit those updates separately from codebase logic and styling changes. Stage files explicitly and keep documentation commits clean.
*   **Local Testing & Auto-Fixing**: Active agents must compile code and run test suites locally (e.g., `npm test`) before submitting. The plugin's `submit` command programmatically executes these tests and blocks the commit/push if they fail.
*   **Token Burn Protection (Debug Retry Limit)**: If local tests or compilation fail, the agent must enter an autonomous debugging loop—parsing the stderr/stdout console output, making code corrections, and rerunning the tests. To protect the user's token budget from runaway loops, the agent is restricted to a maximum of **5 debugging retries** (edit -> test -> edit) per task.
*   **Escalation Protocol**: If the tests still fail after the 5th retry, the agent must immediately stop work. It must flag the task status on `PROJECT_BOARD.md` as `Blocked` (with the label `Blocked - Debug Retry Limit Exceeded`), append the current test/compilation logs to the task details card, and notify the user for manual intervention.
*   **Staging First**: All features must be visually and functionally verified on staging before production promotion is requested. Do not deploy to production based on stale approvals from prior chats/days.
*   **Do Not Revert Others**: If another lane has touched a shared file (such as the main entrypoint), merge main into your branch and resolve/adapt, rather than overwriting.
*   **Rejection & Rectification**: If Product rejects a branch during review due to failing test suites, visual QA issues, or strategic misalignment, Product marks the task `Blocked` or `Rejected` on `PROJECT_BOARD.md` (attaching the failure logs) and alerts the user and the lane agent. The lane agent then resolves the bugs locally on its feature branch until all tests pass before resubmitting. If the changes are permanently rejected, Product closes the PR, deletes the feature branch, and removes the task and resource locks from the board.

---

## 4. UI Quality Gates (Visual QA)
To maintain the visual integrity of the user interface, enforce two hard gates:
*   **Text Containment**: No text may clip, spill out of its container (button, pill, card, input, sidebar, frame), or become hidden behind overflow on any viewport. Always run a text-fit check.
*   **Aesthetic & Style Integrity**: The app must render the correct theme, colors, layouts, and brand typography (no fallback to default system fonts or broken tactile styling). Ensure all local asset files (fonts, SVGs) load successfully.
*   **Interactive QA**: Before declaring UI work ready, visually verify the actual staged page, including responsiveness across mobile/desktop viewports, active hover states, and navigation transitions.
*   **Evidence Language**: If a lane delivered work but a required gate lacks evidence, report the precise split: "delivered; <named checks> passed; <specific gate> remains pending." Do not collapse implementation, tests, visual QA, copy approval, staging review, or release gates into a generic "done".

---

## 5. Drift Audit
Run this quick checklist when resuming a task after a pause, a context compaction, a new day, or an interrupted deploy to prevent state drift:
1. Are active task statuses on the `PROJECT_BOARD.md` still correct?
2. Did another agent/developer modify files, schemas, or the staging target while you were away?
3. Is your staging or live deployment authorization still valid for this specific task?
4. Do you have uncommitted changes in your branch outside the declared scope?
5. Does the next action still belong to your assigned lane?
