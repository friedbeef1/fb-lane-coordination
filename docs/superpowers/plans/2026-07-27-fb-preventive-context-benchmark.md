# FB Preventive Context Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare autonomous Vanilla, autonomous broad-context FB, and autonomous preventive graph FB on Features, Bugs, Tech, and Design work, then place their observed prevention rates on a frozen 91%/99% sensitivity curve without post-failure repair credit.

**Architecture:** A focused benchmark module reuses the reviewed graduated-control runner mechanics but supplies new frozen Features, Bugs, Tech, and Design truth. It classifies 264 cases as deliverable and 24 as intentional blockers and calculates a prevention-versus-readiness sensitivity curve without assuming graph effectiveness. A separate real-Codex holdout gives all three arms equal authority and aggregate budgets while allowing each system to choose its own agent topology; observed prevention rates are then placed on the frozen curve. Existing evidence and plugin runtime remain unchanged.

**Tech Stack:** Node.js CommonJS, `node:test`, JSON fixtures, Markdown evidence, Git hashes.

## Global Constraints

- Report 91% as at least 241/264 first-pass deliverables.
- Report 99% as at least 262/264 first-pass deliverables.
- Require 24/24 intentional blockers correct for either milestone.
- Do not credit diagnosis or repair after a failed first implementation.
- Do not use hidden grading fields to route or construct candidate context.
- Do not assign an assumed prevention accuracy to any arm; autonomous evidence
  supplies observed prevention rates.
- Preserve all unfavorable outcomes and refuse an in-place authoritative rerun.
- Use Features, Bugs, Tech, and Design as the four scenario families; do not
  pool their results with older Media, Product, Software, or Support outcomes.
- Do not prescribe agent count, concurrency, workstreams, or integration passes
  in the autonomous holdout; record what each arm chooses.
- Report authoritative provider tokens and cost when available, otherwise mark
  them unavailable rather than inventing estimates.
- Do not change active plugin behavior, package mirrors, publication, merge, installation, or deployment state.

---

### Task 1: Freeze denominator and first-pass scoring

**Files:**
- Create: `tools/fb-preventive-context-benchmark.cjs`
- Create: `tools/fb-preventive-context-benchmark.test.cjs`
- Create: `tools/fixtures/fb-preventive-context-truth.json`
- Create: `tools/fixtures/fb-preventive-context-settings.json`
- Create: `docs/benchmarks/control-loop/preventive-context-frozen-declaration.json`

