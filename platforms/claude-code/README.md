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
