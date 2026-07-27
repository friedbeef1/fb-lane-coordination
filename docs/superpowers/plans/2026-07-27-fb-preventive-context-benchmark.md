# FB Preventive Context Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare Vanilla, broad-context FB, and preventive graph FB on first-pass deliverable readiness and test one frozen preventive candidate against 91% and 99% milestones without post-failure repair credit.

**Architecture:** A focused benchmark module consumes the immutable reviewed graduated-control evidence and frozen truth. It classifies 264 cases as deliverable and 24 as intentional blockers, derives first-pass outcomes for the two existing arms, applies one public-signal-only preventive policy to the graph arm, and writes a frozen declaration plus machine and Markdown results. The existing benchmark and plugin runtime remain unchanged.

**Tech Stack:** Node.js CommonJS, `node:test`, JSON fixtures, Markdown evidence, Git hashes.

## Global Constraints

- Report 91% as at least 241/264 first-pass deliverables.
- Report 99% as at least 262/264 first-pass deliverables.
- Require 24/24 intentional blockers correct for either milestone.
- Do not credit diagnosis or repair after a failed first implementation.
- Do not use hidden grading fields to route or construct candidate context.
- Preserve all unfavorable outcomes and refuse an in-place authoritative rerun.
- Do not change active plugin behavior, package mirrors, publication, merge, installation, or deployment state.

---

### Task 1: Freeze denominator and first-pass scoring

**Files:**
- Create: `tools/fb-preventive-context-benchmark.cjs`
- Create: `tools/fb-preventive-context-benchmark.test.cjs`
- Create: `docs/benchmarks/control-loop/preventive-context-frozen-declaration.json`

**Interfaces:**
- Consumes: reviewed `graduated-results.json`, frozen truth, and settings.
- Produces: `classifyCases(truth)`, `firstPassRecords(reviewed, classification)`, `buildDeclaration()`, and `validateDeclaration()`.

- [ ] **Step 1: Write denominator and repair-exclusion tests**

Add tests asserting:

```js
assert.equal(classification.deliverable.size, 264);
assert.equal(classification.intentionalBlocker.size, 24);
assert.equal(classification.overlap.size, 0);
assert.equal(classification.total, 288);
assert.equal(firstPass.fullFb.filter(row => row.ready).length, expectedFullFirstPass);
assert(firstPass.fullFb.every(row => !row.repairCredited));
```

