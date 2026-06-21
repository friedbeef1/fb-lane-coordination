# Setup Alternatives

Use the platform guides first when possible:

- [Antigravity 2.0](../platforms/antigravity/README.md)
- [Claude Code](../platforms/claude-code/README.md)
- [Codex](../platforms/codex/README.md)

This page is for fallback setup paths when you are not installing through a platform-specific plugin flow.

## AI-Powered Bootstrap

If you already have an AI agent open in your target project workspace, paste this:

```text
I want to bootstrap the FB-Lane Coordination Plugin in this workspace.
Read the template files and CLI utility from the fb-lane-coordination repository.
Copy tools/fb-lane.cjs to my project's root tools/ directory.
Run node tools/fb-lane.cjs bootstrap to set up my project board, agents, rules, and MCP configuration.
Do not overwrite existing project rules; merge with them conservatively.
```

The agent should create or update the local coordination files, including `PROJECT_BOARD.md`, `AGENTS.md`, `.codex/rules.md`, `CLAUDE.md`, `.mcp.json`, and lane agent definitions where the platform supports them.

## Manual CLI Bootstrap

From your target project root:

```bash
mkdir -p tools
curl -o tools/fb-lane.cjs https://raw.githubusercontent.com/friedbeef1/fb-lane-coordination/main/tools/fb-lane.cjs
node tools/fb-lane.cjs bootstrap
```

What bootstrap creates:

- `PROJECT_BOARD.md`
- lane boundary rules in `AGENTS.md`
- local Codex rules in `.codex/rules.md`
- Claude configuration in `CLAUDE.md`
- MCP configuration where supported
- lane agent definitions where supported

After bootstrap, open the matching platform guide:

- [Antigravity 2.0](../platforms/antigravity/README.md)
- [Claude Code](../platforms/claude-code/README.md)
- [Codex](../platforms/codex/README.md)

## Basic CLI Loop

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim TASK-001 Tech "src/api.ts"
node tools/fb-lane.cjs submit TASK-001
node tools/fb-lane.cjs merge TASK-001
```

For concurrent code-writing lanes, prefer worktrees:

```bash
node tools/fb-lane.cjs claim TASK-001 Tech "src/api.ts" --worktree
```

For tiny changes:

```bash
node tools/fb-lane.cjs quick Tech "src/utils.ts" "Fix db indexing"
```
