# FB Efficiency Correction Design

## Release-first amendment (TASK-028)

This amendment supersedes the routine runtime-candidate full-validator policy
below. Verification has three explicit levels: focused check, immediate safety
gate, and release checkpoint. Focused checks are the default for integration,
staging, owner transfer, review, and Markdown handoffs. Sensitive work keeps
its immediate safety/approval gate. A full validator is eligible only when a
Product-owned handoff explicitly requests a release checkpoint. That checkpoint
allows one initial full pass and, only after an initial failure followed by a
consolidated material repair batch, one final full pass; a third repair, no
progress, unjustified repeated broad gate, or final failure blocks for Product
direction. A handoff file is an artifact, not an owner transfer, review package,
or release checkpoint.

## Decision

FB will use three execution modes with explicit ceremony and verification
budgets:

1. **Normal Codex** is the default for clear, isolated, low-risk work.
2. **Quick BFM** is the default for an approved bounded correction.
3. **Full BFM** is reserved for material product, security, architecture,
   multi-lane, provider-state, or release risk.

This replaces the current tendency to apply Full-BFM coordination and broad
validation to low-risk documentation and correction work. It does not weaken
existing safety gates.

## Evidence and problem

TASK-027 exposed the failure mode this design corrects. A documentation-only
positioning change accumulated multiple durable coordination updates, mirrored
test and documentation edits, multiple independent review layers, repair loops,
and repeated full validators. The evidence was complete, but the user waited
too long and the harness spent disproportionate tool calls and tokens on a
low-risk result.

The correction is therefore not another optional efficiency suggestion. Mode,
record, review, and verification budgets become enforceable contracts.

## Alternatives considered

### Policy wording only

This would be the smallest code change, but agents could still repeat broad
gates and duplicate records. It does not reliably change behavior.

### Three-mode router with enforced budgets — selected

This reuses the existing classifier, session ledger, validator, and package
structure. It adds clear mode boundaries, one Quick record, a verification
budget, a circuit breaker, mechanical package generation, and efficiency
measurement without creating a new orchestration system.

### New scheduler or telemetry platform

This could enforce every transition centrally but would add more infrastructure
to solve an over-coordination problem. It is out of scope.

## Mode router

Safety gates are evaluated before convenience. A sensitive or ambiguous task
can never be classified Normal or Quick merely because it is small.

### Normal Codex

Normal Codex applies when all of these are true:

- The requested outcome and scope are clear.
- Work is isolated to one owner and does not conflict with an active lock.
- No Product approval or durable coordination record is required.
- No auth, privacy, payments, secrets, destructive data, provider state,
  release, deployment, or publication boundary is involved.

Normal Codex creates no FB board item, handoff, session promotion, lane review,
or closeout. Git history and the ordinary user response are sufficient. It runs
only the checks directly relevant to the changed surface.

### Quick BFM

Quick BFM applies when all of these are true:

- The correction is already approved.
- Scope, owner, affected surface, and success criteria are explicit.
- One execution owner can complete it without multi-lane reconciliation.
- It makes no material product-direction, architecture, security, provider, or
  release decision.
- There is no lock conflict or unresolved environment failure.

Quick BFM has exactly one committed source of truth: a compact
`docs/handoffs/TASK-Q-*.md` **Quick Record**. Clone-local live session metadata
may reference it but is not another committed record.

The Quick Record contains:

- approved correction and scope;
- owner and locked files;
- focused verification plan;
- execution result and one reviewer decision;
- Efficiency Receipt;
- one closeout update in the same file.

Quick BFM does not create or update a board card, handoff-index row, workstream
card, separate session recap, separate Task Receipt, or separate Verification
Handoff. If one of those becomes necessary, the task is reclassified Full BFM.

Quick BFM uses one execution pass, proportional focused checks, one reviewer,
and one closeout update. Review findings are fixed in the same task and count
toward the circuit breaker.

### Full BFM

Full BFM remains mandatory for any of these conditions:

- auth, privacy, payments, secrets, destructive data, or provider state;
- release, deployment, publication, production migration, or external approval;
- material architecture or core product-flow changes;
- multiple owners, lanes, repositories, or conflicting locks;
- a material user decision, unclear scope, or an unapproved scope change;
- a Quick BFM circuit-breaker event that cannot be resolved by correcting an
  invalid process or test.

The existing board, index, handoff, lane, session, evidence, and closeout model
continues to govern Full BFM.

## Truth hierarchy by mode

