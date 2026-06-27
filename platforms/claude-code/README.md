# FB-Lane on Claude Code

This page is the tactical Claude Code setup guide. For the Product Lead
operating model, read [Loop Engineering](../../docs/loop-engineering.md).

> **Status:** FB-Lane on Claude Code is alpha.

## What FB-Lane Adds

Claude Code already has subagents, MCP, slash commands, and worktrees. FB-Lane
adds the coordination loop:

- Product approves the Product/workstream OKR.
- Tech, Design, and Business produce markdown plans or handoffs.
- Product launches BFM when source-changing execution is approved.
- BFM execution workers claim files and use worktrees when parallel source edits are useful.
- Product/BFM closes only when board, source, docs, tests, and git state agree.

Normal workstream chats do not edit source, branch, submit, merge, deploy, or
change provider state. They plan.

## Install As A Claude Code Plugin

```bash
/plugin marketplace add friedbeef1/fb-lane-coordination
/plugin install fb-lane-coordination@fb-lane
```

This registers:

- `.mcp.json` for the `fb-lane` MCP server
- `.claude/agents/*.md` lane agents
- `CLAUDE.md` coordination rules

Start a new or reloaded Claude Code session after installing.

## Bootstrap A Project

From the target project root:

```bash
node tools/fb-lane.cjs bootstrap
node tools/fb-lane.cjs doctor
```

Bootstrap creates or updates the board, lane rules, MCP config, and lane agent
definitions. Existing files should be skipped or merged conservatively.

## Recommended Prompt

```text
Use FB-Lane.
Ask fb-tech, fb-design, and fb-business for markdown plans or handoffs.
Do not edit source from normal workstream chats.
When the plans are approved, Product should launch BFM for execution.
```

Direct lane tags such as `@fb-design`, `@fb-tech`, and `@fb-business` are for
questions, critique, and markdown handoffs unless Product has launched BFM.

## BFM Execution

Use claim/submit/merge only after Product launches BFM execution:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge TASK-102
```

Use `--worktree` when two BFM execution workers need separate branches:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts" --worktree
node tools/fb-lane.cjs claim TASK-103 Design "src/nav.css" --worktree
```

Keep `PROJECT_BOARD.md` authoritative in the primary checkout.

## Demo

The Claude Code demo lives in
[how-to-interact-demo/](how-to-interact-demo/).

Rendered MP4:
[GitHub release asset](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/claude-code-how-to-interact.mp4).
