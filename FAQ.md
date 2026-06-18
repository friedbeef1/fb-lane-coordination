# FB-Lane Coordination Framework: Frequently Asked Questions (FAQ)

This FAQ is designed to help developers, product managers, and AI agents understand the philosophy, architecture, and daily operations of the **FB-Lane Coordination Model**.

For a complete overview of the framework, key features, quickstart guides, and step-by-step lifecycles, please refer back to the main [README.md](README.md).

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
*   **`FB-Product` (User Value)**: The orchestrator. Scopes tasks, runs checks, reviews PRs, prioritizes execution, and deploys.
*   **`FB-Tech` (Backend/Logic)**: Owns core logic, schemas, APIs, security rules, and tests.
*   **`FB-Design` (UI/UX/Styling)**: Owns styling (CSS), page layout geometry, and visual QA.
*   **`FB-Business` (Copywriting)**: Owns positioning, pricing text, help documents, and marketing copy.

### Q: Does this framework look familiar? Why does this structure feel so intuitive?
**A:** That’s because it is modeled directly after the industry-standard **cross-functional product pod structure** (Product Manager, Backend/Core Developer, UI/UX Designer, and Copywriter/Business Analyst) used by high-performing product teams worldwide.

Instead of reinventing the wheel, the framework maps these familiar organizational roles directly to isolated AI agent conversational loops. This provides two major advantages without standing in the way of AI autonomy:
1. **Strict Tool Boundaries**: Just as you wouldn't expect a copywriter to push database migrations or a developer to redesign theme stylesheets, each agent lane is sandbox-restricted to the specific tools it needs. This reduces token overhead, eliminates routing errors, and prevents "code-bleed" (e.g., agents breaking logic while editing UI classes).
2. **Autonomy via Git Coordination**: Instead of synchronous meetings or heavy central locking systems, the lanes synchronize asynchronously using git branches and a local markdown-based `PROJECT_BOARD.md` as their message bus. This allows agents to work concurrently and autonomously in the background without stepping on each other's toes.

In short, it takes the best practices of human team coordination and translates them into a lightweight, machine-readable protocol for collaborative AI.

---

## 2. Lane-Specific Boundaries

### Q: Why is the FB-Business lane "Read-Only" for code?
**A:** Business and copywriting agents are experts in messaging, not code structure. Letting them modify source files directly risks breaking CSS layout grids or React component syntax. Furthermore, new copy must pass the `FB-Design` visual check (text-containment) to ensure it doesn't break styling on smaller viewports. Business agents draft copy in markdown or the task board, and developers/designers integrate it.

### Q: What if a task requires both database changes and UI updates?
**A:** Under the FB-Lane model, the `FB-Product` agent (or the framework orchestrator) automatically splits this task into two distinct, sequential, or parallel tasks on the project board, saving the user from having to do it manually:
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
*   **`FB-Product` (User Value Optimizer)**: Coordinates final staging verification. Product checks that both functional and visual test checklists are complete, reviews git diffs, and performs a smoke test on the staging build before merging.

### Q: What happens if the tests or QA checks fail?
**A:** Depending on when the failure occurs, the framework handles it via two safety loops, enforced by programmatic gates and a token budget protection policy:
1.  **Local Dev Failures (Before Push)**: If `FB-Tech` or `FB-Design` runs local test suites and they fail:
    *   **Auto-Fixing Loop**: The agent autonomously debugs the failure by reading error logs, editing code, and rerunning tests locally.
    *   **Pre-Submission Gate**: The `submit` command (`node tools/fb-lane.cjs submit`) automatically runs the local test suite (e.g. `npm test`) and **blocks the branch from being pushed or updated on the board** if the tests fail.
    *   **Token Burn Protection (5-Retry Cap)**: To prevent an agent from burning through your token budget in an infinite debugging loop, it is restricted to a maximum of **5 debugging attempts**.
    *   **Escalation**: If tests still fail after 5 retries, the agent must halt execution, set the task on the board to `Blocked` (marked as `Blocked - Debug Retry Limit Exceeded`), attach the failure logs, and notify the user for supervisor triage.
