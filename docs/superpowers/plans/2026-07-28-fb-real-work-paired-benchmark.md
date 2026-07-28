# Real-Work Paired FB Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure Vanilla versus Preventive Graph FB on six paired historical Unmirror and MÉJA tasks using observed wall time, provider usage when exposed, first-pass readiness, and one bounded repair.

**Architecture:** A canonical task registry describes immutable historical source and acceptance references. A fixture builder exports starting trees without Git history, produces equivalent arm packets and receipts, and keeps hidden graders outside subjects. A bounded Codex runner executes one first pass and at most one repair, preserves redacted usage evidence, and aggregates raw paired results before any workload-weighted estimate.

**Tech Stack:** Node.js CommonJS, built-in `node:test`, Git CLI, Codex `exec --json`, Markdown/JSON evidence.

## Global Constraints

- Source repositories are read-only inputs.
- No network, provider write, production, staging, release, deployment, or plugin mutation.
- One excluded shakedown precedes all counted runs.
- Six tasks × two arms = exactly 12 counted first-pass runs.
- A failed counted run earns at most one repair resume; no selective replacement.
- Both arms receive identical public facts and zero user decisions after launch.
- Provider tokens are reported only when authoritative JSON events expose them.
- Raw event streams remain local and redacted; transcripts, private reasoning, secrets, and environment values are never committed.
- Raw six-pair results are primary; retrospective workload weighting is secondary.

---

### Task 1: Freeze the historical task and retrospective registries

**Files:**
- Create: `tools/fixtures/fb-real-work-benchmark/tasks.json`
- Create: `tools/fixtures/fb-real-work-benchmark/retrospective.json`
- Create: `tools/fb-real-work-benchmark-lib.cjs`
- Create: `tools/fb-real-work-benchmark.test.cjs`

**Interfaces:**
- Produces: `loadTaskRegistry(): TaskDefinition[]`
- Produces: `loadRetrospectiveRegistry(): RetrospectiveTask[]`
- Produces: `validateRegistry(tasks, retrospective): void`
- `TaskDefinition` contains `id`, `project`, `sourceRepo`, `startCommit`,
  `acceptanceCommits`, `class`, `publicRecords`, `focusedProof`, and
  `hiddenGrader`.

- [ ] **Step 1: Write the failing registry contract**

```js
test('freezes six paired tasks and an 18-task real-work mix', () => {
  const tasks = loadTaskRegistry();
  const retrospective = loadRetrospectiveRegistry();
  assert.equal(tasks.length, 6);
  assert.equal(retrospective.length, 18);
  assert.deepEqual(
    tasks.map(task => task.id),
    [
      'unmirror-intro',
      'unmirror-saved-capture',
      'unmirror-native-analytics',
      'meja-scroll',
      'meja-pairing',
      'meja-redesign',
    ],
  );
  assert.doesNotThrow(() => validateRegistry(tasks, retrospective));
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tools/fb-real-work-benchmark.test.cjs`

Expected: FAIL because the registry loader does not exist.

- [ ] **Step 3: Add the exact six task definitions**

Use the commits approved in the design:

```json
{
  "id": "unmirror-intro",
  "project": "Unmirror",
  "sourceRepo": "/Users/jamesyeang/Projects/mirrorcam",
  "startCommit": "2600f57",
  "acceptanceCommits": ["c6e5fde", "de82cbc"],
  "class": "isolated",
  "publicRecords": [
    "docs/handoffs/2026-07-23-intro-headline-amendment-product-handoff.md"
  ],
  "focusedProof": "unmirror-intro",
  "hiddenGrader": "unmirror-intro"
}
```

Add the other five approved tasks with their exact commits and records.

- [ ] **Step 4: Add 18 objectively selected retrospective tasks**

Use nine implementation-bearing board tasks from each project, spanning:

```json
{
  "classes": {
    "isolated": 4,
    "isolated-bug": 4,
    "multi-surface": 3,
    "complex-repair": 3,
    "multi-workstream": 2,
    "sensitive": 2
  }
}
```

Each row records task ID, project, class, source commit range, source commit
count, repair commit count, affected surfaces, and safety/release trigger.

- [ ] **Step 5: Implement strict registry validation**

```js
function validateRegistry(tasks, retrospective) {
  assertUnique(tasks.map(task => task.id), 'task id');
  assertUnique(retrospective.map(task => `${task.project}:${task.taskId}`),
    'retrospective task');
  if (tasks.length !== 6 || retrospective.length !== 18) {
    throw new Error('Frozen registry cardinality mismatch');
  }
  for (const task of tasks) {
    if (!ALLOWED_REPOS.has(task.sourceRepo)) {
      throw new Error(`Unapproved source repository: ${task.sourceRepo}`);
    }
    assertSafeCommit(task.startCommit);
    task.acceptanceCommits.forEach(assertSafeCommit);
  }
}
```

