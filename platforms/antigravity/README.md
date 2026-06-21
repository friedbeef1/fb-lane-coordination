# FB-Lane on Antigravity

Antigravity is a highly agentic SDK with native support for multi-agent systems, background subagent executions, task scheduling, and inter-agent messaging. This directory contains instructions and templates to leverage Antigravity's tools to automate the FB-Lane coordination model.

## ⚠️ The Pain Points & Elegant Fixes in Antigravity

Antigravity's highly agentic, multi-threaded nature is powerful, but complex multi-agent setups introduce specific developer pain points:

### 1. Memory Bloat & Conversation Degradation (The Bloat Pain Point)
* **The Pain Point**: Spawning background subagents that remain active indefinitely, or running multiple tasks in a single long-running subagent conversation, causes rapid context window bloat. The subagent's memory footprint grows, leading to degraded reasoning, slower response times, and increased token costs.
* **The Elegant Fix**: **Disposable Worker Subagents**. The main `FB-Product` lane orchestrator spawns highly focused, temporary subagents using `invoke_subagent` for each specific task (e.g., spawning `FB-Tech` for a database migration). Once the task is complete and submitted, that subagent's thread is terminated (via `manage_subagents` with action `kill`), keeping the orchestrator's and subagents' memory footprints clean and protecting performance.

### 2. Session Reset & Loss of Context (The State Loss Pain Point)
* **The Pain Point**: If the main orchestrator thread is cleared (`/clear`), restarted, or crashes mid-sprint, the agent loses its memory of active branches, file locks, running tasks, and what it was supposed to do next. The user is forced to re-explain the workspace state and manually align the agent.
* **The Elegant Fix**: **Instant Recovery**. Since `PROJECT_BOARD.md` and `.codex/current_task.md` serve as the local, filesystem-level source of truth, the agent has zero dependency on persistent chat session memory. Simply typing `status` or `SOP` forces the orchestrator to inspect the local project board and task context, identify the active branch, and instantly resume control with full context.

### 3. Tool Overload & Routing Confusion
* **The Pain Point**: Giving a single developer agent access to all tools (database, styling, web browser, file writes) leads to tool-routing errors, slower responses, and dangerous boundary violations (e.g., an agent modifying database schemas while trying to edit a CSS file).
* **The Elegant Fix**: **Strict Tool Sandboxing**. Antigravity subagents are registered with restricted tool subsets (e.g., `FB-Design` only gets UI/styling tools, `FB-Business` is strictly read-only on code). This keeps routing execution fast, cheap, and safe.

## How-To Video

The Antigravity 2.0 interaction demo lives in [`how-to-interact-demo/`](how-to-interact-demo/).
It shows the recommended workflow: let Antigravity provide native background subagents, let
FB-Product define and invoke bounded Tech / Design / Business lanes, and use `PROJECT_BOARD.md`
claims plus Product's merge gate to keep concurrent work safe.

Watch the rendered MP4:
[`how-to-interact-demo/renders/antigravity-how-to-interact.mp4`](how-to-interact-demo/renders/antigravity-how-to-interact.mp4).

## Orchestration Concept

In Antigravity, **`FB-Product`** is the main agent thread (representing User Value). It uses Antigravity tools to spawn and manage specialized subagents:

```
                  +-------------+
                  |  FB-Product  | (User Value / Main Thread)
                  +------+------+
                         |
      +------------------+------------------+
      |                  |                  |
      v                  v                  v
+-----+------+     +-----+------+     +-----+------+
|   FB-Tech   |     |  FB-Design  |     | FB-Business | (Background Subagents)
+------------+     +------------+     +------------+
```

1. **`define_subagent`**: Registers the subagents (`FB-Tech`, `FB-Design`, `FB-Business`) with specific tools, systems prompts, and access controls.
2. **`invoke_subagent`**: Launches the subagents concurrently in the background.
3. **`send_message`**: Sends instructions or reviews code updates.
4. **`schedule`**: Sets reminders or background checking loops.

---

## Quick Start: Bootstrapping a Project