2.  **Staging Failures (During Product Review)**: If code is pushed but fails the automated CI/CD pipeline, staging build compilation, or Product's final smoke/visual checks:
    *   **Rejection**: Product rejects the PR and moves the task status to `Blocked` or `Rejected` on the board, attaching the failure logs.
    *   **Notification**: Product alerts the user and the lane thread.
    *   **Correction**: The lane agent checks out the branch, fixes the bugs locally (subject to the same 5-retry cap) until tests pass, pushes the fix, and resubmits for review.

### Q: What happens if two lanes must edit the same file (e.g. `App.tsx` or `index.html`)?
**A:** This is a common code-bleed scenario. Under FB-Lane:
1. Each lane checks out its own branch (`tech/TASK-101` and `design/TASK-102`) and performs its edits.
2. They push their branches and request merge.
3. **`FB-Product` (User Value Optimizer)** reviews the PRs. Product merges the branches sequentially, resolving any conflicts in the shared file.
4. Product performs the final verification on staging to ensure the styling did not break the backend bindings, and vice versa.

### Q: Can FB-Product actively catch and correct inconsistencies between lanes before they reach main?
**A:** Yes — this is one of FB-Product's core responsibilities at the integration gate. Because Product has read access to every branch and every handoff card (`docs/handoffs/TASK-XXX.md`), it cross-reads all submitted work before merging rather than reviewing each lane in isolation.

Common cross-lane inconsistencies Product catches:
*   **API/UI contract drift**: Tech's API returns a field named `user_id` but Design's component expects `userId` — Product flags it before either branch merges.
*   **Copy referencing unbuilt features**: Business copy describes a "one-click checkout" flow that Tech hasn't built yet — Product sends Business back to hold or revise.
*   **Conflicting shared-file assumptions**: Tech and Design both touch `App.tsx` and make incompatible changes — Product sequences the merges and resolves the conflict at the integration point rather than letting it surface on `main`.
*   **Dependency order violations**: Design's UI component depends on a new API endpoint that is still in Tech's unmerged branch — Product merges Tech first, then Design.

When Product catches an inconsistency:
1. It sends the offending lane back to `In Progress` on the board with a specific fix request.
2. The lane fixes its branch and resubmits.
3. Product re-reviews before merging.

This gate runs **after submission, not in real time** — lanes work concurrently and Product reviews at the handoff boundary. If lanes stay within their role boundaries (Tech never touches CSS, Design never touches backend), cross-lane drift is rare; the gate exists for the cases where shared contracts or shared files are involved.

### Q: How do we prevent an AI agent from violating its boundary (e.g. FB-Design modifying APIs)?
**A:** Enforcement depends on the platform:
*   **Antigravity**: Managed programmatically via tool sandboxing (Design is not registered with database/server access tools).
*   **Claude/Codex**: Checked during the Product lane's integration gate. You can also implement pre-commit git hooks or CI workflows that reject commits if a `design/` branch contains changes to files in `server/` or `db/` directories.

### Q: How does this scale as the development team grows? How do I register multiple concurrent Tech or Design agents?
**A:** While the number of developers/agents can grow, the core architecture remains robust. You can register and run multiple concurrent `FB-Tech` or `FB-Design` agents:
*   **In Antigravity (Autonomous Background Orchestration)**: The `FB-Product` agent spawns them using `invoke_subagent` for separate tasks concurrently. The Antigravity client handles unique context boundaries per conversation ID on the active branches.
*   **In IDE Threads (Claude/Cursor/Codex)**: Open separate chat tabs/threads, and in each thread, instruct the agent to adopt the respective lane role on separate task-prefixed branches (e.g., `tech/TASK-103-billing`, `tech/TASK-104-notifications`).
To maintain centralization, code review sanity, and staging control, you must keep **one single Project Board** (`PROJECT_BOARD.md`) and **one Product (User Value)** thread.

