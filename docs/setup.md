# Codex Setup

This page is tactical. For the operating model behind these commands, read
[Loop Engineering](loop-engineering.md). For version naming and the v1-to-latest
before/after, read [FB-Lane Versions](versioning.md).

FB-Lane currently supports Codex only. Start with the
[Codex platform guide](../platforms/codex/README.md); this page is for fallback
setup paths when you are not installing through the plugin flow.

## AI-Powered Bootstrap

If you already have an AI agent open in your target project workspace, paste this:

```text
I want to bootstrap the FB-Lane Coordination Plugin in this workspace.
Read the template files and CLI utility from the fb-lane-coordination repository.
Copy tools/fb-lane.cjs to my project's root tools/ directory.
Run node tools/fb-lane.cjs bootstrap to set up my project board, lane rules, Codex rules, and handoff routing.
Do not overwrite existing project rules; merge with them conservatively.
```

The agent should create or update the local coordination files, including
`PROJECT_BOARD.md`, `AGENTS.md`, `.codex/rules.md`, and the handoff index.

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
- handoff routing index in `docs/handoffs/index.md`
- Codex-ready lane guidance

## Upgrade Existing Codex Plugin Install

When the plugin source has been updated and merged, reinstall the plugin from the
configured FB-Lane marketplace:

```bash
codex plugin marketplace upgrade fb-lane
codex plugin add fb-lane-coordination@fb-lane
```

Verify the active install:

```bash
codex plugin list | rg "fb-lane-coordination"
```

Codex may leave older cache folders under `~/.codex/plugins/cache/`. They are
not the active install unless `codex plugin list` points at that version. Start a
new Codex thread after reinstalling so updated skills and MCP tools are loaded
from the refreshed plugin cache.

For same-version docs-only updates, verify the installed cache contains expected
new wording after reinstall/update. If the active cache still has stale docs,
reinstall rather than trusting the version string; where supported, preserve
plugin data during uninstall/reinstall.

## Basic CLI Loop

Run `claim` only after Product launches BFM execution. Ordinary workstream
threads should write markdown plans or handoffs first.

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim TASK-001 Tech "src/api.ts"
node tools/fb-lane.cjs submit TASK-001
node tools/fb-lane.cjs merge TASK-001
```

For concurrent BFM execution workers, prefer worktrees:

```bash
node tools/fb-lane.cjs claim TASK-001 Tech "src/api.ts" --worktree
```

For a tiny BFM execution slice:

```bash
node tools/fb-lane.cjs quick Tech "src/utils.ts" "Fix db indexing"
```

Quick tasks skip the OKR approval gate; they do not bypass the BFM source-change
boundary. Do not create per-task OKRs or loop health scoring for `TASK-Q-*`
work.
