# Codex Setup

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

Bootstrap and upgrade add derived graph support without overwriting
project-owned boards, records, handoffs, or learning. `.fb/graph/` is ignored,
rebuildable state; Markdown and Git remain authoritative. Existing projects and
historical handoffs need no migration.

This page is tactical. For the operating model behind these commands, read
[Graph Engineering and its workstream loops](loop-engineering.md). For version naming and the v1-to-latest
before/after, read [FB Versions](versioning.md).

FB currently supports Codex only. Start with the
[Codex platform guide](../platforms/codex/README.md); this page is for fallback
setup paths when you are not installing through the plugin flow.

The current release candidate is **FB 0.10.0-beta** build
`0.10.0-beta+codex.20260827100222`.

## Install or update from GitHub

Paste one sentence into Codex while your project is open:

```text
Install or update FB from https://github.com/friedbeef1/fb-lane-coordination and set it up in this project.
```

Codex detects whether the FB marketplace and plugin are missing, already
installed, or outdated. It adds or refreshes the marketplace only when needed,
installs or upgrades the plugin only when needed, and preserves an existing
project setup. When the plugin changes, Codex tells you to open a new Codex task
so the refreshed skills can load, then continues with `$fb-setup`.

The plugin cannot install itself before it is loaded. The GitHub sentence is a
Codex-level entry point that performs that first machine-level step; `$fb-setup`
then owns the repository-level setup and safe upgrade.

## Set up the current project

After installing the plugin, open the project in Codex and invoke:

```text
$fb-setup
```

This is the primary setup invocation. It is safe to run again.
It updates only what is missing or outdated, preserves existing project work,
and reconciles the seven pinned repository tasks. The long-form
`$fb-lane-coordination:project-coordination-setup` invocation and the natural
request `Set up FB in this project.` remain compatibility fallbacks. `/fb-setup`
is not an installed slash command.

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

Omitting this block preserves the normal six-evidence-workstream workflow. FB selects
internal execution treatment; users do not choose Normal, Quick, or Full BFM.

### Project-qualified sidebar titles

Projects may optionally set a repository-visible prefix in `.fb-lane.json`:

```json
{
  "taskTitlePrefix": "PROJECT"
}
```

The prefix defaults to `FB`. It changes visible titles only; a visible title is
not project identity or identity authority. Exact project ID, canonical root,
stable task ID, and pinned state still govern reconciliation.

For duplicate-looking suites or a prefix, rename, archive, or repair request,
run `$fb-setup`. It reuses stable bindings, renames supported generic or legacy
titles, and creates only roles proved absent. Never identify an archive target
from its title alone. If FB was installed, upgraded, or replaced in the current
task, open a fresh Codex task before any plugin-dependent setup or repair
mutation.

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
mkdir -p tools docs/fb docs/evals templates/docs/learning
cp "$fb_lane_tmp"/tools/fb-{lane,onboarding,session,eval,efficiency,changelog-closeout,records,release-preflight,graph-contract,project-graph,graph-scheduler,graph-propagation,graph-learning,graph-bfm,board-context,control-loop,workstream-handoff,learning}.cjs tools/
cp "$fb_lane_tmp"/tools/fb-graph-contract.json tools/
cp "$fb_lane_tmp"/docs/fb/{README,start,workflow,evidence,guardrails,sessions,evals,records,graph,control-loop,learning}.md docs/fb/
cp "$fb_lane_tmp"/docs/evals/{eval-record-template,agent-behavior-scorecard-template}.md docs/evals/
cp "$fb_lane_tmp"/templates/docs/learning/index.md templates/docs/learning/
node tools/fb-lane.cjs bootstrap
```

What bootstrap creates:

- `PROJECT_BOARD.md`
- lane boundary rules in `AGENTS.md`
- local Codex rules in `.codex/rules.md`
- handoff routing index in `docs/handoffs/index.md`
- the eleven-page harness, including `docs/fb/sessions.md`, `docs/fb/evals.md`, `docs/fb/records.md`, `docs/fb/graph.md`, `docs/fb/control-loop.md`, and `docs/fb/learning.md`
- Codex-ready lane guidance
- one clone-local onboarding receipt in the Git common directory, shared by
  linked worktrees, or ignored `.fb/onboarding.json` for a non-Git project;
  plus a one-time permission question for seven repository-scoped Product/BFM,
  User, Business, Design, Tech, Discovery, and Bugs sidebar tasks

If permission is granted and Codex exposes task tools, FB recognizes existing
legacy/current tasks and creates only missing ones. Product/User is a legacy
User title; a lone Product title maps to Product/BFM. New tasks remain idle. If
task tools are unavailable, FB provides manual prompts instead of claiming
success. FB titles and automatically pins every exact workstream task, then
re-lists the repository inventory before recording reconciliation. An existing
unpinned task is pinned, never duplicated.
Pinning never starts work, approves scope, invokes `$bfm`, or authorizes release.

Setup verifies the exact Codex project ID and canonical repository root before
any task mutation. An incomplete or mixed inventory fails closed and returns
the seven role-specific manual prompts. Checkout changes use the runtime's
transactional migration routes: inventory and disposition every difference,
atomically record one canonical root plus quarantined former roots, then rebind
the exact seven pinned tasks. Former roots remain rollback evidence until fresh
verification and explicit retirement approval.

On a busy desktop host, the native recent-task list may stop at 50 non-pinned
tasks. FB does not ask the user to archive unrelated work and does not guess
what is missing. It reads only active task IDs, roots, archive state, and source
kind from local Codex state, excludes helper and spawned-subagent rows, then
joins every exact-root candidate to current native task details and the native
pinned-task set. Local state alone is never enough: missing or contradictory
project, root, title, pin, or source evidence still stops setup before mutation.
The temporary evidence bundle contains identity metadata only; previews, turns,
messages, tool items, and rollout paths are forbidden.

Bootstrap or upgrade installs the graph compiler, scheduler, propagation,
bounded-learning, and Product/BFM projection runtimes, then adds the derived
graph ignore rule. It preserves project-owned records and learning entries.
Checkout migration keeps former roots quarantined and recoverable; derived
graph data is rebuilt from the chosen canonical root rather than copied as
authority.

The installed runtime set includes `fb-graph-scheduler.cjs`,
`fb-graph-propagation.cjs`, `fb-graph-learning.cjs`, and `fb-graph-bfm.cjs`.

## Manual upgrade fallback

In Product/BFM, explicit **Push Live** invokes the model-invoked `fb-release`
skill. It verifies the exact candidate, follows this repository's release
instructions, identifies whether the configured `fb-lane` marketplace source
is local or Git, uses the matching refresh route, reinstalls the exact build,
and verifies installed skills, runtime, manifest, and MCP resolution. It then
requires a new Codex task so the replacement plugin is loaded.

If the automated release route is unavailable, first inspect the configured
marketplace source rather than assuming it is Git-backed. After the plugin
source has been updated and merged, this is the ordinary Git-marketplace
fallback:

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

Installed verification checks the exact cache artifact: version and package
identity, skill discovery, runtime syntax or required exports, packaged
manifest, and bundled MCP resolution. Do not run root-only source-layout tests
inside the installed cache. Keep public changelog and marketplace wording
product-generic; project names and exact consumer smokes belong in linked QA.

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
the bundled eleven-page harness. Before removing the plugin, close or preserve any
active session evidence. Plugin removal does not delete project-owned boards,
handoffs, recaps, or instructions. If no session command is running, optional
clone-local cleanup may remove `fb-sessions` and a confirmed dead
`fb-sessions.lock` from the Git common directory.
