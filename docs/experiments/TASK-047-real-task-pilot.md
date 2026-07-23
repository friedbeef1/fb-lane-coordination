---
type: fb-efficiency-pilot
task: TASK-047
record_model: normalized-v1
status: active
sample_target: 10
---

# TASK-047 real-task efficiency pilot

## Purpose

Measure whether normalized records and risk-triggered verification reduce
coordination cost across ten genuine FB tasks without increasing missed risk,
stale evidence reuse, rework, or user intervention.

This is a prospective observational pilot, not a randomized benchmark. The
results support an internal operating decision; they are not a universal
marketing claim.

## Registration boundary

- Start commit: `3943ca2`
- Candidate branch: `codex/fb-durable-efficiency-evidence`
- Sample size: the next ten eligible tasks, without selectively removing
  unfavorable results.
- Historical comparator: the ten most recent eligible substantial tasks before
  TASK-047 for which the same metric can be recovered. Missing historical
  values remain `unavailable`.
- Do not reconstruct provider tokens from prose, transcripts, character
  counts, or model estimates.

## Eligible tasks

Include a task when it:

- performs genuine Product, Design, Business, Tech, Discovery, Bugs, BFM, or
  repository coordination work;
- produces or updates at least one durable FB record;
- reaches completed, blocked, or deferred closeout.

Exclude:

- synthetic fixtures and benchmark-only work;
- retries caused solely by the measurement harness;
- trivial chat with no durable task record;
- release approval waiting time from elapsed execution time.

Record every exclusion with a concrete reason before reviewing aggregate
results.

## Per-task record

| Field | Rule |
|---|---|
| Task | Durable task ID and handoff link |
| Class | docs/coordination, bounded runtime, cross-workstream, sensitive, or release |
| Outcome | completed, blocked, or deferred |
| Elapsed minutes | Claim/start to verified candidate; exclude user approval waiting |
| Provider tokens | Authoritative input + output usage, or `unavailable` |
| Coordination tokens | Authoritative coordination-only usage, or `unavailable` |
| Tool calls | Count from available run evidence |
| Repeated checks | Same broad or focused check repeated without relevant input change |
| Repair loops | Consolidated implementation/evidence repair cycles |
| User interventions | Times the user had to recover, redirect, combine, or explain routine work |
| Reused checks | Prior verification results accepted with a matching fingerprint |
| Stale invalidations | Reuse attempts correctly rejected because an input changed |
| Consistency findings | Board/index/card/handoff/QA disagreement caught before closeout |
| Escaped risk | Missed lane, unsafe reuse, late dependency, or material issue found after closeout |
| Record bytes | UTF-8 bytes added to board, index, card, handoff, QA, and chat summary |
| Notes | Concrete anomaly or limitation only |

## Ten-task ledger

| # | Task | Class | Outcome | Minutes | Total tokens | Coordination tokens | Tool calls | Repeated checks | Repairs | User interventions | Reused | Stale invalidations | Consistency findings | Escaped risk | Record bytes |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 2 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 3 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 4 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 5 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 6 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 7 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 8 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 9 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |
| 10 | pending | pending | pending | — | unavailable | unavailable | — | — | — | — | — | — | — | — | — |

## Retrospective real-task baseline

Before prospective task 1, the normalization projection was applied to the ten
most recent eligible completed FB tasks, TASK-022 through TASK-031. This is a
counterfactual record-structure analysis, not a replay of agent execution.

The projection:

- preserves each authoritative task handoff byte-for-byte;
- preserves compact board and index routing;
- permits one compact workstream-card route;
- removes duplicated board narrative and repeated card prose.

| Result | Value |
|---|---:|
| Tasks analyzed | 10 |
| Observed durable record bytes | 130,360 |
| Normalized projected bytes | 86,471 |
| Aggregate reduction | 33.7% |
| Median per-task reduction | 35.5% |
| Per-task range | 26.6%–46.9% |
| Authoritative handoff bytes preserved | 74,052 |
| Duplicated board-detail bytes removed | 35,011 |

Every task showed a reduction. This supports the narrower claim that
normalization can reduce durable coordination text by roughly one third in this
repository while preserving authoritative handoffs.

It does **not** demonstrate the same reduction in provider tokens, elapsed
time, repair loops, or user intervention. Those outcomes remain pending in the
prospective ledger and must not be inferred from record bytes.

## Aggregate comparison

Report median and range rather than only averages. Compare the prospective
sample with the registered historical comparator for:

- time to verified candidate;
- total and coordination tokens, only where authoritative usage exists;
- record bytes;
- tool calls and repeated checks;
- repair loops and user interventions;
- stale-evidence and consistency catches;
- escaped-risk rate.

Do not infer token savings when fewer than five tasks in each group have
authoritative provider usage. Do not attribute all observed differences to FB;
report differences in task class, model, repository, environment, and test
surface.

## Safety and stop conditions

Pause the pilot and return to Product/BFM when any of these occurs:

- one unsafe verification reuse;
- one sensitive or release task incorrectly routed to the light path;
- one material decision lost because its authoritative record was removed;
- two consistency escapes with the same root cause;
- measurement work materially delays or changes ordinary delivery.

The pilot may continue after a focused correction and a documented Product
decision. Preserve the unfavorable result.

## Decision after task 10

Adopt the normalized model when coordination burden falls without a worse
escaped-risk, rework, or user-intervention result. Revise or abandon it when
savings depend on missing evidence, weakened checks, or shifted work back to
the user.
