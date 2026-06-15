# 🚀 FB-Lane Coordination Framework

**Run multiple AI agent threads concurrently on the same codebase — with zero merge conflicts, zero context overload, and strict scope safety.**

FB-Lane splits complex software development into four role-isolated workstreams (Product, Tech, Design, Business), each running in its own conversational thread. A version-controlled, markdown-based `PROJECT_BOARD.md` acts as the single source of truth and message bus for task state, branch names, and file-level resource locks.

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

* **Strict Tool Sandboxing**: Prevents tool overload and routing confusion. `FB-Tech` owns backend/logic, `FB-Design` owns styling/CSS, and `FB-Business` is strictly read-only on code.
* **Lightweight Resource Locking**: Locks specific files to prevent concurrent threads from stepping on each other's toes and producing merge conflicts.
* **Standard Operating Procedure (SOP)**: On every session start, threads automatically inspect the board and current task file to claim, align, or resume work without human hand-holding.
* **Two-Layer Handoff**: Worker threads summarize work back to the board and write structured handoff specs under `docs/handoffs/TASK-XXX.md` to ensure context is never lost.
* **Platform Agnostic**: Works natively with **Antigravity 2.0**, **Claude Projects**, and **Codex (OpenAI)**.

---

## ⚡ Quickstart (2 Minutes)

### 1. Copy the CLI tool into your repository
From your project root, run:
```bash
curl -o tools/fb-lane.js https://raw.githubusercontent.com/friedbeef1/fb-lane-coordination/main/tools/fb-lane.js
```
*(Or manually copy `tools/fb-lane.js` to a `tools/` folder in your project.)*

### 2. Run bootstrap
```bash
node tools/fb-lane.js bootstrap
```
This auto-detects your project's name and description from `package.json`, detects your remote origin URL, and generates:
* `PROJECT_BOARD.md` — The centralized task and file-locking board.
* `AGENTS.md` — Human and agent guidelines defining lane boundaries.
* `FB-Product/agent.json`, `FB-Tech/agent.json`, `FB-Design/agent.json`, `FB-Business/agent.json` — Sidebar agent configurations.
* `.codex/rules.md` — Codex rule integration.
* `docs/handoffs/` — Directory for structured lane handoffs.
* Automatically registers the `fb-lane` MCP server in your **Claude Desktop** config.

### 3. Open in your AI Platform
* **Antigravity**: Open the folder. The lane threads will appear instantly in the sidebar!
* **Claude Desktop**: Restart Claude. The `fb-lane` MCP toolset is ready to use.
* **Codex**: The rules file is already in place.

---

## 🔄 The Board Lifecycle

Every feature, bug, or improvement follows a simple, structured 4-step loop:

```
Inbox ──▶ Ready ──▶ In Progress ──▶ Staging QA ──▶ Done
```

1. **Claim**: A worker lane claims a `Ready` task:
   ```bash
   node tools/fb-lane.js claim TASK-001 Tech "src/api.ts"
   ```
   *Checks out a branch `tech/TASK-001-...`, locks `src/api.ts` on the board, and copies a startup instructions block to the clipboard.*
2. **Execute**: The agent implements changes on their branch in their isolated sandbox.
3. **Submit**: Once changes are ready:
   ```bash
   node tools/fb-lane.js submit TASK-001
   ```
   *Writes a detailed handoff document to `docs/handoffs/TASK-001.md`, updates the board status to `Staging QA`, and pushes the branch to remote origin.*
4. **Merge**: Product reviews the handoff and verifies the staging/PR:
   ```bash
   node tools/fb-lane.js merge TASK-001
   ```
   *Merges the branch to main, releases all file locks on the board, and sets the status to `Done`.*

---

## 🛠️ CLI Commands

Run from the root of your project:

| Command | Scope | Description |
|---------|-------|-------------|
| `node tools/fb-lane.js bootstrap` | Setup | Auto-generates board, rules, folder structures, and Claude configurations. |
| `node tools/fb-lane.js status` | Utility | Prints all active tasks, branch mappings, and active file locks. |
| `node tools/fb-lane.js claim <id> <lane> [locks]` | Workers | Checks out a task branch, locks files on the board, and prepares clipboard prompt. |
| `node tools/fb-lane.js quick <lane> <locks> [desc]` | Workers | Fast-track: creates a temporary task, checks out a quick branch, and unlocks write access. |
| `node tools/fb-lane.js submit <id> [staging_url]` | Workers | Formats board updates, pushes feature branch, and moves task to `Staging QA`. |
| `node tools/fb-lane.js merge <id>` | Product | Merges feature branch to main, unlocks files, and moves status to `Done`. |

---

## 🛡️ Safety & State-Driven Writing Gates

To prevent accidental codebase corruption or "rogue edits" when brainstorming with agents:
* **Read-Only by Default**: Worker agents (`FB-Tech`, `FB-Design`) operate strictly as read-only consultants by default. They will not modify files or run write commands in your active chat window.
* **Dynamic Writing Unlock**: Once a task is actively claimed (using the `claim` or `quick` commands), the presence of `.codex/current_task.md` matching their lane unlocks code-writing capability for that agent in the chat thread.
* **File-Lock Boundary**: When write access is unlocked, the agent's prompt strictly restricts writes to the files listed under the task's active locks.

---

## 👥 User Involvement Modes

Depending on your preferred style, you can choose between two operational patterns:
* **Option A: Autonomous Background Orchestration (<20% Involvement)**: You chat only with the main **`FB-Product`** thread. Product autonomously analyzes requirements, splits tasks, claims them on the board, locks files, and spawns subagents (`FB-Tech`/`FB-Design`) in the background silently. Your interaction is restricted to reviewing the plan at the beginning and smoke-testing staging at the end.
* **Option B: Interactive Direct Control (Pair-Programming)**: You chat directly with the sidebar worker threads (`FB-Tech`/`FB-Design`) to review plans, write code, and collaboratively debug. When you instruct a lane agent directly, it autonomously claims the task and locks the files on the board before modifying any files.
  * *Syncing Threads*: If a sidebar thread shows stale history or old buttons, simply type `status` or `SOP` in the thread to force the agent to sync with the board.

---

## 👑 The Four Lanes

| Lane | Role | Owns | Hard Sandbox Boundary |
|------|------|------|-----------------------|
| **FB-Product** | Captain / PM | Scoping, branch merges, release gates, deployments. | Never writes/modifies application feature code. |
| **FB-Tech** | Tech Lead | Backend, APIs, database schemas, migrations, tests. | Never touches CSS, page layouts, or visual styles. |
| **FB-Design** | UI / Designer | CSS, styles, design tokens, layout geometry, responsive UI. | Never touches backend code, API routes, or databases. |
| **FB-Business** | Copywriter | Onboarding texts, FAQs, messaging cards, documentation. | Read-only access to code. Markdown and docs files only. |

---

## 🏃 Option B: Direct Lane Interactive Threads (Antigravity 2.0)

For interactive CLI/terminal usage under Option B (Interactive Direct Control), you can run a lane agent directly in the main thread using the python runner:

```bash
python tools/run_lane.py <lane> <task_id> [locked_files]
```

#### Examples:
* Run the Tech agent on `TASK-102` locking `src/db.ts`:
  ```bash
  python tools/run_lane.py Tech TASK-102 "src/db.ts"
  ```
* Run the Design agent on `TASK-103`:
  ```bash
  python tools/run_lane.py Design TASK-103
  ```

This automatically claims the task on the project board, checks out the correct feature branch, configures the sandboxed system instructions for that lane, and begins the interactive terminal loop.

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