| Mode | Durable source of truth | Active state |
|---|---|---|
| Normal Codex | Git commit and user response | Current Codex task |
| Quick BFM | One `TASK-Q-*` Quick Record | Clone-local session metadata referencing that record |
| Full BFM | Board, routed handoffs, and approved Build Brief | Existing Full-BFM session and lock model |

Status output must identify the selected mode and read from the corresponding
source. It must not require a board row for Quick BFM.

## Verification budget

Before running checks, FB classifies the changed surface:

| Changed surface | Required gate |
|---|---|
| Coordination-only record or closeout | Structure, link, and whitespace checks only |
| Product documentation or diagram | Focused factual, structural, link, and rendering contract |
| Test-only change | Directly affected test suite |
| Runtime, validator, generated runtime package, or execution-affecting configuration | Focused tests plus one full validator after the final runtime-affecting checkpoint |
| Sensitive or release work | Full-BFM safety and release gates |

The full validator may run at most once after the final runtime-affecting
checkpoint. A later coordination-only closeout reuses that checkpoint and does
not rerun runtime suites. A later runtime-affecting change invalidates the
checkpoint and moves the single full-validator run to the new final checkpoint.

Documentation-only work does not run CLI, session, eval, beginner, and other
runtime suites merely because those suites exist. It runs the focused contract
for the affected documentation surface.

## Efficiency circuit breaker

Quick BFM stops automatic iteration when either condition occurs:

- two repair loops have completed; or
- a broad gate is about to be repeated.

Product/BFM must then choose and record one action in the Quick Record:

1. Correct an overly rigid, duplicated, or factually incorrect process/test.
2. Narrow the claimed outcome to the evidence actually required.
3. Reclassify the task Full BFM because material risk or coordination emerged.
4. Mark a genuine Product decision or external environment blocker.

The harness must not automatically dispatch another reviewer, repeat the full
validator, or add another durable record after the circuit breaker fires.

## Resource and loop budgets

Every Quick or Full BFM run declares enforceable budgets before execution.
Normal Codex stops when its requested result and focused checks pass and does
not create FB budget records.

| Resource | Quick BFM default | Full BFM default | Hard stop |
|---|---:|---:|---|
| Agent iterations, including implementers and reviewers | 5 | 5 | A sixth iteration is not dispatched |
| Repair loops | 2 | 2 | A third repair loop is blocked |
| Reviewers | 1 | 2 | Another reviewer requires a new approved run |
| Broad validators | 0 for docs-only; 1 for runtime | 1 after the final runtime checkpoint | Any repeated broad gate is blocked |
| No-progress cycles | 0 | 0 | One no-progress cycle stops the run |
| Elapsed time | 30 minutes unless the approved record states another limit | 120 minutes unless the approved record states another limit | Stop when the declared limit is reached |
| Tokens and cost | Declared only when authoritative provider usage is available | Declared only when authoritative provider usage is available | Stop at the declared token or cost ceiling |

Token and cost budgets are not estimated from transcript length. When the
provider does not expose authoritative usage, the record states `unavailable`
and the other budgets remain enforceable.

Before every repeated worker, repair, review, or verification iteration, FB
compares the new candidate with the previous one. Continuation requires at
least one material progress delta:

- source or generated output changed toward an acceptance criterion;
- required evidence became complete or more specific;
- test state changed for the intended reason;
- a blocker recovery action changed the environment or access state; or
- Product approved a decision that changes the permitted direction.

Rewording a report, repeating the same test, adding another opinion, or
recreating equivalent evidence is not progress. One cycle without a material
delta stops the run and invokes the circuit-breaker decision.

Workers receive only the current task brief, current candidate or diff,
specific feedback, and required evidence. Controllers do not forward full
transcripts, accumulated conversation history, unrelated earlier reports, or
private reasoning.

The run stops immediately when its explicit success predicates pass. It also
stops on two repair loops, one no-progress cycle, a repeated broad gate, five
agent iterations, or an exceeded elapsed-time, token, or cost budget.

## Canonical documentation and package generation

Root documentation and tests remain canonical. Package mirrors are generated
mechanically from a checked-in manifest through one tool:

```text
node tools/fb-package-sync.cjs --write
node tools/fb-package-sync.cjs --check
```

`--write` copies declared canonical files into the packaged plugin. `--check`
reports missing, extra, or stale generated targets without rewriting them.
Packaged generated files are not edited manually.

Documentation tests enforce factual and structural contracts rather than
whole-file equality:

