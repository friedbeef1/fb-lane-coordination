# Real-work Vanilla versus Preventive Graph FB benchmark

Date: 2026-07-28  
Experiment: `fb-real-work-paired-054-20260728`  
Model: `gpt-5.4` through Codex CLI 0.139.0

## Answer

On these six paired historical Unmirror and MÉJA replays, **Preventive Graph FB
did not save total time or total tokens**. Vanilla is the evidence-supported
default for now.

Graph did make the first pass more selective: before repair it used 20.6% fewer
tokens and achieved higher mean criterion coverage. Its repair loops were much
larger, however, reversing the saving. The next useful product problem is not
adding more graph structure; it is preventing broad repair rehydration and
stopping weak candidates earlier.

## Headline totals

| Measure | Vanilla | Preventive Graph FB | Graph difference |
|---|---:|---:|---:|
| Total observed wall time | 59.0 min | 66.7 min | **+13.1%** |
| Total provider-reported tokens | 19.83M | 26.72M | **+34.7%** |
| Uncached input plus output | 1.44M | 1.85M | **+28.1%** |
| First-pass wall time | 49.8 min | 50.6 min | +1.6% |
| First-pass tokens, before repair | 13.82M | 10.97M | **−20.6%** |
| Repair wall time | 9.2 min | 16.2 min | +76.1% |
| Repair tokens | 6.01M | 15.74M | +161.9% |
| First-pass accepted outcomes | 2/6 | 1/6 | −1 |
| Final accepted outcomes | 2/6 | 2/6 | equal |
| Runs requiring repair | 4/6 | 5/6 | +1 |
| Mean first-pass criterion coverage | 59.4% | 67.8% | +8.4 points |
| Mean final criterion coverage | 59.4% | 75.3% | +15.9 points |

“Tokens” means authoritative provider usage from Codex JSONL. Cached input is a
subset of input tokens, not an additional category. “Uncached input plus
output” is shown separately to prevent the large cache component from being
mistaken for newly supplied context.

## Fixture-level results

| Historical task | Class | Vanilla | Graph | Graph wall difference | Graph token difference |
|---|---|---|---|---:|---:|
| Unmirror intro headline | Isolated | 4.0 min; 1.28M; final fail | 4.7 min; 0.62M; first-pass pass | +17.9% | **−52.1%** |
| Unmirror Saved Capture | Multi-surface | 13.8 min; 7.36M; first-pass pass | 12.9 min; 12.64M; pass after repair | **−6.1%** | +71.7% |
| Unmirror native analytics | Sensitive | 8.1 min; 2.10M; first-pass pass | 14.4 min; 3.62M; final fail | +77.2% | +72.4% |
| MÉJA host-action scrolling | Isolated bug | 7.2 min; 1.24M; final fail | 7.3 min; 1.31M; final fail | +1.3% | +5.9% |
| MÉJA pairing/presence | Complex repair | 15.1 min; 3.40M; final fail | 12.4 min; 2.18M; final fail | **−17.7%** | **−36.1%** |
| MÉJA Host/Audience redesign | Multi-workstream | 10.9 min; 4.44M; final fail | 15.0 min; 6.35M; final fail | +37.8% | +42.9% |

Median paired Graph minus Vanilla difference was **+9.6% wall time** and
**+24.4% tokens**. The ranges were wide: −17.7% to +77.2% for wall time and
−52.1% to +72.4% for tokens. No class-specific routing claim is justified from
one task per class.

## With and without rework

| View | Vanilla | Graph | Interpretation |
|---|---:|---:|---|
| First pass only: wall time | 49.8 min | 50.6 min | Essentially equal (+1.6% Graph) |
| First pass only: tokens | 13.82M | 10.97M | Graph used 20.6% fewer |
| Repairs only: wall time | 9.2 min | 16.2 min | Graph repair time was 76.1% higher |
| Repairs only: tokens | 6.01M | 15.74M | Graph repair tokens were 161.9% higher |
| Final | 59.0 min; 19.83M | 66.7 min; 26.72M | Repair behavior reversed the first-pass token advantage |

This is the strongest actionable finding. Selective context did reduce
first-pass token consumption, but the current one-shot repair still rehydrates
too much context and does not reliably turn additional criterion coverage into
an accepted outcome.

## Human attention

Both arms received **zero user decisions after launch**. All 12 first passes and
their earned repairs ran unattended. This proves unattended execution in the
benchmark; it does **not** measure screen time saved, because the experiment
deliberately held human interaction at zero for both arms.

## Workload-weighted estimate

Applying each replay class to the frozen 18-task retrospective mix gives a
secondary estimate:

| Estimated average task | Vanilla | Graph | Graph difference |
|---|---:|---:|---:|
| Wall time | 9.40 min | 10.16 min | +8.0% |
| Provider-reported tokens | 3.08M | 4.01M | +30.0% |

This estimate is not an additional experiment. It reweights the same six
observations and is less important than the raw pair table.

## Product decision

Use **Vanilla Codex by default** based on current evidence. Do not make
Preventive Graph FB the default on a claim of token or time savings.

Keep the existing graph available as repository navigation and durable context,
but do not add more plugin complexity from this study. A future experiment is
worthwhile only after repair context is materially reduced and the repair gate
can prove progress without rereading the whole candidate.

## Evidence and limitations

- [Frozen declaration](frozen-declaration.json)
- [Excluded shakedown](shakedown.json)
- [Methodology review](methodology-review.md)
- [Curated pair results](results.json)

The six tasks are directional evidence for James’s recent workload, not a
population estimate. The experiment compares workflow packages rather than
isolating graph structure as the sole causal variable. The installed CLI could
not run the originally proposed `gpt-5.6-sol`, so both arms used the same
supported `gpt-5.4`. Historical accepted implementations informed hidden
behavior graders but were never exposed to subjects.