### Q: What happens if I talk to a lane directly, but Product rejects their changes during review? How is this rectified, and how do I know?
**A:** If a direct-lane instruction results in code that conflicts with the product's strategic direction, user experience standards, or technical roadmap, the rectification and notification loop operates as follows:
1.  **Rejection & Blocked Status**: `FB-Product` rejects the pull request and updates the task status in `PROJECT_BOARD.md` to `Blocked` (or `Rejected`), documenting the specific reason (e.g. *strategic misalignment, dependency sequencing conflicts, or poor value-vs-effort mix*).
2.  **User Notification**: The `FB-Product` agent immediately alerts the user in the main product/roadmap thread, explaining why the integration was paused and pointing to the logged rationale on the board.
3.  **Rectification Options**:
    *   **Abandonment**: If the change is scrapped completely, Product closes the PR, deletes the isolated feature branch, and removes the task and resource locks from `PROJECT_BOARD.md`, reverting the affected files back to the clean main branch baseline.
    *   **Scope Realignment**: If the change is valid but needs adjustments to align with the roadmap, Product updates the task scope on the board and moves it back to the backlog. The lane agent then pulls the updated task, refines its branch, and resubmits it for staging QA.

---

## 5. Orchestration & Team Workflow

### Q: Do I (the supervisor/user) only talk to FB-Product, or can I talk to individual lanes? Doesn't direct communication screw up alignment or the product's direction?
**A:** You can do both depending on the task, and **it will not break alignment or derail the product's strategic direction**. The framework has built-in guards to maintain synchronization and protect the roadmap even during decentralized conversations:
*   **High-Level Planning**: Instruct **`FB-Product`** to prioritize tasks, scope features, and review staging releases. Product retains final merge authority.
*   **Deep-Dive Development**: Talk directly to **`FB-Tech`**, **`FB-Design`**, or **`FB-Business`** threads when you want to pair-program, refine layouts, or discuss copy options.
*   **Why Alignment and Product Direction are Guarded**:
    1.  **Immediate Board Logging**: Whenever you direct a lane to work in a thread, the lane agent must claim or create the task on `PROJECT_BOARD.md` immediately, setting status to `In Progress` and documenting the exact scope.
    2.  **Strict File Locking**: The lane declares its resource locks on the board. Other threads check the board and see which files are locked, preventing duplicate edits or conflicting file modifications.
    3.  **Merge Isolation (Veto Power)**: No lane can merge their own code. When they finish, they push a PR and hand it over to Product for review on staging. Product acts as the ultimate gatekeeper with exclusive merge authority, ensuring nothing goes live that conflicts with the roadmap.
    4.  **Roadmap Visibility & Veto**: Because every lane immediately logs their active scope on the project board, the roadmap remains the single source of truth. Product (or the human supervisor reviewing Product) has real-time visibility and can instantly pause, re-prioritize, or flag tasks that drift from the core strategic direction.

### Q: How do we ensure the Product lane (User Value) does not become a workflow bottleneck?
**A:** The framework is built to prevent Product from becoming a chokepoint through three mechanisms:
1.  **Asynchronous Pull Model**: Developers and subagents do not wait for Product assignments. They pull prioritized tasks directly from the `PROJECT_BOARD.md` when they are ready, setting them to `In Progress` and locking their resources autonomously.
2.  **Self-Reporting QA Checklists**: Each lane owns its quality checks (tests, visual QA) and documents the outcomes directly on the board card. Product's role is reduced to a quick review of the checklist and staging build, which takes minutes.
3.  **Conflict-Free Concurrency**: Because files and screens are locked on the board, different lanes coordinate schedule conflicts automatically. A tech branch knows to work on a different endpoint if its target file is locked by design, eliminating coordination meetings.

