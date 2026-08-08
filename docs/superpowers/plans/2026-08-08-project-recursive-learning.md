# Project-Local Recursive Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every FB project turn verified delivery failures and inefficiencies into bounded, relevant lessons that improve later related work without extending repair loops.

**Architecture:** Add one focused CommonJS learning module beside the existing control-loop, eval, graph, and session modules. It stores privacy-safe observations atomically under the Git common directory, keeps durable lesson state in a compact repository Markdown registry, selects only matching lessons for context, and enforces a fixed lifecycle with one revision and immediate safety rollback. BFM records learning before final closeout; session close and doctor validate it but do not start another repair loop.

**Tech Stack:** Node.js CommonJS, built-in `node:test`, repository Markdown records, Git-common clone-local JSONL, existing package synchronizer and Codex plugin manifests.

## Global Constraints

- Learning improves the consumer project first; no project evidence is automatically sent to the FB repository.
- Quick BFM keeps one consolidated repair; Full BFM keeps at most two material repairs; learning never resets either budget.
- One provisional lesson per failure signature per BFM run, one active candidate per signature, and one revision maximum.
- Automatic treatments may only add relevant context/dependencies, select an existing check, record a recovery hint, or increase minimum verification treatment.
- Automatic treatments never change application source, prompts, skills, eval authority, sensitive policy, product decisions, scope, release authority, or **Push Live**.
- Relevant lessons only enter future context packets; unrelated history stays linked and retrievable.
- Historical records remain valid and are not retrofitted.
- Candidate version is `0.6.0-beta+codex.<UTC-build>`; publication remains gated by **Push Live**.

---

### Task 1: Learning record, storage, and relevance contract

**Files:**
- Create: `tools/fb-learning.cjs`
- Create: `tools/fb-learning.test.cjs`
- Modify: `tools/fb-package-manifest.json`

**Interfaces:**
- Produces: `validateLearningReceipt(input)`, `recordLearningObservation(cwd, input)`, `readLearningObservations(cwd)`, `readLearningRegistry(repoRoot)`, `writeLearningRegistry(repoRoot, lessons)`, `selectApplicableLessons(lessons, context)`, and `renderLearningSummary(lesson)`.
- Lesson states: `provisional | confirmed | revised | rejected | retired`.
- Automatic treatment types: `add_context_ref | add_dependency | select_existing_check | recovery_hint | raise_verification_floor`.

- [ ] **Step 1: Write failing schema, privacy, atomicity, and relevance tests**

```js
test('records one privacy-safe provisional lesson and selects only a matching work type', () => {
  const lesson = validateLearningReceipt({
    lessonId: 'LESSON-TECH-CACHE-001',
    runId: 'run-001',
    taskId: 'TASK-001',
    state: 'provisional',
    signature: { category: 'build', surface: 'cache', criterion: 'invalidation' },
    workTypes: ['tech:cache'],
    cause: 'Mutation did not invalidate the derived cache.',
    currentRepair: 'Invalidate the derived cache after the mutation.',
    treatment: { type: 'select_existing_check', value: 'cache-invalidation' },
    evidenceRefs: ['docs/qa/TASK-001.md#cache-regression'],
    safetyClass: 'ordinary',
  });
  recordLearningObservation(repo, lesson);
  assert.deepEqual(selectApplicableLessons([lesson], { workTypes: ['tech:cache'] }).map(x => x.lessonId), [lesson.lessonId]);
  assert.deepEqual(selectApplicableLessons([lesson], { workTypes: ['design:navigation'] }), []);
});
```

