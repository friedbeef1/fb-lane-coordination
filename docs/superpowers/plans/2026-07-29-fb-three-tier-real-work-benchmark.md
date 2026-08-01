# FB Three-Tier Real-Work Benchmark Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` to implement this plan one task at a
> time with implementation and review gates.

**Goal:** Compare Vanilla Codex with Efficient-Graph FB across eighteen
traceable historical tasks split evenly into easy, medium, and difficult tiers.

**Architecture:** Extend the TASK-056 real-work runner rather than replacing it.
A frozen registry holds historical source and acceptance refs, public task
facts, tier, and grader. Immutable receipts import the six completed TASK-056
pairs. A tier-aware controller schedules only the twelve missing pairs, applies
equal model and time limits, permits one fresh-delta repair, checkpoints
atomically, and publishes tier-level evidence.

**Tech stack:** Node.js CommonJS, Git fixtures, Codex `exec`, JSON evidence,
Markdown reports, `node:test`.

## Global constraints

- Use `gpt-5.4` for both arms.
- Allow 20 minutes for the first pass and one 10-minute fresh-delta repair.
- Stop before the aggregate provider-token usage exceeds 60,000,000.
- Keep Unmirror and MÉJA repositories read-only.
- Preserve TASK-056 results; do not rewrite or selectively rerun them.
- Run one excluded shakedown, then exactly 24 new counted runs.
- Preserve valid failures and unfavorable results.
- Report strict acceptance, mean readiness, and the proportion of outcomes at
  or above 80% readiness.
- Do not push, merge, publish, install, release, or deploy.

### Task 1: Freeze the tier registry and reuse contract

**Files:**

- Create: `tools/fixtures/fb-three-tier-benchmark/tasks.json`
- Create: `tools/fb-three-tier-benchmark.cjs`
- Create: `tools/fb-three-tier-benchmark.test.cjs`

**Steps:**

1. Write failing tests for exactly eighteen unique tasks, six per tier, equal
   repository representation across the full study (nine tasks per repository),
   immutable source/acceptance refs, and exact TASK-056 reuse receipts.
2. Freeze these IDs:
   - easy: `unmirror-intro`, `unmirror-intro-persistence`, `meja-scroll`,
     `meja-topic-flip`, `meja-back-navigation`,
     `meja-first-timer-readiness`;
   - medium: `unmirror-intro-polish`, `unmirror-landscape-camera`,
     `unmirror-actual-reassurance`, `meja-home-scroll`,
     `meja-sync-warning`, `meja-redesign`;
   - difficult: `unmirror-saved-capture`, `unmirror-native-analytics`,
     `unmirror-unified-shutter`, `unmirror-ios-camera-crash`,
     `meja-pairing`, `meja-auth-hardening`.
3. Implement `loadTierRegistry()`, `buildReuseReceipts()`, and
   `buildThreeTierSchedule()`.
4. Make every reuse receipt include the original result hash, declaration hash,
   task ID, arm, provider usage, wall time, acceptance, and readiness.
5. Run the focused test and commit:
   `feat: freeze three-tier benchmark registry`.

### Task 2: Add the six missing Unmirror historical fixtures

**Files:**

- Modify: `tools/fixtures/fb-three-tier-benchmark/tasks.json`
- Create/modify: `tools/fixtures/fb-three-tier-benchmark/graders/*`
- Modify: `tools/fb-three-tier-benchmark.test.cjs`

**Steps:**

1. Resolve exact historical source and accepted refs for intro persistence,
   intro polish, landscape camera, actual reassurance, unified shutter, and the
   iOS camera crash.
2. Record only public facts available at the historical starting point.
3. Add deterministic graders proving the historical start fails and the
   accepted state passes.
4. Stop without substituting another task if any task cannot be traced.
5. Run the focused registry/grader tests and commit:
   `test: add Unmirror tier benchmark fixtures`.

### Task 3: Add the six missing MÉJA historical fixtures

**Files:**

- Modify: `tools/fixtures/fb-three-tier-benchmark/tasks.json`
- Create/modify: `tools/fixtures/fb-three-tier-benchmark/graders/*`
- Modify: `tools/fb-three-tier-benchmark.test.cjs`

**Steps:**

1. Resolve exact historical source and accepted refs for topic flip, back
   navigation, first-timer readiness, home scroll, sync warning, and auth
   hardening.
2. Record deterministic, credential-free acceptance criteria.
3. Prove every historical start fails and every accepted state passes.
4. Stop without substitution if traceability is insufficient.
5. Run focused registry/grader tests and commit:
   `test: add MEJA tier benchmark fixtures`.

### Task 4: Add tier-aware execution, budgets, checkpoints, and aggregation

**Files:**

- Modify: `tools/fb-three-tier-benchmark.cjs`
- Modify: `tools/fb-three-tier-benchmark.test.cjs`
- Reuse: `tools/fb-real-work-benchmark-*.cjs`

**Steps:**

1. Write fake-Codex tests for preflight, excluded shakedown, exact schedule,
   equal arm inputs, time limits, fresh-delta repair, atomic checkpoint resume,
   privacy rejection, source-repository cleanliness, provider usage, token
   ceiling, and result recomputation.
2. Add CLI operations:

   ```bash
   node tools/fb-three-tier-benchmark.cjs preflight --experiment fb-three-tier-059-20260729
   node tools/fb-three-tier-benchmark.cjs shakedown --experiment fb-three-tier-059-20260729
   node tools/fb-three-tier-benchmark.cjs run --experiment fb-three-tier-059-20260729
   node tools/fb-three-tier-benchmark.cjs summarize --experiment fb-three-tier-059-20260729
   ```

3. Refuse counted runs before a passing preflight and excluded shakedown, after
   a counted schedule is complete, or when the next run could exceed the
   aggregate token ceiling.
4. Keep each counted result immutable and recoverable.
5. Run the focused tests and commit:
   `feat: add three-tier benchmark controller`.

### Task 5: Execute the comparison and publish evidence

**Files:**

- Create: `docs/benchmarks/difficulty-tiers/declaration.json`
- Create: `docs/benchmarks/difficulty-tiers/results.json`
- Create: `docs/benchmarks/difficulty-tiers/README.md`
- Modify: `docs/qa/TASK-059.md`
- Modify: `docs/handoffs/TASK-059.md`
- Modify: `docs/handoffs/INDEX.md`
- Modify: `PROJECT_BOARD.md`

**Steps:**

1. Run deterministic preflight.
2. Run one excluded real-Codex shakedown.
3. If it passes, run the 24 missing counted comparisons once.
4. Recompute results only from immutable TASK-056 receipts and the new
   checkpoints.
5. Publish per-task and per-tier medians, ranges, signed differences, strict
   acceptance, mean readiness, outcomes at or above 80%, provider tokens,
   repair use, and limitations.
6. Run focused benchmark tests, affected syntax, links, and whitespace.
7. Complete the Task Receipt and QA evidence without claiming universal FB
   superiority.
8. Commit:
   `docs: record three-tier FB benchmark`.