### Q: What if Product (the human or the agent) is not technically capable of sequencing tasks or prioritizing them properly?
**A:** The framework relies on the **`FB-Product` AI agent** to handle the heavy lifting of technical task analysis, dependency mapping, and roadmap sequencing. It acts as an autonomous co-pilot that evaluates tasks against two primary criteria:
1.  **Goal Alignment**: It cross-checks every task claimed or created on the board back to the user's high-level goal, preventing accidental scope creep or rogue code changes.
2.  **Optimal Sequencing (Value vs. Effort)**: The Product AI analyzes files affected, maps technical dependencies (e.g. database schema migrations must precede frontend styling components), and sequences the backlog to optimize the value-to-effort ratio (tackling quick-win, high-impact tasks first).

The human supervisor does not need technical project management expertise; they simply review and sign off on the Product agent's AI-sequenced roadmap.

### Q: So there is also going to be a backlog or something? How does it map to the board?
**A:** Yes. In the FB-Lane framework, the backlog is not stored in an external tool like Jira or Linear; it is built directly into the local **`PROJECT_BOARD.md`** file, divided into two distinct statuses:
1.  **`Inbox` (The Raw Backlog)**: This is where new user ideas, raw instructions, or rejected tasks requiring major re-scoping are placed first. These tasks are waiting to be triaged and analyzed.
2.  **`Ready` (The Prioritized Backlog)**: This is where fully scoped, dependency-resolved, and value-sequenced tasks live. Lane agents pull tasks directly from here when they are ready to work.

### Q: How do backlog items get reviewed? Are they automatically pulled in, or am I asked "Do you still want to do this?"
**A:** Backlog items are **never automatically pulled into development**. Development lanes only pull tasks that have been promoted to the `Ready` list. Backlog items (in `Inbox` or deferred status) follow an explicit review and sign-off cycle:
1.  **When Review Happens**: Backlog grooming occurs whenever you hand a new plan/goal to Product, or when the active `Ready` list runs dry. The `FB-Product` AI agent analyzes `Inbox` and deferred items to see if they align with the new goals or are now unblocked by recent code changes.
2.  **No Automated Promotion**: The AI Product agent does not move backlog items to `Ready` on its own. Instead, it grooms and packages the backlog, then prompts the user for explicit confirmation (e.g., *"I've triaged the backlog. I recommend promoting TASK-103 (previously deferred database optimization) to Ready because its backend dependency is now solved. Do you still want to do this?"*).
3.  **User Confirmation Gate**: You retain absolute control. You can approve the promotion, keep the task deferred in the backlog, adjust its scope, or delete it entirely. Tasks only enter the active development pool (`Ready`) after your explicit sign-off.

### Q: What is the typical day-to-day workflow for a user?
**A:** In most cases, your day-to-day workflow is simple, automated, and hands-off:
1.  **Draft Your Plan**: Write down your requirements, feature checklist, or PRD. (While you can write in plain text, **Markdown is highly preferred** because the agent can parse headers and checklists directly onto the `PROJECT_BOARD.md` without losing structure or details).
2.  **Hand Off to Product**: Give the plan directly to the main **`FB-Product`** thread.
3.  **Autonomous Execution**: Product parses your requirements, and creates and prioritizes tasks on the project board. The parallel lane threads (`FB-Tech`/`FB-Design`) pull their respective tasks from the board, lock affected files, implement the changes, and hand them back for staging review and deployment.
4.  **Review Deliverables**: Product hands you the staging links, code PRs, and verification artifacts (e.g. test logs, walkthroughs, layout screenshots) for your final approval.

### Q: What is the alternative workflow if I want to talk directly to a specific lane (e.g., Tech or Design)?
**A:** If you want to bypass the Product lane to refine a specific feature (like pair-programming a backend fix or iterating on a button layout), the workflow is:
1.  **Direct Instruction**: Describe the goal directly in the specific lane's thread (e.g., *"Design, make this button tactile and green"*).
2.  **Autonomous Claim & Lock**: Before writing code, the lane agent checks `PROJECT_BOARD.md`, claims the task, asserts the resource locks on target files (e.g. `Button.css`), and commits the board update.
3.  **Implement & Test**: The lane agent checks out its isolated feature branch (e.g. `design/TASK-102`), writes code, and runs functional/visual checks.
4.  **Staging QA**: The lane agent pushes the branch to the remote and updates `PROJECT_BOARD.md` to `Staging QA`.
5.  **Product Gate Review**: Product reviews the staging build, merges the branch to `main`, and removes the resource locks (unlocking the files).