### Method A: Antigravity Plugin (Recommended)
You can load the FB-Lane Coordination plugin directly in Antigravity by referencing it in your workspace's `.agents/plugins/marketplace.json` file:
```json
{
  "plugins": [
    {
      "name": "fb-lane-coordination",
      "source": {
        "source": "local",
        "path": "./plugins/fb-lane-coordination"
      }
    }
  ]
}
```
This automatically registers the `fb-lane-coordination` and `project-coordination-setup` skills, as well as the four lane subagents (`FB-Product`, `FB-Tech`, `FB-Design`, and `FB-Business`) directly in your workspace.

### Method B: AI-Powered Bootstrap
If you have an AI agent active in your workspace, simply paste this prompt:
> *"I want to bootstrap the FB-Lane Coordination Plugin in this workspace. Read the template files and CLI utility from the `fb-lane-coordination` repository, copy `tools/fb-lane.cjs` to my project's root `tools/` directory, and run `node tools/fb-lane.cjs bootstrap` to set up my project board, agents, rules, and Claude Desktop MCP configurations automatically."*

### Method C: Manual CLI Bootstrap
To automatically set up the plugin manually, copy `tools/fb-lane.cjs` to your repository root `tools/` folder and run:
```bash
node tools/fb-lane.cjs bootstrap
```

This bootstrap command automatically creates:
- `PROJECT_BOARD.md` (Project Task Board)
- `AGENTS.md` (Lane Boundaries & Rules)
- The agent configuration directories (`agents/FB-Product/agent.json`, `agents/FB-Tech/agent.json`, `agents/FB-Design/agent.json`, `agents/FB-Business/agent.json`)

**Next Step**: Open the project folder in **Antigravity 2.0**. The lane agents will automatically populate on your left sidebar!

---

## Setting Up Antigravity Skills

The FB-Lane Coordination plugin for Antigravity is divided into two reusable skills to optimize token efficiency:

1.  **`project-coordination-setup`**: Handles verifying and bootstrapping the workspace files (`AGENTS.md`, `PROJECT_BOARD.md`) and programmatically registering `FB-Tech`, `FB-Design`, and `FB-Business` subagents.
    *   *Skill file:* [SKILL.md](../../skills/project-coordination-setup/SKILL.md)
2.  **`fb-lane-coordination`**: Guides the agent on how to use the local `tools/fb-lane.cjs` utility to claim, submit, and merge tasks autonomously using simple `run_command` invocations. This avoids having to register heavy MCP tool schemas, saving thousands of context window tokens.
    *   *Skill file:* [SKILL.md](../../skills/fb-lane-coordination/SKILL.md)

---

## Custom Subagent JSON Configurations
These are the standard configurations Antigravity uses under the hood to instantiate the agents:

### 👑 FB-Product Config (`agents/FB-Product/agent.json`)
```json
{
  "name": "FB-Product",
  "description": "Product Manager optimizing User Value. Central orchestrator of the workspace. Scopes tasks, spawns subagent threads, merges code, runs release gates, and manages deployments.",
  "config": {
    "customAgent": {
      "systemPromptSections": [
        {
          "title": "Agent System Instructions",
          "content": "You are FB-Product, the PM optimizing User Value.\n\n### Role & Responsibilities:\n1. **Orchestration**: Create/update scoped tasks in PROJECT_BOARD.md.\n2. **Spawning**: Spawn FB-Tech, FB-Design, or FB-Business subagents using `invoke_subagent` to execute prioritized tasks.\n3. **Integrations**: Review PRs, merge git branches, and run release gates.\n4. **Authority**: Only you are authorized to run staging/production deployment scripts."
        }
      ],
      "toolNames": ["send_message", "invoke_subagent", "define_subagent", "manage_subagents", "run_command", "write_to_file", "replace_file_content", "view_file"]
    }
  }
}
```

