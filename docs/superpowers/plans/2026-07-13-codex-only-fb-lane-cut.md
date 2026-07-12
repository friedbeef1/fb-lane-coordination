# Codex-only FB-Lane Cut Implementation Plan

**Goal:** Make Codex the sole supported, shipped, documented, and tested FB-Lane integration.

## Global Constraints

- No plugin publication, marketplace release, or installation/testing of paused integrations.
- `bootstrap`, `--platform codex`, and `--codex-only` create only Codex artifacts.
- `all`, `claude`, `claude-code`, and `antigravity` exit nonzero before writing any target-workspace file and include `paused; collaborators welcome` plus the archived-note path.
- Root and packaged CLI behavior stay identical.
- The bundled Codex MCP server uses `cwd: "."` and `./tools/fb-lane.cjs`; bootstrap does not create project `.mcp.json`.

### Task 1: Codex-only CLI contract

Files: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`.

Add failing root/package tests for default, `--platform codex`, `--codex-only`, and every rejected platform value. The rejected commands must leave an empty temp directory. Restrict the parser to Codex, remove non-Codex generation and project `.mcp.json` generation/doctor requirements, make quick-start output Codex-only, and mirror root/package CLIs. Run both suites, syntax checks, and parity.

### Task 2: Codex-only distribution and documentation

Files: `.claude-plugin/**` (remove), `.claude/agents/**` (remove), `platforms/claude-code/**` and `platforms/antigravity/**` (remove), `README.md`, `FAQ.md`, `CHANGELOG.md`, `docs/setup.md`, `docs/versioning.md`, `docs/paused-integrations.md`, `plugins/fb-lane-coordination/.mcp.json`, `plugins/fb-lane-coordination/README.md`.

Replace active multi-platform copy with a Codex-only support statement and paused-note link. Add the contributor revival checklist. Remove non-Codex packaging and source-platform demos/configuration. Set the bundled MCP server to `command: node`, `args: [./tools/fb-lane.cjs, mcp]`, and `cwd: .`.

### Task 3: Integration proof and closeout

Files: `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-CODEX-ONLY-001.md`, `docs/workstreams/fb-product.md`.

Run root/package test suites, syntax checks, parity, validator, doctor, and whitespace check. Perform a local Codex marketplace/plugin smoke without publishing. Record exact evidence and Product review gate in the task handoff, board/index, and product card.

### Task 4: Remove stale non-Codex runtime artifacts and validator assumptions

Files: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`, `tools/fb-lane.validate.cjs`, `agents/**` (remove), `plugins/fb-lane-coordination/agents/**` (remove).

Add a failing root/package regression that proves the CLI source contains no Claude/Antigravity bootstrap branch or agent-generation surface. Remove the unused platform generator code and its static agent definitions, remove the stale root/package agent JSON artifacts, and make readiness validation check only Codex distribution artifacts. The validator must pass on the Codex-only tree without reading `.claude-plugin` or generated agent JSON. Run root/package suites, syntax checks, byte parity, and the validator.

### Task 5: Remove repository-level legacy runtime entry points

Files: `.mcp.json` (remove), `tools/run_lane.py` (remove), `CLAUDE.md` (remove), `templates/CLAUDE.md` (remove), `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`, `tools/fb-lane.validate.cjs`.

Add a failing root/package regression that requires the four legacy runtime/configuration paths to be absent. Delete them, then make the validator fail if any of these paths is reintroduced. The validator continues to validate only the Codex plugin manifest and bundled MCP server. Run root/package suites, syntax checks, byte parity, clean-tree validator, and whitespace check.
