---
type: fb-project-graph-experiment
task: TASK-048
status: preregistered
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

Not run.

