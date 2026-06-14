# Agent & Thread Coordination Rules

This project uses the standard **FB-Lane Four-Lane Coordination Model** to enable safe concurrent development. 

Instead of trying to discuss pricing copy, fix a backend bug, and tweak a UI button in a single bloated conversation—which leads to agent confusion and broken code—FB-Lane allows you to split concerns into clean, parallel workstreams:
*   Talk to **Business** about pricing options.
*   Direct **Tech** to fix the backend bug.
*   Instruct **Design** to style the UI button.

---

## 1. Lane Scopes & Boundaries

To prevent context window overload and git collisions, strictly adhere to your assigned lane:

### 👑 FB-Product (Product Manager / Integration Captain)
*   **Ownership**: Final product decisions, task prioritization, scoping, file merges, staging/live deployments, and release gates.
*   **Authority**: Only lane authorized to merge branches into main or execute deployments to staging/production.
*   **Workflow**: Reads user requests, updates `PROJECT_BOARD.md`, assigns resource locks, delegates tasks, reviews PRs, verifies staging, and merges branches.

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
The user (acting as the external supervisor) is completely shielded from manual project coordination, task tracking, or Git management. The user's interaction points are restricted to:
1. **Giving Instructions**: Describing what to build, either to the main `FB-Product` thread or directly to a specific lane thread concurrently (e.g. consulting Business on pricing, Tech on a database bug, or Design on button styles).
2. **Reviewing Outputs**: Inspecting the visual staging builds and code reviews when notified that a task is complete.

All internal coordination—including running drift audits, checking/asserting resource locks on `PROJECT_BOARD.md`, checking out branches, writing code, executing verification tests, and pushing PRs—is **fully automated by the agents**. Product remains the integration Captain who reviews staging and merges the final code.

---

## 2. The Board Loop & Resource Locking (`PROJECT_BOARD.md`)

All tasks must be logged in `PROJECT_BOARD.md` in the project root to coordinate concurrent workstreams:
1. **Drift Audit**: Before starting, run the drift checklist to verify workspace state.
2. **Claim & Lock**: Claim or create an item in `PROJECT_BOARD.md`. Change status to `In Progress`. Declare the exact **Affected Screens** and **Locked Files** to establish a resource lock.
3. **Commit**: Work in an isolated branch (`tech/...` or `design/...`). Do not touch files locked by other active threads.
4. **QA**: Once complete, push your branch, set status to `Staging QA`, and document the modified files and QA verification results.
5. **Link**: Update the task details block and table row with direct links to the Git branch, Pull Request, and staging environment URL.
6. **Handoff & Unlock**: Report the work item to `FB-Product` for staging review. Product merges the branch and removes the resource locks, marking the task `Done`.

---

## 3. Safety & Git Hygiene
*   **Never commit directly to main**. All work must go through a branch.
*   **Commit Docs Separately**: When editing documentation, `PROJECT_BOARD.md`, design specifications, plans, or handoff notes, commit those updates separately from codebase logic and styling changes. Stage files explicitly and keep documentation commits clean.
*   **Staging First**: All features must be visually and functionally verified on staging before production promotion is requested. Do not deploy to production based on stale approvals from prior chats/days.
*   **Do Not Revert Others**: If another lane has touched a shared file (such as the main entrypoint), merge main into your branch and resolve/adapt, rather than overwriting.

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

