# Real-Work Paired FB Benchmark Design

## Purpose

Measure whether Preventive Graph FB actually changes time, token use, and
rework on representative work from James's existing applications. Replace the
earlier modeled efficiency assumptions with paired, auditable execution
evidence where the local Codex runner exposes authoritative usage.

This study compares workflow packages. It does not claim to isolate graph
structure as the sole causal variable.

## Study shape

Use a hybrid design:

1. An 18-task retrospective registry describes the recent workload mix across
   Unmirror and MÉJA.
2. Six tasks spanning that mix are replayed through Vanilla and Preventive
   Graph FB.
3. Raw paired replay results are primary.
4. A workload-weighted retrospective estimate is secondary and clearly labeled
   as an estimate.

The counted study has 12 first-pass runs: six tasks by two arms. A run earns at
most one repair resume. One separate shakedown validates the harness and is
excluded.

## Historical replay tasks

| ID | Project | Task | Starting commit | Acceptance reference | Class |
|---|---|---|---|---|---|
| `unmirror-intro` | Unmirror | Intro headline alignment | `2600f57` | `c6e5fde`, `de82cbc` | isolated |
| `unmirror-saved-capture` | Unmirror | Saved Capture across Web/Android/iOS | `568a6b4` | `c26ab07`–`fc359d6` | multi-surface |
| `unmirror-native-analytics` | Unmirror | Privacy-limited native analytics | `71bf297` | `e548495`, `42bc97c` | sensitive |
| `meja-scroll` | MÉJA | Host-action scrolling/reachability | `cdfa26d` | `27f67cc`, `60c51f6` | isolated bug |
| `meja-pairing` | MÉJA | Pairing and presence reliability | `da4868f` | `53d6d8d`–`1462645` | complex repair |
| `meja-redesign` | MÉJA | Host/Audience redesign | `a815a90` | `3bd46b2`, `469cf31` | multi-workstream |

Historical accepted code is used only to author behavior-oriented graders. The
subjects cannot access later commits, historical patches, hidden grader data,
or another arm's output.

## Fixture construction

For each task:

- export the exact starting commit into an isolated directory without `.git`;
- include only source files needed to build/test the task and the task's public
  records;
- remove secrets, local environment values, deployment configuration, build
  outputs, caches, and unrelated historical handoffs;
- preserve dependency manifests and already-present local dependencies only
  when they can be shared read-only without network access;
- create a public focused test that proves basic interface viability without
  exposing the hidden acceptance answer;
- create a hidden grader from documented acceptance criteria and historical
  tests, scoring behavior rather than exact diff similarity;
- hash public facts, starting source, public test, hidden grader, prompts, and
  package manifests before execution.

Source repositories remain read-only. No replay writes back to Unmirror or
MÉJA.

## Arm treatments

Both arms receive identical public facts and the same first-candidate,
time-budget, test, repair, and outside-access rules.

### Vanilla

Receives the relevant raw task brief and records directly. It is instructed to
use ordinary Codex execution without FB terminology, graph packets, statuses,
or hidden coordination answers.

### Preventive Graph FB

Receives a context packet mechanically compiled from the same public records:

- current objective;
- relevant decisions and assumptions;
- changed evidence;
- acceptance criteria;
- safety or missing-evidence triggers;
- links to unchanged records rather than copied content.

The packet may select direct execution for isolated work. Subjects do not
choose Normal, Quick, or Full BFM. The situation determines the route.

## Execution and repair protocol

Run subjects sequentially to avoid resource-contention distortion. Use a
counterbalanced task/arm order so one arm is not always first.

For each subject:

1. Start an ephemeral Codex execution with the same model and configuration.
2. Record controller start time immediately before launch.
3. Capture the complete JSONL event stream outside the fixture.
4. Stop at the first candidate.
5. Run the recorded public proof exactly once.
6. Hash and hidden-grade the first candidate.
7. If the hidden/public result fails, resume the same Codex session once with
   only the failed public evidence.
8. Rerun only failed proof targets, then hidden-grade the final candidate.
9. Record controller finish time and evidence hashes.

Per-arm budget:

- first pass: 20 minutes;
- one repair resume: 10 minutes;
- no second repair;
- no selective replacement run;
- no user decision or approval during execution;
- no network or external provider/application state.

## Metrics

Report per task and aggregate:

- first-pass wall time;
- repair wall time;
- total wall time;
- authoritative input, cached-input, and output tokens when present;
- repair tokens;
- total tokens;
- first-pass pass/fail and criterion score;
- final pass/fail and criterion score;
- repair incidence;
- test execution count;
- subject-selected agent topology when observable;
- unattended completion with zero user-decision events;
- tokens and wall time per accepted outcome.

Report signed paired differences as Graph minus Vanilla, plus median and range.
Do not convert missing provider usage into modeled tokens.

## Retrospective workload calibration

Freeze 18 recent implementation-bearing board tasks: nine Unmirror and nine
MÉJA tasks. Record task class, affected surfaces, source commits, repair
commits, safety/release triggers, and cross-workstream involvement.

Map each registry task to one replay class. Apply replay ratios only as a
secondary workload-weighted estimate, with bootstrap-free ranges across the
observed six pairs. The raw six-pair result remains the headline evidence.

Commit timestamps are not treated as active work time. Documentation commits,
approval waits, device QA waits, and deployment waits are classified
separately.

## Evidence integrity

- freeze all executable artifacts before the shakedown;
- allow one excluded shakedown and no counted work before it passes;
- retain every counted run, including failures and timeouts;
- store prompt/treatment receipts and candidate/test hashes;
- retain raw JSONL usage events but reject transcripts, hidden reasoning,
  secrets, and unredacted private data from committed evidence;
- commit only curated metrics, hashes, grader outputs, and redacted event
  summaries;
- perform one bounded independent pre-run methodology review and one
  evidence-only result review;
- do not rerun a counted arm to improve an unfavorable result.

## Decision interpretation

| Observed result | Product recommendation |
|---|---|
| Graph preserves readiness and improves paired time/tokens | Preventive Graph FB default |
| Vanilla wins isolated tasks and Graph wins complex tasks | Automatic task-dependent routing |
| Graph adds over 5% median overhead with no readiness/rework gain | Vanilla default |
| Graph improves safety/readiness but costs more | Graph only for complex or sensitive work |
| Effects are unstable or token evidence is absent | Inconclusive; no quantitative product claim |

Six paired tasks are directional evidence for James's workload, not a
population estimate. Results must name the projects, task classes, sample
size, model/configuration boundary, and unavailable metrics.

## Out of scope

- changing FB runtime, plugin guidance, or public documentation before results;
- publishing a token/time marketing claim;
- production, staging, provider, database, release, or deployment changes;
- replaying device-only or credential-dependent gates;
- transcript capture or hidden-reasoning storage;
- a general benchmark platform, dashboard, webhook, or hosted telemetry.
