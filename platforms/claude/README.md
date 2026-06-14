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

## How to Set Up Claude Projects

1. **Create a Claude Project** for your codebase.
2. **Upload Reference Files**: Add `AGENTS.md` and `PROJECT_BOARD.md` to the Project Knowledge section.
3. **Set Custom Instructions**: Paste the overall platform guidelines into the Project Custom Instructions text area:
    ```markdown
    You are an AI assistant operating in a workspace that uses the FB-Lane Coordination Model (detailed in the attached AGENTS.md).
    Before you start any work:
    1. Read AGENTS.md to understand your boundaries.
    2. Read PROJECT_BOARD.md to check active tasks.
    3. At the beginning of the chat, ask the user which lane (FB-Tech, FB-Design, or FB-Business) you should adopt. 
    4. Adhere strictly to the boundaries of the adopted lane. Do not touch files outside your lane scope.
    ```

---

## Operational Loop: Working with Claude

Since Claude is single-threaded, the user coordinates the project lifecycle by opening distinct, concurrent chat threads with Claude adopting different roles. The user acts as the **Integration Captain (FB-Product)** when scoping, merging, and deploying, but talks directly to Claude as **FB-Tech**, **FB-Design**, or **FB-Business** in separate threads to execute tasks:

### Step 1: Task Initialization & File Locking
1. **Select Task**: Choose an available task (e.g. `TASK-102`) from the `Ready` list on the board.
2. **Branch & Lock**: Checkout the feature branch (e.g., `tech/TASK-102-auth`) and update `PROJECT_BOARD.md` to `In Progress` with the declared file locks. (If using Cursor, simply instruct Claude to run these terminal commands and commit the board separately).

### Step 2: Open a Dedicated Chat Thread (Concurrent Execution)
1. **Always open a fresh, empty chat thread** in Claude Projects or Cursor for a new task. Do not reuse old chats to prevent context bloat. You can run multiple task threads concurrently (e.g. one for tech bug fixing, one for design styling) as long as they work on different branches and non-overlapping locked files.
2. Prompt Claude to adopt the specific lane and define its boundaries:
   > "Adopt the **`FB-Tech`** lane. We are working on branch `tech/TASK-102-auth-endpoint` to implement user authentication. Do not edit styling files or UI templates."
   
   *(You can find copy-pasteable system prompts for each role in [system-prompts.md](system-prompts.md)).*

### Step 3: Implement & Verify
1. Direct Claude to draft modifications or write files.
2. Run compilation commands, test suites, or linters locally. If errors occur, paste the console logs back into the Claude chat.
3. If modifying UI, run a **Visual QA Audit**:
   - Verify text containment across mobile/desktop viewports (zero text clipping or overflow).
   - Ensure aesthetic integrity (brand fonts and styling colors load correctly).
4. Commit code changes regularly.

### Step 4: Staging QA & Merge
1. **Push & Staging QA**: Push the branch to the remote and update `PROJECT_BOARD.md` status to `Staging QA` (including the PR and staging links).
2. **Product Merge**: Verify the staging build, merge the branch into `main`, and set the status to `Done` in `PROJECT_BOARD.md` (releasing the resource locks). Commit the board update separately.