- [ ] **Step 6: Run GREEN and commit**

Run: `node --test tools/fb-real-work-benchmark.test.cjs`

Expected: PASS.

Commit: `test: freeze real-work benchmark registry`

---

### Task 2: Build safe historical fixture exports

**Files:**
- Create: `tools/fb-real-work-fixture.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/forbidden-paths.json`
- Modify: `tools/fb-real-work-benchmark.test.cjs`

**Interfaces:**
- Produces: `exportFixture(task: TaskDefinition, target: string): FixtureReceipt`
- Produces: `scanFixture(target: string): { files: string[], rejected: string[] }`
- `FixtureReceipt` contains task ID, source commit, tree hash, exported-file
  hash, public-record hashes, and removed-path list.

- [ ] **Step 1: Add fake-repository export tests**

Test that export:

```js
assert.equal(fs.existsSync(path.join(target, '.git')), false);
assert.equal(fs.existsSync(path.join(target, '.env')), false);
assert.equal(receipt.startCommit, sourceCommit);
assert.match(receipt.exportedFilesSha256, /^[a-f0-9]{64}$/);
assert.deepEqual(scanFixture(target).rejected, []);
```

Also prove traversal, unknown repos, missing commits, symlinks escaping the
fixture, secrets, build outputs, and oversized binary files stop preparation.

- [ ] **Step 2: Run RED**

Run: `node --test tools/fb-real-work-benchmark.test.cjs`

Expected: FAIL because `exportFixture` is missing.

- [ ] **Step 3: Implement archive export**

Use `git archive <commit>` into a temporary tar, extract only within `target`,
then delete forbidden tracked paths:

```js
const FORBIDDEN = [
  /^\.env(?:\.|$)/,
  /(^|\/)(node_modules|dist|build|DerivedData|\.gradle)(\/|$)/,
  /\.(?:jks|keystore|p12|mobileprovision)$/,
];
```

Reject any matching secret marker rather than silently committing it.

- [ ] **Step 4: Copy only declared public records**

The arm packet is built outside the exported tree. Do not leave board history,
handoff indexes, or unrelated handoffs available to subjects.

- [ ] **Step 5: Run GREEN, syntax, and commit**

Run:

```bash
node --test tools/fb-real-work-benchmark.test.cjs
node --check tools/fb-real-work-fixture.cjs
git diff --check
```

Commit: `feat: add safe historical benchmark exports`

---

### Task 3: Add behavior graders and equivalent treatment packets

**Files:**
- Create: `tools/fb-real-work-context.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/prompts.json`
- Create: `tools/fixtures/fb-real-work-benchmark/graders/unmirror-intro.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/graders/unmirror-saved-capture.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/graders/unmirror-native-analytics.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/graders/meja-scroll.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/graders/meja-pairing.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/graders/meja-redesign.cjs`
- Modify: `tools/fb-real-work-benchmark.test.cjs`

**Interfaces:**
- Produces: `compilePublicFacts(task, fixture): PublicFacts`
- Produces: `compileTreatment(arm, publicFacts): TreatmentReceipt`
- Produces: `gradeCandidate(taskId, candidateDir): Grade`
- `Grade` contains criterion rows, `passed`, `total`, `readiness`, mandatory
  blocker rows, and combined pass.

- [ ] **Step 1: Write equivalence and leakage tests**

```js
assert.equal(vanilla.publicFactsSha256, graph.publicFactsSha256);
assert.equal(vanilla.graphPacket, null);
assert(graph.graphPacket);
assert.deepEqual(
  new Set(flattenFacts(graph.graphPacket)),
  new Set(flattenFacts(publicFacts)),
);
assert.equal(JSON.stringify(vanilla).includes('hiddenGrader'), false);
assert.equal(JSON.stringify(graph).includes('acceptanceCommits'), false);
```

- [ ] **Step 2: Write adversarial grader tests**

For each task, test:

- untouched starting tree fails;
- historical accepted tree passes;
- a candidate that only copies expected filenames fails;
- safety/missing-evidence blockers cannot also receive completion credit;
- alternative behaviorally correct implementations can pass without matching
  the historical diff.

- [ ] **Step 3: Run RED**

Run: `node --test tools/fb-real-work-benchmark.test.cjs`

Expected: FAIL because compilers and graders are missing.

- [ ] **Step 4: Implement public-fact and graph compilation**

The graph packet contains only:

```js
{
  objective,
  relevantDecisions,
  assumptions,
  changedEvidence,
  acceptanceCriteria,
  riskTriggers,
  requiredOutput,
  recordLinks
}
```

Keep `recordLinks` fixture-local and reject unresolved links.

- [ ] **Step 5: Implement six task-specific graders**