### Q: If a lane completes its work, does it get notified when Product merges it and finishes?
**A:** Yes. When `FB-Product` completes the staging review, merges the branch to `main`, and removes the file locks on the board, a completion loop triggers:
1.  **Direct Notification**: Product sends a notification message back to the active lane thread (e.g., *"TASK-102 has been successfully merged and locks have been released. This task is complete."*).
2.  **Board Sync**: Product marks the task `Done` on `PROJECT_BOARD.md` and deletes the file locks. Other active threads scan the board and immediately see that those files are now free.
3.  **Local Branch Cleanup**: Once notified, the lane agent (or developer) safely deletes its local feature branch (`git branch -d [branch-name]`) to keep the workspace clean.

### Q: How much manual coordination does the user have to do?
**A:** Virtually none. The human user is completely shielded from the mechanics of project management, task board updates, branch checkouts, and Git merges. Your role is strictly restricted to **giving instructions/plans** and **reviewing staging outputs/verification artifacts**. The agents autonomously handle all background logistics, testing, and Git operations in between.

---

## 6. Platform Integration (Antigravity, Claude, Codex)

### Q: How does execution differ between Antigravity, Claude Code, and Codex?
**A:** The framework operates differently based on the platform's orchestration capabilities:
*   **Antigravity (Programmatic Multi-Agent)**: The main `FB-Product` thread runs on an agentic SDK. It uses programmatic tools (`define_subagent` and `invoke_subagent`) to spin up sandboxed background threads for `FB-Tech` and `FB-Design` autonomously.
*   **Claude Code (Native Subagents + MCP)**: Four lane agents (`fb-product`, `fb-tech`, `fb-design`, `fb-business`) are registered as Claude Code subagents in `.claude/agents/` and invokable directly from the sidebar via `@mention`. The `fb-lane` MCP server connects all four to the same `PROJECT_BOARD.md` for real-time status and lock checks. The main session acts as FB-Product by default; open separate sidebar conversations for each lane to run them concurrently. Install as a plugin in one step: `/plugin marketplace add friedbeef1/fb-lane-coordination`. See [`platforms/claude-code/`](platforms/claude-code/README.md).
*   **Codex (Local File/Git Agent)**: The main benefit is that you can give multiple lane instructions at once, Codex can run them concurrently with native subagents or sidebar threads, and FB-Lane keeps those concurrent tasks from editing the same files or losing handoff context. FB-Lane's Codex value is the collision-control protocol: local rules (e.g., `.codex/rules.md`), a shared project board/current-task file, file claims, handoff docs, and Product/Captain integration gates.

### Q: What is the main benefit of FB-Lane in Codex?
**A:** The main benefit is not that FB-Lane creates parallelism. Codex already has native subagents. The benefit is that you can give several lane instructions at once and let Codex run them concurrently without those lanes stepping on each other's files, losing context, or forcing you to manually coordinate locks and handoffs.

The practical Codex split is:
*   **Concurrency engine**: Codex native subagents.
*   **Coordination safety**: FB-Lane board/status/claim/handoff protocol.
*   **Final integration**: Product/Captain thread.

Example Product/Captain prompt:
```text
Product/Captain mode.

Run this in parallel where safe:
@tt-design create warmer prep-screen icon direction.
@tt-tech check whether the prep flow touches risky auth/data paths.
@tt-business tighten the prep-step copy for anxious interview users.

Keep file scopes separate. Integrate the lane outputs here.
```

### Q: In Codex, can I address lanes like `@tt-design` or `@tt-tech`?
**A:** Yes, as a lightweight convention. It is not the same as Claude Code's native `@agent` mention unless your Codex environment has a matching agent router installed. In Codex, the repo rules can define these aliases:

```text
@tt-product  -> Product / Captain / Integration
@tt-design   -> UI, visuals, icons, layout, responsive QA
@tt-tech     -> implementation, auth, data, tests, reliability
@tt-business -> positioning, pricing, GTM, onboarding/help copy
```

In a Product/Captain thread, a bundle like this means "route or spawn lanes where safe":
```text
@tt-design I need new icons for the prep screen.
@tt-tech Check if this auth flow is safe.
@tt-product decide whether this should go into staging.
@tt-business rewrite this onboarding copy.
```

In a persistent sidebar thread, the same tag means "this thread should adopt that lane, sync from repo state, and claim files before editing."

### Q: How do separate Codex lane threads become aware of each other?
**A:** They do not share chat memory. They become aware through shared repo state.

The minimal automation loop is:
1. The lane runs a status command or reads `PROJECT_BOARD.md` / `.codex/current_task.md` before editing.
2. The lane claims intended files or surfaces.
3. The claim operation rejects overlaps with active lane claims.
4. The lane releases the claim when done.
5. Non-trivial lane output creates a short `docs/handoffs/` document for Product/Captain.

Example local script aliases some projects use:
```bash
npm run lane:status
npm run lane:claim -- --lane design --task "new prep icons" --files "components/Prep.tsx,index.css" --board TASK-123
npm run lane:release -- --session design/new-prep-icons-20260618 --status "released - handed to Product"
npm run lane:handoff -- --lane design --task "new prep icons" --board TASK-123 --files "components/Prep.tsx,index.css" --next-owner "Product / Captain"
```

The exact commands can be backed by `tools/fb-lane.cjs`, an MCP server, or a small repo-local helper. The key invariant is the same: every editing lane checks active locks before writing, and Product/Captain owns final integration.

### Q: Managing threads on Claude and Codex Desktop (non-CLI) sounds painful and full of friction. How can I make this easier?
**A:** We have created the **`fb-lane` automation utility** (`tools/fb-lane.cjs`) specifically to eliminate this manual friction. It automates branch management, project board edits, file locking, and git commits via two workflows:

1.  **For Claude Desktop (Zero Friction via MCP)**: You can register `tools/fb-lane.cjs` as a local Model Context Protocol (MCP) server in your `claude_desktop_config.json`. This allows Claude to claim tasks, checkout branches, update the board, and submit changes autonomously using standard tool calls. Your only job is starting the thread and telling Claude what task to execute.
2.  **For Cursor & Claude Web (Low Friction via CLI & Clipboard)**: Run the CLI tool locally:
    - `node tools/fb-lane.cjs claim <task-id> <lane> [locked_files]` claims the task on the board, locks files, checks out the branch, and **copies the startup prompt (with lane rules and task context) directly to your clipboard**. You just open a fresh thread and press Cmd+V (Paste)!
    - `node tools/fb-lane.cjs submit <task-id>` updates the status to Staging QA, commits, pushes to origin, and copies the PR review instructions to your clipboard.
    - `node tools/fb-lane.cjs merge <task-id>` handles merging the feature branch into main, releasing the board locks, pushing, and deleting the branch.
3.  **For Codex Desktop (Hands-Off Context Injection)**: The CLI claim command automatically writes the active task scope to a local file: **`.codex/current_task.md`**. You can add a single instruction in your project rules telling Codex to read this file upon startup. When you open Codex Desktop, it instantly picks up the branch, locked files, and task details, working on it completely hands-off.

### Q: If I do everything on the same thread in Claude, Codex, or Antigravity, won't the context window get bloated?
**A:** **Yes, absolutely.** Running everything on a single, long-running thread causes severe context window bloat, leading to:
1.  **Reasoning Degradation**: AI models lose performance, make mistakes, and forget rules as the chat history grows.
2.  **Scope Bleed**: The agent will start cross-modifying files from previous tasks (e.g., editing database logic while working on a styling layout).

