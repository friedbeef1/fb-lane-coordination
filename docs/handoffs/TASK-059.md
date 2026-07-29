---
type: fb-lane-handoff
task: TASK-059
lane: fb-product
status: ready
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-059 — Three-Tier Real-Work FB Benchmark

## Goal Alignment

- **Objective:** Quantify where FB saves time and tokens across realistic task
  difficulty without hiding partial readiness behind all-or-nothing acceptance.
- **Key results:** Six easy, six medium, and six difficult traceable historical
  tasks; Vanilla Codex and Efficient-Graph FB receive equal facts and limits;
  TASK-056 remains immutable; only twelve missing pairs are run; results report
  time, provider tokens, strict acceptance, and mean readiness by tier.
- **Definition of done:** Registry and grader traceability, controller
  lifecycle, privacy, token ceiling, result recomputation, links, syntax, and
  whitespace pass. Valid unfavorable outcomes are preserved.
- **Gate:** One excluded shakedown before paid comparative runs; 60,000,000
  aggregate provider-token ceiling.
- **Approval:** Approved by James.

## Approved Build Brief

Build a three-tier extension of TASK-056:

- easy: six isolated or narrow historical tasks;
- medium: six multi-surface or multi-workstream tasks;
- difficult: six repair-heavy, sensitive, or deeply reconciled tasks;
- arms: Vanilla Codex and Efficient-Graph FB;
- model: `gpt-5.4`;
- first pass: 20 minutes;
- repair: one fresh-delta pass of at most 10 minutes;
- reuse the six TASK-056 pairs through immutable receipts;
- run only the twelve missing pairs, for 24 new counted runs;
- source repositories remain read-only;
- strict acceptance remains visible alongside mean readiness and the proportion
  of outcomes at or above 80% readiness.

## Approved protocol correction

After the initial paid pilot exposed a four-check readiness scale that could
only report 0%, 25%, 50%, 75%, or 100%, James approved a smaller directional
simulation on 2026-07-29:

- preserve the eight completed pilot candidates as excluded calibration
  evidence;
- use granular observable subchecks so 90–95% readiness is measurable without
  weakening must-pass requirements;
- give both arms identical public facts while presenting Vanilla as a flat
  brief and Efficient-Graph FB as a structured dependency packet;
- run one representative easy, medium, and difficult task per arm;
- report the result as directional evidence, not a universal product claim.

The six-run directional profile uses Unmirror intro preference persistence,
MÉJA sync-warning presentation, and Unmirror iOS camera-crash prevention.

The first Medium pair exposed two remaining exact historical-name assertions.
Both candidates had implemented the observable warning, dismissal, styling, and
non-blocking local-play behavior. Product therefore approved semantic
outcome-level grading for the selected Medium and Difficult fixtures before
spending on the Difficult pair. The original checkpoints remain immutable; the
final report identifies the Medium scores as deterministic regrades.

## Changelog

Changelog expectation: not expected — this task records experimental evidence
and does not alter user-visible plugin behavior.

## Boundaries

- No selective reruns of unfavorable valid results.
- No substitution for an untraceable historical task without Product approval.
- No transcript or private-reasoning capture.
- No plugin release, merge, publication, or deployment authority.

## Task Receipt

- **Approved brief:** Compare equal-fact Vanilla and Efficient-Graph FB
  treatments across realistic difficulty tiers without editing source
  repositories.
- **Scope change:** James approved a directional six-run profile after the
  original readiness scale proved too coarse for the intended 90–95% signal.
- **Candidate evidence:** Protocol v2 commits `7b2d352`, `324aa5a`,
  `3cae162`, and `fdf55ee`; final evidence is in
  [TASK-059 directional results](../benchmarks/difficulty-tiers/TASK-059-directional-results.md).
- **Checks:** Historical accepted/start proofs, unsafe mutations,
  equal-fact/different-structure contract, directional profile, privacy,
  interrupted reset, package parity, syntax, links, and whitespace.
- **Observed outcome:** Efficient Graph used 44.0% fewer raw provider tokens
  and 7.3% less wall time across three task pairs, with both arms passing all
  defined local outcomes. Graph was slower on the Difficult task.
- **Calibration:** Original paid checkpoints remain immutable. Semantic
  regrading changed only interpretation, not candidates, time, or usage.
- **Review state:** not reviewable — benchmark evidence has no runnable product
  candidate.
- **Limits:** Three pairs; static/local grading; no physical-device,
  provider-backed, visual, production, or human-attention measurement.
- **External gates:** No merge, push, plugin publication, installation,
  deployment, or release authorized.
- **Repository state:** Source repositories remained read-only; only this FB
  benchmark branch changed.
- **Remaining owner/action:** Product reviews the directional claim and decides
  whether it is sufficient or whether a larger preregistered study is worth
  the cost.

## Brief Validation

Status: pass

- Equal public facts and model: satisfied by frozen treatment hashes.
- One Easy, Medium, and Difficult pair: satisfied by six immutable checkpoints.
- Raw time and provider tokens: recorded from authoritative Codex usage.
- Readiness: all defined semantic subchecks passed; unsafe mutations still
  fail.
- Honest limitations: recorded in the result report and QA artifact.
