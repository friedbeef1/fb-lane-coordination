# FB-Lane Coordination Framework: Frequently Asked Questions (FAQ)

This FAQ is designed to help developers, product managers, and AI agents understand the philosophy, architecture, and daily operations of the **FB-Lane Coordination Model**.

---

## 1. High-Level Concepts

### Q: What is the FB-Lane Coordination Framework?
**A:** It is a decentralized, role-isolated project management and execution framework. By dividing tasks into four highly bounded "lanes" (Product, Tech, Design, Business) and coordinating them via a local markdown-based project board (`PROJECT_BOARD.md`), it allows human developers and autonomous AI agents to work concurrently on the same codebase without stepping on each other's toes.

### Q: What core problems does it solve?
**A:** It solves the chaos of trying to do everything in a single, bloated developer thread. 

Without FB-Lane, discussing pricing copy, fixing a backend bug, and tweaking a UI button in the same conversation causes the agent to lose context and make mistakes—often breaking styling while editing backend files.

FB-Lane allows you to run these workstreams **concurrently** in separate, isolated threads. You can consult **Business** on pricing options, direct **Tech** to fix the database bug, and instruct **Design** to refine the UI button in parallel. Because each lane has strict code and file boundaries, they never step on each other's toes.

### Q: Why 4 lanes? How are they structured?
**A:** The four lanes map directly to the primary pillars of software development:
*   **`FB-Product` (Captain)**: The orchestrator. Scopes tasks, runs checks, reviews PRs, prioritizes execution, and deploys.
*   **`FB-Tech` (Backend/Logic)**: Owns core logic, schemas, APIs, security rules, and tests.
*   **`FB-Design` (UI/UX/Styling)**: Owns styling (CSS), page layout geometry, and visual QA.
*   **`FB-Business` (Copywriting)**: Owns positioning, pricing text, help documents, and marketing copy.

---

## 2. Lane-Specific Boundaries

### Q: Why is the FB-Business lane "Read-Only" for code?
**A:** Business and copywriting agents are experts in messaging, not code structure. Letting them modify source files directly risks breaking CSS layout grids or React component syntax. Furthermore, new copy must pass the `FB-Design` visual check (text-containment) to ensure it doesn't break styling on smaller viewports. Business agents draft copy in markdown or the task board, and developers/designers integrate it.

### Q: What if a task requires both database changes and UI updates?
**A:** Under the FB-Lane model, you split this task into two distinct, sequential, or parallel tasks on the project board:
1. A **`tech/[feature]`** task (claimed by `FB-Tech`) to implement the database schema and expose the API endpoint.
2. A **`design/[feature]`** task (claimed by `FB-Design`) to build the visual UI component and consume the new API.
This prevents a single thread from having write-access to both backend models and styling configurations.

---

## 3. The Board Loop & Resource Locking

### Q: Why use a local Markdown file instead of Jira or Linear?
**A:** Markdown project boards offer three massive advantages:
1. **Offline & Fast**: No API latency or web browser overhead.
2. **Git Version-Controlled**: Your task status is committed directly to the repository history. If a deploy fails, checking out an older commit reverts both the code and the board status to that exact moment.
3. **LLM-Friendly**: AI agents can read and update a markdown file instantly using basic file-writing tools, whereas integrating with external APIs (like Jira/Linear) is slow and error-prone.

### Q: What is "Resource Locking" and why do we do it?
**A:** To enable safe concurrent development, active tasks must declare their affected screens/files on the project board. This establishes a **resource lock** on those files. No other active thread is allowed to modify locked resources until the owning thread completes its work, pushes its changes, and Product merges it—releasing the lock.

### Q: What is the rule about "Separate Documentation Commits"?
**A:** When updating the project board (`PROJECT_BOARD.md`), design handoffs, or documentation files, you must stage and commit them separately from source code changes. This keeps pull request diffs clean and ensures project management history is isolated from functional logic.

---

## 4. Conflict Resolution, Testing & Scaling

### Q: How does testing and QA fit into the FB-Lane framework?
**A:** Testing is distributed across specialized lanes to keep code quality high without overloading agent threads:
*   **`FB-Tech` (Functional Tests)**: Writes and runs unit, integration, API, and database security test suites (e.g. `npm run test` or backend linters) inside isolated `tech/` branches before pushing.
*   **`FB-Design` (Visual QA)**: Runs layout audits across mobile/desktop viewports, checking theme styling, font loading, hover states, and ensuring zero text clipping or spill.
*   **`FB-Product` (Integration Captain)**: Coordinates final staging verification. Product checks that both functional and visual test checklists are complete, reviews git diffs, and performs a smoke test on the staging build before merging.

