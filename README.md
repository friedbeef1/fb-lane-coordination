# FB-Lane Coordination Framework

**Run AI agents concurrently on the same codebase — without merge conflicts, context overload, or stepping on each other.**

FB-Lane splits your project into four role-isolated lanes (Product, Tech, Design, Business), each running in its own chat thread. A shared `PROJECT_BOARD.md` acts as the single source of truth for task state and file locks.

```
User
 ├─▶ FB-Product  (orchestrator — merges, deploys, gates)
 ├─▶ FB-Tech     (backend, APIs, database)
 ├─▶ FB-Design   (CSS, layout, visual QA)
 └─▶ FB-Business (copy, docs — read-only)
         │
         ▼
   PROJECT_BOARD.md  (task state + file locks)
```

Works with **Antigravity**, **Claude**, and **Codex** (OpenAI).

---

## Why this exists

When multiple AI agents or developers work on the same repo concurrently, two problems emerge:

1. **Context overload** — One thread handling backend bugs, pricing copy, and CSS layout at the same time quickly hits token limits and degrades model quality.
2. **Git collisions** — Two threads editing the same file at the same time causes merge conflicts.

FB-Lane solves both by giving each lane a strict ownership boundary and a lightweight file-locking system baked into a markdown board.

---

## Quickstart (2 minutes)

### Step 1 — Copy the CLI tool into your repo
```bash
# From your project root:
curl -o tools/fb-lane.js https://raw.githubusercontent.com/friedbeef1/fb-lane-coordination/main/tools/fb-lane.js
```
Or just copy `tools/fb-lane.js` manually.

### Step 2 — Run bootstrap
```bash
node tools/fb-lane.js bootstrap
```

This auto-detects your project name from `package.json` and generates:
- `PROJECT_BOARD.md` — your task board
- `AGENTS.md` — lane rules and boundaries
- `FB-Product/agent.json`, `FB-Tech/agent.json`, `FB-Design/agent.json`, `FB-Business/agent.json` — sidebar agent configs (Antigravity 2.0 picks these up automatically)
- `.codex/rules.md` — Codex auto-configuration
- Auto-registers the MCP server in your Claude Desktop config

### Step 3 — Open in your AI platform
- **Antigravity**: Open the workspace folder — agents appear instantly in the left sidebar.
- **Claude Desktop**: Restart Claude — the `fb-lane` MCP server is now registered.
- **Codex**: The `.codex/rules.md` file is already in place.

### Step 4 — Claim your first task
```bash
node tools/fb-lane.js claim TASK-001 Tech
```
This creates a feature branch, locks files on the board, and copies a startup prompt to your clipboard. Paste it into your lane thread to begin.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `node tools/fb-lane.js bootstrap` | One-time setup: generates board, agents, configs |
| `node tools/fb-lane.js status` | Print all active tasks and file locks |
| `node tools/fb-lane.js claim <id> <lane> [files]` | Claim a task, checkout branch, lock files |
| `node tools/fb-lane.js submit <id> [url]` | Run tests, push branch, mark Staging QA |
| `node tools/fb-lane.js merge <id>` | Merge to main, release locks, mark Done |
| `node tools/fb-lane.js mcp` | Start the MCP server (used by Claude Desktop) |

---

## The Four Lanes

| Lane | Owns | Hard Boundary |
|------|------|--------------|
| **FB-Product** | Merges, deployments, backlog, release gates | Never writes feature code |
| **FB-Tech** | APIs, DB schemas, serverless functions, tests | Never touches CSS or layout |
| **FB-Design** | CSS, tokens, layout geometry, visual QA | Never touches backend or schemas |
| **FB-Business** | Copy, docs, marketing content | Read-only on source code |

---

## The Board Loop

```
Inbox → Ready → In Progress → Staging QA → Done
```

1. **Product** triages and marks a task `Ready`
2. A lane thread **claims** it (`In Progress`) and locks the relevant files
3. The lane implements, then **submits** (`Staging QA`) — branch is pushed automatically
4. **Product** reviews staging and **merges** (`Done`) — locks are released

All state lives in `PROJECT_BOARD.md`, committed to git, visible to every thread.

---

## Templates

Drop these into any repo to instantly adopt the framework:

| File | Purpose |
|------|---------|
| [`templates/AGENTS.md`](templates/AGENTS.md) | Full lane rules and boundaries |
| [`templates/PROJECT_BOARD.md`](templates/PROJECT_BOARD.md) | Blank task board |
| [`templates/CLAUDE.md`](templates/CLAUDE.md) | Claude Projects system prompt |

---

## Platform Guides

| Platform | Guide |
|----------|-------|
| Antigravity 2.0 | [platforms/antigravity/README.md](platforms/antigravity/README.md) |
| Claude Desktop | [platforms/claude/README.md](platforms/claude/README.md) |
| Codex (OpenAI) | [platforms/codex/README.md](platforms/codex/README.md) |

---

## Example

See [`examples/my-app/`](examples/my-app/README.md) for a minimal walkthrough showing bootstrap output and a full task lifecycle on a fictional project.

---

## License
[MIT](LICENSE)
