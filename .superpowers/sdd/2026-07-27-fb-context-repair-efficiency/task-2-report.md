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

Pending commit at report update.

### Repair concerns

None.
