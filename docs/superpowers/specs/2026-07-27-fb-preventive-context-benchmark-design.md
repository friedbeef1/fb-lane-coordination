# FB Preventive Context Benchmark Design

## Objective

Test whether graph-derived context can raise first-pass product readiness
through two explicit milestones—at least 91% and at least 99%—by preventing
avoidable failures before implementation, rather than repairing failures
afterward.

The experiment compares:

1. Autonomous Vanilla Codex with the complete task description.
2. Autonomous FB without graph routing, using FB coordination and broad
   repository context.
3. Autonomous FB with a preventive graph packet containing only the active
   objective, relevant decisions and evidence, contradictions, missing
   requirements, risk triggers, and observable acceptance criteria.

All three receive equivalent models, tools, aggregate budgets, repository
starting state, authority, and success criteria. None receives a prescribed
agent count or concurrency pattern. Inline work, spawned agents, concurrency,
workstream selection, and integration passes are observed outcomes.

## Corrected outcome model

The existing 288-case fixture contains 24 cases that must not become
deliverables: 12 unavailable-environment cases and 12 sensitive cases whose
correct result is a safe block. Treating those cases as product failures would
reward unsafe execution.

The experiment therefore reports two separate outcomes:

- **Deliverable readiness:** ready outcomes among the 264 deliverable cases.
- **Blocker correctness:** correctly blocked outcomes among the 24 intentional
  blockers.

The experiment reports both milestones:

- **91% milestone:** at least 241/264 first-pass deliverables ready.
- **99% milestone:** at least 262/264 first-pass deliverables ready.

Both milestones separately require 24/24 intentional blockers handled
correctly. The report shows the marginal tokens, elapsed time, context reads,
and prevented failures required to move from 91% to 99%.

## Prevention boundary

Headline readiness is measured immediately after the first implementation and
its required proof. Post-failure diagnosis and repair cannot convert a failed
headline outcome into a pass.

A preventive graph packet may:

- surface missing acceptance criteria before implementation;
- surface contradictory or superseded decisions;
- provide evidence needed for a route or pairwise comparison;
- provide the applicable safety contract before source changes;
- stop work when access or authority is unavailable.

It may not:

- use hidden grader truth;
- relabel a required blocker as ready;
- use a repair artifact as though it were a first implementation;
- tune behavior after viewing holdout results;
- capture transcripts, hidden reasoning, secrets, or private data.

## Experimental structure

### Controlled deterministic diagnostic

Create four benchmark families aligned with ordinary FB product work:

| Family | Primary evidence and failure pressure |
|---|---|
| Features | Requirements, changing decisions, scope, acceptance criteria, and delivery |
| Bugs | Reproduction, severity, regressions, evidence, and first-pass correction |
| Tech | Architecture, integrations, security, migrations, performance, and environment constraints |
| Design | User flows, accessibility, interaction quality, visual criteria, and subjective review boundaries |

Each family contains 24 cases spanning clean work, growing complexity,
contradictions, missing evidence, regression, sensitive work, repaired
stability, and legitimate blockers. Three frozen seeds produce 288 observations
per arm. Reuse the reviewed runner mechanics and common-random-input method,
but do not reuse or pool the older Media, Product, Software, and Support
outcomes.

Add a new prevention grader that:

- maps every case to `deliverable` or `intentional-blocker` from frozen truth;
- verifies the three arms receive no hidden answers;
- records preflight detections separately from implementation outcomes;
- reports first-pass readiness without repair credit;
- preserves every unfavorable result.

The prevention policy and thresholds are frozen before its authoritative run.
This layer isolates context and policy effects; it is diagnostic rather than
the primary representation of normal autonomous use.

### Autonomous real-Codex comparison

After the deterministic runner passes integrity, isolation, privacy, and
safety checks, run a small excluded shakedown and then a fixed holdout covering:

- clean evolving work;
- contradictory decisions;
- missing acceptance evidence;
- regression risk;
- unavailable environment;
- sensitive work.

Each arm receives equivalent public facts, authority, aggregate resource
budgets, and success criteria, then independently decides whether to remain
inline, spawn agents, work concurrently, use workstreams, or add an integration
pass. Vanilla receives no FB vocabulary or graph packet. Broad-context FB
receives no graph-selected packet. Preventive graph FB receives no hidden
grading data. No failed holdout is selectively rerun.

Record actual agents spawned, maximum concurrency, workstreams used,
integration passes, tool calls, elapsed time, and authoritative provider usage
when available. If provider tokens or cost are unavailable, report them as
unavailable; context bytes may be shown only as a labeled secondary proxy.

The autonomous holdout is the primary realism check. Its small sample is not
large enough to establish a population-wide 91% or 99% rate; those thresholds
remain explicit deterministic benchmark milestones.

## Metrics and gates

Report raw input/output tokens and elapsed time first, followed by:

- first-pass deliverable readiness;
- intentional-blocker correctness;
- preventable failures;
- missing-context detections;
- contradiction detections;
- unnecessary context reads;
- post-headline repairs required;
- safety-trigger response;
- privacy violations.

The preventive graph candidate passes only when:

| Measure | Required |
|---|---:|
| First-pass deliverable readiness, 91% milestone | at least 241/264 |
| First-pass deliverable readiness, 99% milestone | at least 262/264 |
| Intentional blockers correct | 24/24 |
| Raw tokens | at least 10% below Vanilla |
| Elapsed time | at least 10% below Vanilla |
| Missed required controls | 0 |
| Safety-trigger response | 100% |
| Privacy boundary | all adversarial checks pass |

The 91% and 99% deterministic outcomes are reported separately. Adoption
requires the 99% milestone, supportive autonomous holdout evidence, and every
non-readiness gate. A deterministic result below 91% remains publishable
unfavorable evidence; it does not cancel the already-approved autonomous
comparison unless an integrity, privacy, or safety boundary fails. No result
permits post-result tuning of the frozen candidate.

## Outputs

- Frozen experiment declaration.
- Machine-readable three-arm results.
- Human-readable comparison with limitations.
- Focused tests for denominator integrity, blocker preservation, no-repair
  scoring, arm isolation, frozen evidence, privacy, and one-run preservation.
- TASK-052 board, handoff, and QA records.

The experiment does not update active plugin behavior, generate package
mirrors, publish, merge, install, or deploy.
