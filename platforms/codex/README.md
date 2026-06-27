# FB-Lane on Codex

This page is the tactical Codex setup and usage guide. For the Product Lead
operating model, read [Loop Engineering](../../docs/loop-engineering.md).

> **Status:** FB-Lane on Codex is a public beta.

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
Ask each workstream for a markdown plan or handoff.
Launch BFM when source-changing execution is approved.
Product should sequence the final integration and tell me what is ready to merge.
```

When handoffs already exist and Product/Captain needs to sequence and route execution, use:

```text
$bfm process the prepared handoffs for this task and execute the sequence to completion.
```

For non-trivial BFM work, use the Goal Alignment Session and return-loop rules
described in [Loop Engineering](../../docs/loop-engineering.md). The plugin does
not create Codex's parallelism. Codex already has that. The plugin packages the
coordination layer: skills, MCP status/claim/submit/merge tools, file locks,
handoffs, and Product/Captain integration.

If the project itself still needs FB-Lane repo files, run the Codex-only bootstrap from the project
root:

```bash
node tools/fb-lane.cjs bootstrap --platform codex
node tools/fb-lane.cjs doctor
```

`doctor` is read-only. It checks the board, Codex rules, MCP config, handoff folder/index,
active file locks, git workspace, non-quick handoff `OKR Fit`, and approved Goal Alignment
Session OKRs before lane work starts.

### Fallback Setup

If you are not using the Codex plugin installer, use the fallback setup paths in [../../docs/setup.md](../../docs/setup.md).

---

## The Pain Point This Solves in Codex
Codex already has subagents, skills, plugins, MCP, and worktrees. FB-Lane only
adds the Product loop around them:

- workstreams plan in markdown
- Product approves the OKR and launches BFM
- BFM execution workers claim files and use worktrees when parallel source edits are useful
- Product/BFM closes only after evidence, board state, repo state, and git state agree

For ordinary workstream chats, do not run `claim`, create branches, or edit source.
Write the markdown plan/handoff and return it to Product.

## BFM Execution Commands

Use these only after Product launches BFM execution:

```bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
node tools/fb-lane.cjs claim TASK-103 Design "src/nav.css" --worktree
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge TASK-102
```

Use `--worktree` when two BFM execution workers need different branches at the
same time. Keep `PROJECT_BOARD.md` authoritative in the primary checkout.