- required headings, definitions, and safety boundaries;
- required table fields and examples;
- valid local and external link shapes and resolvable local targets;
- Mermaid blocks, required nodes, and important connected paths;
- absence of contradictory or deprecated claims.

Mechanical generation owns mirror parity. Semantic tests own meaning. Exact
byte comparison is removed from individual documentation tests and retained
only inside the generator's drift check.

## Efficiency Receipt

Every Quick Record ends with one compact receipt:

```text
Efficiency Receipt

Mode: Quick BFM
Elapsed user wait: <duration>
Tool calls: <count>
Focused checks: <count and names>
Broad validator runs: <count>
Repeated checks: <count>
Repair loops: <count>
Reviewers: <count>
Approximate tokens: <count or unavailable>
Circuit breaker triggered: yes | no
```

Metrics are curated and repository-local. They exclude transcripts, hidden
reasoning, secrets, authentication tokens, environment values, and unredacted private data.
When token accounting is not exposed, the receipt records `unavailable`
instead of estimating it.

## Pilot and success measures

The first five eligible Quick BFM corrections form the pilot. Product compares
their median results with recent comparable Full-BFM correction work.

Each Quick task must satisfy these hard limits:

- one durable Quick Record;
- one execution owner;
- one reviewer;
- one closeout update;
- zero broad validators for documentation-only work;
- at most one broad validator for runtime-affecting work;
- zero runtime-suite reruns after coordination-only closeout;
- no more than two repair loops;
- no more than five total agent iterations;
- no no-progress cycle;
- no exceeded elapsed-time, token, or cost budget.

The pilot succeeds when median user wait time, tool calls, repeated checks,
review loops, and available token use are lower than the comparison baseline
without a missed safety gate or false completion claim. Product records the
baseline and result; the harness does not add hosted telemetry or autonomous
scoring.

Local metrics are the default. Webhooks, Grafana, hosted monitoring, and
external provider-usage capture are optional integrations and require separate
Product approval before configuration or data leaves the repository.

## Compatibility and migration

- Existing Full-BFM board items, handoffs, sessions, and historical records
  remain valid and are not rewritten.
- Public commands and technical identifiers remain unchanged. Implementation
  may refactor internal helpers without changing those interfaces.
- New Quick Records use the new compact contract; historical quick tasks are
  not retrofitted.
- Normal Codex does not require bootstrap changes beyond routing guidance.
- Root/package behavior remains aligned through mechanical generation.
- No release, publication, deployment, provider change, plugin installation,
  or consumer-repository migration is part of implementation.

## Failure handling

- Ambiguous classification fails to Full BFM.
- A sensitive-gate match always overrides Normal or Quick classification.
- A lock conflict prevents Quick execution.
- A missing focused check is a blocked Quick task, not a reason to run every
  suite.
- A broken package-generation check is fixed at the canonical source or
  manifest, never by editing the generated copy independently.
- Missing efficiency metrics are recorded as unavailable; they do not block a
  safe product correction.

## Acceptance criteria

1. Classification fixtures prove Normal, Quick, Full, and safety-gate
   precedence.
2. A fresh approved bounded correction produces exactly one Quick Record and
   no board/index/card/recap duplicates.
3. A documentation-only Quick task runs focused documentation checks and zero
   runtime suites.
4. A runtime Quick task runs the full validator no more than once after its
   final runtime checkpoint.
5. Coordination-only closeout does not invalidate runtime evidence.
6. The circuit breaker stops a third repair loop and any repeated broad gate.
7. Package mirrors are written and checked mechanically from canonical files.
8. Documentation contracts validate facts and structure without asserting
   whole-file equality.
9. The Efficiency Receipt records all available wait, tool, check, loop,
   reviewer, and token measures without private session capture.
10. Auth, privacy, payments, destructive changes, provider state, release, and
    unclear-scope fixtures always route to Full BFM or an explicit approval
    gate.
11. A repeated iteration cannot proceed without a material progress delta.
12. Five agent iterations, two repair loops, one no-progress cycle, a repeated
    broad gate, or an exceeded declared resource budget stops the run.
13. Worker context contains only the current brief, candidate, specific
    feedback, and required evidence.
14. External monitoring and usage capture remain disabled unless separately
    approved.

## Out of scope

- A new public dashboard, eval runner, CI platform, autonomous judge, hosted
  telemetry service, transcript capture, or new package identifier.
- Weakening any existing sensitive-action or release approval boundary.
- Releasing, publishing, deploying, merging, or installing the resulting
  candidate.
