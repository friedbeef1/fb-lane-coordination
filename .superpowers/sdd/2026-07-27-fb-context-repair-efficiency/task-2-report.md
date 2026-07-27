# TASK-051 Task 2 implementation report

## Scope

Implemented only the opt-in canonical consolidated-repair planner and
clone-local flat efficiency metrics. The graduated router, plugin/package
mirrors, active guidance, benchmarks, prior evidence, and coordination records
were not changed.

## Files

- `tools/fb-control-loop.cjs` — exported `planConsolidatedRepair` and
  `aggregateEfficiencyMetrics`; accepted four optional flat context metrics on
  stage events.
- `tools/fb-control-loop.test.cjs` — focused planner, authority, metric,
  aggregation, privacy, and compatibility coverage.

## RED

Command:

```sh
node tools/fb-control-loop.test.cjs
```

Observed expected RED after adding the planner contract: the focused suite
failed with `TypeError: planConsolidatedRepair is not a function` at the
minimal failed-proof-only repair test.

An additional authority-boundary RED was run after adding the stale Full
authority test. The planner incorrectly returned `repair` after the Product
decision version changed; the test expected `blocked-budget`.

## GREEN

Commands:

```sh
node tools/fb-control-loop.test.cjs
node --check tools/fb-control-loop.cjs
git diff --check
```

Results: 57/57 control-loop tests passed; syntax and whitespace checks passed.

## Self-review

- Planner outcomes are exactly `repair`, `ready`, `blocked-no-progress`,
  `blocked-budget`, or `blocked-safety`; safety is fail-closed and precedes
  other repair decisions.
- Repair packets contain only the current brief, identity/hash, curated diff
  and diagnosis, references, and failed proof IDs. Passed proofs are never
  included for rerun.
- Quick planning calls the existing policy/budget evaluator without mutating
  caller state. Full planning reads the durable budget and active BFM authority
  without advancing it, blocks a third repair, and fails closed if the session
  or Product decision is superseded.
- `contextBytes`, `changedSourceCount`, `reusedSourceCount`, and
  `repeatedReadCount` are optional flat non-negative or `unavailable` fields,
  so existing stage events remain valid.
- Aggregation validates each event and emits numeric totals or `unavailable`;
  it retains no prompt or output content. Privacy-bearing event fields remain
  rejected by the existing validation boundary.
- Independent review found no Critical, Important, or Minor findings.

## Commit

Implementation: `d190dbf723c0142eab781401c2556330a0e0f95a`
(`feat: add consolidated repair planner`). This report is recorded separately
to preserve that implementation commit identity.

## Concerns

None. This remains an exported canonical runtime API only; no routing or
guidance activation was added.

## Review repair — round 1

### Scope

Closed the review finding that a copied Quick authority could be replayed to
produce another repair packet. Full authority and safety precedence remain
unchanged.

### RED

Command:

```sh
node tools/fb-control-loop.test.cjs
```

Observed expected RED after adding the replay contract: the first Quick plan
returned `repair`, but a second call with the same authority also returned
`repair` rather than the required `blocked-budget`.

### GREEN

Commands:

```sh
node tools/fb-control-loop.test.cjs
node --check tools/fb-control-loop.cjs
git diff --check
```

Results: 58/58 control-loop tests passed; syntax and whitespace checks passed.

### Repair self-review

- A Quick packet now atomically claims a clone-local, hash-only authority
  record scoped to the existing brief, paths, and trusted slice start.
- The claim runs under the existing shared authority lock and uses exclusive
  record creation, so a replay or racing second claim is blocked without
  storing brief/prompt/output content.
- Budget exhaustion is evaluated before claiming; blocked plans consume
  nothing. Full authority and visible-safety checks preserve their prior
  read-only and fail-closed behavior.

### Repair commit

Implementation: `81e5620f57017dad8473ed454669caf8ceb0fc93`
(`fix: consume Quick repair authority`). This report update is recorded
separately to preserve that implementation commit identity.

### Repair concerns

None.

## Review repair — round 2

### Scope

Replaced the mutable Quick authority claim derivation with the smallest stable
caller-required execution-slice identity. The durable one-use claim no longer
depends on brief, paths, or budget limits.

### RED

Command:

```sh
node tools/fb-control-loop.test.cjs
```

Observed expected RED after changing the replay test's brief and cost limit
while retaining `sliceId`: the second call still returned `repair` instead of
`blocked-budget` because the prior claim ID used mutable request values.

### GREEN

Commands:

```sh
node tools/fb-control-loop.test.cjs
node --check tools/fb-control-loop.cjs
git diff --check
```

Results: 58/58 control-loop tests passed; syntax and whitespace checks passed.

### Repair self-review

- Quick planning now requires a safe, stable `sliceId`; it is the only durable
  claim identity, so mutable brief and budget changes cannot create another
  claim for the same execution slice.
- Full authority rejects `sliceId` and retains its durable budget-reference
  contract; safety, ready, and no-progress precedence remain unchanged.
- The clone-local one-use record continues to contain only the safe identifier
  and timing metadata, never prompt, brief, or output content.

### Repair commit

Implementation: `ceb501551e9daa8199cd945d11a02e683d3abacc`
(`fix: bind Quick repairs to stable slices`). This report update is recorded
separately to preserve that implementation commit identity.

### Repair concerns

Callers must preserve the stable Quick execution-slice identifier across repair
planning attempts; a different `sliceId` intentionally denotes a different
execution slice.

## Review repair — round 3

### Scope

Replaced the caller-selected Quick `sliceId` claim with a pre-issued,
clone-local one-use authority reference. Issuance durably binds the authority
to task ID, slice ID, candidate identity/hash, state identity, changed paths,
and the current Quick policy; planning validates that exact binding before an
atomic one-time consume.

### RED

Command:

```sh
node tools/fb-control-loop.test.cjs
```

Observed expected RED after adding pre-issuance contracts: the focused suite
failed with `TypeError: issueQuickRepairAuthority is not a function` at the
new authority issuance helper.

### GREEN

Commands:

```sh
node tools/fb-control-loop.test.cjs
node --check tools/fb-control-loop.cjs
git diff --check
```

Results: 58/58 control-loop tests passed; syntax and whitespace checks passed.

### Repair self-review

- `issueQuickRepairAuthority` creates an exclusive clone-local record and
  refuses another issuance for the same immutable task/state/path/policy
  binding, including an alternate caller slice label.
- The planner accepts only the returned authority reference. A forged or
  substituted reference either has no durable record or fails exact task,
  candidate/hash, state, path, and policy binding validation.
- Consumption changes the durable one-use record from active to consumed under
  the existing authority lock; replay yields `blocked-budget` without another
  packet. Full repair and safety behavior are unchanged.
- The durable record stores identifiers, hashes, policy, and counters only;
  no brief, prompt, transcript, or output body is persisted.

### Repair commit

Implementation: `edc0f765d38fba1c0ac8953bdd1b511eb2fac67b`
(`fix: require pre-issued Quick authority`). This report update is recorded
separately to preserve that implementation commit identity.

### Repair concerns

Quick callers must request the authority before planning, then retain the
returned opaque reference for that one permitted repair.
