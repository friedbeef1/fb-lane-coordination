# FB-Lane on Antigravity

Antigravity is a highly agentic SDK with native support for multi-agent systems, background subagent executions, task scheduling, and inter-agent messaging. This directory contains instructions and templates to leverage Antigravity's tools to automate the FB-Lane coordination model.

## The Problem This Solves in Antigravity
Even in highly agentic workflows, complex projects can fail due to:
* **Tool Overload & Routing Confusion**: Giving one agent access to every available tool (e.g., database writes, styling files, Web audits, API invocations) leads to routing confusion and slower response times.
* **State Drift & Overwrites**: Multiple background agents working concurrently on the same branch will collide and overwrite each other's changes.

**How FB-Lane fixes this:**
* **Strict Tool Sandboxing**: Subagents are registered with only the tools they need (e.g., `FB-Business` is read-only, `FB-Design` only gets UI and styling tools).
* **Automated Orchestration**: `FB-Product` acts as the traffic controller, spawning background tasks sequentially or on isolated branches, and coordinating the merge gate.

## Orchestration Concept

In Antigravity, **`FB-Product`** is the main agent thread (or Integration Captain). It uses Antigravity tools to spawn and manage specialized subagents:

```
                  +-------------+
                  |  FB-Product  | (Captain / Main Thread)
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

## Setting Up Antigravity Skills

The FB-Lane Coordination framework for Antigravity is divided into two reusable skills to optimize token efficiency:

1.  **`project-coordination-setup`**: Handles verifying and bootstrapping the workspace files (`AGENTS.md`, `PROJECT_BOARD.md`) and programmatically registering `FB-Tech`, `FB-Design`, and `FB-Business` subagents.
    *   *Skill file:* [project-coordination-setup-skill.md](project-coordination-setup-skill.md)
2.  **`fb-lane-coordination`**: Guides the agent on how to use the local `tools/fb-lane.js` utility to claim, submit, and merge tasks autonomously using simple `run_command` invocations. This avoids having to register heavy MCP tool schemas, saving thousands of context window tokens.
    *   *Skill file:* [fb-lane-coordination-skill.md](fb-lane-coordination-skill.md)

---

## Custom Subagent JSON Configurations
These are the standard configurations Antigravity uses under the hood to instantiate the agents:

### 👑 FB-Product Config (`FB-Product/agent.json`)
```json
{
  "name": "FB-Product",
  "description": "Product Manager and Integration Captain. Central orchestrator of the workspace. Scopes tasks, spawns subagent threads, merges code, runs release gates, and manages deployments.",
  "config": {
    "customAgent": {
      "systemPromptSections": [
        {
          "title": "Agent System Instructions",
          "content": "You are FB-Product, the PM and Integration Captain.\n\n### Role & Responsibilities:\n1. **Orchestration**: Create/update scoped tasks in PROJECT_BOARD.md.\n2. **Spawning**: Spawn FB-Tech, FB-Design, or FB-Business subagents using `invoke_subagent` to execute prioritized tasks.\n3. **Integrations**: Review PRs, merge git branches, and run release gates.\n4. **Authority**: Only you are authorized to run staging/production deployment scripts."
        }
      ],
      "toolNames": ["send_message", "invoke_subagent", "define_subagent", "manage_subagents", "run_command", "write_to_file", "replace_file_content", "view_file"]
    }
  }
}
```

### ⚙️ FB-Tech Config (`FB-Tech/agent.json`)
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

### 🎨 FB-Design Config (`FB-Design/agent.json`)
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

### 📝 FB-Business Config (`FB-Business/agent.json`)
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

## Operational Loop: Working with Antigravity

In Antigravity, the user acts as the external supervisor, interacting primarily with the `FB-Product` (Captain) thread. The agent framework coordinates the rest of the loop autonomously using the `fb-lane-coordination` skill:

### Step 1: Task Initialization & File Locking
1. **User Request**: Describe a feature or bugfix to the main Antigravity thread (e.g., *"Build user signup feature"*).
2. **Scoping**: `FB-Product` reviews requirements and updates `PROJECT_BOARD.md` to add the new tasks (e.g., `TASK-102`).
3. **Claiming**: Before spawning subagents, `FB-Product` executes the claim command via the skill:
   ```bash
   node tools/fb-lane.js claim TASK-102 Tech "src/auth.ts"
   ```
   This checks out the feature branch, updates the board to `In Progress`, and commits the board changes separately.

### Step 2: Parallel Spawning (Concurrent Execution)
1. **Spawning**: `FB-Product` uses `invoke_subagent` to spawn background tasks for `FB-Tech` (or `FB-Design`) on the active branch.
2. **Subagent Execution**: The spawned agent operates on the checkout branch and implements the requested code changes locally.
3. **Collaboration**: Subagents collaborate using inter-agent messaging (`send_message`).

### Step 3: Staging Verification & Gates
1. **Submit for QA**: When code changes are ready, the subagent (or Product) runs the submission command:
   ```bash
   node tools/fb-lane.js submit TASK-102 "https://staging.example.com"
   ```
   This commits the board update, pushes the branch to remote origin, and marks the status as `Staging QA`.
2. **Quality Gates**: `FB-Product` checks that functional test suites pass and runs visual audits to ensure viewport styling and text containment are correct.

### Step 4: Integration, Unlock & Completion
1. **Merge & Completion**: Once verified, `FB-Product` runs the merge command:
   ```bash
   node tools/fb-lane.js merge TASK-102
   ```
   This merges the branch to `main`, deletes the feature branch, releases the locked files on the board, commits the board changes, and pushes to remote.
2. **Notification**: Product notifies the user that the task is complete.

---

## Direct Lane Interactive Threads (Antigravity 2.0)

In addition to autonomous background subagent delegation orchestrated by `FB-Product`, Antigravity 2.0 supports running specialized lane agents directly on **main threads** (interactive terminal sessions). This allows developers to interact directly with `FB-Tech`, `FB-Design`, `FB-Business`, or `FB-Product` in their terminal while automatically maintaining the underlying board updates, git branching, and lock mechanics.

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
1. **Board Claim Hook**: The script programmatically executes `node tools/fb-lane.js claim` to checkout the appropriate branch, declare locks, and commit the board.
2. **Strict Sandbox Configuration**: It maps the target lane to the corresponding rules defined in the coordination model, configuring the agent's system prompt and capabilities (e.g. read-only tool limits for `Business`).
3. **Interactive Prompt**: It starts the conversational loop using the standard `User:` and `Agent:` terminal prompts.
4. **Command Approval**: When the agent requests a shell command execution (such as `npm test` or compilation checks), the safety policy will present an interactive `y/n` confirmation prompt to you before running the command.
