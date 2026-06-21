# FB-Lane on Claude Code

Claude Code (CLI, web, and the desktop / IDE extensions) is supported natively. Unlike Antigravity
(which reads `agents/*/agent.json`) or Claude Desktop (which uses `claude_desktop_config.json`),
Claude Code discovers three project-local artifacts:

| Artifact | Purpose |
|----------|---------|
| `.mcp.json` | Registers the `fb-lane` MCP server (`node tools/fb-lane.cjs mcp`) → exposes `fb_lane_status`, `fb_lane_claim`, `fb_lane_submit`, `fb_lane_merge`. |
| `.claude/agents/*.md` | The four lanes as selectable subagents: `fb-product`, `fb-tech`, `fb-design`, `fb-business`. |
| `CLAUDE.md` | Auto-loaded coordination rules (lane boundaries + board/lock protocol). |

> **Two agent locations (kept in sync):** the lane definitions live in both `agents/*.md` (the
> plugin's default-discovery directory, used when installed via the marketplace) and
> `.claude/agents/*.md` (used when this repo is opened directly as a Claude Code project). They are
> identical copies — if you change a lane's prompt, edit both.

## ⚠️ The Pain Points & Elegant Fixes in Claude Code

> **Reality check (so we don't oversell):** Claude Code already gives you **context-isolated
> subagents** — per the docs, *"each subagent runs in its own context window… and returns only the
> summary"* — and **`claude --worktree` parallel sessions** so *"concurrent edits don't collide."*
> So FB-Lane is **not** what makes Claude Code parallel or context-clean; those are native. The gap
> FB-Lane fills is that those primitives **isolate work but do not coordinate it** — there is no
> shared task state, no cross-session awareness, and no integration gate. That coordination layer is
> the entire value here, and the pain points below are scoped to it (we deliberately do *not* claim
> FB-Lane "fixes context bloat," because subagent isolation already does).

### 1. Isolation Without Coordination (The Blind-Parallelism Pain Point)
* **The Pain Point**: Worktrees and subagents isolate work — each session/worktree gets its own
  checkout and context — but they are blind to each other. Two parallel lanes can edit the same
  file, duplicate work, or build against conflicting assumptions, and nothing surfaces it until you
  try to merge the branches together. Isolation prevents *live* collisions; it does nothing for
  *integration* drift.
* **The Elegant Fix**: **A Shared Board + File Claims + Integration Gate**. `PROJECT_BOARD.md` is a
  version-controlled message bus every lane reads before writing: a lane claims its files (locking
  them), so an overlapping claim is rejected up front instead of discovered at merge time. Each
  lane writes a `docs/handoffs/TASK-XXX.md` card, and **FB-Product** cross-reads all submitted
  branches to catch contract mismatches before sequencing the merges.

### 2. State Amnesia Across Sessions (The Cold-Start Pain Point)
* **The Pain Point**: A new, resumed, or auto-compacted session does not inherently know which
  branch is active, which files are locked, or what the previous session was mid-way through. The
  context that mattered may have been summarized away, leaving the agent to re-derive the workspace
  state (or ask you to re-explain it).
* **The Elegant Fix**: **A Filesystem Source of Truth**. Active branch, task, and file locks live on
  disk in `PROJECT_BOARD.md` and `.codex/current_task.md`, not in chat memory. Typing `status` or
  `SOP` makes any cold session inspect those files (and `git branch --show-current`) and resume with
  full context — independent of whatever the conversation history retained.

### 3. Tool Limits Are Not Domain Limits (The Scope-Bleed Pain Point)
* **The Pain Point**: Subagents can restrict *which tools* they hold, but that is not the same as
  restricting *which files a role owns*. An `fb-tech` subagent that legitimately needs `Edit` can
  still edit a stylesheet; an `Edit` permission says nothing about CSS-vs-schema boundaries.
* **The Elegant Fix**: **Lane Ownership + Board-Scoped Writes**. Each lane has explicit ownership
  boundaries (Tech owns APIs/schemas and never touches CSS; Design owns CSS and never touches
  backend; Business is read-only on code), and the task's claimed files on the board scope writes to
  exactly that set — so the boundary is enforced by what the lane is allowed to claim, not just by
  which tools it was handed.

## Install as a Claude Code plugin (recommended)

This repo is also a single-plugin **marketplace** (`.claude-plugin/marketplace.json` +
`.claude-plugin/plugin.json`). Install the lanes, skills, and MCP server in one step:

```bash
/plugin marketplace add friedbeef1/fb-lane-coordination
/plugin install fb-lane-coordination@fb-lane
```

This registers the four lane subagents (`./.claude/agents`), the `fb-lane` skills (`skills/`),
and the `fb-lane` MCP server (the bundled CLI is referenced via `${CLAUDE_PLUGIN_ROOT}`, so it
works wherever the plugin is installed). The MCP server reads the `PROJECT_BOARD.md` of whatever
project you currently have open.

## How-To Video

The Claude Code interaction demo lives in [`how-to-interact-demo/`](how-to-interact-demo/). It shows
the recommended Claude Code workflow: use direct lane tags such as `@fb-design`, `@fb-tech`, and
`@fb-business`, let each lane claim files on the shared board, then let Product sequence and resolve
integration at the end.

Watch the rendered MP4:
[`how-to-interact-demo/renders/claude-code-how-to-interact.mp4`](how-to-interact-demo/renders/claude-code-how-to-interact.mp4).

## Or: bootstrap into a project (copies the CLI in)

From your project root, run the bootstrap — it generates all three artifacts, non-destructively
(existing files are skipped or merged in place):

```bash
node tools/fb-lane.cjs bootstrap
```

Then **reload your Claude Code session**:
- The lanes appear in `/agents` and the agent picker (the left-sidebar agents list in the app).
- Approve the `fb-lane` MCP server with `/mcp`.

> These artifacts are read at session start, so a new/reloaded session is required for them to
> take effect — they are not hot-loaded into a running session.

## How the lanes map

The **main session acts as FB-Product** (the orchestrator): scope tasks on `PROJECT_BOARD.md`,
delegate to a lane, review the result, then merge. You can also invoke any lane subagent
**directly** — e.g. *"use the fb-design subagent to …"* — instead of routing everything through
Product.

| Lane | Subagent | Owns | Never touches |
|------|----------|------|---------------|
| Product | `fb-product` | backlog, review, merges, release gates | feature code |
| Tech | `fb-tech` | APIs, schemas, migrations, security, tests | CSS/layout, copy |
| Design | `fb-design` | CSS, tokens, layout geometry, visual QA | backend, schemas |
| Business | `fb-business` | copy, docs, positioning (**read-only** on code) | source code |

Lanes drive the task lifecycle with the CLI (`node tools/fb-lane.cjs claim|submit|merge …`); only
FB-Product merges to `main`. Full ownership boundaries and the board loop live in
[`AGENTS.md`](../../AGENTS.md).
