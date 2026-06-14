# Agent & Thread Coordination Rules

This project uses the standard **FB-Lane Four-Lane Coordination Model**. Assume multiple agents, subagents, or developers may edit the codebase concurrently.

---

## 1. Lane Scopes & Boundaries

To prevent context window overload and git collisions, strictly adhere to your assigned lane:

### 👑 FB-Product (Product Manager / Integration Captain)
*   **Ownership**: Final product decisions, task scoping, file merges, staging/live deployments, and release gates.
*   **Authority**: Only lane authorized to merge branches into main or execute deployments to staging/production.
*   **Workflow**: Reads user request, updates `PROJECT_BOARD.md`, delegates tasks, reviews pull requests, runs the release checklist, and performs the final merge.

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
*   **Rule**: *Operates in a READ-ONLY capacity.* Cannot modify code or run deployments.
*   **Workflow**: Drafts proposed text directly in markdown documentation or inside `PROJECT_BOARD.md` entries, then requests `FB-Product` or `FB-Design` to apply it.

---

## 2. The Board Loop (`PROJECT_BOARD.md`)

All tasks must be logged in `PROJECT_BOARD.md` in the project root:
1. **Claim**: Before modifying code, claim or create an item in `PROJECT_BOARD.md`. Set status to `In Progress`.
2. **Commit**: Work in an isolated branch (`tech/...` or `design/...`).
3. **QA**: Once complete, push your branch, set status to `Staging QA`, and document the modified files and QA verification results.
4. **Handoff**: Report the work item to `FB-Product` for review and merging.

---

## 3. Safety & Git Hygiene
*   **Never commit directly to main**. All work must go through a branch.
*   **Commit Docs Separately**: When editing documentation or `PROJECT_BOARD.md`, make separate commits from source code changes. Keep the git tree clean.
*   **Staging First**: All features must be visually and functionally verified on staging before production promotion is requested.
*   **Do Not Revert Others**: If another lane has touched a shared file (such as the main entrypoint), merge main into your branch and resolve/adapt, rather than overwriting.
