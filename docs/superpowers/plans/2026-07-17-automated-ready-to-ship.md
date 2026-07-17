# Automated Ready-to-Ship Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FB run routine verification itself, show optional review links, and prompt James to say `Push Live` when the exact candidate is ready.

**Architecture:** Add one pure automated-verification policy in `fb-efficiency.cjs`, one durable candidate-bound evidence record in the existing session registry, and one shared submission pipeline used by CLI and MCP. Root files remain canonical; plugin mirrors are generated mechanically.

**Tech Stack:** Node.js CommonJS, existing Git/session helpers, Markdown handoffs, clone-local JSON session records, `node:test`, package synchronizer.

## Global Constraints

- Exact ready prompt:
  `Automated checks passed. Optional review links are available above.` then
  `Say **Push Live** to deploy.`
- FB makes bounded repairs only within the approved brief; scope, product,
  access, and safety decisions return to the user.
- Auth, privacy, payments, secrets, destructive data, migrations, provider
  state, permissions, lock conflicts, unclear scope, and release configuration
  retain immediate safety precedence.
- `Push Live` authorizes only the verified candidate, in the current
  conversation, and is single-use.
- `--no-tests` remains parseable for compatibility but exits nonzero before
  mutation and cannot produce `Ready to ship`.
- No new public deploy command, identifier change, hosted telemetry, dashboard,
  release, merge, publication, or live deployment.
- Root sources are canonical; package mirrors are generated with
  `fb-package-sync --write` and checked with `--check`.

---

### Task 1: Candidate-bound automated verification evidence

**Files:**
- Modify: `tools/fb-efficiency.cjs`
- Modify: `tools/fb-efficiency.test.cjs`
- Modify: `tools/fb-session.cjs`
- Modify: `tools/fb-session.test.cjs`

**Interfaces:**
- Produces:
  ```js
  selectAutomatedChecks(paths, repoRoot)
  // -> [{ id, command, args }]

  automatedVerificationDecision({
    candidateCommit,
    checkedCommit,
    changedPaths,
    checkResults,
    safetyGate,
    optionalLinks,
    bypassRequested,
  })
  // -> { status: 'Ready to ship'|'Checking'|'Blocked', reusable, reason,
  //      candidateCommit, checks, optionalLinks, prompt }

  recordAutomatedVerification(cwd, taskId, evidence)
  // atomically stores evidence on the one active execution session

  submitVerificationReuse(cwd, taskId)
  // reuses only explicit passed automated evidence for the same source
  // candidate when every later path is coordination-only
  ```

- [ ] **Step 1: Write focused failing policy tests**

  Add tests that require: docs/coordination select structure/link/whitespace
  checks; runtime selects the project test script; missing runtime tests block;
  sensitive paths require a passed safety gate; failed checks return
  `Checking`; passed checks return the exact prompt; bypass requests block;
  optional links may be empty; stale candidates and non-coordination changes
  cannot reuse evidence.

- [ ] **Step 2: Run the policy tests RED**

  Run:
  ```bash
  node tools/fb-efficiency.test.cjs
  ```
  Expected: FAIL because the new selection and decision interfaces do not
  exist.

- [ ] **Step 3: Implement the minimal pure policy**

  Implement deterministic check selection and decision logic. Commands are
  represented as executable plus argument arrays; do not introduce shell-built
  command strings. The ready result must contain:

  ```js
  prompt: [
    'Automated checks passed. Optional review links are available above.',
    'Say **Push Live** to deploy.',
  ].join('\n')
  ```

- [ ] **Step 4: Write session evidence RED tests**

  Add fixtures proving generic `reason: verification` milestones do not count,
  passed automated evidence records candidate/check/safety/link data, stale
  source changes invalidate reuse, coordination-only closeout preserves reuse,
  and malformed or failed evidence cannot close as ready.

- [ ] **Step 5: Run the session tests RED**

  Run:
  ```bash
  node tools/fb-session.test.cjs
  ```
  Expected: FAIL because session records do not yet persist explicit automated
  verification evidence.

- [ ] **Step 6: Implement atomic evidence persistence and reuse**

  Store this shape on the active execution session:

  ```js
  automatedVerification: {
    status: 'passed',
    candidateCommit: '0123456789abcdef0123456789abcdef01234567',
    checkedAt: '2026-07-17T00:00:00.000Z',
    checks: [{ id: 'project-test', result: 'passed' }],
    safetyGate: { result: 'not-applicable', approvalRef: '' },
    optionalLinks: [],
  }
  ```

  Validate the evidence through the existing per-session mutation lock. Replace
  the hard-coded `broadValidatorPassed: true` reuse assumption with this record.

- [ ] **Step 7: Run Task 1 GREEN checks and commit**

  Run root tests, generate declared mirrors, run package tests, sync check,
  syntax, and whitespace. Commit:
  ```bash
  git commit -m "feat: record automated verification evidence"
  ```

---

### Task 2: One CLI/MCP submission pipeline and Push Live prompt

