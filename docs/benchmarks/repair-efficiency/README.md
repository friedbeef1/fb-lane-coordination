# TASK-056 — Prospective repair-efficiency benchmark

Date: 2026-07-28
Model: `gpt-5.4`
Sample: six paired historical tasks, twelve counted runs
User decisions after launch: zero

## Result

Efficient-Graph FB passed the pre-registered efficiency target on this sample.
Compared with fresh Vanilla Codex runs, it used **15.8% fewer total
provider-reported tokens** and **23.6% less wall time**, while final mean
readiness increased and accepted outcomes improved from 1/6 to 3/6.

| Measure | Vanilla Codex | Efficient-Graph FB | FB difference |
|---|---:|---:|---:|
| Observed wall time | 58.25 min | 44.52 min | **−23.6%** |
| Provider-reported total tokens | 14.12M | 11.89M | **−15.8%** |
| First-pass tokens | 10.29M | 10.72M | +4.1% |
| Repair tokens | 3.83M | 1.18M | **−69.3%** |
| Repair wall time | 21.81 min | 6.74 min | **−69.1%** |
| Runs requiring repair | 6/6 | 3/6 | −3 repairs |
| Final accepted outcomes | 1/6 | 3/6 | +2 outcomes |
| Mean final readiness | 68.6% | 79.4% | +10.8 percentage points |

The saving came from preventing and shrinking repairs, not from a cheaper first
pass. Efficient Graph first passes were 4.1% more token-intensive and 3.7%
slower. Its advantage appeared after integration: three candidates passed
without repair, and the three earned repairs used fresh criterion-specific
delta packets.

## Cost estimate

Codex did not expose an authoritative billed dollar amount. The table below is
therefore an **API-equivalent estimate**, not James's actual subscription
charge. It applies the published GPT-5.4 standard rates of $2.50 per million
uncached input tokens, $0.25 per million cached input tokens, and $15 per
million output tokens.

| Cost view | Vanilla Codex | Efficient-Graph FB | FB difference |
|---|---:|---:|---:|
| Standard API-equivalent estimate | $7.60 | $6.15 | **−$1.45 / −19.1%** |
| Codex token-rate estimate | 190.1 credits | 153.9 credits | **−36.2 / −19.1%** |
| Actual billed subscription cost | unavailable | unavailable | unavailable |

Official pricing references:
[GPT-5.4 model pricing](https://developers.openai.com/api/docs/models/gpt-5.4)
and [Codex rate card](https://help.openai.com/en/articles/20001106).

The estimate does not apply the GPT-5.4 long-context multiplier because the
aggregate Codex usage event does not expose each underlying request's context
length. It should not be presented as an invoice.

## Fixture-level results

| Task | Vanilla time / tokens / final | Efficient Graph time / tokens / final |
|---|---:|---:|
| Unmirror intro | 4.20 min / 0.65M / 100% | 3.55 min / 0.65M / 100% |
| Unmirror saved capture | 17.54 min / 5.69M / 60% | 11.07 min / 5.13M / 100% |
| Unmirror native analytics | 9.60 min / 1.78M / 75% | 6.50 min / 1.29M / 100% |
| MÉJA scroll | 5.01 min / 1.02M / 66.7% | 5.19 min / 1.05M / 66.7% |
| MÉJA pairing | 9.13 min / 1.79M / 50% | 6.74 min / 1.55M / 50% |
| MÉJA redesign | 12.77 min / 3.19M / 60% | 11.47 min / 2.23M / 60% |

## Interpretation

- **Adopt the TASK-055 repair policy:** yes. It cleared the stated 10% raw
  token and wall-time targets and did not reduce readiness on this sample.
- **Claim that FB is always faster or cheaper:** no. The isolated scroll task
  was slightly worse with Graph, three Graph candidates still failed final
  acceptance, and six pairs are not a population estimate.
- **Primary mechanism:** bounded context improved the chance of passing before
  repair; fresh delta repairs then reduced repair tokens by 69.3%.
- **Routing implication:** normal isolated work can remain Vanilla. FB is most
  defensible for evolving multi-surface, sensitive, or reconciliation-heavy
  work where avoided repair outweighs its small first-pass overhead.

## Method and limits

- Same six historical TASK-054 starting trees, public facts, hidden graders,
  model, execution ceilings, and zero-decision condition.
- Fresh candidates in both arms; no TASK-054 result was pooled into these
  totals.
- Pair order was counterbalanced. Each valid run occurred once; no unfavorable
  result was replaced.
- One excluded real-Codex shakedown proved authoritative usage and fresh-task
  repair before counted spend.
- Efficient Graph received bounded execution slices and fresh delta repair
  context. Vanilla received ordinary raw task context.
- Results measure unattended agent execution, not user screen time.
- One run per arm per fixture leaves stochastic uncertainty. Treat the result
  as directional evidence for this task mix, not a universal marketing figure.

Durable machine-readable evidence:
[declaration](declaration.json),
[shakedown](shakedown.json), and
[results](results.json).
