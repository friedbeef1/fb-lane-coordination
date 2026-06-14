# FB-Lane on Claude (Projects & Cursor)

Claude (via Claude Projects, Desktop, or Cursor IDE) is typically a single-threaded agent. It does not natively spawn background subagents. However, you can easily simulate the **FB-Lane Model** to protect Claude's context window from bloating and keep its focus razor-sharp.

## The Problem This Solves in Claude & Cursor
Claude Projects and Cursor chats are highly prone to:
* **Context Overload & Forgetfulness**: As a chat thread grows longer, Claude starts losing track of earlier instructions, forgets its system constraints, and suffers from degraded reasoning.
* **Scope Creep**: Without strict instruction boundaries, Claude will attempt to solve multiple unrelated tasks at once (e.g., trying to write backend endpoints while fixing a CSS centering bug), resulting in bloated diffs and bugs.

**How FB-Lane fixes this:**
* **Chat Thread Segmentation**: By starting a new, fresh chat thread for each lane/task (FB-Tech, FB-Design, FB-Business), you keep Claude's context window extremely clean and focused.
* **Instruction Anchoring**: The custom instructions and project knowledge files keep Claude anchored to its specific lane parameters, preventing it from straying into other files.

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

Since Claude is single-threaded, the user acts as the **Integration Captain (`FB-Product`)** to guide Claude through the development lifecycle:

### Step 1: Claim Task & Branch Checkout
1. Select a task in `PROJECT_BOARD.md` (e.g., `TASK-102`).
2. Locally, checkout a clean feature branch prefixing the lane:
   ```bash
   git checkout -b tech/TASK-102-auth-endpoint
   ```
3. Update `PROJECT_BOARD.md` to change the status to `In Progress` under `TASK-102` and commit the board update.

### Step 2: Open a Dedicated Chat Thread
1. **Always open a fresh, empty chat thread** in Claude Projects or Cursor for a new task. Do not reuse old chats to prevent context bloat.
2. Prompt Claude to adopt the specific lane and define its boundaries:
   > "Adopt the **`FB-Tech`** lane. We are working on branch `tech/TASK-102-auth-endpoint` to implement user authentication. Do not edit styling files or UI templates."
   
   *(You can find copy-pasteable system prompts for each role in [system-prompts.md](system-prompts.md)).*

### Step 3: Implement & Verify
1. Direct Claude to draft modifications or write files.
2. Run compilation commands, test suites, or linters locally. If errors occur, paste the console logs back into the Claude chat.
3. Commit code changes regularly.

### Step 4: Staging QA & Handoff
1. Push the branch to GitHub:
   ```bash
   git push origin tech/TASK-102-auth-endpoint
   ```
2. Switch Claude to the **`FB-Product`** lane (or start a fresh chat) and ask it to update `PROJECT_BOARD.md` to `Staging QA` with the PR and branch links. Commit `PROJECT_BOARD.md` separately.
3. Verify on staging, merge the branch, and update the task status to `Done`.

