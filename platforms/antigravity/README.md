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

## Setting Up the Global Skill
The bootstrapper skill handles:
1. Verifying if `AGENTS.md` and `PROJECT_BOARD.md` exist (merging them safely if they do).
2. Generating the standard template files if they are missing.
3. Running `define_subagent` to programmatically register `FB-Tech`, `FB-Design`, and `FB-Business` as subagents in the environment.

*   You can find the complete skill definition at [project-coordination-setup-skill.md](project-coordination-setup-skill.md).

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

---

## Operational Loop: Working with Antigravity

In Antigravity, the user acts as the external supervisor, interacting primarily with the `FB-Product` (Captain) thread. The agent framework coordinates the rest of the loop autonomously:

### Step 1: Task Initialization & File Locking
1. **User Request**: Describe a feature or bugfix to the main Antigravity thread.
2. **Drift Audit**: Before scoping, `FB-Product` runs a drift audit (inspects active tasks, checks for file and schema updates from other threads, and ensures staging/live build statuses are aligned).
3. **Lock & Board Update**: `FB-Product` checks `PROJECT_BOARD.md` to verify that the target files/screens are not locked by other active tasks. It creates a scoped task card (e.g. `TASK-101`) detailing the changes, **assigns the resource locks** (declarative screens/files to be modified), and commits the board update.

### Step 2: Parallel Spawning (Concurrent Execution)
1. **Spawning**: `FB-Product` uses `invoke_subagent` to spawn background tasks for `FB-Tech` and/or `FB-Design` concurrently. Spawned subagents autonomously check the project board, lock files, and execute.
2. **Subagent Execution**:
   - `FB-Tech` checks out `tech/TASK-101` and implements database/API logic.
   - `FB-Design` checks out `design/TASK-101` and implements frontend layouts.
   - *Since they are running in parallel, they work concurrently without git collisions because their work is isolated by branches and locks.*
3. **Collaboration**: If `FB-Design` needs copy approved, it calls `send_message` to consult `FB-Business` (which acts in a read-only copywriting role) in the background.

### Step 3: Staging Verification & Gates
1. **Staging QA**: Subagents push their code to staging, mark `Staging QA` on the board, and notify `FB-Product`.
2. **Quality Gates**: `FB-Product` checks the build and runs static check suites:
   - **Functional Gates**: Ensures unit and integration tests pass.
   - **UI Visual QA Gates**: `FB-Product` triggers a visual audit using browser tools to verify that:
     - Text containment is perfect (no clipping, overlap, or overflow across mobile/desktop viewports).
     - Aesthetic/style integrity is intact (brand fonts load correctly, styling themes match specifications).

### Step 4: Integration, Unlock & Deployment
1. **Code Merge**: `FB-Product` merges the subagent branches into `main`.
2. **Unlock**: `FB-Product` removes the resource locks on the project board, freeing those screens/files for future tasks.
3. **Commit Docs Separately**: `FB-Product` commits any updates to `PROJECT_BOARD.md` or documentation in a separate commit from source code changes.
4. **Board Closure**: `FB-Product` updates the board item `TASK-101` to `Done` with final links, and reports the results back to the user.