Also reject unsafe IDs and paths, nested/raw transcript payloads, secret-like material, unknown keys, unsupported treatment types, duplicate active signatures, and concurrent partial JSONL writes.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tools/fb-learning.test.cjs`

Expected: fail because `tools/fb-learning.cjs` does not exist.

- [ ] **Step 3: Implement the minimal module**

Use `git rev-parse --git-common-dir` for `<common>/fb-lane/learning/observations.jsonl`; append through exclusive temporary-file creation plus atomic rename/append locking consistent with `fb-control-loop.cjs`. Keep the durable registry at `docs/learning/index.md` with one explicit heading per lesson and exact fields:

```md
## LESSON-TECH-CACHE-001
State: provisional
Signature: build/cache/invalidation
Work types: tech:cache
Treatment: select_existing_check — cache-invalidation
Applications: 0
Revision count: 0
Owning record: docs/handoffs/TASK-001.md#project-learning
Evidence: docs/qa/TASK-001.md#cache-regression
```

Validate evidence as repository-relative Markdown references. Preserve existing registry entries and write replacements atomically.

- [ ] **Step 4: Run focused GREEN and syntax**

Run: `node --test tools/fb-learning.test.cjs && node --check tools/fb-learning.cjs`

Expected: all learning tests pass and syntax exits zero.

- [ ] **Step 5: Add both canonical files to package generation and commit**

Add `tools/fb-learning.cjs` and `tools/fb-learning.test.cjs` to `tools/fb-package-manifest.json`, then run `node tools/fb-package-sync.cjs --write`.

Commit: `feat: add project learning records`

---

### Task 2: Bounded lifecycle, proof gates, and rollback

**Files:**
- Modify: `tools/fb-learning.cjs`
- Modify: `tools/fb-learning.test.cjs`
- Modify: `tools/fb-control-loop.cjs`

**Interfaces:**
- Produces: `evaluateLearningTransition({ lesson, observation })`, `validateAutomaticTreatment(treatment)`, and `assertLearningBudget({ runId, signature, repairBudget, activeLessons })`.
- Observation results: `helped | incomplete | failed | safety_regression | not_comparable`.

- [ ] **Step 1: Add failing lifecycle tests**

```js
test('confirms after two helpful applications and allows only one revision', () => {
  const first = evaluateLearningTransition({ lesson: provisional, observation: helpful('run-2') });
  assert.equal(first.state, 'provisional');
  const second = evaluateLearningTransition({ lesson: first, observation: helpful('run-3') });
  assert.equal(second.state, 'confirmed');
  const revised = evaluateLearningTransition({ lesson: provisional, observation: incomplete('run-2') });
  assert.equal(revised.state, 'revised');
  assert.equal(evaluateLearningTransition({ lesson: revised, observation: incomplete('run-3') }).state, 'rejected');
});
```

Add cases for immediate safety rejection, must-pass regression, no progress, fixture-only improvement, changed environment/criteria, one active candidate per signature, no repair-budget reset, quality proof, and efficiency proof requiring at least 10% observed token or wall-time improvement with the same accepted outcome.

- [ ] **Step 2: Run the lifecycle tests and confirm RED**

Run: `node --test tools/fb-learning.test.cjs`

Expected: lifecycle assertions fail because transition functions are absent.

- [ ] **Step 3: Implement the state machine and hard allowlist**

Make every transition return `{ state, reason, applications, revisionCount, active }`. `safety_regression` and `failed` on a must-pass case return rejected and inactive immediately. `incomplete` consumes the only revision; a second incomplete or failure rejects. `not_comparable` never increments applications. Confirm only after two distinct run IDs with comparable helpful evidence.

Reuse the existing control-loop candidate comparison and repair budget as evidence; do not create a learning-specific repair counter that could extend it.

- [ ] **Step 4: Run focused GREEN plus the existing control-loop suite**

Run: `node --test tools/fb-learning.test.cjs tools/fb-control-loop.test.cjs`

Expected: both suites pass.

- [ ] **Step 5: Regenerate package mirrors and commit**

Run: `node tools/fb-package-sync.cjs --write && node tools/fb-package-sync.cjs --check`.

Commit: `feat: bound recursive learning lifecycle`

---

### Task 3: Closeout, doctor, context, and bootstrap integration

**Files:**
- Modify: `tools/fb-session.cjs`
- Modify: `tools/fb-lane.cjs`
- Modify: `tools/fb-session.test.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Modify: `templates/docs/handoffs/normalized-handoff-template.md`
- Create: `templates/docs/learning/index.md`

**Interfaces:**
- Internal CLI: `node tools/fb-lane.cjs learning record <receipt.json>`, `learning status [work-type ...]`, and `learning apply <lesson-id> <observation.json>`.
- MCP: `fb_learning_record`, `fb_learning_status`, and `fb_learning_apply`, with the same validated inputs and no release authority.
- Closeout field: `Learning: none — <reason>` or a complete `## Project Learning` receipt.

- [ ] **Step 1: Add failing integration tests**

Test that completed Full BFM closeout rejects a missing learning decision, accepts a concrete `none` reason, validates a complete receipt, never changes repair-budget state, and returns only matching active lessons in `learning status`. Test bootstrap creating `docs/learning/index.md` only when absent and preserving project-owned entries on rerun.

- [ ] **Step 2: Run focused session/CLI tests and confirm RED**

Run: `node --test tools/fb-learning.test.cjs tools/fb-session.test.cjs tools/fb-lane.test.cjs`

Expected: fail on absent learning closeout and command/MCP routes.

- [ ] **Step 3: Wire the runtime**

Import the learning module into `fb-session.cjs` and `fb-lane.cjs`. Completed Full BFM validates that the handoff records either a concrete no-learning decision or a complete receipt already recorded before the final checkpoint. Doctor validates registry/observation consistency and reports counts without printing lesson narratives. Bootstrap copies the empty registry only when missing.

The CLI/MCP may record or transition learning but may not edit application source, execute treatment text, alter eval authority, or release. BFM remains responsible for applying allowlisted graph/eval/document changes before verification.

- [ ] **Step 4: Run focused GREEN**

Run: `node --test tools/fb-learning.test.cjs tools/fb-session.test.cjs tools/fb-lane.test.cjs`

Expected: all pass.

- [ ] **Step 5: Generate package mirrors and commit**

Add the new template to `tools/fb-package-manifest.json`, run package synchronization, and commit as `feat: integrate learning into BFM closeout`.

---

### Task 4: Harness, plugin guidance, and public explanation

