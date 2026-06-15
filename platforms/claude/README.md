# FB-Lane on Claude (Projects & Cursor)

Claude (via Claude Projects, Desktop, or Cursor IDE) is typically a single-threaded agent. It does not natively spawn background subagents. However, you can easily simulate the **FB-Lane Model** to protect Claude's context window from bloating and keep its focus razor-sharp.

## The Problem This Solves in Claude & Cursor
Claude Projects and Cursor chats are highly prone to:
* **Context Overload & Forgetfulness**: As a chat thread grows longer, Claude starts losing track of earlier instructions, forgets its system constraints, and suffers from degraded reasoning.
* **Scope Creep**: Without strict instruction boundaries, Claude will attempt to solve multiple unrelated tasks at once (e.g., trying to write backend endpoints while fixing a CSS centering bug), resulting in bloated diffs and bugs.

**How FB-Lane fixes this:**
* **Chat Thread Segmentation**: By starting a new, fresh chat thread for each lane/task (FB-Tech, FB-Design, FB-Business), you keep Claude's context window extremely clean and focused.
* **Instruction Anchoring**: The custom instructions and project knowledge files keep Claude anchored to its specific lane parameters, preventing it from straying into other files.
* **Simulated Tool Sandboxing**: Since Claude Projects cannot programmatically restrict tool access, role-based "sandboxing" is simulated via system instructions (e.g., instructing Claude that `FB-Business` is strictly read-only and `FB-Design` is restricted from editing backend logic).

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

To eliminate manual Git commands, board editing, and context copy-pasting, use the provided **`fb-lane` automation utility** (`tools/fb-lane.js`). It supports two modes:

### 1. Claude Desktop (Zero-Friction via MCP)
If you use the **Claude Desktop app**, you can configure it as a local **Model Context Protocol (MCP)** server. This allows Claude to autonomously checkout branches, update the markdown board, assert file locks, and submit PRs without you running any commands.

Add this to your `claude_desktop_config.json` (typically located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

Once registered, Claude Desktop will show the `fb_lane_status`, `fb_lane_claim`, `fb_lane_submit`, and `fb_lane_merge` tools, allowing it to manage the entire coordination lifecycle autonomously.

---

### 2. Cursor IDE & Claude Web (Low-Friction via CLI & Clipboard)
If you are using Cursor IDE or the Claude Web Projects interface, you can run the CLI utility to automate your workspace management. The utility automatically **copies startup prompts directly to your system clipboard** so you can paste them instantly into a new chat thread:

*   **To claim a task & lock files**:
    ```bash
    node tools/fb-lane.js claim TASK-102 Tech "src/auth.ts, src/db.ts"
    ```
    *This checks out the feature branch, updates the board, commits the change, and copies the startup prompt containing task context and lane rules to your clipboard. Simply paste (Cmd+V) in a new chat thread!*

*   **To submit a task for QA**:
    ```bash
    node tools/fb-lane.js submit TASK-102 "https://staging.example.com"
    ```
    *This updates the board, commits the change, pushes the branch to remote, and copies the review instructions for Product to your clipboard.*

*   **To merge and complete a task (Product)**:
    ```bash
    node tools/fb-lane.js merge TASK-102
    ```
    *This merges the branch into main, releases the locks on the board, commits, pushes, and deletes the local feature branch.*

---

## Operational Loop: Working with Claude

The step-by-step loop using the automation tools:

### Step 1: Task Initialization & File Locking
1. Run `node tools/fb-lane.js status` to view ready tasks and verify file locks.
2. Claim your task (e.g. `TASK-102`) in your chosen lane, specifying files to lock:
   ```bash
   node tools/fb-lane.js claim TASK-102 Tech "src/auth.ts"
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
   node tools/fb-lane.js submit TASK-102 "https://staging.example.com"
   ```
   *(Or ask Claude Desktop with MCP: "Submit TASK-102 with staging link https://staging.example.com").*
2. As **FB-Product**, run the merge command to complete the cycle:
   ```bash
   node tools/fb-lane.js merge TASK-102
   ```
   *(Or ask Claude Desktop with MCP: "Merge TASK-102").*

> [!NOTE]
> **Thread Initialization**: Claude Projects, Cursor, and other chat interfaces cannot programmatically start a new UI chat thread for you. You must manually start a fresh chat thread for each lane/task (e.g., one thread for `FB-Tech`, another for `FB-Design`). Because all threads operate on the same local workspace files and share the same git branch and `PROJECT_BOARD.md`, the different sessions remain fully in sync. Work done by Claude in one thread will be immediately visible and ready for testing or merging in the next thread.


