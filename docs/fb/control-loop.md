# Generic agent control loop

FB can add a repository-local control loop to an approved Build Brief:

`Understand → Route → Produce → Compare → QA → Diagnose/repair → Ready to ship`

These stages are **capabilities, not mandatory agents**. One agent may perform
several stages, or deterministic code may perform a stage without an agent.
They augment Product/User, Business, Design, Tech, Discovery, and Bugs; they do
not create new workstreams or change Product/BFM authority.

## Opt in through the Build Brief

Use the loop only where transformation, comparison, or diagnosed configuration
evolution is useful. The Build Brief names the enabled capabilities, criteria,
evidence, gates, and repair budget. Users describe the outcome; FB selects its
internal execution treatment.

A project may declare paths in `.fb-lane.json` without enabling autonomous
behavior:

```json
{
  "controlLoop": {
    "enabled": true,
    "profileManifest": "config/fb/control-loop-profiles.json",
    "goldenManifest": "config/fb/control-loop-golden.json"
  }
}
```

These paths are repository-relative. Existing Quick and Full BFM iteration,
time, safety, and approval limits remain authoritative.

## Route before spending

Deterministic rules run before agent judgment. A clear item is routed to
`process` or `skip`; a safety trigger overrides either route. Ambiguous cases
return `judgment_required` so an assigned agent can record an evidence-based
decision. A skipped transformation preserves the baseline artifact and avoids
unnecessary compute or quality degradation.

## Operational evidence and durable truth

Every stage may append one flat JSONL event under the Git common directory.
That clone-local ledger supports diagnosis across worktrees without becoming a
new source of product truth. It stores references, decisions, results, bounded
usage, and next actions—not transcripts, raw prompts, complete outputs, hidden
reasoning, credentials, environment values, secrets, or private data.

Committed Markdown remains curated product truth:

- the board says what is active;
- the handoff records what was decided and approved;
- the QA artifact records what was verified;
- Git records what changed.

Session verification checkpoints link to stage-event summaries and counts.
They do not copy the JSONL into committed records.

## Compare and gate without duplicating proof

Pairwise comparison evaluates a candidate directly against its preserved
baseline for named criteria. A required criterion without evidence blocks the
comparison; there is no opaque aggregate score. The result records whether the
candidate, baseline, or neither is acceptable.

Layered gates are non-duplicative:

- `focused` proves the smallest changed behavior;
- `comparison` proves the candidate is not worse than its baseline;
- `safety` protects sensitive boundaries;
- `integration` proves combined slices;
- `release` performs the explicitly requested release checkpoint.

Each selected gate has distinct evidence. Any unresolved required gate prevents
**Ready to ship**.

## Bounded diagnosis and configuration evolution

Diagnosis consumes only curated events, eval evidence, candidate diffs, and
observed failures. It classifies a Build, Brief, Eval, or Environment failure
and proposes a bounded next action. Quick BFM keeps one repair. Full BFM keeps
at most two material repair loops, requires progress before every repeat, and
stops on no progress, timeout, exhausted budget, or a changed user decision.

Prompt or configuration changes are written to an isolated clone-local
candidate. Baseline and candidate run against the same frozen golden fixtures,
settings, model reference, limits, and grader contract. Missing cases,
selective reruns, changed criteria, incompatible environments, or discarded
unfavourable outcomes block the recommendation.

Canonical configuration changes require exact Product approval tied to the
candidate and benchmark evidence. The loop never promotes itself, changes eval
authority, edits canonical configuration, merges, publishes, or deploys.
Only **Push Live** authorizes the final release action.

## Fixed-treatment benchmark

An eight-case deterministic simulation compared a process-everything baseline
with the FB control loop. It deliberately included good inputs, improvements,
degradation, repairable and unresolved failure, ambiguous routing, a safety
case, and a misleading candidate. One ambiguous case favoured the baseline.