**Files:**
- Modify: `tools/fb-lane.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Modify: `tools/fb-session.test.cjs`

**Interfaces:**
- Consumes Task 1 policy and session evidence functions.
- Produces:
  ```js
  performAutomatedSubmission({
    workspaceRoot,
    taskId,
    optionalReviewUrl,
    bypassRequested,
    transport, // 'cli' | 'mcp'
  })
  // -> { status, candidateCommit, checks, optionalLinks, prompt }
  ```

- [ ] **Step 1: Write CLI/MCP parity tests RED**

  Add end-to-end fixtures proving both transports:

  - run the same selected checks;
  - fail without mutation when required checks fail or are absent;
  - reject `--no-tests` before hooks, board updates, commits, or pushes;
  - enforce unresolved safety gates before ordinary checks;
  - persist the same evidence shape;
  - update the board only after passed checks;
  - label supplied URLs as optional review links;
  - return `Ready to ship` and the exact Push Live prompt;
  - never merge, deploy, or consume live approval.

- [ ] **Step 2: Run affected CLI/session tests RED**

  Run:
  ```bash
  node tools/fb-lane.test.cjs
  node tools/fb-session.test.cjs
  ```
  Expected: FAIL because CLI and MCP still use separate submission paths and
  `--no-tests` still bypasses checks.

- [ ] **Step 3: Implement the shared pipeline**

  Move authority revalidation, changed-path calculation, automated check
  execution, evidence persistence, board update, commit, and branch push behind
  `performAutomatedSubmission`. Use `execFileSync(command, args)` for selected
  checks. CLI and MCP become thin adapters to this function.

  The result shown to the user is:

  ```text
  System verification: passed
  - Automated checks: project-test: passed
  - Evidence: candidate 0123456789abcdef0123456789abcdef01234567 passed npm test

  Optional review links:
  - none

  Ready to ship
  Automated checks passed. Optional review links are available above.
  Say **Push Live** to deploy.
  ```

- [ ] **Step 4: Make bypass and failures fail closed**

  Keep `--no-tests` in help as a deprecated compatibility token, but make it
  exit nonzero with:

  ```text
  Automated checks are required before Ready to ship; --no-tests cannot submit.
  ```

  A failed automated check remains `Checking`; missing environment/access or a
  safety gate remains `Blocked`. Neither path updates the board to ready or
  pushes.

- [ ] **Step 5: Run Task 2 GREEN checks and commit**

  Run root/package CLI and session tests, package sync, syntax, and whitespace.
  Commit:
  ```bash
  git commit -m "feat: unify automated submission flow"
  ```

---

### Task 3: Make the flow the default FB operating contract

**Files:**
- Modify: canonical `docs/fb/` harness pages
- Modify: root shared skills and applicable plugin-only skills
- Modify: root README, FAQ, setup/Codex/plugin guides, examples, and templates
- Modify: TASK-028 board, handoff, index, Product card, spec, and plan records
- Test: existing beginner, two-speed, documentation, bootstrap, and package-sync contracts

**Interfaces:**
- Consumes Task 2’s exact output wording.
- Produces identical root/bootstrap/plugin guidance through canonical sources
  and mechanical package generation.

- [ ] **Step 1: Write structural documentation tests RED**

  Require active user-facing and agent-facing surfaces to present this order:
  automated checks → optional review links → Ready to ship → Push Live. Require
  the bounded-repair wording and safety exceptions. Reject active guidance that
  makes routine user QA, PR review, staging, a handoff file, or owner transfer a
  readiness prerequisite.

- [ ] **Step 2: Run focused documentation contracts RED**

  Run the beginner, two-speed, bootstrap/CLI documentation, and package-focused
  tests. Expected: FAIL on stale review/merge wording.

- [ ] **Step 3: Update canonical guidance and public documentation**

  Make the simple flow primary. Keep detailed engineering evidence behind
  progressive-disclosure links. State that FB owns bounded repairs within the
  approved brief and asks only for scope, product, access, safety, or Push Live
  decisions.

- [ ] **Step 4: Generate plugin mirrors and update plugin-only routers**

  Run:
  ```bash
  node tools/fb-package-sync.cjs --write
  ```
  Edit plugin-only skills only where no canonical root source exists. Do not
  hand-edit declared generated mirrors.

- [ ] **Step 5: Reconcile TASK-028 and PR review evidence**

  Record that the three PR #42 findings are fixed by one shared pipeline,
  explicit evidence, and removal of generic checkpoint assumptions. Keep the
  candidate local/PR review-ready; do not claim live readiness for this harness
  change and do not consume Push Live approval.

- [ ] **Step 6: Run focused final verification and review**

  Run root/package efficiency, CLI, session, beginner, two-speed, package-sync,
  syntax, whitespace, and doctor. Do not run a live deployment. Request one
  independent focused review of the implemented range.

- [ ] **Step 7: Commit the distribution slice**

  ```bash
  git commit -m "docs: make automated shipping the FB default"
  ```

## Completion Gate

- All focused root/package contracts pass.
- CLI and MCP emit identical candidate-bound readiness evidence.
- `--no-tests` cannot submit or push.
- Optional links are not routine QA requirements.
- The exact Push Live prompt appears only after passed checks and resolved
  safety gates.
- Root/package mirrors are current; doctor and whitespace pass.
- No merge, release, deployment, publication, or Push Live consumption occurs.
