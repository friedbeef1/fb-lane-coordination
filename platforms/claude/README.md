# FB-Lane on Claude (Projects & Cursor)

Claude (via Claude Projects, Desktop, or Cursor IDE) is typically a single-threaded agent. It does not natively spawn background subagents. However, you can easily simulate the **FB-Lane Model** to protect Claude's context window from bloating and keep its focus razor-sharp.

## ⚡ Quick Setup

### Method A: AI-Powered Bootstrap (Recommended)
If you have an AI agent active in your workspace, simply paste this prompt:
> *"I want to bootstrap the FB-Lane Coordination Plugin in this workspace. Read the template files and CLI utility from the `fb-lane-coordination` repository, copy `tools/fb-lane.cjs` to my project's root `tools/` directory, and run `node tools/fb-lane.cjs bootstrap` to set up my project board, agents, rules, and Claude Desktop MCP configurations automatically."*

### Method B: Manual CLI Bootstrap
1. Download the CLI script:
   ```bash
   curl -o tools/fb-lane.cjs https://raw.githubusercontent.com/friedbeef1/fb-lane-coordination/main/tools/fb-lane.cjs
   ```
2. Run bootstrap:
   ```bash
   node tools/fb-lane.cjs bootstrap
   ```

---

## ⚠️ The Pain Points & Elegant Fixes in Claude

> **Reality check:** Claude Projects and Claude Desktop are **single-threaded** chat surfaces — one
> conversation, no native background subagents and no native tool-permission restrictions. So here
> FB-Lane is not adding parallelism; it is a *discipline* that protects the one context window you
> have and simulates the boundaries the platform cannot enforce on its own.

Single-threaded chat surfaces have three concrete, verifiable pain points:

### 1. Context Overload & Reasoning Degradation (The Bloat Pain Point)
* **The Pain Point**: There is only one context window, and everything shares it. As a single thread
  grows — and especially when one thread juggles backend logic, CSS, and copy at once — earlier
  instructions and lane constraints get pushed out of effective attention. Claude starts forgetting
  its own rules, contradicting earlier decisions, and reasoning gets noticeably worse.
* **The Elegant Fix**: **Lane-Per-Thread Segmentation**. Each lane/task runs in its own fresh chat
  (`FB-Tech`, `FB-Design`, `FB-Business`), so each window holds only what that lane needs. The
  threads don't need to remember each other because state lives on disk: `PROJECT_BOARD.md`,
  `.codex/current_task.md`, and the git branch are the shared memory, so a clean thread can pick up
  full context by reading them (`status` / `SOP`) instead of carrying a bloated history.

### 2. Scope Creep & Code-Bleed (The Boundary Pain Point)
* **The Pain Point**: Ask one general thread to "just fix this" and it will happily reach across
  domains — rewriting a backend endpoint while fixing a CSS centering bug — producing sprawling
  diffs that are hard to review and prone to regressions.
* **The Elegant Fix**: **Instruction-Anchored Lanes + File Claims**. The lane's pasted startup
  prompt (and the Project Knowledge / Custom Instructions) anchors Claude to one role, and the
  task's claimed files on `PROJECT_BOARD.md` define exactly which files it may write. Work stays
  scoped to one domain and one small, reviewable diff.

### 3. No Native Tool Sandboxing (The Enforcement Pain Point)
* **The Pain Point**: Unlike Claude Code subagents, Claude Projects/Desktop cannot programmatically
  restrict tool access. There is no platform switch that makes `FB-Business` physically read-only or
  stops `FB-Design` from editing backend code.
* **The Elegant Fix**: **Simulated Sandboxing via Instructions**. Role boundaries are enforced in
  the system/lane instructions (e.g., `FB-Business` is told it is strictly read-only; `FB-Design`
  is told never to touch backend logic). This is a *behavioral* guardrail, not a hard sandbox — it
  is honest about the platform's limits, and it works because each lane thread only ever holds its
  own role's rules.

## The Simulation Concept
Instead of running four separate processes in parallel, the user acts as the coordinator (`FB-Product`) and instructs Claude to adopt a specific lane for each chat session. 

```
+--------------------------------------------------------+
|                      USER (FB-Product)                  |
+---------------------------+----------------------------+
                            |
    +-----------------------+-----------------------+
    | (Chat 1: Logic)       | (Chat 2: CSS Layout)  | (Chat 3: Copy)
    v                       v                       v
+---+---------+         +---+---------+         +---+---------+
| Claude as   |         | Claude as   |         | Claude as   |
| FB-Tech      |         | FB-Design    |         | FB-Business  |
+-------------+         +-------------+         +-------------+
```