### ⚙️ FB-Tech Config (`agents/FB-Tech/agent.json`)
```json
{
  "name": "FB-Tech",
  "description": "Tech Lead and Core Developer. Implements backend migrations, APIs, core app logic, and runs development tests.",
  "config": {
    "customAgent": {
      "systemPromptSections": [
        {
          "title": "Agent System Instructions",
          "content": "You are FB-Tech, the Tech Lead and Core Developer.\n\n### Role & Responsibilities:\n1. **Core Development**: Implement backend code, APIs, schemas, migrations, and third-party integrations.\n2. **Security**: Own database permissions (RLS/policies), credentials, and secret hygiene.\n3. **Verification**: Run tests (e.g. npm run test) and compilation checks.\n4. **Boundary**: Do not modify UI styling, CSS layouts, or frontend design classes."
        }
      ],
      "toolNames": ["send_message", "run_command", "write_to_file", "replace_file_content", "view_file", "list_dir", "grep_search"]
    }
  }
}
```

### 🎨 FB-Design Config (`agents/FB-Design/agent.json`)
```json
{
  "name": "FB-Design",
  "description": "UI/UX Designer and Layout Auditor. Edits frontend styles, handles page geometry layout, and performs visual audits on staging.",
  "config": {
    "customAgent": {
      "systemPromptSections": [
        {
          "title": "Agent System Instructions",
          "content": "You are FB-Design, the UI/UX Designer and Layout Auditor.\n\n### Role & Responsibilities:\n1. **Frontend Styling**: Modify CSS/HTML/JS styles for responsive, premium layouts.\n2. **Quality Gates**: Enforce strict text containment (no spill/clip) and typography integrity (correct font loading).\n3. **Visual QA**: Use browser tools to capture screenshots and verify layouts across mobile and desktop viewports.\n4. **Boundary**: Do not edit database schemas, API routes, or backend server logic."
        }
      ],
      "toolNames": ["send_message", "run_command", "write_to_file", "replace_file_content", "view_file", "list_dir", "call_mcp_tool"]
    }
  }
}
```

### 📝 FB-Business Config (`agents/FB-Business/agent.json`)
```json
{
  "name": "FB-Business",
  "description": "Business copywriter and positioning strategist. Focuses on onboarding text, documentation, user-facing messaging, and pricing/marketing copy.",
  "config": {
    "customAgent": {
      "systemPromptSections": [
        {
          "title": "Agent System Instructions",
          "content": "You are FB-Business, the copywriter and positioning strategist.\n\n### Role & Responsibilities:\n1. **Positioning**: Align copy with target audiences, write pricing cards and product benefits.\n2. **Copywriting**: Write onboarding copy, help center/FAQs, system documentation, and interface text.\n3. **Boundary (Read-Only)**: Propose copy updates to FB-Product or FB-Design; do not write code or run deployment commands."
        }
      ],
      "toolNames": ["send_message", "view_file", "list_dir", "grep_search", "search_web"]
    }
  }
}
```

## Main Approach: Autonomous Background Orchestration

In the Main Approach, the user acts as the supervisor, interacting primarily with the main `FB-Product` (User Value) thread. The agent plugin coordinates the rest of the loop autonomously in the background using the `fb-lane-coordination` skill:

### Step 1: Task Initialization & File Locking
1. **User Request**: Describe a feature or bugfix to the main Antigravity thread (e.g., *"Build user signup feature"*).
2. **Scoping**: `FB-Product` reviews requirements and updates `PROJECT_BOARD.md` to add the new tasks (e.g., `TASK-102`).
3. **Claiming**: Before spawning subagents, `FB-Product` executes the claim command via the skill:
   ```bash
   node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
   ```
   This checks out the feature branch, updates the board to `In Progress`, and commits the board changes separately.

### Step 2: Parallel Spawning (Concurrent Execution)
1. **Spawning**: `FB-Product` uses `invoke_subagent` to spawn background tasks for `FB-Tech` (or `FB-Design`) on the active branch.
2. **Subagent Execution**: The spawned agent operates on the checkout branch and implements the requested code changes locally.
3. **Collaboration**: Subagents collaborate using inter-agent messaging (`send_message`).

### Step 3: Staging Verification & Gates
1. **Submit for QA**: When code changes are ready, the subagent (or Product) runs the submission command:
   ```bash
   node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
   ```
   This commits the board update, pushes the branch to remote origin, and marks the status as `Staging QA`.
