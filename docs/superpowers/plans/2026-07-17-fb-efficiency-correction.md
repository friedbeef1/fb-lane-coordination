# FB Efficiency Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Normal Codex the default for simple isolated work, make Quick BFM a one-record bounded-correction path, and reserve existing Full BFM ceremony for material risk.

**Architecture:** Add one pure efficiency-policy module used by the existing CLI and session seams. Quick tasks persist one Markdown record plus clone-local counters, while Full BFM keeps the current board/handoff model. A root-only package synchronizer generates declared plugin mirrors; factual tests validate meaning while the synchronizer alone validates byte drift.

**Tech Stack:** Node.js CommonJS, Markdown records, existing Git/session helpers, JSON package-sync manifest, node:test/assert fixtures.

## Global Constraints

- Public commands and technical identifiers remain unchanged.
- Normal Codex produces no FB record.
- Quick BFM produces one `TASK-Q-*` Quick Record, one execution pass, proportional focused checks, one reviewer, and one closeout update.
- Full BFM remains mandatory for auth, privacy, payments, secrets, destructive changes, provider state, releases, material architecture, multi-lane work, lock conflicts, or unclear scope.
- The full validator runs at most once after the final runtime-affecting checkpoint and never after coordination-only closeout.
- A third repair loop or attempted repeated broad gate triggers the circuit breaker.
- Root files are canonical; package mirrors are generated mechanically.
- Metrics exclude transcripts, hidden reasoning, secrets, authentication tokens, environment values, and private data.
- No push, PR, merge, release, publication, deployment, install, or consumer migration.

---

### Task 1: Mechanical package synchronization

**Files:**
- Create: `tools/fb-package-manifest.json`
- Create: `tools/fb-package-sync.cjs`
- Create: `tools/fb-package-sync.test.cjs`
- Modify: `tools/fb-lane.validate.cjs`
- Generate: declared files under `plugins/fb-lane-coordination/`

**Interfaces:**
- `loadManifest(repoRoot) -> string[]`
- `syncPackage(repoRoot, { write }) -> { checked: string[], drift: string[] }`
- CLI: `node tools/fb-package-sync.cjs --write|--check`

- [ ] Write failing fixtures proving `--check` reports a missing target and changed target without rewriting, and `--write` creates exact declared targets.
- [ ] Add a manifest covering existing true mirrors: canonical CLI/session/eval modules and tests, focused beginner/positioning/two-speed tests, `docs/why-fb.md`, TASK-026 evidence, seven `docs/fb/` pages, and root skills that already have package mirrors.
- [ ] Implement path-safe manifest loading. Reject absolute paths, `..`, duplicate sources/targets, and any target outside `plugins/fb-lane-coordination/`.
- [ ] Implement atomic `--write` and read-only `--check`.
- [ ] Replace validator `sameFile` mirror assertions with one package-sync `--check`; retain semantic and syntax checks.
- [ ] Run only `node tools/fb-package-sync.test.cjs`, `node tools/fb-package-sync.cjs --check`, and validator syntax. Do not run the full validator.
- [ ] Commit the task.

### Task 2: Three-mode router and single Quick Record

**Files:**
- Create: `tools/fb-efficiency.cjs`
- Create: `tools/fb-efficiency.test.cjs`
- Modify: `tools/fb-lane.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Generate: packaged module, CLI, and tests through `fb-package-sync --write`

**Interfaces:**
- `classifyExecutionMode(task, options) -> { mode: 'Normal Codex'|'Quick BFM'|'Full BFM', reason: string }`
- `renderQuickRecord(input) -> string`
- `parseQuickRecord(markdown) -> object`
- `findQuickRecord(repoRoot, taskId) -> string|null`
- Existing `classifyBfmClass` remains as a compatibility wrapper returning `Quick BFM Patch` or `Full BFM`.

- [ ] Write failing classification fixtures for Normal, approved bounded Quick, ambiguous Full, multi-owner Full, and every preserved sensitive-risk trigger.
- [ ] Write failing Quick CLI fixtures proving one `docs/handoffs/TASK-Q-*.md` is created while `PROJECT_BOARD.md`, the handoff index, workstream cards, and session recap paths remain unchanged.
- [ ] Implement the pure router with safety precedence.
- [ ] Implement the compact Quick Record with approval, scope, owner, locks, verification plan, reviewer, closeout, and Efficiency Receipt fields.
- [ ] Change the existing `quick` command to create and commit that record instead of a board row while preserving branch/worktree and hook behavior.
- [ ] Make status identify Quick mode from the current Quick Record without requiring a board row.
- [ ] Generate package mirrors and run only efficiency, CLI quick/status, package-sync, syntax, and parity checks. Do not run the full validator.
- [ ] Commit the task.

### Task 3: Quick closeout, verification budget, circuit breaker, and receipt

**Files:**
- Modify: `tools/fb-efficiency.cjs`
- Modify: `tools/fb-efficiency.test.cjs`
- Modify: `tools/fb-session.cjs`
- Modify: `tools/fb-session.test.cjs`
- Modify: `tools/fb-lane.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Generate: packaged mirrors through `fb-package-sync --write`