### Context Hygiene (Crucial for Claude)
To manage Claude's context window:
1. **Start a new chat for every new task/lane**. Do not mix logic implementation (`FB-Tech`) and styling audits (`FB-Design`) in the same chat thread.
2. Upload `AGENTS.md` and `PROJECT_BOARD.md` to the **Claude Project Knowledge** (or add them as reference files in Cursor using `@AGENTS.md`).
3. Add the platform rules to the **Project Custom Instructions**.

---

## Automation & Reducing Manual Friction

To eliminate manual Git commands, board editing, and context copy-pasting, use the provided **`fb-lane` automation utility** (`tools/fb-lane.cjs`). It supports two modes:

### 1. Claude Desktop (Zero-Friction via MCP)
If you use the **Claude Desktop app**, you can configure it as a local **Model Context Protocol (MCP)** server. This allows Claude to autonomously checkout branches, update the markdown board, assert file locks, and submit PRs without you running any commands.

Add this to your `claude_desktop_config.json` (typically located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "fb-lane": {
      "command": "node",
      "args": ["/Users/jamesyeang/.gemini/antigravity/scratch/fb-lane-coordination/tools/fb-lane.cjs", "mcp"]
    }
  }
}
```

Once registered, Claude Desktop will show the `fb_lane_status`, `fb_lane_claim`, `fb_lane_submit`, and `fb_lane_merge` tools, allowing it to manage the entire coordination lifecycle autonomously.

---

### 2. Cursor IDE & Claude Web (Low-Friction via CLI & Clipboard)
If you are using Cursor IDE or the Claude Web Projects interface, you can run the CLI utility to automate your workspace management. The utility automatically **copies startup prompts directly to your system clipboard** so you can paste them instantly into a new chat thread:

*   **To claim a task & lock files**:
    ```bash
    node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts, src/db.ts"
    ```
    *This checks out the feature branch, updates the board, commits the change, and copies the startup prompt containing task context and lane rules to your clipboard. Simply paste (Cmd+V) in a new chat thread!*

*   **To submit a task for QA**:
    ```bash
    node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
    ```
    *This updates the board, commits the change, pushes the branch to remote, and copies the review instructions for Product to your clipboard.*

*   **To merge and complete a task (Product)**:
    ```bash
    node tools/fb-lane.cjs merge TASK-102
    ```
    *This merges the branch into main, releases the locks on the board, commits, pushes, and deletes the local feature branch.*

---

## Operational Loop: Working with Claude

The step-by-step loop using the automation tools:

### Step 1: Task Initialization & File Locking
1. Run `node tools/fb-lane.cjs status` to view ready tasks and verify file locks.
2. Claim your task (e.g. `TASK-102`) in your chosen lane, specifying files to lock:
   ```bash
   node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
   ```
   *(If using Claude Desktop with MCP enabled, you can skip this step and simply ask Claude in the chat: "Claim TASK-102 for Tech locking src/auth.ts").*

### Step 2: Open a Dedicated Chat Thread
1. **Always open a fresh, empty chat thread** for a new task.
2. Paste (Cmd+V) the startup prompt generated by the claim command.
   *(If using Claude Desktop with MCP, Claude will read the board and active task status automatically via its tools).*

### Step 3: Implement & Verify
1. Direct the agent to write code.
2. Run local tests. If errors occur, paste the console logs back into the chat.
3. If modifying UI, run a **Visual QA Audit** across viewports to ensure layout integrity.
4. Commit changes regularly.

### Step 4: Staging QA & Merge
1. Run the submission command:
   ```bash
   node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
   ```
   *(Or ask Claude Desktop with MCP: "Submit TASK-102 with staging link https://staging.example.com").*
2. As **FB-Product**, run the merge command to complete the cycle:
   ```bash
   node tools/fb-lane.cjs merge TASK-102
   ```
   *(Or ask Claude Desktop with MCP: "Merge TASK-102").*

> [!NOTE]
> **Thread Initialization & Context Clearing**: Claude Projects, Cursor, and other chat interfaces cannot programmatically start a new UI chat thread for you. You must manually start a fresh chat thread for each lane/task (e.g., one thread for `FB-Tech`, another for `FB-Design`).
> 
> Furthermore, **clearing the thread (e.g., via `/clear` or starting a fresh chat window) is highly encouraged** for each new task to avoid context bloat and reasoning degradation. Because all threads operate on the same local workspace files and share the exact same git branch, `.codex/current_task.md`, and `PROJECT_BOARD.md`, the different sessions remain fully in sync.
> 
> If you clear context, simply typing `status` or `SOP` in the fresh thread will prompt the agent to inspect the local files (like `.codex/current_task.md` and `PROJECT_BOARD.md`) and run Git queries (like `git branch --show-current`) to immediately determine its active lane, task ID, and locked files, resuming control instantly.