Each grader exports:

```js
module.exports.grade = function grade(candidateDir) {
  return {
    criteria: [],
    blockers: [],
    pass: false,
  };
};
```

Use existing historical tests when portable; otherwise use deterministic
source/behavior contracts named in the public acceptance criteria. Do not
compare exact source hashes or historical patch text.

- [ ] **Step 6: Run GREEN and commit**

Run:

```bash
node --test tools/fb-real-work-benchmark.test.cjs
node --check tools/fb-real-work-context.cjs
node --check tools/fixtures/fb-real-work-benchmark/graders/*.cjs
```

Commit: `test: add real-work treatments and graders`

---

### Task 4: Implement bounded Codex execution and authoritative usage parsing

**Files:**
- Create: `tools/fb-real-work-runner.cjs`
- Create: `tools/fixtures/fb-real-work-benchmark/run-result.schema.json`
- Modify: `tools/fb-real-work-benchmark.test.cjs`

**Interfaces:**
- Produces: `runFirstPass(runConfig): Promise<RunEvidence>`
- Produces: `runRepair(runEvidence, failurePacket): Promise<RunEvidence>`
- Produces: `parseCodexJsonl(text): { sessionId, usage, events }`
- Produces: `redactEvents(events): CuratedEvent[]`

- [ ] **Step 1: Add fake-Codex lifecycle tests**

Fixtures must cover:

- usage present with input/cached/output tokens;
- usage absent;
- malformed JSONL;
- timeout;
- nonzero Codex exit;
- session ID extraction;
- one successful repair resume;
- second repair rejection;
- transcript/private-reasoning/secret rejection;
- run-directory escape rejection.

- [ ] **Step 2: Run RED**

Run: `node --test tools/fb-real-work-benchmark.test.cjs`

Expected: FAIL because the runner is missing.

- [ ] **Step 3: Implement first-pass runner**

Execute:

```text
codex exec --json --ignore-user-config --sandbox workspace-write -C <fixture>
```

Use an isolated per-run `CODEX_HOME` that receives authentication only for the
live process. Do not copy authentication or configuration into committed
evidence.

Capture:

```js
{
  startedAt,
  finishedAt,
  wallTimeMs,
  exitCode,
  sessionId,
  usage: {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    authoritative
  },
  treatmentReceiptSha256,
  candidateSha256
}
```

- [ ] **Step 4: Implement one repair resume**

Resume the same session with only:

```js
{
  failedPublicChecks,
  observedOutput,
  requiredAcceptance,
  instruction: 'Make one consolidated repair, rerun only the failed proof, and stop.'
}
```

Reject repair when the first pass already succeeded or a repair record exists.

- [ ] **Step 5: Implement redaction**

Committed curated events may contain event type, timestamp, tool category,
status, usage, and hashes. They must not contain prompts, message text,
transcripts, environment values, filesystem secrets, or reasoning.

- [ ] **Step 6: Run GREEN and commit**

Run:

```bash
node --test tools/fb-real-work-benchmark.test.cjs
node --check tools/fb-real-work-runner.cjs
git diff --check
```

Commit: `feat: add bounded real-work Codex runner`

---

### Task 5: Freeze, prepare, and shakedown the study

**Files:**
- Create: `tools/fb-real-work-benchmark.cjs`
- Create: `docs/benchmarks/real-work/frozen-declaration.json`
- Create: `docs/benchmarks/real-work/shakedown.json`
- Modify: `tools/fb-real-work-benchmark.test.cjs`
- Modify: `docs/handoffs/TASK-054.md`

**Interfaces:**
- Command: `node tools/fb-real-work-benchmark.cjs prepare --root <dir>`
- Command: `node tools/fb-real-work-benchmark.cjs shakedown --root <dir>`
- Command: `node tools/fb-real-work-benchmark.cjs run --root <dir>`
- Command: `node tools/fb-real-work-benchmark.cjs summarize --root <dir>`

- [ ] **Step 1: Test freeze and scheduling**

Assert:

- all registry, prompt, grader, source tree, public-record, runner, and schema
  hashes match the declaration;
- exactly 12 counted IDs exist;
- arm order alternates across task classes;
- shakedown IDs cannot enter counted results;
- counted runs cannot begin until shakedown passes;
- no counted ID can run twice.

- [ ] **Step 2: Run RED**

Run: `node --test tools/fb-real-work-benchmark.test.cjs`

Expected: FAIL because orchestration is missing.

- [ ] **Step 3: Implement preparation and freeze generation**

Freeze:

```js
{
  experimentId: 'fb-real-work-paired-054-20260728',
  tasks: 6,
  arms: ['vanilla', 'preventiveGraphFb'],
  countedFirstPassRuns: 12,
  repairMaximumPerRun: 1,
  userDecisionEvents: 0,
  hashes: {}
}
```

