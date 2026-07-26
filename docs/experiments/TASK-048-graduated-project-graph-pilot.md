---
type: fb-project-graph-experiment
task: TASK-048
status: completed
record_model: normalized-v1
---

# TASK-048 Graduated Project Graph Pilot

## Question

Does a deterministic graph derived from normalized FB records reduce repeated
project-orientation reads while preserving correct, source-cited answers and
safe fallback?

## Hypothesis

Graph-assisted navigation will reduce orientation bytes or repeated file reads
by at least 20 percent on the pre-registered scenarios without increasing
incorrect answers, missed dependencies, or unsupported authority claims.

Bytes are a reproducible context proxy, not provider token evidence. Provider
input/output tokens are reported only when authoritative usage exists.

## Scenarios

1. `new-project`: Level 1 deterministic graph.
2. `growing-project`: Level 1 graph plus valid repeated retrieval friction;
   Level 2 is recommended but semantic extraction does not run.
3. `damaged-graph`: corrupt graph JSON; normalized-record fallback.
4. `six-workstream`: Product/User, Business, Design, Tech, Discovery, and Bugs
   start concurrently, first through normalized records and then through the
   same records plus the graph.
5. `fb-repository`: the current FB repository and four pre-registered queries.
6. `unmirror-snapshot`: read-only isolated inputs if canonical normalized
   records are available; otherwise an explicit blocked result.

## Pre-registered Queries

- What is active and blocked?
- What decision governs the current task?
- What verifies the current task?
- What does the current task depend on?
- What is the next approval gate?

The six-workstream fixture assigns one distinct question to each workstream and
includes at least one shared governing decision or dependency.

## Answer Isolation

Answer keys are held by the pilot controller, not written into graph inputs.
The normalized and graph-assisted arms receive identical authoritative records.
The controller does not pre-reconcile either arm and does not forward
transcripts or accumulated conversation history.

## Measures

- graph build and refresh milliseconds;
- graph artifact bytes;
- source files and bytes read;
- unique files and repeated file reads;
- query correctness;
- incorrect assumptions;
- missed dependencies;
- six-worker wall and summed worker time;
- maximum observed concurrency;
- Product/BFM reconciliation findings;
- authoritative provider tokens when available, otherwise `unavailable`.

## Graduation Rules

Project age and record count do not independently trigger Level 2. A Level 2
recommendation requires a source-cited retrieval-friction signal with a
concrete query or problem and either two observed occurrences or one material
missed dependency or unresolved contradiction.

Sensitive or cross-project corpora require explicit approval. Level 2 semantic
extraction is not run in this pilot.

## Stopping Rules

- Run each deterministic fixture once; recompute stored results rather than
  selectively repeating an unfavorable scenario.
- One implementation repair may follow a focused failing proof.
- Stop if privacy validation fails, answer keys leak into inputs, or the
  consumer repository would be modified.
- Preserve valid neutral or unfavorable results.

## Decision Rule

- `demonstrated`: at least 20 percent lower orientation bytes or another
  pre-registered material navigation improvement, with no correctness loss.
- `promising but inconclusive`: directional improvement below the threshold or
  a blocked real-repository example.
- `not demonstrated`: no material improvement, greater total navigation cost,
  or reduced correctness.

## Results

### Excluded accounting shakedown

The first controller run completed every scenario and produced result hash
`c87e090506887d559680022ec86c8b5aded562a5c44263ff44594a373e441b76`.
It is excluded from the comparative conclusion because the graph arm did not
charge graph construction source bytes, graph artifact bytes, or query-response
bytes. That omission favored the graph arm. The focused contract now requires
all three costs before the one comparative run.

### Corrected deterministic run

The corrected comparative run produced result hash
`aeed8229fb753f62af17c530bc830c210658dac561f5c232a26b24851a5330f0`.

| Measure | Normalized records | Graph assisted | Difference |
|---|---:|---:|---:|
| Ongoing navigation bytes | 14,351 | 4,748 | -66.9% |
| Repeated file reads | 19 | 5 | -73.7% |
| First-run bytes, including graph build and artifact | 14,351 | 23,730 | +65.4% |
| Correct workstream answers | 6/6 | 6/6 | no change |
| Missed dependencies | 0 | 0 | no change |

The graph's one-time construction cost was 18,982 bytes. At the observed
9,603-byte navigation saving, it breaks even after approximately two comparable
six-workstream orientation cycles. This is a deterministic context proxy, not
provider token evidence.

The new-project scenario created a Level 1 graph. The growing-project scenario
recommended Level 2 only after valid retrieval-friction evidence; semantic
extraction did not run. The damaged-graph scenario returned the normalized
record fallback. The Unmirror availability check was read-only and did not
modify its repository.

### Real six-agent Codex comparison

Six real, concurrent, read-only Codex tasks answered the same six workstream
questions in each arm. Both arms answered 6/6 correctly.

An initial graph-interface shakedown is excluded because four generic queries
were not scoped to the current task. It exposed a real interface defect: empty
or noisy neighborhoods caused fallback reads. One preregistered repair added
explicit document references and current-task query scoping.

| Measure | Normalized records | Corrected graph assisted | Difference |
|---|---:|---:|---:|
| Concurrent wall time | 57.85 s | 64.98 s | +12.3% |
| Gross input tokens | 930,657 | 953,891 | +2.5% |
| Uncached input tokens | 206,689 | 228,387 | +10.5% |
| Output tokens | 9,135 | 7,588 | -16.9% |
| Reasoning tokens | 3,797 | 3,060 | -19.4% |
| Correct answers | 6/6 | 6/6 | no change |

The real-agent result did not demonstrate lower input-token use or wall time.
The installed skill and global-project context remained a large shared cost,
and the graph neighborhood still supplied more context than each focused
question required. Lower output and reasoning usage is directional evidence,
not enough to offset the input and wall-time increase.

## Conclusion

**Promising but inconclusive.**

The deterministic pilot demonstrates materially fewer repeated reads and
ongoing navigation bytes without correctness loss. The real-agent comparison
does not demonstrate the intended total token or time saving. Therefore:

- retain the repository-local prototype and evidence;
- do not add the graph to bootstrap or the packaged plugin yet;
- do not make a public efficiency claim from this pilot;
- require a separate Product decision before another bounded experiment;
- if continued, narrow graph responses to the minimum question-specific
  subgraph and make graph-first routing avoid loading redundant operating
  context.

The one-repair circuit breaker has been reached. Further automatic tuning or
reruns would be selective experimentation and are outside this pilot.
