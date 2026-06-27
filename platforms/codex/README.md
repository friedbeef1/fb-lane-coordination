# FB-Lane on Codex

Codex is a local developer agent that operates directly on your filesystem and git workspace. It already supports native subagents for parallel work, worktrees for isolated background tasks, plugins for reusable workflows, skills for task-specific instructions, and MCP servers for shared tools and context. FB-Lane does not replace those capabilities.

The Codex pain point is narrower: once you start using those capabilities for real product work, someone still has to answer "who owns this?", "which files are safe to edit?", "what finished?", "what must Product integrate first?", and "what did the other lane decide?". FB-Lane gives Codex a lightweight product-coordination contract for that layer.

> **Codex reality check:** Codex already has concurrency and isolation primitives. FB-Lane is not what makes Codex parallel. FB-Lane is the shared-state protocol that makes parallel lane work easier to trust: lane identity, file claims, status checks, handoffs, and Product/Captain integration.

Use that protocol only when it reduces coordination risk. For a one-thread fix, a read-only answer,
or independent work where Codex worktrees already provide enough isolation, use Codex directly and
skip the board/handoff ceremony.

## 📺 How-To Video

> 📺 **[Watch the FB-Lane on Codex Video on YouTube](https://youtu.be/nVEGruk2R7Y)** (Cmd/Ctrl + click to open in a new tab)
> 
> [![FB-Lane on Codex Demo Video](https://img.youtube.com/vi/nVEGruk2R7Y/maxresdefault.jpg)](https://youtu.be/nVEGruk2R7Y)

## ⚡ Quick Setup

### Method A: Codex Plugin (Recommended)
Install the repo marketplace and plugin:

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

This installs:

- `bfm`, `fb-lane`, `fb-product`, `fb-tech`, `fb-design`, and `fb-business` Codex skills
- the bundled `fb-lane` MCP server
- plugin metadata for Codex's plugin browser

To upgrade an existing install after this repo changes:

```bash
codex plugin add fb-lane-coordination@fb-lane
codex plugin list | rg "fb-lane-coordination"
```

Start a new Codex thread after reinstalling. Existing threads can retain skill
context that was loaded before the upgrade. Older cache folders may remain on
disk, but Codex uses the installed version shown by `codex plugin list`.

After install, start a new Codex thread and ask for `$fb-lane` or a lane-specific skill. Natural
language also works, and `@fb-lane` remains a useful prompt convention if you want to make the lane
intent obvious. Example:

```text
$fb-lane status
```

Then describe the work in normal language:

```text
$fb-lane
Split this across Product, Tech, Design, and Business.
Use worktrees for code-writing lanes where helpful.
Each lane should claim files, write a handoff, and return to Product.
Product should sequence the final integration and tell me what is ready to merge.
Product should not claim or execute Tech/Design/Business source changes for the lanes.
```

When handoffs already exist and Product/Captain needs to sequence and route execution, use:

```text
$bfm process the prepared handoffs for this task and execute the sequence to completion.
```

For non-trivial BFM work, Product records approved OKRs in a `Goal Alignment Session` block on
`PROJECT_BOARD.md`: `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`,
`Approval: pending|approved`, and `Justification`. BFM blocks before execution if approval is
missing, OKRs are unclear, or a handoff is blocked by OKR ambiguity. If a handoff conflicts with
approved OKRs, BFM proposes aligned approaches, scope, or sequence and recommends one; it does not
edit approved OKRs.

BFM closes only after every handoff is marked `implemented`, `already done`, `blocked`,
`out of scope`, or `explicitly deferred`, and board/source/docs/tests agree or the gap is named.

The plugin does not create Codex's parallelism. Codex already has that. The plugin packages the coordination layer: skills, MCP status/claim/submit/merge tools, file locks, handoffs, and Product/Captain integration.

If the project itself still needs FB-Lane repo files, run the Codex-only bootstrap from the project
root:

```bash
node tools/fb-lane.cjs bootstrap --platform codex
node tools/fb-lane.cjs doctor
```

`doctor` is read-only. It checks the board, Codex rules, MCP config, handoff folder, active file
locks, git workspace, non-quick handoff `OKR Fit`, and approved Goal Alignment Session OKRs before
lane work starts.

### Fallback Setup

If you are not using the Codex plugin installer, use the fallback setup paths in [../../docs/setup.md](../../docs/setup.md).

---

## The Pain Point This Solves in Codex
Codex already gives you the building blocks for parallel work:

- **Subagents** can explore, test, or analyze work concurrently.
- **Worktrees** let Codex run independent tasks in separate Git checkouts so they do not disturb the foreground workspace.
- **Plugins, skills, and MCP servers** package reusable workflows and tools.

So the pain point is not "Codex cannot run multiple things." The pain point is what happens when a user tries to use that power like a real product team:

```text
@tt-design create new prep-screen icons.
@tt-tech check whether the auth flow is safe.
@tt-business rewrite onboarding copy.
@tt-product decide whether this goes to staging.
```

Without an explicit coordination layer, the user is still left to manage the product-level state:

- Which lane owns the task?
- Which files or surfaces are safe to edit?
- Are two lanes about to touch the same component from different angles?
- Did Business write copy for a feature Tech has not built yet?
- Did Design assume an API shape Tech changed?
- What should Product review first, and what must wait?
- Where is the handoff after the original chat context gets cleared?

Codex worktrees reduce direct workspace interference. Codex subagents reduce context overload and can save time. But neither one is, by itself, a product coordination board, lane-boundary policy, or handoff protocol.

**What this does not claim:** FB-Lane does not claim Codex is unable to run parallel work, isolate work in worktrees, or package workflows through plugins. Those are Codex capabilities. FB-Lane makes the product/team semantics around that work explicit and durable.

**How FB-Lane fixes this elegantly:**

- **Shared board**: `PROJECT_BOARD.md` records owner, scope, status, locks, links, QA, and next owner.
- **Lane identity**: `fb-product`, `fb-tech`, `fb-design`, and `fb-business` make ownership explicit before work starts.
- **File claims**: lanes claim files/surfaces before editing and stop when another active lane owns the same area.
- **Boundary rules**: Tech does not drift into styling, Design does not drift into auth/data, and Business stays read-only on app code.
- **Handoff docs**: non-trivial lane output lands in `docs/handoffs/` so Product can integrate from durable repo state instead of scattered chat history.
- **Product endpoint**: Product/Captain sequences dependencies, resolves conflicts, checks staging readiness, and owns the final merge decision.

The result: Codex still does what it is good at, but the user no longer has to be the human traffic controller for every parallel lane.

---

## How FB-Lane Works With Codex Worktrees

Codex worktrees and FB-Lane are not competing answers to the same problem.

- **Worktrees are physical isolation**: each task or lane can run in a separate Git checkout, so one thread's edits do not disturb another thread's working directory.
- **FB-Lane is coordination**: each lane has an owner, scope, file claim, status, handoff, and Product/Captain integration path.

In plain terms: worktrees give each lane a separate workspace. FB-Lane gives each lane a job, a claim ticket, and a handoff back to Product.

Use the tools this way:

- **Use Codex worktrees alone** when the tasks are technically independent and you are comfortable reviewing branches and merge order yourself.
- **Use FB-Lane alone** for planning, copy, design review, product decisions, small edits, or one Product/Captain thread coordinating native Codex subagents.
- **Use both together** for bigger code-writing work: Product gives direction and splits the work, each implementation lane claims its own files in the board and works in its own Codex worktree, each lane writes a handoff, and Product/Captain sequences the final integration.
- **Use neither FB-Lane nor extra worktrees** when one local Codex thread can safely complete and verify the task.

Example prompt:

```text
$fb-lane
Use FB-Lane with Codex worktrees for code-writing lanes.
Product should split the work.
Tech, Design, and Business should work separately.
Each lane should claim files, write a handoff, and return to Product.
Product should sequence the final integration and tell me what is ready to merge.
Product should not claim or execute Tech/Design/Business source changes for the lanes.
```

If Codex asks before creating worktrees, pushing branches, or merging, approve only when the lane scope and affected files are clear on the board.

Solved, the payoff is real: feed Codex several goals at once and let its lanes run them concurrently while the board's file-claims keep them from colliding.

> **Running two lanes on different branches at once:** `claim` does an in-place `git checkout`, and
> one working directory holds only one branch — so concurrent lanes share a tree and rely on file
> locks. To put each concurrent lane on its own branch in its own directory, add `--worktree`:
> `node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts" --worktree`. Keep `PROJECT_BOARD.md`
> authoritative in the primary checkout; see the Claude Code guide's
> [worktree section](../claude-code/README.md#run-lanes-in-parallel-with-worktrees-optional) for the
> full rationale.

---

## Two Codex Workflows

### 1. One Product/Captain Thread + Native Codex Subagents

This is the safest default. You give several lane instructions to one Product/Captain thread. Codex can use native subagents where the work is independent; FB-Lane makes each lane check and claim shared repo state before editing:

```text
Product/Captain mode.

Run this in parallel where safe:
@tt-design create warmer prep-screen icon direction.
@tt-tech check whether the prep flow touches risky auth/data paths.
@tt-business tighten the prep-step copy for anxious interview users.

Do not let agents edit overlapping files. Integrate the lane outputs here.
```

Product/Captain remains the integration owner. It decides which work can run in parallel, serializes shared-file edits, and records final decisions. This is the core Codex use case: you can issue multiple lane instructions at once without manually tracking every file claim, dependency, and handoff.

### 2. Persistent Codex Sidebar Lane Threads

Use this when you want ongoing specialist conversations, like a physical Design or Tech person:

```text
@tt-design status
@tt-design I need new icons for the prep screen.

@tt-tech status
@tt-tech check whether this auth flow is safe.

@tt-business status
@tt-business rewrite this onboarding copy.
```

Those tags are a convention defined in repo rules, not magic Codex routing. A lane thread must sync from shared repo state before editing. It should run or perform the equivalent of:

```bash
npm run lane:status
npm run lane:claim -- --lane design --task "new prep icons" --files "components/Prep.tsx,index.css" --board TASK-123
```

If the claim reports an overlap, the lane stops and asks Product/Captain to split, serialize, or reassign the work.

Common aliases:

| Alias | Lane |
|---|---|
| `@tt-product`, `Product`, `Captain`, `Integration` | Product / Captain |
| `@tt-design`, `Design`, `hey design` | Design |
| `@tt-tech`, `Tech`, `Technical`, `Development` | Tech |
| `@tt-business`, `Business`, `Marketing`, `Copy` | Business |

---

## Minimal Lane Awareness Contract

Do not rely on separate Codex chats or subagent summaries as the source of truth for coordination. Make lanes aware of each other through files in the repo. A minimal setup should provide:

1. A status command or rule that reads active lane claims.
2. A claim command that records the lane, task, board item, and locked files.
3. Overlap rejection, so two active lanes cannot claim the same file.
4. A release command that clears the lane claim when done.
5. A handoff command/template for non-trivial output that Product/Captain must integrate.

Example project-local aliases:

```json
{
  "scripts": {
    "lane:status": "node scripts/lane-session.mjs status",
    "lane:claim": "node scripts/lane-session.mjs claim",
    "lane:release": "node scripts/lane-session.mjs release",
    "lane:handoff": "node scripts/lane-session.mjs handoff"
  }
}
```

Example usage:

```bash
npm run lane:status
npm run lane:claim -- --lane design --task "new prep icons" --files "components/Prep.tsx,index.css" --board TASK-123
npm run lane:release -- --session design/new-prep-icons-20260618 --status "released - handed to Product"
npm run lane:handoff -- --lane design --task "new prep icons" --board TASK-123 --files "components/Prep.tsx,index.css" --next-owner "Product / Captain"
```

Whether you implement those aliases with `tools/fb-lane.cjs`, MCP tools, or a small repo-local helper, the invariant is the same: every editing lane checks active claims before writing.

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
4. **Staging Gates**: Codex builds and tests the staging environment before handing off to the User Value Optimizer for merging.

---

## Automation & Reducing Manual Friction

To eliminate manual git dancing, board updates, and manual prompting in Codex Desktop, use the **`fb-lane` automation utility** (`tools/fb-lane.cjs`) in one of two modes:

### 1. Codex Plugin + MCP
The recommended path is to install the Codex plugin. It bundles the `fb-lane` MCP server and exposes `fb_lane_status`, `fb_lane_claim`, `fb_lane_submit`, and `fb_lane_merge` to Codex:

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

When calling MCP tools from a plugin-launched server, pass the active repo path as `workspacePath` if Codex does not infer it automatically. The bundled server uses that path to find `PROJECT_BOARD.md` and run git operations from the correct workspace.

### 2. Manual MCP Registration
If you do not install the plugin, register the project-local CLI as an MCP server in Codex config:

```toml
[mcp_servers.fb-lane]
command = "node"
args = ["/absolute/path/to/your/project/tools/fb-lane.cjs", "mcp"]
```

Once configured, Codex gets direct tool-level access to Git and `PROJECT_BOARD.md`. The Codex agent can then manage branch checkout, file locking, board updates, and pushes autonomously.

---

### 3. Local Context Injection (Low Friction via CLI)
If you do not register the MCP server, you can run the CLI tool locally. The claim command automatically writes the active task scope to a local file: **`.codex/current_task.md`**:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
```

Add this directive to your project instructions (e.g. `.codex/rules.md` or system instructions) to instruct Codex Desktop to auto-read the context file:
```markdown
# Codex Instructions
- You operate under the FB-Lane coordination plugin.
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
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
```
*(If using Codex Desktop with MCP enabled, you can skip this step and simply tell Codex in the chat: "Claim TASK-102 for Tech locking src/auth.ts").*

### Step 2: Implement & Test
*   Launch Codex Desktop. It will auto-detect `.codex/current_task.md` (or read the board using MCP) and begin implementing the changes.
*   Run local test suites (e.g., `npm run test` or backend linters) to confirm logic compiles and is correct.
*   Perform a **Visual QA Audit** across viewports if any UI was modified.

### Step 3: Staging QA & Merge
1. **Submit for QA**:
   ```bash
   node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
   ```
   *(Or ask Codex Desktop via MCP: "Submit TASK-102 with staging link https://staging.example.com").*
2. **Product Merge**:
   ```bash
   node tools/fb-lane.cjs merge TASK-102
   ```
   *(Or ask Codex Desktop via MCP: "Merge TASK-102").*

> [!NOTE]
> **Thread Initialization & Context Clearing**: The Codex client cannot programmatically start new conversation UI threads on your behalf. You must start the chat sessions manually for the individual lanes (e.g. `FB-Tech`, `FB-Design`) in Codex. 
> 
> Furthermore, **clearing the Codex thread or workspace session (e.g., via `/clear` or starting a fresh chat window) is highly encouraged** for each new task to avoid context bloat and reasoning degradation. Because all threads operate on the same local workspace files and share the exact same git branch, `.codex/current_task.md`, and `PROJECT_BOARD.md`, the different sessions remain fully in sync.
> 
> If you clear context, typing `status` or `SOP` in the fresh session prompts Codex to inspect the local files (like `.codex/current_task.md` and `PROJECT_BOARD.md`) and run Git queries (like `git branch --show-current`) to immediately determine its active lane, task ID, and locked files, resuming control instantly.