- [ ] **Step 4: Run one excluded shakedown**

Use a non-counted compact task. Confirm:

- Codex authentication works;
- JSONL includes authoritative usage or explicitly marks it unavailable;
- timeout and one-shot rules work;
- candidate/test hashes bind;
- redaction rejects prompt/transcript content;
- repair resume works when deliberately triggered.

If authoritative usage is absent, continue only for wall/rework evidence and
record token comparison as unavailable before counted spend.

- [ ] **Step 5: Run focused pre-run review**

Review only the frozen methodology, public packets, graders, runner, redaction,
and shakedown. Any Critical or Important fairness finding blocks counted runs.

- [ ] **Step 6: Commit the frozen green bundle**

Run:

```bash
node --test tools/fb-real-work-benchmark.test.cjs
node --check tools/fb-real-work-benchmark.cjs
git diff --check
```

Commit: `test: freeze real-work paired benchmark`

---

### Task 6: Execute the 12 paired runs and earned repairs

**Files:**
- Create locally only: `/private/tmp/fb-real-work-054/**`
- Create: `docs/benchmarks/real-work/results.json`

**Interfaces:**
- Consumes the frozen Task 5 bundle.
- Produces one immutable result row per counted run and repair.

- [ ] **Step 1: Prepare all 12 run directories**

Run:

```bash
node tools/fb-real-work-benchmark.cjs prepare \
  --root /private/tmp/fb-real-work-054
```

Expected: 12 unique treatment receipts and starting-source hashes.

- [ ] **Step 2: Execute the frozen counterbalanced order**

Run:

```bash
node tools/fb-real-work-benchmark.cjs run \
  --root /private/tmp/fb-real-work-054
```

Do not start another arm until the current arm's evidence is sealed.

- [ ] **Step 3: Execute only earned repairs**

Each failed first candidate receives exactly one resume. Passing candidates
receive none. Preserve timeouts and failures.

- [ ] **Step 4: Recompute all evidence**

For every result:

- receipt matches treatment;
- candidate hash matches test and grader;
- usage totals equal raw JSONL usage when available;
- first-pass result remains immutable after repair;
- final result points to a distinct post-repair candidate when repaired.

- [ ] **Step 5: Write machine-readable results**

`results.json` includes raw task rows, signed paired differences, arm medians
and ranges, first-pass and final readiness, repair incidence, tokens/time per
accepted result, unavailable fields, and limitations.

Commit: `test: record real-work paired executions`

---

### Task 7: Publish honest results and close TASK-054

**Files:**
- Create: `docs/benchmarks/real-work/README.md`
- Create: `docs/benchmarks/real-work/independent-review.md`
- Create: `docs/qa/TASK-054.md`
- Modify: `docs/handoffs/TASK-054.md`
- Modify: `PROJECT_BOARD.md`
- Modify: `docs/handoffs/index.md`
- Modify: `tools/fb-real-work-benchmark.test.cjs`

**Interfaces:**
- Produces a human-readable result generated from `results.json`.
- Produces a Product recommendation using the frozen decision table.

- [ ] **Step 1: Add result rendering and contract tests**

Require:

- task-level raw table;
- first-pass and with-repair comparisons;
- observed wall time first;
- authoritative token totals or explicit unavailable status;
- zero user-decision protocol;
- isolated versus complex split;
- raw six-pair result before workload weighting;
- signed differences and limitations;
- no universal marketing percentage.

- [ ] **Step 2: Run RED, render, and run GREEN**

Run:

```bash
node --test tools/fb-real-work-benchmark.test.cjs
node tools/fb-real-work-benchmark.cjs summarize \
  --root /private/tmp/fb-real-work-054
node --test tools/fb-real-work-benchmark.test.cjs
```

- [ ] **Step 3: Perform one evidence-only result review**

Recompute every hash, grade, usage total, duration, repair classification,
aggregate, and written claim without rerunning subjects.

- [ ] **Step 4: Apply the frozen Product decision**

Choose exactly one:

- Preventive Graph FB default;
- automatic task-dependent routing;
- Vanilla default;
- graph for complex/sensitive only;
- inconclusive.

Do not change runtime/plugin guidance in TASK-054. Any adoption is a separate
approved task.

- [ ] **Step 5: Close records and verify**

Run:

```bash
node --test tools/fb-real-work-benchmark.test.cjs
node --check tools/fb-real-work-benchmark.cjs
node --check tools/fb-real-work-runner.cjs
node --check tools/fb-real-work-fixture.cjs
git diff --check
git status --short
```

Update TASK-054 to Staging QA with direct result/review/QA links.

- [ ] **Step 6: Commit**

Commit: `docs: close real-work paired benchmark`

Do not push, merge, publish, rebuild the plugin, or deploy.
