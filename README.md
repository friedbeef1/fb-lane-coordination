# FB-Lane Coordination Plugin

Keep telling your AI what you want, as fast as you think of it. FB-Lane lets Product, Tech, Design, and Business lanes work across one codebase without losing ownership, file claims, handoffs, or merge order.

[Watch the demo video](https://youtu.be/wry1xhaEEBg) | [FAQ](FAQ.md) | [Setup alternatives](docs/setup.md)

FB-Lane is the coordination layer for many goals arriving over time. It does not replace your AI tool's native concurrency. It gives concurrent work a shared operating model:

- `PROJECT_BOARD.md` records owner, status, scope, locks, links, and QA.
- Product/Captain sequences work and owns final integration.
- Tech, Design, and Business stay in their own lanes.
- File claims reduce overlap before agents write.
- Handoff docs preserve decisions after chat context disappears.

## The Problem

Without FB-Lane, parallel AI work tends to fail in predictable ways:

| Problem | What Happens |
|---|---|
| Goal pile-up | New ideas wait behind whatever the current thread is doing. |
| Context overload | One chat mixes backend, design, copy, and product decisions. |
| File collisions | Two agents edit the same component or config without knowing it. |
| Code bleed | A styling task changes backend code, or a tech task changes copy/layout. |
| Lost handoffs | Product has to reconstruct what each lane did from chat history. |
| Merge confusion | The user becomes the traffic controller for every lane. |

FB-Lane fixes this by making every lane sync from the board, claim files before editing, and return work to Product/Captain for sequencing.

## Platform Guides

Choose the guide for the AI tool you use:

| Platform | Guide | Best For |
|---|---|---|
| Antigravity 2.0 | [platforms/antigravity/README.md](platforms/antigravity/README.md) | Native multi-agent orchestration and isolated worker lanes. |
| Claude Code | [platforms/claude-code/README.md](platforms/claude-code/README.md) | `@agent` / `/agents` lane workflows with MCP and optional worktrees. |
| Codex | [platforms/codex/README.md](platforms/codex/README.md) | Codex plugin, skills, MCP, subagents, and worktrees. |

Manual/bootstrap setup options live in [docs/setup.md](docs/setup.md).

## Quick Mental Model

```text
User request
  -> FB-Product scopes and sequences
  -> FB-Tech / FB-Design / FB-Business work in bounded lanes
  -> PROJECT_BOARD.md tracks claims, status, and locks
  -> docs/handoffs/ carries non-trivial lane output
  -> FB-Product integrates and decides what is ready to merge
```

Worktrees and branches isolate files. FB-Lane coordinates the work.

## The Four Lanes

| Lane | Owns | Boundary |
|---|---|---|
| FB-Product | Scoping, priorities, sequencing, staging/live decisions, merge gates. | Does not casually rewrite lane implementation work. |
| FB-Tech | Backend, APIs, schemas, auth, migrations, tests, reliability. | Does not own visual styling or product copy. |
| FB-Design | UI, CSS, layout, icons, visual QA, responsive behavior. | Does not own backend logic, data schemas, or auth. |
| FB-Business | Positioning, onboarding copy, help text, pricing, marketing docs. | Read-only on application code unless explicitly assigned. |

## Core Loop

```text
Inbox -> Ready -> In Progress -> Staging QA -> Done
```

1. Product scopes the task and chooses lane ownership.
2. The lane claims files or surfaces before editing.
3. The lane works on an isolated branch or worktree where useful.
4. The lane submits checks and handoff notes.
5. Product/Captain reviews, resolves conflicts, and merges.

## CLI Quick Reference

Run from the project root:

| Command | Purpose |
|---|---|
| `node tools/fb-lane.cjs status` | Show tasks, owners, and file claims. |
| `node tools/fb-lane.cjs claim <id> <lane> [locks] [--worktree]` | Claim work and lock files. Use `--worktree` for isolated parallel code-writing lanes. |
| `node tools/fb-lane.cjs quick <lane> <locks> [desc]` | Create and claim a fast-track `TASK-Q-####` task. |
| `node tools/fb-lane.cjs submit <id> [staging_url]` | Submit work for Product/Captain review. |
| `node tools/fb-lane.cjs merge <id>` | Product/Captain merge path after review. |
| `node tools/fb-lane.cjs bootstrap` | Manual/bootstrap setup path. See [docs/setup.md](docs/setup.md). |

## 🔧 Extensible Loop Harness & Lifecycle Hooks

FB-Lane operates as a pluggable **execution and loop harness**. Instead of hardcoding opinionated testing or QA tools directly into the core scripts, FB-Lane provides core coordination (branching, status, and file locking) and exposes lifecycle hooks.

This allows developers to bind their own custom loops (e.g., unit tests, visual regression checkers, AST validators, API contract checkers) using a simple local `.fb-lane.json` configuration file in the project root.

### Config Example (`.fb-lane.json`)

```json
{
  "hooks": {
    "pre-claim": "echo 'Checking workspace sanity...'",
    "pre-submit": "npm test && npm run lint",
    "post-submit": "curl -X POST https://hooks.slack.com/services/... -d '{\"text\":\"Task submitted for QA\"}'",
    "pre-merge": "node tools/ast-drift-check.js"
  }
}
```

### Supported Hooks

*   **`pre-claim` / `post-claim`**: Runs before/after a task or quick-edit is claimed and locked. Perfect for environment setup.
*   **`pre-submit` / `post-submit`**: Runs before/after task submission. *If `pre-submit` exits with a non-zero code, the submission is blocked.* Perfect for custom test suites and notifications.
*   **`pre-merge` / `post-merge`**: Runs before/after merging. Perfect for goal-drift checkers and cache cleaning.

### Why This Is Important

1.  **Technology Agnostic**: Works out of the box with any stack (Node/React, Python, Go, Rust, etc.) by executing standard shell commands.
2.  **Zero-Friction Autonomy**: Prevents bad code (broken tests, visual drift, or schema mismatches) from ever reaching the staging branch or being merged, without requiring human developers to manually run checks.
3.  **Lightweight Core**: Keeps the core framework focused on Git and task state management, letting teams customize and evolve their AI loops independently.

## More

- [FAQ](FAQ.md)
- [Setup alternatives](docs/setup.md)
- [Example app](examples/my-app/README.md)
- [Plugin package](plugins/fb-lane-coordination/README.md)
- [License](LICENSE)
