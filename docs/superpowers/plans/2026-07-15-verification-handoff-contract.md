# Verification Handoff Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Product/BFM closeouts self-contained for testing by requiring a runnable verification handoff and a recovery loop before reporting an environment barrier to the user.

**Architecture:** Extend the existing lightweight Evidence Honesty scorecard instead of adding a runner, dashboard, command, or second handoff type. The root coordination rules, setup template, and packaged Codex plugin will state one shared contract; the existing regression suite will prove bootstrap output and root/package/template copies contain it.

**Tech Stack:** Markdown templates and Codex plugin skills; Node.js built-in `assert` regression tests; existing `tools/fb-lane.validate.cjs` readiness validation.

## Global Constraints

- Codex-only distribution; do not reintroduce paused integrations.
- Documentation, templates, skills, tests, board, and handoff only; no publication, marketplace update, deployment, or provider change.
- Preserve the lightweight scorecard model: no new CLI command, CI job, dashboard, eval runner, or `doctor` expansion.
- A user-approved Product/BFM task continues through safe diagnosis and verification; it stops only at a real approval or external manual boundary.
- A missing test or staging environment is never a pass result and must include the exact blocker plus the next Product/BFM recovery action.

---

### Task 1: Lock the contract in regression tests

**Files:**
- Modify: `tools/fb-lane.test.cjs`
- Modify: `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`

**Interfaces:**
- Consumes: existing `assertCodexBootstrap()` fixture and root/package test parity.
- Produces: a regression assertion that bootstrap creates the verification-handoff contract and all active coordination entry points retain it.

- [ ] **Step 1: Add the failing test**

Add a test named `documents the verification handoff and recovery contract across source, package, and bootstrap` that requires:

```js
assert.match(source, /## Verification Handoff/);
assert.match(source, /Test plan.*link/i);
assert.match(source, /Next Product\/BFM recovery action/i);
```

The test must check the root scorecard, template scorecard, packaged scorecard, root coordination skill, packaged BFM skill, and bootstrap-generated `AGENTS.md`/`.codex/rules.md`.

- [ ] **Step 2: Run the targeted test and confirm RED**

Run: `node tools/fb-lane.test.cjs`

Expected: failure because the Verification Handoff contract is absent.

### Task 2: Add the shared Product/BFM contract

**Files:**
- Modify: `docs/evals/agent-behavior-scorecard-template.md`
- Modify: `templates/docs/evals/agent-behavior-scorecard-template.md`
- Modify: `plugins/fb-lane-coordination/docs/evals/agent-behavior-scorecard-template.md`
- Modify: `AGENTS.md`, `.codex/rules.md`, `templates/AGENTS.md`
- Modify: `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`
- Modify: `plugins/fb-lane-coordination/skills/bfm/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`, `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`

**Interfaces:**
- Consumes: the existing Evidence Honesty and auto-unblock rules.
- Produces: one `## Verification Handoff` section with candidate, test plan, commands/results/environment, manual test links/pass criteria, blocked evidence, recovery attempted, next Product/BFM recovery action, and only genuine external gates.

- [ ] **Step 1: Add the exact scorecard checklist**

Add four Evidence Honesty checks for the verification-handoff section, current command/environment/result, runnable manual links plus pass criteria, and the exact recovery attempt/next Product/BFM action for blocked verification.

- [ ] **Step 2: Link the contract from BFM and setup guidance**

Require Product/BFM to create or update the section before presenting a verification/staging barrier. State that Product/BFM runs the recovery ladder itself; it does not ask the user to find a healthy environment.

- [ ] **Step 3: Keep root/package/template wording aligned**

Use identical core language where the same artifact is distributed in source, template, and packaged plugin.

### Task 3: Make fresh bootstrap inherit the contract

**Files:**
- Modify: `tools/fb-lane.cjs`
- Modify: `plugins/fb-lane-coordination/tools/fb-lane.cjs`

**Interfaces:**
- Consumes: bootstrap’s existing generated `AGENTS.md` and `.codex/rules.md` text.
- Produces: a generated Verification Handoff rule that links to the bootstrapped scorecard and retains the same recovery boundary.

- [ ] **Step 1: Add the generated rule**

Add a short `### Verification Handoff` section to both generated files. It must tell a fresh project what evidence Product/BFM returns before it asks the user to perform a manual test.

- [ ] **Step 2: Run the regression suite and confirm GREEN**

Run: `node tools/fb-lane.test.cjs`

Expected: all existing checks plus the new contract check pass.

### Task 4: Register and close the coordination work

**Files:**
- Modify: `PROJECT_BOARD.md`
- Modify: `docs/handoffs/index.md`
- Create: `docs/handoffs/TASK-018.md`
- Modify: `docs/workstreams/fb-product.md`

**Interfaces:**
- Consumes: James’s explicit approval to reduce manual coordination and require agent-owned verification recovery.
- Produces: a durable Product/BFM task record with no publication authorization.

- [ ] **Step 1: Create the task record**

Record `TASK-018` as Product/BFM coordination work with the verification-handoff contract, root/package/template/test surfaces, no release/publish scope, and the explicit no-MirrorCam-write boundary.

- [ ] **Step 2: Run full validation**

Run:

```bash
node tools/fb-lane.test.cjs
node plugins/fb-lane-coordination/tools/fb-lane.test.cjs
node tools/fb-lane.validate.cjs
node tools/fb-lane.cjs doctor
git diff --check
```

Expected: root/package test parity and the existing readiness validator pass; doctor reports only the intentional documentation work before commit, if any.

- [ ] **Step 3: Review the diff before final report**

Run `git diff --check` and inspect the changed paths. Report all checks, the no-publish boundary, and any remaining Product review gate.
