# 🚀 FB-Lane Coordination Framework

**Run multiple AI agent threads concurrently on the same codebase — with zero merge conflicts, zero context overload, and strict scope safety.**

> 📺 **[Watch the FB-Lane Demo Video on YouTube](https://youtu.be/wry1xhaEEBg)** — Click the preview below to watch the framework in action:
[![FB-Lane Framework Demo Video](https://img.youtube.com/vi/wry1xhaEEBg/maxresdefault.jpg)](https://youtu.be/wry1xhaEEBg)

Looking for quick answers, troubleshooting tips, or details on how the coordination loops work under the hood? Check out our [Frequently Asked Questions (FAQ)](FAQ.md).

FB-Lane splits complex software development into four role-isolated workstreams (Product, Tech, Design, Business), each running in its own conversational thread. A version-controlled, markdown-based `PROJECT_BOARD.md` acts as the single source of truth and message bus for task state, branch names, and file-level resource locks.

---

## ⚖️ Before & After: The FB-Lane Advantage

Compare how development works on complex, multi-layered features with AI agents:

| Development Challenge | Without FB-Lane Framework | With FB-Lane Framework | How the User Works Now |
| :--- | :--- | :--- | :--- |
| **Task Coordination** | No central board; tasks are scattered across commits or external tracking tools, leading to agent alignment confusion. | **`PROJECT_BOARD.md`**: A version-controlled, git-integrated local markdown file serving as the single source of truth and message bus. | **Real-Time Board Tracking**: View task statuses, branches, locks, and pull requests directly in your code editor. |
| **Concurrency & Collisions** | High risk of merge conflicts and regression as multiple agent threads modify the same files. | **Lightweight Resource Locking**: Tasks declare affected files on `PROJECT_BOARD.md`, establishing locks to prevent collisions. | **Concurrent Execution**: Direct multiple lanes to work at the same time; they will never step on each other's toes or collide. |
| **Context & Token Overload** | Large, bloated chat threads discussing copy, databases, and UI style together, causing agent confusion and poor outputs. | **Role-Isolated Lanes**: Tech, Design, Business, and Product operate in specialized, isolated threads with targeted capabilities. | **Zero-Risk Chat**: Chat with different lanes concurrently in separate tabs without worrying about messing up other parts of the codebase. |
| **Domain Safety (Code-Bleed)** | Copywriters editing React layouts or layout agents inadvertently breaking database schemas and backend models. | **State-Driven Writing Gates**: Tech cannot touch CSS/styles, Design cannot edit backend code, and Business is strictly read-only. | **Declare Intent**: Describe feature requirements; the framework automatically splits tasks and locks files programmatically. |
| **Code Reliability** | Broken or compile-failing code gets pushed to main/staging; tests are rarely run by agents. | **Pre-Submission Test Gate**: The CLI automatically executes test suites (e.g. `npm test`) and blocks pushing if tests fail. | **Smoke Testing**: Skip manual checkout and testing; you only perform a quick visual smoke test on the generated staging environment. |
| **Token Budget Protection** | Runaway debugging loops; agents attempt infinite edits to fix a bug, burning through your tokens. | **5-Retry Debug Cap**: Strict retry threshold pauses execution and escalates to the user if a bug can't be resolved in 5 attempts. | **Passive Monitoring**: Sit back; the framework notifies you immediately if a worker agent hits the cap and goes into a `Blocked` state. |
| **Handoffs & Context Retention** | Silent handoffs; subsequent agents must blindly read repo history to understand what prior agents changed. | **Structured Handoff Cards**: Automated creation of `docs/handoffs/TASK-XXX.md` summarizing decisions, risk details, and testing. | **Review Handoffs**: Read the short markdown handoff files to inspect implementation choices and risks before merging. |
| **Micro-Tasks & Hotfixes** | Manual branch creation, file tracking, and state sync, leading to developer overhead for simple edits. | **Fast-Track Quick Edits**: A single command (`node tools/fb-lane.cjs quick`) instantly checks out a branch and locks files for edits. | **Fast Hotfixes**: Run the `quick` command in your terminal to instantly pair-program on micro-tasks without board overhead. |


```
                  ┌──────────────────────┐
                  │      User Prompt     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      FB-Product      │ (Orchestrator / Main Thread)
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌────────────┐   ┌────────────┐   ┌────────────┐
     │  FB-Tech   │   │ FB-Design  │   │FB-Business │ (Worker Threads / Lanes)
     └──────┬─────┘   └─────┬──────┘   └─────┬──────┘
            │               │                │
            └───────────────┼────────────────┘
                            ▼
                  ┌──────────────────────┐
                  │   PROJECT_BOARD.md   │ (Single Source of Truth)
                  └──────────────────────┘
```

---

## 🌟 Key Features

* **Concurrent Multi-Lane Execution**: Direct multiple lanes (e.g., Tech and Design) to work simultaneously. Chat with different lanes concurrently in separate tabs without worrying about them stepping on each other's toes or corrupting other parts of the codebase.
* **Strict Tool Sandboxing**: Prevents tool overload and routing confusion. `FB-Tech` owns backend/logic, `FB-Design` owns styling/CSS, and `FB-Business` is strictly read-only on code.
* **Lightweight Resource Locking**: Locks specific files to prevent concurrent threads from stepping on each other's toes and producing merge conflicts.
* **Standard Operating Procedure (SOP)**: On every session start, threads automatically inspect the board and current task file to claim, align, or resume work without human hand-holding.
* **Two-Layer Handoff**: Worker threads summarize work back to the board and write structured handoff specs under `docs/handoffs/TASK-XXX.md` to ensure context is never lost.
* **Platform Agnostic**: Works natively with **Antigravity 2.0**, **Claude Projects**, and **Codex (OpenAI)**.

---

## ⚡ Quickstart

Initialize the framework in your workspace using one of the following methods:

### Method A: AI-Powered Bootstrap (Recommended — 30 Seconds)
If you are using a capable AI coding agent in your project workspace (such as Antigravity or Claude), simply paste the following instruction to let the agent retrieve, copy, and set up the framework autonomously:
> *"Visit the repository at `https://github.com/friedbeef1/fb-lane-coordination` and bootstrap the FB-Lane Coordination Framework in our project workspace. Read the templates and guides, copy the necessary config files, and initialize the directories accordingly."*

---

### Method B: Manual CLI Bootstrap (2 Minutes)

#### 1. Copy the CLI tool into your repository
From your project root, run:
```bash
curl -o tools/fb-lane.cjs https://raw.githubusercontent.com/friedbeef1/fb-lane-coordination/main/tools/fb-lane.cjs
```
*(Or manually copy `tools/fb-lane.cjs` to a `tools/` folder in your project.)*

#### 2. Run bootstrap
```bash
node tools/fb-lane.cjs bootstrap
```
This auto-detects your project's name and description from `package.json`, detects your remote origin URL, and generates:
* `PROJECT_BOARD.md` — The centralized task and file-locking board.
* `AGENTS.md` — Human and agent guidelines defining lane boundaries.
* `agents/FB-Product/agent.json`, `agents/FB-Tech/agent.json`, `agents/FB-Design/agent.json`, `agents/FB-Business/agent.json` — Sidebar agent configurations.
* `.codex/rules.md` — Codex rule integration.
* `docs/handoffs/` — Directory for structured lane handoffs.

#### 3. Open in your AI Platform
* **Antigravity**: Open the folder. The lane threads will appear instantly in the sidebar!
* **Claude Desktop**: Restart Claude. The `fb-lane` MCP toolset is ready to use.
* **Codex**: The rules file is already in place.

---

## 👥 How to Use

Depending on your preferred style, you can choose between two operational patterns:
* **Main Approach: Autonomous Background Orchestration (<20% Involvement)**: You chat only with the main **`FB-Product`** thread. Product autonomously analyzes requirements, splits tasks, claims them on the board, locks files, and spawns subagents (`FB-Tech`/`FB-Design`) in the background silently. Your interaction is restricted to reviewing the plan at the beginning and smoke-testing staging at the end.
* **Optional Interaction: Interactive Direct Control (Pair-Programming)**: You chat directly with the sidebar worker threads (`FB-Tech`/`FB-Design`) to review plans, write code, and collaboratively debug. When you instruct a lane agent directly, it autonomously claims the task and locks the files on the board before modifying any files.
  * *Syncing Threads*: If a sidebar thread shows stale history or old buttons, simply type `status` or `SOP` in the thread to force the agent to sync with the board.
  * *Direct Lane Interactive Threads (Antigravity 2.0)*: For interactive CLI/terminal usage under Optional Interaction, you can run any lane agent directly in the main thread using the python runner:
    ```bash
    python tools/run_lane.py <lane> <task_id> [locked_files]
    ```
    *Examples:*
    - Run the Tech agent on `TASK-102` locking `src/db.ts`: `python tools/run_lane.py Tech TASK-102 "src/db.ts"`
    - Run the Design agent on `TASK-103`: `python tools/run_lane.py Design TASK-103`
    This automatically claims the task on the project board, checks out the correct feature branch, configures the sandboxed system instructions for that lane, and begins the interactive terminal loop.

---

## 🔄 The Board Lifecycle

Every feature, bug, or improvement follows a simple, structured 4-step loop:

```
Inbox ──▶ Ready ──▶ In Progress ──▶ Staging QA ──▶ Done
```

1. **Claim**: A worker lane claims a `Ready` task:
   ```bash
   node tools/fb-lane.cjs claim TASK-001 Tech "src/api.ts"
   ```
   *Checks out a branch `tech/TASK-001-...`, locks `src/api.ts` on the board, and copies a startup instructions block to the clipboard.*
2. **Execute**: The agent implements changes on their branch in their isolated sandbox.
3. **Submit**: Once changes are ready:
   ```bash
   node tools/fb-lane.cjs submit TASK-001
   ```
   *Writes a detailed handoff document to `docs/handoffs/TASK-001.md`, updates the board status to `Staging QA`, and pushes the branch to remote origin.*
4. **Merge**: Product reviews the handoff and verifies the staging/PR:
   ```bash
   node tools/fb-lane.cjs merge TASK-001
   ```
   *Merges the branch to main, releases all file locks on the board, and sets the status to `Done`.*

---

## 🛠️ CLI Commands

Run from the root of your project:

| Command | Scope | Description |
|---------|-------|-------------|
| `node tools/fb-lane.cjs bootstrap` | Setup | Auto-generates board, rules, folder structures, and Claude configurations. |
| `node tools/fb-lane.cjs status` | Utility | Prints all active tasks, branch mappings, and active file locks. |
| `node tools/fb-lane.cjs claim <id> <lane> [locks]` | Workers | Checks out a task branch, locks files on the board, and prepares clipboard prompt. |
| `node tools/fb-lane.cjs quick <lane> <locks> [desc]` | Workers | Fast-track: creates a temporary task, checks out a quick branch, and unlocks write access. |
| `node tools/fb-lane.cjs submit <id> [staging_url]` | Workers | Formats board updates, pushes feature branch, and moves task to `Staging QA`. |
| `node tools/fb-lane.cjs merge <id>` | Product | Merges feature branch to main, unlocks files, and moves status to `Done`. |

---

## 🛡️ Safety & State-Driven Writing Gates

To prevent accidental codebase corruption or "rogue edits" when brainstorming with agents:
* **Read-Only by Default**: Worker agents (`FB-Tech`, `FB-Design`) operate strictly as read-only consultants by default. They will not modify files or run write commands in your active chat window.
* **Dynamic Writing Unlock**: Once a task is actively claimed (using the `claim` or `quick` commands), the presence of `.codex/current_task.md` matching their lane unlocks code-writing capability for that agent in the chat thread.
* **File-Lock Boundary**: When write access is unlocked, the agent's prompt strictly restricts writes to the files listed under the task's active locks.

---

## 👑 The Four Lanes

| Lane | Role | Owns | Hard Sandbox Boundary |
|------|------|------|-----------------------|
| **FB-Product** | User Value Optimizer / PM | Scoping, branch merges, release gates, deployments. | Never writes/modifies application feature code. |
| **FB-Tech** | Tech Lead | Backend, APIs, database schemas, migrations, tests. | Never touches CSS, page layouts, or visual styles. |
| **FB-Design** | UI / Designer | CSS, styles, design tokens, layout geometry, responsive UI. | Never touches backend code, API routes, or databases. |
| **FB-Business** | Copywriter | Onboarding texts, FAQs, messaging cards, documentation. | Read-only access to code. Markdown and docs files only. |

---

## 📖 Platform Integration Guides

Detailed walkthroughs for configuring and running the framework on specific developer platforms:

* **Antigravity 2.0**: [platforms/antigravity/README.md](platforms/antigravity/README.md)
* **Claude Desktop**: [platforms/claude/README.md](platforms/claude/README.md)
* **Codex**: [platforms/codex/README.md](platforms/codex/README.md)

*See [`examples/my-app/`](examples/my-app/README.md) for a mock project illustrating the post-bootstrap folder structure and a complete task workflow lifecycle.*

---

## 📄 License
[MIT](LICENSE)