**Interfaces:**
- `classifyChangedSurface(paths) -> 'coordination'|'documentation'|'test'|'runtime'|'sensitive'`
- `verificationBudget(paths, checkpoint) -> { focused: string[], runFullValidator: boolean, reuseCheckpoint: boolean, blockedReason: string|null }`
- `evaluateCircuitBreaker(state, event) -> { blocked: boolean, reason: string|null, state: object }`
- `renderEfficiencyReceipt(metrics) -> string`
- `closeQuickRecord(markdown, closeout) -> string`

- [ ] Write failing fixtures for every change class, zero runtime suites after coordination closeout, zero full validators for docs-only work, and exactly one full-validator allowance after the final runtime checkpoint.
- [ ] Write failing circuit-breaker fixtures for two allowed repair loops, a blocked third loop, one allowed broad gate, and a blocked repeated broad gate.
- [ ] Write failing receipt fixtures for wait time, tool calls, focused checks, repeated checks, repair loops, reviewer count, broad-gate count, tokens-or-unavailable, and privacy rejection.
- [ ] Implement the pure budget, circuit, and receipt functions; store only clone-local counters and curated Quick Record output.
- [ ] Make `submit TASK-Q-*` validate one reviewer, focused evidence, budgets, and circuit state; update and commit the same Quick Record once; preserve existing Full-BFM submit behavior.
- [ ] Ensure coordination-only Quick closeout cannot invoke `runTests` or the full validator.
- [ ] Generate mirrors and run only efficiency, Quick submit, session-budget, package-sync, syntax, and parity checks. Do not run the full validator.
- [ ] Commit the task.

### Task 4: Harness guidance, structural contracts, pilot, and final gate

**Files:**
- Modify: `docs/fb/README.md`
- Modify: `docs/fb/workflow.md`
- Modify: `docs/fb/sessions.md`
- Modify: `docs/fb/guardrails.md`
- Modify: `skills/fb-lane-coordination/SKILL.md`
- Modify: `skills/project-coordination-setup/SKILL.md`
- Modify: applicable plugin-only lane and BFM skills as concise routers
- Modify: `tools/fb-two-speed.test.cjs`
- Modify: documentation contract tests that currently assert exact copies
- Modify: `tools/fb-lane.validate.cjs`
- Generate: all declared package mirrors

**Interfaces:**
- Documentation contracts validate required facts, headings, tables, links, Mermaid nodes and edges, and prohibited contradictions.
- `fb-package-sync --check` is the only byte-drift authority.

- [ ] Write failing structural and factual contracts for the three modes, safety precedence, one Quick Record, one reviewer, one closeout, verification budget, circuit breaker, generator ownership, and Efficiency Receipt.
- [ ] Remove whole-file equality assertions from individual documentation tests; keep semantic assertions and local-target resolution.
- [ ] Update concise canonical guidance and plugin routers without duplicating the operating manual.
- [ ] Add the five-task pilot and hard limits to Product/BFM guidance.
- [ ] Generate package mirrors and run every directly affected focused root/package suite once.
- [ ] Run `node tools/fb-package-sync.cjs --check`, syntax, link and manifest checks, and whitespace.
- [ ] Run `node tools/fb-lane.validate.cjs` exactly once after the final runtime-affecting commit. Record the checkpoint commit and do not amend runtime or test files afterward.
- [ ] Run standalone doctor and one independent final review. Repair at most twice; if another repair or repeated broad gate is requested, invoke the circuit-breaker decision instead of continuing automatically.
- [ ] Commit implementation evidence, then update TASK-028 coordination records only. After that coordination-only closeout, run focused structural, package-sync, doctor, and whitespace checks without rerunning runtime suites or the full validator.

## Execution order

Tasks are serial because they share canonical CLI, session, and test surfaces. Each task uses one implementer and one reviewer. Product/BFM performs one final review after Task 4. The branch remains local after closeout.