**Files:**
- Create: `docs/fb/learning.md`
- Modify: `docs/fb/README.md`
- Modify: `docs/fb/workflow.md`
- Modify: `docs/fb/evidence.md`
- Modify: `docs/fb/guardrails.md`
- Modify: `docs/fb/sessions.md`
- Modify: `docs/fb/evals.md`
- Modify: `docs/fb/graph.md`
- Modify: `docs/fb/control-loop.md`
- Modify: `skills/bfm/SKILL.md`
- Modify: `skills/fb-product/SKILL.md`
- Modify: `skills/fb-lane-coordination/SKILL.md`
- Modify: `skills/project-coordination-setup/SKILL.md`
- Modify: `README.md`
- Modify: `FAQ.md`
- Create: `tools/fb-learning-docs.test.cjs`

**Interfaces:**
- Public positioning: Continuous Learning is a core capability beneath Graph Engineering.
- User workflow remains workstream handoffs → `$bfm` → implementation/verification → **Ready to ship** → **Push Live**.

- [ ] **Step 1: Write a failing structural documentation contract**

Require the project-first loop, five lesson states, one-revision maximum, relevant-context selection, no nested repair budget, consumer-project privacy, automatic-treatment allowlist, Product proposal boundary, and **Push Live**. Reject claims of autonomous source mutation, automatic cross-project transmission, unbounded recursion, or self-promotion.

- [ ] **Step 2: Run the contract and confirm RED**

Run: `node --test tools/fb-learning-docs.test.cjs`

Expected: fail because the canonical learning page and aligned guidance are absent.

- [ ] **Step 3: Write concise canonical and public guidance**

Use this public explanation:

> After FB verifies a feature, it records what caused meaningful failure or rework, repairs within the existing budget, and gives the next related task only the proven lesson it needs. Helpful lessons are confirmed; ineffective lessons are revised once or rejected. FB never turns continuous learning into an endless repair loop.

Add `learning.md` to the harness read order and bootstrap pack. Keep detailed state and authority rules canonical there; other pages link instead of duplicating them.

- [ ] **Step 4: Run root documentation contract, links, and whitespace**

Run: `node --test tools/fb-learning-docs.test.cjs && git diff --check`.

Expected: pass.

- [ ] **Step 5: Add new canonical files to package generation, regenerate once, and commit**

Add `docs/fb/learning.md` and `tools/fb-learning-docs.test.cjs` to the package manifest. Run `node tools/fb-package-sync.cjs --write` once after canonical review, then `--check`.

Commit: `docs: explain bounded continuous learning`

---

### Task 5: Version, release records, and final verification

**Files:**
- Modify: `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
- Modify: `plugins/fb-lane-coordination/plugin.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/versioning.md`
- Modify: `docs/setup.md`
- Modify: `PROJECT_BOARD.md`
- Create: `docs/handoffs/TASK-079.md`
- Create: `docs/qa/TASK-079.md`
- Modify: `tools/fb-plugin-metadata.test.cjs`

**Interfaces:**
- Version: `0.6.0-beta+codex.<UTC-build>` in both manifests and active release documentation.
- Release boundary: stop at **Ready to ship**; only **Push Live** authorizes merge, publication, and reinstall.

- [ ] **Step 1: Add failing metadata/release assertions**

Require exact root/package versions, Continuous Learning in plugin capability copy, all learning runtime/docs/tests in the package manifest, and no stale `0.5.12-beta` active-version claim.

- [ ] **Step 2: Run metadata tests and confirm RED**

Run: `node --test tools/fb-plugin-metadata.test.cjs tools/fb-learning-docs.test.cjs`

Expected: fail on old version and missing release records.

- [ ] **Step 3: Update manifests, changelog, handoff, QA, and board**

The changelog entry uses What changed, Why it matters, Compatibility, and Installation or upgrade. The Task Receipt records the exact candidate build, learning verification, candidate commits, package parity, changelog decision, and remaining **Push Live** gate.

- [ ] **Step 4: Generate mirrors once and run the focused gate**

Run:

```bash
node tools/fb-package-sync.cjs --write
node --test tools/fb-learning.test.cjs tools/fb-control-loop.test.cjs tools/fb-session.test.cjs tools/fb-lane.test.cjs tools/fb-learning-docs.test.cjs tools/fb-plugin-metadata.test.cjs
node tools/fb-package-sync.cjs --check
node --check tools/fb-learning.cjs
node --check tools/fb-lane.cjs
node --check tools/fb-session.cjs
git diff --check
```

Expected: all focused checks pass.

- [ ] **Step 5: Run one release checkpoint and close the candidate**

Run the repository's complete validator once, then `node tools/fb-lane.cjs doctor`. Record exact results in `docs/qa/TASK-079.md`; do not rerun the validator for coordination-only closeout.

- [ ] **Step 6: Commit and push the release candidate**

Commit: `feat: release FB 0.6.0 continuous learning`

Push `codex/project-recursive-learning`, create a PR to `main`, observe one GitHub readiness run, and report **Ready to ship** with optional links. Do not merge, publish, or reinstall before **Push Live**.