To prevent this, the FB-Lane framework enforces strict **Thread Segmentation**:
*   **Claude (Projects/Cursor)**: You must start a fresh chat thread for every single task. Never discuss backend logic and styling changes in the same thread.
*   **Antigravity**: The `FB-Product` agent runs the orchestrator thread, but automatically spawns temporary, isolated subagents (`invoke_subagent`) for each task. Once complete, that subagent's conversation thread is archived and closed, protecting Product's memory.
*   **Codex**: Codex operates as a short-lived local execution. Because it uses file locking, it only reads the subset of files related to the active task, preventing it from sucking the entire codebase context into its window.

> [!NOTE]
> Detailed thread-segmentation instructions, system prompts, and configuration steps for each environment are fully documented in the platform-specific guides: [platforms/antigravity/README.md](platforms/antigravity/README.md), [platforms/claude/README.md](platforms/claude/README.md), and [platforms/codex/README.md](platforms/codex/README.md).

----

## 8. User Involvement & Thread Synchronization

### Q: I want to be involved less than 20% of the time. Which mode should I choose?
**A:** Choose **Main Approach: Autonomous Background Orchestration**. Under this option, you spend 95% of your time talking directly to the main **`FB-Product`** thread. Product will autonomously plan, write board tasks, spawn background workers (`FB-Tech`, `FB-Design`, `FB-Business`), run tests, and push branches silently in the background. Your interaction is restricted to reviewing the plan at the beginning (Plan Gate) and smoke testing the staging site at the end (Staging Gate) before merging.
*   **Main Approach: Autonomous Background Orchestration** is best if you want the agents to handle all task updates, branching, and execution in the background while you act purely as a supervisor.
*   **Optional Interaction: Interactive Direct Control** (Direct Lane Threads) is best if you want to pair-program, refine layouts, or discuss copy options directly with individual lane threads (`FB-Tech`, `FB-Design`, or `FB-Business`) or run interactive terminal sessions.

### Q: If I run background subagents, are my sidebar threads in the IDE meaningless?
**A:** **No.** They serve as your direct query interfaces and domain-expert assistants:
1. **Details & Inspections**: If you want to know technical details without reading files, click the `FB-Tech` sidebar thread and ask. The agent reads the local files and handoff notes to present a clean, domain-specific explanation.
2. **Individual Conversations**: If you ever want to bypass Product and give a direct instruction (e.g. asking Design to make a header transparent), you can do so directly in the sidebar thread. Design will check out the branch, implement it, and submit it, leaving Product to merge it.

### Q: How do State-Driven Writing Gates work?
**A:** By default, sidebar threads (`FB-Tech` and `FB-Design`) operate strictly as **read-only consultants**. This means they will not edit files or run commands that modify your codebase during brainstorming. They only unlock writing capabilities once a task is actively claimed (indicated by the presence of `.codex/current_task.md` matching their lane). 

### Q: Does the agent claim tasks on its own also?
**A:** Yes. You do not need to manually run claim commands or edit the board. Task claiming is fully automated:
*   Under the **Main Approach (Autonomous Background Orchestration)**, `FB-Product` automatically claims the task on the board, locks the files, and checks out the branch before spawning the subagent. The subagent starts with the task already claimed.
*   Under **Optional Interaction (Interactive Direct Control)**, when you instruct a lane agent directly in a thread, that lane agent autonomously runs the claim script, claims the task, and locks the files on `PROJECT_BOARD.md` before starting any code modifications.

### Q: What is the File Lock Boundary rule for agents?
**A:** Once a task is claimed and writing is unlocked, the agent is strictly prohibited from modifying files outside of the "Locked Files" declared in `.codex/current_task.md`. This prevents code-bleed and ensures styling agents never modify backend routes, and vice versa.

### Q: How do I perform quick edits without setting up a full task backlog?
**A:** You can run the fast-track command in your terminal:
```bash
node tools/fb-lane.cjs quick Tech "src/utils.ts" "Fix db indexing"
```
This automatically registers a temporary task (`TASK-Q-XXXX`) on your project board, checks out a `quick/` branch, locks the files, and immediately unlocks write capability for the `FB-Tech` agent in your active thread.