### Q: What happens if two lanes must edit the same file (e.g. `App.tsx` or `index.html`)?
**A:** This is a common code-bleed scenario. Under FB-Lane:
1. Each lane checks out its own branch (`tech/TASK-101` and `design/TASK-102`) and performs its edits.
2. They push their branches and request merge.
3. **`FB-Product` (Integration Captain)** reviews the PRs. The Captain merges the branches sequentially, resolving any conflicts in the shared file.
4. Product performs the final verification on staging to ensure the styling did not break the backend bindings, and vice versa.

### Q: How do we prevent an AI agent from violating its boundary (e.g. FB-Design modifying APIs)?
**A:** Enforcement depends on the platform:
*   **Antigravity**: Managed programmatically via tool sandboxing (Design is not registered with database/server access tools).
*   **Claude/Codex**: Checked during the Product lane's integration gate. You can also implement pre-commit git hooks or CI workflows that reject commits if a `design/` branch contains changes to files in `server/` or `db/` directories.

### Q: How does this scale as the development team grows?
**A:** While the number of developers/agents can grow, the core architecture remains robust:
*   You can register multiple concurrent `FB-Tech` or `FB-Design` agents, provided they checkout separate, unique task-prefixed branches (e.g., `tech/TASK-103-billing`, `tech/TASK-104-notifications`).
*   Keep **one single Project Board** and **one Product Captain** thread to maintain centralization, code review sanity, and staging control.

---

## 5. Orchestration & Team Workflow

### Q: Do I (the supervisor/user) only talk to FB-Product, or can I talk to individual lanes? Doesn't direct communication screw up alignment?
**A:** You can do both depending on the task, and **it will not break alignment**. The framework has built-in guards to maintain synchronization even during decentralized conversations:
*   **High-Level Planning**: Instruct **`FB-Product`** to prioritize tasks, scope features, and review staging releases. Product retains final merge authority.
*   **Deep-Dive Development**: Talk directly to **`FB-Tech`**, **`FB-Design`**, or **`FB-Business`** threads when you want to pair-program, refine layouts, or discuss copy options.
*   **Why Alignment is Maintained**:
    1.  **Immediate Board Logging**: Whenever you direct a lane to work in a thread, they must claim the task on `PROJECT_BOARD.md`, setting status to `In Progress` and documenting their scope.
    2.  **Strict File Locking**: The lane immediately declares its resource locks. Other threads check the board and see which files are locked, preventing duplicate edits or file collisions.
    3.  **Merge Isolation**: No lane can merge their own code. When they finish, they hand it over to Product for review on staging, ensuring Product has final quality and alignment control before anything goes live.

### Q: How do we ensure the Product lane (Captain) does not become a workflow bottleneck?
**A:** The framework is built to prevent Product from becoming a chokepoint through three mechanisms:
1.  **Asynchronous Pull Model**: Developers and subagents do not wait for Product assignments. They pull prioritized tasks directly from the `PROJECT_BOARD.md` when they are ready, setting them to `In Progress` and locking their resources autonomously.
2.  **Self-Reporting QA Checklists**: Each lane owns its quality checks (tests, visual QA) and documents the outcomes directly on the board card. Product's role is reduced to a quick review of the checklist and staging build, which takes minutes.
3.  **Conflict-Free Concurrency**: Because files and screens are locked on the board, different lanes coordinate schedule conflicts automatically. A tech branch knows to work on a different endpoint if its target file is locked by design, eliminating coordination meetings.

### Q: What is the typical day-to-day workflow for a user?
**A:** In most cases, your day-to-day workflow is simple, automated, and hands-off:
1.  **Draft Your Plan**: Write down your requirements, feature checklist, or PRD. (While you can write in plain text, **Markdown is highly preferred** because the agent can parse headers and checklists directly onto the `PROJECT_BOARD.md` without losing structure or details).
2.  **Hand Off to Product**: Give the plan directly to the main **`FB-Product`** thread.
3.  **Autonomous Execution**: Product parses your requirements, creates tasks on the board, locks files, dispatches them to parallel threads (`FB-Tech`/`FB-Design`), runs verification tests, and deploys to staging.
4.  **Review Deliverables**: Product hands you the staging links, code PRs, and verification artifacts (e.g. test logs, walkthroughs, layout screenshots) for your final approval.