| Outcome | Process-all baseline | FB control loop | Difference |
|---|---:|---:|---:|
| Product-ready outcomes | 2/8 (25%) | 4/8 (50%) | +2; +25 percentage points |
| Unnecessary processing | 2/8 (25%) | 1/8 (12.5%) | -1; 50% fewer |
| Worse candidate attempts | 2 | 1 | -1; 50% fewer |
| Already-good inputs retained as ready | 0/2 | 2/2 | +2 |
| Diagnosis accuracy | n/a | 2/4 (50%) | n/a |
| Human-decision events | 0 | 1 | +1 |
| Unresolved failures | 6 | 4 | -2; 33% fewer |
| Deterministic work units | 96 | 126 | +30; 31% more |
| Modeled token units | 9,200 | 11,860 | +2,660; 29% more |
| Modeled elapsed minutes | 17.2 | 21.2 | +4.0; 23% more |
| Work units per accepted outcome | 48.0 | 31.5 | -16.5; 34% fewer |
| Modeled token units per accepted outcome | 4,600 | 2,965 | -1,635; 36% fewer |

The experiment shows the intended tradeoff, not a universal performance claim:
the loop spent more modeled work overall but produced more accepted outcomes
and used fewer modeled units per accepted outcome. Token and time figures are
**modeled, not observed Codex usage**. The experiment does not establish actual
Codex-token, wall-clock, or population-wide savings. In sensitivity runs, the
process-all baseline beat FB at both 25% and 50% already-good inputs when
transformation reliability reached 95%; the 75%/95% setting tied. The
sensitivity model uses fallible 90% comparison accuracy and 94% gate accuracy,
so routing, comparison, and gate mistakes can outweigh the loop's benefit.
One human judgment contributes one modeled attention minute but zero agent
tokens or work units. See the
[full methodology, raw outcomes, assumptions, sensitivity results, and hashes](https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/benchmarks/control-loop/README.md).

## Graduated benchmark

A second deterministic simulation tested the way FB is intended to operate:
start with a focused check, add routing, comparison, diagnosis, and protection
only as visible evidence requires them, then step down after clean evidence.
It used four mixed-complexity scenarios, 24 sequential cases per scenario,
three fixed seeds, and three arms. The 864 arm/case executions ran once from
pre-registered thresholds; none was selectively rerun.

| Outcome | Process-all | Full FB | Graduated FB |
|---|---:|---:|---:|
| Product-ready outcomes | 192/288 (66.7%) | 226/288 (78.5%) | 213/288 (74.0%) |
| Unnecessary processing | 84 | 9 | 28 |
| Worse candidate attempts | 12 | 1 | 1 |
| Unresolved failures | 96 | 62 | 75 |
| Modeled token units | 313,920 | 385,740 | 328,390 |
| Modeled token units per ready outcome | 1,635 | 1,707 | 1,542 |
| Modeled elapsed minutes | 604.8 | 643.2 | 575.4 |
| Immediate safety-trigger response | 0% | 100% | 100% |

Graduated FB retained most of Full FB's readiness improvement while using
14.9% fewer modeled token units than Full FB. Against process-all it produced
7.3 percentage points more ready outcomes, used 4.6% more modeled token units
in total, and used 5.7% fewer modeled token units per ready outcome.

The graduation policy itself needs improvement before its thresholds become a
recommended default: exact-level graduation accuracy was only 38.9%, with 106
over-graduations, 70 missed graduations, and 7 successful step-downs across 36
opportunities. The safety override did work in every sensitive case. These are
modeled simulator results, not observed Codex usage or production performance.
See the
[full graduated methodology, scenario/phase/seed tables, raw evidence, and limitations](https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/benchmarks/control-loop/graduated.md).

## Deliberate limits

FB does not add a hosted logger, hosted dashboard, semantic scoring platform,
transcript capture, automatic external adapter, mandatory agent per stage, or
autonomous configuration promotion. If richer telemetry is useful, it may
supply optional evidence; approved briefs, handoffs, QA, and Product closeout
remain authoritative.
