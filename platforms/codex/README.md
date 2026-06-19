# FB-Lane on Codex

Codex is a local developer agent that operates directly on your filesystem and git workspace. It excels at codebase audits, local compilation checks, terminal automation, and native subagent concurrency. The main FB-Lane benefit in Codex is that you can give multiple lane instructions at once and let Codex run them concurrently without the lanes editing the same files or losing handoff context.

> **Codex reality check:** Codex already has native subagents for concurrency. FB-Lane is not what makes Codex parallel. FB-Lane is the shared-state protocol that makes parallel Codex work safe: lane identity, file claims, status checks, handoffs, and Product/Captain integration.

## ⚡ Quick Setup

### Method A: Codex Plugin (Recommended)
Install the repo marketplace and plugin:

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

This installs:

- `fb-lane`, `fb-product`, `fb-tech`, `fb-design`, and `fb-business` Codex skills
- the bundled `fb-lane` MCP server
- plugin metadata for Codex's plugin browser

After install, start a new Codex thread and ask for `@fb-lane`, `$fb-lane`, or a lane-specific skill. Example:

```text
@fb-lane
Run these concurrently:
@tt-design create prep-screen icon options.
@tt-tech check whether the auth flow is safe.
@tt-business rewrite the onboarding copy.
Then have Product sequence the handoffs and flag conflicts.
```

The plugin does not create Codex's parallelism. Codex already has that. The plugin packages the coordination layer: skills, MCP status/claim/submit/merge tools, file locks, handoffs, and Product/Captain integration.

### Method B: AI-Powered Bootstrap
If you have an AI agent active in your workspace, simply paste this prompt:
> *"I want to bootstrap the FB-Lane Coordination Framework in this workspace. Read the template files and CLI utility from the `fb-lane-coordination` repository, copy `tools/fb-lane.cjs` to my project's root `tools/` directory, and run `node tools/fb-lane.cjs bootstrap` to set up my project board, agents, rules, and Claude Desktop MCP configurations automatically."*

### Method C: Manual CLI Bootstrap
1. Download the CLI script:
   ```bash
   curl -o tools/fb-lane.cjs https://raw.githubusercontent.com/friedbeef1/fb-lane-coordination/main/tools/fb-lane.cjs
   ```
2. Run bootstrap:
   ```bash
   node tools/fb-lane.cjs bootstrap
   ```

---

## The Problem This Solves in Codex
As a local, filesystem-active developer agent, Codex is prone to:
* **Uncoordinated Parallelism**: Codex can run multiple subagents, but without a shared claim/status protocol they may inspect stale state, duplicate work, or edit the same files.
* **Merge Collisions**: If multiple Codex runs execute in the same workspace without branch isolation, they will overwrite each other's changes, corrupting the code state.
* **Dirty Git Logs**: Mixing project board tracking updates, markdown notes, and source code edits in a single commit makes PR reviews extremely difficult.
* **Scope Creep & Code Bleed**: Without rigid boundary constraints, a Codex run might aggressively modify stylesheets, schemas, and config files all in one go to solve a minor issue, introducing regressions.

**How FB-Lane fixes this:**
* **Mandatory Feature Branches**: Enforces the checkout of isolated branches (`tech/[feature]` or `design/[feature]`).
* **Atomic Documentation Commits**: Enforces committing `PROJECT_BOARD.md` updates separately from code changes.
* **Rigid Code Boundaries**: Prevents the agent from editing files or directories outside its assigned role (e.g., Tech lane cannot modify `.css` files).
* **Simulated Tool Sandboxing**: Enforces role restrictions in Codex's system instructions (e.g. `.codex/rules.md`), strictly prohibiting the agent from running write/deploy commands or modifying files outside its domain (such as keeping `FB-Business` read-only).

---

## Two Codex Workflows

### 1. One Product/Captain Thread + Native Codex Subagents

This is the safest default. You give several lane instructions to one Product/Captain thread. Codex runs the safe pieces concurrently; FB-Lane makes each lane check and claim shared repo state before editing:

```text
Product/Captain mode.

Run this in parallel where safe:
@tt-design create warmer prep-screen icon direction.
@tt-tech check whether the prep flow touches risky auth/data paths.
@tt-business tighten the prep-step copy for anxious interview users.

Do not let agents edit overlapping files. Integrate the lane outputs here.
```

Product/Captain remains the integration owner. It decides which work can run in parallel, serializes shared-file edits, and records final decisions. This is the core Codex use case: multiple instructions can run at once without you manually babysitting collisions.

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

Codex lane threads do not share chat memory. They become aware of each other through files in the repo. A minimal setup should provide:

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