2. **Quality Gates**: `FB-Product` checks that functional test suites pass and runs visual audits to ensure viewport styling and text containment are correct.

### Step 4: Integration, Unlock & Completion
1. **Merge & Completion**: Once verified, `FB-Product` runs the merge command:
   ```bash
   node tools/fb-lane.cjs merge TASK-102
   ```
   This merges the branch to `main`, deletes the feature branch, releases the locked files on the board, commits the board changes, and pushes to remote.
2. **Notification**: Product notifies the user that the task is complete.

---

## Optional Interaction: Interactive Direct Control (Direct Lane Threads)

In addition to autonomous background subagent delegation orchestrated by `FB-Product` (Main Approach), Antigravity supports running specialized lane agents directly on **main threads** (interactive terminal sessions or dedicated IDE sidebar threads). This allows developers to interact directly with `FB-Tech`, `FB-Design`, `FB-Business`, or `FB-Product` in their workspace while automatically maintaining the underlying board updates, git branching, and lock mechanics.

### 🔑 Authentication Prerequisite
Make sure you have a valid Gemini API key set in your environment:
```bash
export GEMINI_API_KEY="your-api-key-here"
```
If you do not have an API key, you can obtain one from [Google AI Studio](https://aistudio.google.com/app/api-keys).

### 🚀 Running a Direct Lane Thread
Execute the `tools/run_lane.py` runner script to start an interactive lane agent loop:
```bash
python tools/run_lane.py <lane> <task-id> [locked_files]
```
*   **`<lane>`**: The target lane to run (`Tech`, `Design`, `Business`, or `Product`).
*   **`<task-id>`**: The task ID from `PROJECT_BOARD.md` (e.g., `TASK-102`).
*   **`[locked_files]`**: An optional comma-separated list of files to lock (e.g., `src/db.ts,src/auth.ts`).

#### Examples:
1. **Tech Lane**:
   ```bash
   python tools/run_lane.py Tech TASK-102 "src/api.ts"
   ```
2. **Design Lane**:
   ```bash
   python tools/run_lane.py Design TASK-103 "src/App.css"
   ```
3. **Business Lane (Read-Only)**:
   ```bash
   python tools/run_lane.py Business TASK-104
   ```

### 🛡️ How It Coordinates Internally
When you run the `run_lane.py` script:
1. **Board Claim Hook**: The script programmatically executes `node tools/fb-lane.cjs claim` to checkout the appropriate branch, declare locks, and commit the board.
2. **Strict Sandbox Configuration**: It maps the target lane to the corresponding rules defined in the coordination model, configuring the agent's system prompt and capabilities (e.g. read-only tool limits for `Business`).
3. **Interactive Prompt**: It starts the conversational loop using the standard `User:` and `Agent:` terminal prompts.
4. **Command Approval**: When the agent requests a shell command execution (such as `npm test` or compilation checks), the safety policy will present an interactive `y/n` confirmation prompt to you before running the command.

> [!NOTE]
> **Thread Initialization & Context Clearing**: The parent integration agent (or assistant) cannot programmatically spawn a new conversation UI thread in the IDE panel for you. When working across multiple lanes in the IDE, you should start the conversation thread manually for each lane (e.g. `FB-Tech` or `FB-Design`) from the sidebar, and let the agents coordinate the work.
> 
> Furthermore, **clearing the thread (e.g., via `/clear` or starting a fresh chat window) is highly encouraged** for each new task to avoid context bloat and reasoning degradation. Because all threads operate on the same local workspace files and share the exact same git branch, `.codex/current_task.md`, and `PROJECT_BOARD.md`, the different sessions remain fully in sync.
> 
> If you clear context, simply typing `status` or `SOP` in the fresh thread prompts the agent to inspect the local files (like `.codex/current_task.md` and `PROJECT_BOARD.md`) and run Git queries (like `git branch --show-current`) to immediately determine its active lane, task ID, and locked files, resuming control instantly.