**Interfaces:**
- Consumes: reviewed runner mechanics plus new frozen Features, Bugs, Tech, and
  Design truth and settings.
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
It requires exactly 24 cases in each of Features, Bugs, Tech, and Design and
rejects the older family names.

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
git add tools/fb-preventive-context-benchmark.cjs tools/fb-preventive-context-benchmark.test.cjs tools/fixtures/fb-preventive-context-truth.json tools/fixtures/fb-preventive-context-settings.json docs/benchmarks/control-loop/preventive-context-frozen-declaration.json
git commit -m "test: freeze preventive context benchmark"
```

---

### Task 2: Add preventive packets and the sensitivity curve

**Files:**
- Modify: `tools/fb-preventive-context-benchmark.cjs`
- Modify: `tools/fb-preventive-context-benchmark.test.cjs`

**Interfaces:**
- Consumes: projected public case fields, avoidable-failure classification,
  milestone thresholds, and cost ceilings.
- Produces: `compilePreventivePacket(publicCase, priorPublicState)` and
  `preventionSensitivity(baselineReady, avoidableFailures, rates)`.

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

- [ ] **Step 3: Implement public-signal packets and sensitivity math**

Use only public signals:

- `criteria_missing` triggers clarification before implementation;
- `evaluator_conflict` adds pairwise criteria before implementation;
- `output_defect` adds the observed defect and acceptance proof;
- regression evidence adds baseline-retention criteria;
- sensitive triggers add the safety contract and Level 4 gate;
- `access_missing` and policy-boundary blockers remain blocked.

Do not decide whether a packet succeeds. For each frozen rate in
`[0, 0.25, 0.5, 0.75, 0.91, 0.95, 0.99, 1]`, calculate the number of avoidable
failures that would need prevention, the resulting readiness, and the allowed
token/time envelope. Calculate exact minimum prevention counts and rates for
241/264 and 262/264 using ceiling arithmetic.

- [ ] **Step 4: Add adversarial policy tests**

Prove:

- missing criteria cannot pass without clarification evidence;
- intentional blockers never become ready;
- no sensitivity point mutates or relabels an underlying case;
- changing hidden truth without changing public inputs does not change routing;
- safety and privacy checks override efficiency;
- no post-failure diagnosis or repair changes headline readiness.

- [ ] **Step 5: Run Task 2 tests and commit**

Run the focused test, syntax, and whitespace. Commit:

```bash
git add tools/fb-preventive-context-benchmark.cjs tools/fb-preventive-context-benchmark.test.cjs
git commit -m "feat: model preventive context sensitivity"
```

---

### Task 3: Execute one frozen modeled diagnostic

**Files:**
- Modify: `tools/fb-preventive-context-benchmark.cjs`
- Create: `docs/benchmarks/control-loop/preventive-context-results.json`
- Create: `docs/benchmarks/control-loop/preventive-context.md`
- Create: `docs/qa/TASK-052.md`
- Modify: `docs/handoffs/TASK-052.md`
- Modify: `docs/handoffs/index.md`
- Modify: `PROJECT_BOARD.md`

**Interfaces:**
- Consumes: the frozen declaration, tested three-arm first-pass reconstruction,
  and sensitivity calculator.
- Produces: one immutable diagnostic bundle, readable report, and coherent
  TASK-052 checkpoint.

- [ ] **Step 1: Write result-integrity tests**

Require exact recomputation of:

- first-pass ready count and rate;
- 91% and 99% milestone predicates;
- correct blockers;
- raw modeled tokens and minutes;
- avoidable failures and required prevention counts/rates;
- all eight sensitivity points and their cost envelopes;
- post-headline repairs required but not credited;
- safety, privacy, and missed-control metrics.

Mutation tests must reject threshold changes, deleted unfavorable rows,
blocker relabeling, repair credit, altered rates or sensitivity math, and a
second in-place run.

- [ ] **Step 2: Run the focused test and verify RED**

Expected: failure because result writing and validation are absent.

- [ ] **Step 3: Implement result generation and reporting**

The Markdown report presents:

| Arm | First-pass ready | 91% | 99% | Correct blockers | Tokens | Time |
|---|---:|---:|---:|---:|---:|---:|

It separately reports the sensitivity curve, exact prevention needed for 91%
and 99%, signed baseline comparisons, the cost envelope from 91% to 99%,
failure categories, and limitations. It must state that the curve is
mathematical and does not claim graph effectiveness. All token/time values are
modeled rather than observed.

- [ ] **Step 4: Run the sole authoritative modeled comparison**

Run:

```bash
node tools/fb-preventive-context-benchmark.cjs run
```

Do not modify thresholds, rates, classification, or cost envelopes after
seeing the result.

- [ ] **Step 5: Validate and close the modeled result**

Run the focused suite, syntax, record coherence, and whitespace checks. Update
TASK-052 records with the actual diagnostic and the minimum prevention rates
required for 91% and 99%. Only an integrity, privacy, or safety failure closes
Task 4.

- [ ] **Step 6: Commit**

Commit the result and records:

```bash
git add tools/fb-preventive-context-benchmark.cjs tools/fb-preventive-context-benchmark.test.cjs docs/benchmarks/control-loop/preventive-context-results.json docs/benchmarks/control-loop/preventive-context.md docs/qa/TASK-052.md docs/handoffs/TASK-052.md docs/handoffs/index.md PROJECT_BOARD.md
git commit -m "test: record preventive context result"
```

---

### Task 4: Autonomous real-Codex holdout

**Files:**
- Create after Task 3 passes integrity, privacy, and safety:
  `docs/benchmarks/control-loop/preventive-context-real-codex.json`
- Modify:
  `docs/benchmarks/control-loop/preventive-context.md`
  `docs/qa/TASK-052.md`
  `docs/handoffs/TASK-052.md`
  `PROJECT_BOARD.md`

**Interfaces:**
- Consumes: the frozen six-scenario holdout, three prompt projections,
  identical starting repositories, and equal aggregate authority/resource
  budgets.
- Produces: observed orchestration choices, provider tokens when available,
  wall time, first-pass readiness, and blocker correctness.

- [ ] **Step 1: Verify the integrity and safety gate**

Do not run real Codex if evidence integrity, privacy, or safety validation
fails. A missed modeled milestone remains unfavorable evidence but does not
suppress the approved autonomous comparison.

- [ ] **Step 2: Run one excluded shakedown**

Verify prompt isolation, equal aggregate budgets, orchestration-event capture,
usage capture, time limits, privacy rejection, and first-pass scoring. Exclude
this evidence from comparison.

- [ ] **Step 3: Run the fixed three-arm holdout once**

Give each arm the same outcome, tools, model, repository state, resource
ceiling, and authority. Do not tell any arm how many agents to spawn or whether
to use concurrency. Record agents spawned, maximum concurrency, workstreams,
integration passes, tool calls, and elapsed time. Preserve every valid
unfavorable outcome and do not retry failed product runs.

- [ ] **Step 4: Record evidence and commit**

Report real usage separately from modeled results. If authoritative provider
tokens or cost are unavailable, report `unavailable`; context bytes are a
secondary proxy only. Do not generalize six scenarios into a universal
percentage.

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