### Q: What if my sidebar threads show stale info or a pending button from a background run?
**A:** Because `PROJECT_BOARD.md` and git are the single source of truth, the threads are never actually out of sync. To force any sidebar thread to align its chat context with the actual state of your workspace instantly, just type **`status`** or **`SOP`** in that thread. The agent will read the board, detect the active branch, and update its context.

### Q: If I clear the chat context (e.g. via `/clear` or starting a fresh thread), how does the agent know which lane it is in when I type `status` or `SOP`?
**A:** Clearing context or starting a fresh thread is fully supported and even encouraged to keep the agent's context clean and prevent reasoning degradation. When you clear context and type `status` or `SOP`, the agent dynamically reconstructs its lane identity and task constraints from the local workspace state:
1. **Local State File (`.codex/current_task.md`)**: It reads this file first. The file explicitly documents the active `Task ID`, `Lane` (e.g. `FB-Tech`), `Feature Branch`, and `Locked Files`.
2. **Git Branch Parsing**: It runs git queries (like `git rev-parse --abbrev-ref HEAD` or `git branch --show-current`) to inspect the current checkout. The prefix (e.g. `tech/` or `design/`) lets the agent know which lane's branch it is currently working on.
3. **Project Board Reference (`PROJECT_BOARD.md`)**: It reads the project board and matches the active task ID from the Git branch with the designated owner (`FB-Tech`, `FB-Design`, `FB-Business`, or `FB-Product`) in the table.
4. **Agent Configurations & System Prompts**: On platforms like Antigravity, the registered subagent configuration or custom instructions (such as those in `.codex/rules.md` or `CLAUDE.md`) anchor the agent to its specific lane parameters (e.g. keeping `FB-Tech` restricted from stylesheet modifications).

---

## 9. Getting Started & Automation

### Q: Can I just ask Antigravity, Claude, or Codex to read this framework and set it up themselves?
**A:** **Yes, absolutely!** In fact, this is the recommended way to get started. You do not need to manually copy or configure files. 

Simply point your agent to this repository (or copy the framework files into a reference folder) and prompt:
> *"I want to bootstrap the FB-Lane Coordination Framework in our project workspace. Read this framework's templates and platform guide, and configure our workspace accordingly."*

The agents are designed to autonomously:
1.  **Copy the Templates**: Copy [templates/AGENTS.md](file:///./templates/AGENTS.md) and [templates/PROJECT_BOARD.md](file:///./templates/PROJECT_BOARD.md) directly to the root of your project repository and commit them.
2.  **Configure Your Platforms**: Follow the detailed guide for your platform of choice:
    *   **Antigravity**: Read the [Antigravity Guide](file:///./platforms/antigravity/README.md) and use the [project-coordination-setup](file:///./skills/project-coordination-setup/SKILL.md) skill to auto-register your subagent roles.
    *   **Claude & Cursor**: Read the [Claude Guide](file:///./platforms/claude/README.md) to set Custom Instructions and use the copy-pasteable [system prompts](file:///./platforms/claude/system-prompts.md).
    *   **Codex**: Read the [Codex Guide](file:///./platforms/codex/README.md) and copy the [Codex workflow rules](file:///./platforms/codex/workflow-rules.md) to your rules directory.
3.  **Claim Your First Task**: Triage your board, mark `TASK-001` (Setup & Bootstrap) as `In Progress`, check out a new branch, and start building!

---

## 10. Trivia

### Q: What does "FB" stand for?
**A:** "FB" can stand for a variety of concepts depending on the context:
*   **Frame Bound**: Representing the strict sandbox boundaries and containerized workspaces built around each agent lane.
*   **Feature Branch**: Emphasizing the isolated branch-per-task model that prevents code collisions.
*   **Flow Based**: Highlighting the state-driven transition of tasks through the project board.
*   **Function Block**: Mapping to the modular, component-centric architecture of the system.
*   **File Boundary**: Designating the strict file lock boundaries that prevent code-bleed between agents.
*   **Frontend/Backend**: Denoting the clear separation between visual styling and application logic.
... or it could mean Fried Beef, you never know ;)
