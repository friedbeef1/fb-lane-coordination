# FB-Lane on Claude Code

This page is the tactical Claude Code setup and usage guide. For the Product
Lead operating model, read [Loop Engineering](../../docs/loop-engineering.md).

> **Status:** FB-Lane on Claude Code is alpha.

> **Why it matters:** keep handing Claude Code new goals — independent ones run in parallel worktrees while the shared board stops any two from touching the same files.

Claude Code (CLI, web, and the desktop / IDE extensions) is supported natively. Unlike Antigravity
(which reads `agents/*/agent.json`), Claude Code discovers three project-local artifacts:

| Artifact | Purpose |
|----------|---------|
| `.mcp.json` | Registers the `fb-lane` MCP server (`node tools/fb-lane.cjs mcp`) → exposes `fb_lane_status`, `fb_lane_claim`, `fb_lane_submit`, `fb_lane_merge`. |
| `.claude/agents/*.md` | The four lanes as selectable subagents: `fb-product`, `fb-tech`, `fb-design`, `fb-business`. |
| `CLAUDE.md` | Auto-loaded coordination rules (lane boundaries + board/lock protocol). |

> **Two agent locations (kept in sync):** the lane definitions live in both `agents/*.md` (the
> plugin's default-discovery directory, used when installed via the marketplace) and
> `.claude/agents/*.md` (used when this repo is opened directly as a Claude Code project). They are
> identical copies — if you change a lane's prompt, edit both.

## 📺 How-To Video

> 📺 **[Watch the FB-Lane on Claude Code Video on YouTube](https://youtu.be/2QDJt3mt5P8)** (Cmd/Ctrl + click to open in a new tab)
> 
> [![FB-Lane on Claude Code Demo Video](https://img.youtube.com/vi/2QDJt3mt5P8/maxresdefault.jpg)](https://youtu.be/2QDJt3mt5P8)

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

**New here?** Type **`/fb-lane-coordination:quickstart`** for a 30-second orientation on the lanes
and the claim → submit → merge loop — enough to start working without reading the rest of this guide.
(Or just ask the FB-Product thread *"how do I use this?"*.) The rest of this page is the deep dive.

## How-To Video

The Claude Code interaction demo lives in [`how-to-interact-demo/`](how-to-interact-demo/). It shows
the recommended Claude Code workflow: use direct lane tags such as `@fb-design`, `@fb-tech`, and
`@fb-business`, let each lane claim files on the shared board, then let Product sequence and resolve
integration at the end.

Watch the rendered MP4:
[GitHub release asset](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/claude-code-how-to-interact.mp4).

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

## Run lanes in parallel with worktrees (optional)

For most work you don't need this: lane subagents share the orchestrator's single working tree, and
the board's **file-locks** keep them from editing the same files. Reach for worktrees only when you
want two lanes on **different branches at the same time** — because a plain `claim` runs an in-place
`git checkout -b` (`tools/fb-lane.cjs`), and one working directory can only hold one branch at once.

The CLI does this in one step with `--worktree`: it claims the task and locks files on the board
(in the current checkout) **and** creates the lane's branch in its own directory off `main`, without
moving the primary checkout:

```bash
# Each command claims + locks on the board, then spins up an isolated worktree on the lane branch
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts" --worktree
node tools/fb-lane.cjs claim TASK-103 Design "src/nav.css" --worktree
# It prints the path; open a session there:  cd ../<repo>-tech-TASK-102 && claude
```

(Under the hood that is `git worktree add -b tech/TASK-102-… ../<repo>-tech-TASK-102 origin/main`;
you can also run `claude --worktree <name>` directly if you don't need the board claim.) Each
worktree is a separate directory, so the two lanes edit truly in parallel with zero physical
collision.

**Where the board lives (important):** `PROJECT_BOARD.md` stays authoritative in the **primary
checkout — the FB-Product / main session.** Product is already the only lane that claims, merges,
and releases locks, so let it own the board there and spin each lane worktree off `main` carrying
**only code** for that task's locked files. Don't have lane worktrees edit the board on their own
branches: each worktree has its own copy on its own branch, so parallel board edits would diverge
and only reconcile at merge. Keeping one authoritative board in the Product checkout sidesteps that
entirely.

**Integration is unchanged:** lanes `submit` their branches, FB-Product cross-reads the handoff
cards, reconciles any contract mismatches, and merges each branch to `main` in dependency order —
exactly the gate described above. Worktrees add *physical* branch isolation; the board and Product
still provide the *coordination*. See [Worktrees](https://code.claude.com/docs/en/worktrees) for
cleanup and `git worktree remove`.
