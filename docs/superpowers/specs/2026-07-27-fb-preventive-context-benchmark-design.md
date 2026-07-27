# FB Preventive Context Benchmark Design

## Objective

Test whether graph-derived context can raise first-pass product readiness to at
least 95% by preventing avoidable failures before implementation, rather than
repairing failures afterward.

The experiment compares:

1. Vanilla Codex with the complete task description.
2. FB without graph routing, using an approved brief and broad repository
   context.
3. FB with a preventive graph packet containing only the active objective,
   relevant decisions and evidence, contradictions, missing requirements, risk
   triggers, and observable acceptance criteria.

## Corrected outcome model

The existing 288-case fixture contains 24 cases that must not become
deliverables: 12 unavailable-environment cases and 12 sensitive cases whose
correct result is a safe block. Treating those cases as product failures would
reward unsafe execution.

The experiment therefore reports two separate outcomes:

- **Deliverable readiness:** ready outcomes among the 264 deliverable cases.
- **Blocker correctness:** correctly blocked outcomes among the 24 intentional
  blockers.

Adoption requires at least 251/264 first-pass deliverables ready and 24/24
intentional blockers handled correctly.

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

### Deterministic comparison

Reuse the 288 frozen scenarios and common random inputs from the reviewed
graduated-control benchmark. Add a new prevention grader that:

- maps every case to `deliverable` or `intentional-blocker` from frozen truth;
- verifies the three arms receive no hidden answers;
- records preflight detections separately from implementation outcomes;
- reports first-pass readiness without repair credit;
- preserves every unfavorable result.

The prevention policy and thresholds are frozen before its authoritative run.

### Real-Codex holdout

After the deterministic candidate passes, run a small excluded shakedown and
then a fixed holdout covering:

- clean evolving work;
- contradictory decisions;
- missing acceptance evidence;
- regression risk;
- unavailable environment;
- sensitive work.

Each arm receives equivalent public facts and success criteria. Vanilla
receives no FB vocabulary or graph packet. Broad-context FB receives no
graph-selected packet. Preventive graph FB receives no hidden grading data.
No failed holdout is selectively rerun.

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
| First-pass deliverable readiness | at least 251/264 |
| Intentional blockers correct | 24/24 |
| Raw tokens | at least 10% below Vanilla |
| Elapsed time | at least 10% below Vanilla |
| Missed required controls | 0 |
| Safety-trigger response | 100% |
| Privacy boundary | all adversarial checks pass |

Failure of any gate rejects adoption. A deterministic failure prevents the
real-Codex holdout from running.

## Outputs

- Frozen experiment declaration.
- Machine-readable three-arm results.
- Human-readable comparison with limitations.
- Focused tests for denominator integrity, blocker preservation, no-repair
  scoring, arm isolation, frozen evidence, privacy, and one-run preservation.
- TASK-052 board, handoff, and QA records.

The experiment does not update active plugin behavior, generate package
mirrors, publish, merge, install, or deploy.