The test also requires all 24 blocker IDs to be exactly the frozen
`unresolved-environment` and `sensitive-block` cases across three seeds.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tools/fb-preventive-context-benchmark.test.cjs
```

Expected: failure because the benchmark module does not exist.

- [ ] **Step 3: Implement classification and first-pass reconstruction**

Map case IDs to frozen public case data and classification. For reviewed rows
with `repairAttempted: true`, reconstruct headline readiness from the state
before repair: a repair outcome never supplies first-pass credit. Preserve
blocker correctness as a separate field.

- [ ] **Step 4: Freeze and validate the declaration**

The declaration binds:

- reviewed result hash and source commit;
- truth and settings hashes;
- runner/grader hash;
- 241/264 and 262/264 thresholds;
- 24/24 blocker requirement;
- no-repair scoring;
- one-run and no-tuning policy;
- privacy and release boundaries.

- [ ] **Step 5: Run Task 1 tests and commit**

Run the focused test, syntax check, and whitespace check. Commit:

```bash
git add tools/fb-preventive-context-benchmark.cjs tools/fb-preventive-context-benchmark.test.cjs docs/benchmarks/control-loop/preventive-context-frozen-declaration.json
git commit -m "test: freeze preventive context benchmark"
```

---

### Task 2: Add the public-signal preventive arm

**Files:**
- Modify: `tools/fb-preventive-context-benchmark.cjs`
- Modify: `tools/fb-preventive-context-benchmark.test.cjs`

**Interfaces:**
- Consumes: projected public case fields, common deterministic draws, and the frozen preventive policy.
- Produces: `compilePreventivePacket(publicCase, priorPublicState)` and `executePreventiveCase(packet, publicCase, draw)`.

- [ ] **Step 1: Write arm-isolation and packet tests**

Require preventive packets to contain only:

```js
{
  objective,
  activeDecision,
  relevantEvidence,
  contradictions,
  missingRequirements,
  riskTriggers,
  acceptanceCriteria
}
```

Tests reject hidden fields, repair artifacts, transcripts, private reasoning,
credentials, and unrelated completed context. Vanilla packets must contain no
FB vocabulary; broad FB packets must not contain graph-selected fields.

- [ ] **Step 2: Run the focused test and verify RED**

Expected: failure because the compiler and executor are absent.

- [ ] **Step 3: Implement the frozen prevention policy**

Use only public signals:

- `criteria_missing` triggers clarification before implementation;
- `evaluator_conflict` adds pairwise criteria before implementation;
- `output_defect` adds the observed defect and acceptance proof;
- regression evidence adds baseline-retention criteria;
- sensitive triggers add the safety contract and Level 4 gate;
- `access_missing` and policy-boundary blockers remain blocked.

Use the existing common deterministic component draws. Freeze preventive
execution accuracy at the existing reviewed `repairAccuracy` of `0.68`; this is
a conservative inherited capability assumption, not a tuned result. A
successful preventive draw changes the first implementation outcome directly
and records `preventionApplied: true`; it never calls or credits repair.

- [ ] **Step 4: Add adversarial policy tests**

Prove:

- missing criteria cannot pass without clarification evidence;
- intentional blockers never become ready;
- a failed preventive draw remains a first-pass failure;
- changing hidden truth without changing public inputs does not change routing;
- safety and privacy checks override efficiency;
- no post-failure diagnosis or repair changes headline readiness.

- [ ] **Step 5: Run Task 2 tests and commit**

Run the focused test, syntax, and whitespace. Commit:

```bash
git add tools/fb-preventive-context-benchmark.cjs tools/fb-preventive-context-benchmark.test.cjs
git commit -m "feat: model preventive graph context"
```

---

### Task 3: Execute one frozen modeled comparison

**Files:**
- Modify: `tools/fb-preventive-context-benchmark.cjs`
- Create: `docs/benchmarks/control-loop/preventive-context-results.json`
- Create: `docs/benchmarks/control-loop/preventive-context.md`
- Create: `docs/qa/TASK-052.md`
- Modify: `docs/handoffs/TASK-052.md`
- Modify: `docs/handoffs/index.md`
- Modify: `PROJECT_BOARD.md`

**Interfaces:**
- Consumes: the frozen declaration and tested three-arm runner.
- Produces: one immutable result bundle, readable report, and coherent TASK-052 closeout.

- [ ] **Step 1: Write result-integrity tests**

Require exact recomputation of:

- first-pass ready count and rate;
- 91% and 99% milestone predicates;
- correct blockers;
- raw modeled tokens and minutes;
- prevention attempts and successes;
- post-headline repairs required but not credited;
- safety, privacy, and missed-control metrics.

Mutation tests must reject threshold changes, deleted unfavorable rows,
blocker relabeling, repair credit, altered draws, and a second in-place run.

- [ ] **Step 2: Run the focused test and verify RED**

Expected: failure because result writing and validation are absent.

- [ ] **Step 3: Implement result generation and reporting**

The Markdown report presents:

| Arm | First-pass ready | 91% | 99% | Correct blockers | Tokens | Time |
|---|---:|---:|---:|---:|---:|---:|

It reports signed comparisons, the cost from the 91% threshold to the 99%
threshold, failure categories, and limitations. It must label all token/time
values modeled rather than observed.

- [ ] **Step 4: Run the sole authoritative modeled comparison**

Run:

```bash
node tools/fb-preventive-context-benchmark.cjs run
```

Do not modify thresholds or rerun after seeing the result.

- [ ] **Step 5: Validate and close the modeled result**

Run the focused suite, syntax, record coherence, and whitespace checks. Update
TASK-052 records with the actual result. If the deterministic result is below
91%, close the real-Codex gate. If it reaches 91% but misses 99%, preserve the
result and permit evidence-only diagnosis without tuning or adoption. Only a
99% result with every safety/privacy/efficiency predicate may open Task 4.

- [ ] **Step 6: Commit**

Commit the result and records:

```bash
git add tools/fb-preventive-context-benchmark.cjs tools/fb-preventive-context-benchmark.test.cjs docs/benchmarks/control-loop/preventive-context-results.json docs/benchmarks/control-loop/preventive-context.md docs/qa/TASK-052.md docs/handoffs/TASK-052.md docs/handoffs/index.md PROJECT_BOARD.md
git commit -m "test: record preventive context result"
```

---

### Task 4: Conditional real-Codex holdout

**Files:**
- Create only if Task 3 opens the gate:
  `docs/benchmarks/control-loop/preventive-context-real-codex.json`
- Modify only if Task 3 opens the gate:
  `docs/benchmarks/control-loop/preventive-context.md`
  `docs/qa/TASK-052.md`
  `docs/handoffs/TASK-052.md`
  `PROJECT_BOARD.md`

**Interfaces:**
- Consumes: the frozen six-scenario holdout and three prompt projections.
- Produces: observed provider tokens, wall time, first-pass readiness, and blocker correctness.

- [ ] **Step 1: Verify the conditional gate**

Do not run real Codex unless the modeled candidate reaches 99% and every
non-readiness predicate passes.

- [ ] **Step 2: Run one excluded shakedown**

Verify prompt isolation, usage capture, time limits, privacy rejection, and
first-pass scoring. Exclude this evidence from comparison.

- [ ] **Step 3: Run the fixed three-arm holdout once**

Preserve every valid unfavorable outcome. Do not retry failed product runs.

- [ ] **Step 4: Record evidence and commit**

Report real usage separately from modeled results. Do not generalize six
scenarios into a universal percentage.

---

## Final Verification

Run only:

```bash
node --test tools/fb-preventive-context-benchmark.test.cjs
node --check tools/fb-preventive-context-benchmark.cjs
node --test tools/fb-records.test.cjs
git diff --check
git status --short --branch
```

Do not run the full repository validator, duplicate packaged tests, package
generation, publication, merge, installation, or deployment.

