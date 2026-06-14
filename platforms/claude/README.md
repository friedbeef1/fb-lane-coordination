# M-Lane on Claude (Projects & Cursor)

Claude (via Claude Projects, Desktop, or Cursor IDE) is typically a single-threaded agent. It does not natively spawn background subagents. However, you can easily simulate the **M-Lane Model** to protect Claude's context window from bloating and keep its focus razor-sharp.

---

## The Simulation Concept
Instead of running four separate processes in parallel, the user acts as the coordinator (`M-Product`) and instructs Claude to adopt a specific lane for each chat session. 

```
+--------------------------------------------------------+
|                      USER (M-Product)                  |
+---------------------------+----------------------------+
                            |
    +-----------------------+-----------------------+
    | (Chat 1: Logic)       | (Chat 2: CSS Layout)  | (Chat 3: Copy)
    v                       v                       v
+---+---------+         +---+---------+         +---+---------+
| Claude as   |         | Claude as   |         | Claude as   |
| M-Tech      |         | M-Design    |         | M-Business  |
+-------------+         +-------------+         +-------------+
```

### Context Hygiene (Crucial for Claude)
To manage Claude's context window:
1. **Start a new chat for every new task/lane**. Do not mix logic implementation (`M-Tech`) and styling audits (`M-Design`) in the same chat thread.
2. Upload `AGENTS.md` and `PROJECT_BOARD.md` to the **Claude Project Knowledge** (or add them as reference files in Cursor using `@AGENTS.md`).
3. Add the platform rules to the **Project Custom Instructions**.

---

## How to Set Up Claude Projects

1. **Create a Claude Project** for your codebase.
2. **Upload Reference Files**: Add `AGENTS.md` and `PROJECT_BOARD.md` to the Project Knowledge section.
3. **Set Custom Instructions**: Paste the overall platform guidelines into the Project Custom Instructions text area:
    ```markdown
    You are an AI assistant operating in a workspace that uses the M-Lane Coordination Model (detailed in the attached AGENTS.md).
    Before you start any work:
    1. Read AGENTS.md to understand your boundaries.
    2. Read PROJECT_BOARD.md to check active tasks.
    3. At the beginning of the chat, ask the user which lane (M-Tech, M-Design, or M-Business) you should adopt. 
    4. Adhere strictly to the boundaries of the adopted lane. Do not touch files outside your lane scope.
    ```

---

## Running the Workflow

When you start a task, prompt Claude to take on a specific role:

*   **For Logic Development**:
    > "Adopt the **`M-Tech`** lane. We are working on task `TASK-102` to implement user authentication API endpoints. Do not modify any frontend style files."
*   **For Design/Styling**:
    > "Adopt the **`M-Design`** lane. We are working on task `TASK-103` to update the layout geometry and typography styles of the dashboard. Do not modify database or API logic."
*   **For Copywriting**:
    > "Adopt the **`M-Business`** lane. We need to draft new onboarding copy and help page text. Provide your suggestions in a markdown format."

You can find copy-pasteable system prompts for each role in [system-prompts.md](system-prompts.md).
