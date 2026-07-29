# Codex Setup

This page is tactical. For the operating model behind these commands, read
[Loop Engineering](loop-engineering.md). For version naming and the v1-to-latest
before/after, read [FB Versions](versioning.md).

FB currently supports Codex only. Start with the
[Codex platform guide](../platforms/codex/README.md); this page is for fallback
setup paths when you are not installing through the plugin flow.

The current published release is **FB 0.5.1-beta** build
`0.5.1-beta+codex.20260729135705`.

Projects that need the optional generic agent control loop declare it in the
approved Build Brief. They may also provide repository-relative manifest paths:

```json
{
  "controlLoop": {
    "enabled": true,
    "profileManifest": "config/fb/control-loop-profiles.json",
    "goldenManifest": "config/fb/control-loop-golden.json"
  }
}
```

Omitting this block preserves the normal six-workstream workflow. FB selects
internal execution treatment; users do not choose Normal, Quick, or Full BFM.

## AI-Powered Bootstrap

If you already have an AI agent open in your target project workspace, paste this:

```text
I want to bootstrap the FB coordination plugin in this workspace.
Read the template files and CLI utilities from the fb-lane-coordination repository.
Use the documented archive fallback so the runtime modules, all ten docs/fb pages, and both docs/evals template assets arrive together.
Run node tools/fb-lane.cjs bootstrap to set up my project board, lane rules, Codex rules, and handoff routing.
Do not overwrite existing project rules; merge with them conservatively.
```

The agent should create or update the local coordination files, including
`PROJECT_BOARD.md`, `AGENTS.md`, `.codex/rules.md`, and the handoff index.

## Manual CLI Bootstrap

From your target project root:

```bash
FB_LANE_ARCHIVE_URL="${FB_LANE_ARCHIVE_URL:-https://github.com/friedbeef1/fb-lane-coordination/archive/refs/heads/main.tar.gz}"
fb_lane_tmp="$(mktemp -d)"
trap 'rm -rf "$fb_lane_tmp"' EXIT
curl -fsSL "$FB_LANE_ARCHIVE_URL" | tar -xz -C "$fb_lane_tmp" --strip-components=1
mkdir -p tools docs/fb docs/evals
cp "$fb_lane_tmp"/tools/fb-{lane,onboarding,session,eval,efficiency,changelog-closeout,records,project-graph,control-loop}.cjs tools/
cp "$fb_lane_tmp"/docs/fb/{README,start,workflow,evidence,guardrails,sessions,evals,records,graph,control-loop}.md docs/fb/
cp "$fb_lane_tmp"/docs/evals/{eval-record-template,agent-behavior-scorecard-template}.md docs/evals/
node tools/fb-lane.cjs bootstrap
```

What bootstrap creates:

- `PROJECT_BOARD.md`
- lane boundary rules in `AGENTS.md`
- local Codex rules in `.codex/rules.md`
- handoff routing index in `docs/handoffs/index.md`
- the ten-page harness, including `docs/fb/sessions.md`, `docs/fb/evals.md`, `docs/fb/records.md`, `docs/fb/graph.md`, and `docs/fb/control-loop.md`
- Codex-ready lane guidance
- one clone-local onboarding receipt in the Git common directory, shared by
  linked worktrees, or ignored `.fb/onboarding.json` for a non-Git project;
  plus a one-time permission question for repository-scoped Product/User,
  Business, Design, Tech, Discovery, and Bugs sidebar tasks

If permission is granted and Codex exposes task tools, FB recognizes existing
legacy/current workstream tasks and creates only missing ones. Existing
four-task projects receive Discovery and Bugs only. New tasks remain idle. If
task tools are unavailable, FB provides manual prompts instead of claiming
success.

## Upgrade Existing Codex Plugin Install

When the plugin source has been updated and merged, reinstall the plugin from the
configured FB marketplace:

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

Claims and quick tasks now use linked worktrees by default. Use the compatibility
flag only when a repository explicitly requires a single checkout:

```bash
node tools/fb-lane.cjs claim TASK-001 Tech "src/api.ts" --no-worktree
```

FB reuses an exact matching linked worktree. Otherwise it resolves the primary
checkout from Git and creates the worker under `<primary>/.worktrees/`, never
under the linked worktree that happened to launch the command.

Projects may add an optional runtime-agnostic preflight to `.fb-lane.json`:

```json
{
  "hooks": {
    "preflight": "./scripts/workspace-health.sh"
  }
}
```

The command runs before claim or quick-task mutation. Its failure stops with
the project command visible. FB does not supply a global Node version or assume
a package manager.

For a tiny BFM execution slice:

```bash
node tools/fb-lane.cjs quick Tech "src/utils.ts" "Fix db indexing" --approval-ref "USER-APPROVAL-001"
```

Quick tasks skip the OKR approval gate; they do not bypass the BFM source-change
boundary. Do not create per-task OKRs or loop health scoring for `TASK-Q-*`
work. The existing public `quick` command is not itself the internal **Quick BFM
Patch** classification; an approved existing task receives that class only when
the bounded low-risk rules in [workflow.md](fb/workflow.md) pass.

## Session Data And Removal

Repository-local sessions keep transcript-free JSON under the Git common
directory and curated recaps in `docs/sessions/`. Upgrades preserve all
project-owned instruction text outside the managed FB route markers and refresh
the bundled ten-page harness. Before removing the plugin, close or preserve any
active session evidence. Plugin removal does not delete project-owned boards,
handoffs, recaps, or instructions. If no session command is running, optional
clone-local cleanup may remove `fb-sessions` and a confirmed dead
`fb-sessions.lock` from the Git common directory.