### Q: What is the alternative workflow if I want to talk directly to a specific lane (e.g., Tech or Design)?
**A:** If you want to bypass the Product lane to refine a specific feature (like pair-programming a backend fix or iterating on a button layout), the workflow is:
1.  **Direct Instruction**: Describe the goal directly in the specific lane's thread (e.g., *"Design, make this button tactile and green"*).
2.  **Autonomous Claim & Lock**: Before writing code, the lane agent checks `PROJECT_BOARD.md`, claims the task, asserts the resource locks on target files (e.g. `Button.css`), and commits the board update.
3.  **Implement & Test**: The lane agent checks out its isolated feature branch (e.g. `design/TASK-102`), writes code, and runs functional/visual checks.
4.  **Staging QA**: The lane agent pushes the branch to the remote and updates `PROJECT_BOARD.md` to `Staging QA`.
5.  **Product Gate Review**: Product reviews the staging build, merges the branch to `main`, and removes the resource locks (unlocking the files).

### Q: How much manual coordination does the user have to do?
**A:** Virtually none. The human user is completely shielded from the mechanics of project management, task board updates, branch checkouts, and Git merges. Your role is strictly restricted to **giving instructions/plans** and **reviewing staging outputs/verification artifacts**. The agents autonomously handle all background logistics, testing, and Git operations in between.

---

## 6. Platform Integration (Antigravity, Claude, Codex)

### Q: How does execution differ between Antigravity, Claude, and Codex?
**A:** The framework operates differently based on the platform's orchestration capabilities:
*   **Antigravity (Programmatic Multi-Agent)**: The main `FB-Product` thread runs on an agentic SDK. It uses programmatic tools (`define_subagent` and `invoke_subagent`) to spin up sandboxed background threads for `FB-Tech` and `FB-Design` autonomously.
*   **Claude (Single-Threaded Chat)**: Simulated via thread partitioning. The developer acts as the supervisor, starting a fresh chat thread for each task to protect Claude's memory. However, the work inside the thread is **highly automated**: once instructed to adopt a role, Claude uses terminal/IDE tools (via Cursor, MCP, or command tools) to checkout branches, write code, update the markdown board, and push branches/PRs automatically.
*   **Codex (Local File/Git Agent)**: Enforced via local repository rule files (e.g., `.codex/rules.md`). The Codex runs checkouts, updates the markdown board locally, and validates compilations inside isolated local git branches.

---

## 7. Getting Started & Automation

### Q: Can I just ask Antigravity, Claude, or Codex to read this framework and set it up themselves?
**A:** **Yes, absolutely!** In fact, this is the recommended way to get started. You do not need to manually copy or configure files. 

Simply point your agent to this repository (or copy the framework files into a reference folder) and prompt:
> *"I want to bootstrap the FB-Lane Coordination Framework in our project workspace. Read this framework's templates and platform guide, and configure our workspace accordingly."*

The agents are designed to autonomously:
1. Copy [templates/AGENTS.md](file:///./templates/AGENTS.md) and [templates/PROJECT_BOARD.md](file:///./templates/PROJECT_BOARD.md) to your project root.
2. Register the respective system prompts, workspace rules (e.g. `.codex/rules.md`), or skills (such as running the [project-coordination-setup](file:///./platforms/antigravity/project-coordination-setup-skill.md) skill on Antigravity) without human intervention.

### Q: How do I manually bootstrap the FB-Lane framework?
**A:** If you prefer manual setup, it takes three quick steps:
1.  **Copy the Templates**: Copy [templates/AGENTS.md](file:///./templates/AGENTS.md) and [templates/PROJECT_BOARD.md](file:///./templates/PROJECT_BOARD.md) directly to the root of your project repository and commit them.
2.  **Configure Your Platforms**: Follow the detailed guide for your platform of choice:
    *   **Antigravity**: Read the [Antigravity Guide](file:///./platforms/antigravity/README.md) and use the [project-coordination-setup](file:///./platforms/antigravity/project-coordination-setup-skill.md) skill to auto-register your subagent roles.
    *   **Claude & Cursor**: Read the [Claude Guide](file:///./platforms/claude/README.md) to set Custom Instructions and use the copy-pasteable [system prompts](file:///./platforms/claude/system-prompts.md).
    *   **Codex**: Read the [Codex Guide](file:///./platforms/codex/README.md) and copy the [Codex workflow rules](file:///./platforms/codex/workflow-rules.md) to your rules directory.
3.  **Claim Your First Task**: Triage your board, mark `TASK-001` (Setup & Bootstrap) as `In Progress`, check out a new branch, and start building!
