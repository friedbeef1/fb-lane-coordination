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
*   **Workflow**: Reads user requests, triages and prioritizes the backlog on `PROJECT_BOARD.md` (sequencing tasks based on goal-alignment and optimal value-vs-effort mix, prompting the user for approval before promoting backlog items to `Ready`), manages resource locks, reviews PRs, verifies staging, and merges branches.

### ⚙️ FB-Tech (Technical Lead / Developer)
*   **Ownership**: Database schemas, APIs, serverless functions, database security (e.g., RLS), configuration scripts, and unit/integration test suites.
*   **Rule**: *Does not make styling, layout geometry, font, or UI appearance changes.*
*   **Workflow**: Creates feature branch (`tech/[feature-name]`), implements logic, runs tests, pushes, updates `PROJECT_BOARD.md` to `Staging QA`, and requests merge from `FB-Product`.

### 🎨 FB-Design (UI/UX Designer / QA Auditor)
*   **Ownership**: CSS files, theme tokens, styling classes, asset management (SVGs, icons), page layout geometry, and visual viewports.
*   **Rule**: *Does not edit database schemas, API routes, or backend app logic.*
*   **Workflow**: Creates style branch (`design/[feature-name]`), modifies styling, performs visual checks on target viewports (mobile and desktop), updates `PROJECT_BOARD.md` to `Staging QA`, and requests merge.

### 📝 FB-Business (Copywriter / Positioning)
*   **Ownership**: Pricing text, copywriting, onboarding copy, documentation, help desks, FAQs, and marketing text.
*   **Rule**: *Operates in a READ-ONLY capacity on application code.* Cannot modify source files or run deployments.
*   **Workflow**: Drafts proposed text directly in markdown documentation or inside `PROJECT_BOARD.md` entries, then requests `FB-Product` or `FB-Design` to apply it.

### 💬 The User's Role: Supervisor & Reviewer

The user (acting as the external supervisor) is shielded from manual project coordination, task tracking, or Git management. The plugin is optimized for **Main Approach: Autonomous Background Orchestration**, with **Optional Interaction: Interactive Direct Control** serving as a manual escape hatch or fallback mode for single-threaded platforms.

#### Main Approach: Autonomous Background Orchestration (<20% Involvement - Optimized Mode)
* **Status**: **Primary/Recommended**. This is the mode the plugin is designed and optimized for.
* **Workflow**: The user talks only to the main **`FB-Product`** thread to describe features and milestones. Product automatically handles task planning, claiming, file locking, branch checkouts, and spawns background subagents (`FB-Tech`, `FB-Design`, `FB-Business`) in the background to execute work in parallel.
* **User Touchpoints**: Restricted to reviewing plans (Plan Gate) and verifying staging environments (Staging Gate) before final merges.
* **Sidebar Threads**: Used passively as detail desks. If the user opens a sidebar thread to check technical details, the agent reads local handoff files and schema states to present an update.

#### Optional Interaction: Interactive Direct Control (Pair-programming / Escape Hatch)
* **Status**: **Fallback/Manual**. Used on platforms without background orchestration support (e.g. Claude Projects, Cursor) or when the user explicitly wishes to manually pair-program or debug code.
* **Workflow**: The user manually instructs and chats directly with individual sidebar threads (e.g. asking Tech to build a feature, or Design to update a button). 
* **User Touchpoints**: Higher involvement; the user reviews plans and approves task executions directly within the specific lane thread.
* **Multi-thread Crossing**: Lanes synchronize via `PROJECT_BOARD.md` and `docs/handoffs/`. When a lane finishes, they write a structured handoff document that the next lane automatically reads on session start.

#### Thread Synchronization & SOP alignment
Because the project board and git branch are the single source of truth:
* Sidebar threads do not get out of sync.
* If a thread shows stale history or a pending button from a background run, typing `status` or `SOP` in that thread forces the agent to read `PROJECT_BOARD.md` and instantly update its chat context.

All internal coordination—including running drift audits, checking/asserting resource locks on `PROJECT_BOARD.md`, checking out branches, writing code, executing verification tests, and pushing PRs—is **fully automated by the agents**. Product remains the User Value Optimizer who reviews staging and merges the final code, ensuring all changes align with the product's strategic direction and do not cause scope drift.

---

## 2. The Board Loop & Resource Locking (`PROJECT_BOARD.md`)

All tasks must be logged in `PROJECT_BOARD.md` in the project root to coordinate concurrent workstreams:
1. **Drift Audit**: Before starting, run the drift checklist to verify workspace state.
2. **Claim & Lock**: Claim or create an item in `PROJECT_BOARD.md`. Change status to `In Progress`. Declare the exact **Affected Screens** and **Locked Files** to establish a resource lock.
3. **Commit**: Work in an isolated branch (`tech/...` or `design/...`). Do not touch files locked by other active threads.
4. **QA**: Once complete, push your branch, set status to `Staging QA`, and document the modified files and QA verification results.
5. **Link**: Update the task details block and table row with direct links to the Git branch, Pull Request, and staging environment URL.
6. **Handoff, Unlock & Clean**: Report the work item to `FB-Product` for staging review. Product merges the branch, removes the resource locks (marking the task `Done`), and notifies the lane thread. The lane agent (or developer) then performs a local clean-up, deleting the local feature branch.

---

## 3. Safety & Git Hygiene
*   **State-Driven Writing Gates**: In active chat sessions, worker agents (`FB-Tech`, `FB-Design`) operate strictly as read-only consultants by default. They are only authorized to use code-writing tools once a task is actively claimed (indicated by the presence of `.codex/current_task.md` matching their lane). If no task is claimed, they must suggest changes in markdown blocks only.
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

---

## 5. Drift Audit
Run this quick checklist when resuming a task after a pause, a context compaction, a new day, or an interrupted deploy to prevent state drift:
1. Are active task statuses on the `PROJECT_BOARD.md` still correct?
2. Did another agent/developer modify files, schemas, or the staging target while you were away?
3. Is your staging or live deployment authorization still valid for this specific task?
4. Do you have uncommitted changes in your branch outside the declared scope?
5. Does the next action still belong to your assigned lane?

