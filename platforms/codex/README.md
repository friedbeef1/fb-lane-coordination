# FB-Lane on Codex

Codex is a local developer agent that operates directly on your filesystem and git workspace. It excels at codebase audits, local compilation checks, and terminal automation. To coordinate multiple Codex threads working on the same project, the FB-Lane model relies on strict **branch isolation** and local **project board tracking**.

## The Problem This Solves in Codex
As a local, filesystem-active developer agent, Codex is prone to:
* **Merge Collisions**: If multiple Codex runs execute in the same workspace without branch isolation, they will overwrite each other's changes, corrupting the code state.
* **Dirty Git Logs**: Mixing project board tracking updates, markdown notes, and source code edits in a single commit makes PR reviews extremely difficult.
* **Scope Creep & Code Bleed**: Without rigid boundary constraints, a Codex run might aggressively modify stylesheets, schemas, and config files all in one go to solve a minor issue, introducing regressions.

**How FB-Lane fixes this:**
* **Mandatory Feature Branches**: Enforces the checkout of isolated branches (`tech/[feature]` or `design/[feature]`).
* **Atomic Documentation Commits**: Enforces committing `PROJECT_BOARD.md` updates separately from code changes.
* **Rigid Code Boundaries**: Prevents the agent from editing files or directories outside its assigned role (e.g., Tech lane cannot modify `.css` files).
* **Simulated Tool Sandboxing**: Enforces role restrictions in Codex's system instructions (e.g. `.codex/rules.md`), strictly prohibiting the agent from running write/deploy commands or modifying files outside its domain (such as keeping `FB-Business` read-only).

## Coordination Concept
Since Codex is a developer-centric CLI agent, its coordination model is built entirely around standard Git workflows and the local `PROJECT_BOARD.md`:

```
                    +--------------------+
                    |  PROJECT_BOARD.md  | (Local source of truth)
                    +---------+----------+
                              |
      +-----------------------+-----------------------+
      | (Tech Branch)         | (Design Branch)       | (Read-Only Copy)
      v                       v                       v
+-----+------+          +-----+------+          +-----+------+
| Codex as   |          | Codex as   |          | Codex as   |
| FB-Tech     |          | FB-Design   |          | FB-Business |
+------------+          +------------+          +------------+
```

1. **Board Claims**: Codex reads `PROJECT_BOARD.md` before writing code, claims a task by setting status to `In Progress`, and checks out a feature branch.
2. **Strict Git Isolation**: Codex creates a `tech/[feature]` or `design/[feature]` branch to isolate logic edits from styling edits.
3. **Separate Documentation Commits**: Updates to `PROJECT_BOARD.md` and documentation are committed separately from application code changes to keep diffs clean.
4. **Staging Gates**: Codex builds and tests the staging environment before handing off to the Integration Captain for merging.

---

## Automation & Reducing Manual Friction

To eliminate manual git dancing, board updates, and manual prompting in Codex Desktop, use the **`fb-lane` automation utility** (`tools/fb-lane.js`) in one of two modes:

### 1. Codex Desktop (Zero Friction via MCP)
Like Claude, the **Codex Desktop App** supports the Model Context Protocol (MCP). You can register `tools/fb-lane.js` as an MCP server directly through the Codex Desktop GUI (under **Settings > Plugins** or **MCP Servers**) or in its configuration settings:

```json
{
  "mcpServers": {
    "fb-lane": {
      "command": "node",
      "args": ["/Users/jamesyeang/.gemini/antigravity/scratch/fb-lane-coordination/tools/fb-lane.js", "mcp"]
    }
  }
}
```

Once configured, Codex Desktop gets direct tool-level access to Git and `PROJECT_BOARD.md` via `fb_lane_status`, `fb_lane_claim`, `fb_lane_submit`, and `fb_lane_merge`. The Codex agent can then manage its own branch checkout, file locking, board updates, and pushes autonomously.

---

### 2. Local Context Injection (Low Friction via CLI)
If you do not register the MCP server, you can run the CLI tool locally. The claim command automatically writes the active task scope to a local file: **`.codex/current_task.md`**:

```bash
node tools/fb-lane.js claim TASK-102 Tech "src/auth.ts"
```

Add this directive to your project instructions (e.g. `.codex/rules.md` or system instructions) to instruct Codex Desktop to auto-read the context file:
```markdown
# Codex Instructions
- You operate under the FB-Lane coordination framework.
- If the file .codex/current_task.md exists, read it immediately.
- Adhere strictly to the active branch, task ID, and locked files listed in that file. Do not modify files outside of the locked files or the assigned lane.
```
When you launch Codex Desktop, it will read `.codex/current_task.md` and immediately start working on the claimed task without you typing a single prompt.

---

## Operational Loop: Working with Codex

The step-by-step workflow using the automation tools:

### Step 1: Task Initialization & File Locking
Before starting any coding task, run the claim command:
```bash
node tools/fb-lane.js claim TASK-102 Tech "src/auth.ts"
```
*(If using Codex Desktop with MCP enabled, you can skip this step and simply tell Codex in the chat: "Claim TASK-102 for Tech locking src/auth.ts").*

### Step 2: Implement & Test
*   Launch Codex Desktop. It will auto-detect `.codex/current_task.md` (or read the board using MCP) and begin implementing the changes.
*   Run local test suites (e.g., `npm run test` or backend linters) to confirm logic compiles and is correct.
*   Perform a **Visual QA Audit** across viewports if any UI was modified.

### Step 3: Staging QA & Merge
1. **Submit for QA**:
   ```bash
   node tools/fb-lane.js submit TASK-102 "https://staging.example.com"
   ```
   *(Or ask Codex Desktop via MCP: "Submit TASK-102 with staging link https://staging.example.com").*
2. **Product Merge**:
   ```bash
   node tools/fb-lane.js merge TASK-102
   ```
   *(Or ask Codex Desktop via MCP: "Merge TASK-102").*


