---
type: fb-qa
task: TASK-050
status: ready-to-ship
record_model: normalized-v1
---

# TASK-050 Focused QA

## Candidate

FB `0.5.0-beta+codex.20260726130257` on
`codex/fb-agent-control-loop`.

## Focused evidence

- Task 1 and Task 2 control-loop contracts and scoped reviews: passed.
- Control-loop runtime and MCP: 49/49 passed.
- Session integration: 20 focused checks passed.
- Eval/bootstrap/fallback integration: 18/18 passed.
- Efficiency integration: 20/20 passed.
- Root CLI/bootstrap/doctor: 70/70 passed.
- Six-workstream and six-skill compatibility: passed.
- Root/package control-loop documentation and bootstrap contract: passed.
- Root/package metadata contract: passed for
  `0.5.0-beta+codex.20260726130257`.
- Full BFM changelog closeout: 13/13 passed.
- Ready-to-ship boundary: 5/5 passed.
- Package synchronization: 48 declared mirrors aligned.
- Affected Node syntax, TASK-050/control-loop links, and whitespace: passed.
- Controlled before/after simulator: 12/12 focused contracts passed. The frozen
  eight-case run produced 2/8 product-ready outcomes for process-all and 4/8
  for FB, while preserving one valid case where the baseline won. Gross modeled
  work increased; modeled work per accepted outcome fell. Diagnosis was correct
  for 2/4 diagnosed failures, and one human-decision event was modeled. The
  sensitivity model includes fallible comparison and gate behavior. These are
  simulator results, not observed Codex usage. See the
  [full result and methodology](../benchmarks/control-loop/README.md).
- Graduated-control simulator repair: 14/14 methodology contracts passed before
  the one recorded replacement run. The original result from commit `06b292d`
  is superseded and non-publishable because process-all omitted its promised
  final-QA cost. The replacement has four explicit domain workflows, common
  random numbers, executable-grader hashing, and 864 arm/case records.
  Process-all, Full FB, and Graduated FB produced 63.5%, 79.5%, and 80.2%
  product-ready outcomes respectively. Graduated FB used 347,590 modeled token
  units versus 331,200 for process-all and 384,160 for Full FB. Its 1,505
  modeled token units per ready outcome were lower than both alternatives.
  Immediate sensitive-trigger protection was 100%; exact-level graduation was
  62.5%, with 108 over-applied controls, zero missed required levels, and 23/23
  safe eligible step-downs. The settings were fixed before the recorded
  replacement run, but there is no external preregistration and the bundle
  cannot prove historical execution count. These are deterministic modeled
  results, not observed Codex usage. See the
  [full graduated result](../benchmarks/control-loop/graduated.md) and
  [machine evidence](../benchmarks/control-loop/graduated-results.json).
- Graduated-control independent methodology review: specification and quality
  passed with zero Critical or Important findings. The reviewer confirmed all
  288 process-all QA calls, common arm-independent draws, four distinct
  workflows, 23/23 safe eligible step-downs, zero missed required levels,
  executable grader binding, exact recomputation, and package parity.
- Fast-decay policy experiment: 15/15 dedicated contracts passed. One
  replacement four-arm run preserved the reviewed Task 5 first-three-arm
  evidence exactly and added 288 Fast-decay FB v2 records. The candidate
  retained 231/288 product-ready outcomes, 57 unresolved failures, zero missed
  required levels, and 100% immediate safety response while reducing modeled
  tokens from 347,590 to 343,900. It reduced excess-control cases from 108 to
  85 (21.3%), missing the frozen requirement of at least 25% (81 or fewer).
  The adoption gate therefore failed; the result is preserved as rejected
  evidence and operating guidance was not changed. See the
  [fast-decay report](../benchmarks/control-loop/fast-decay.md) and
  [machine evidence](../benchmarks/control-loop/fast-decay-results.json).
  This replacement supersedes invalid result
  `fef75ab0e470a0007f74210c34cea94aa1e936cd1c0818ee26c97b13931d3915`
  from `ebe22ed`: review found that unresolved diagnosis evidence was retained
  but did not actively hold persistent Level 3. Bundle validation binds the
  exact superseded-result identity, invalidation reason, replacement-run
  declaration, and disclosed development history. It does not prove historical
  execution count, the absence of exploratory runs, or the absence of tuning.
  Independent review of the repaired evidence and metadata binding passed with
  zero Critical or Important findings. The dedicated evidence contract passed
  17/17 checks. The rejected candidate therefore remains useful experimental
  evidence, but it does not change the canonical control policy or plugin.
- Changelog wording: approved by James in the originating conversation on
  2026-07-26.
- Independent whole-branch review: specification and quality passed with zero
  Critical or Important findings.
- Complete release validator: passed once at the explicit release checkpoint,
  including 48 package mirrors, 70 CLI checks, session, eval, beginner,
  positioning, two-speed, efficiency, doctor, syntax, and whitespace.

## Safety result

The candidate adds no hosted logger, dashboard, transcript capture, mandatory
agent-per-stage requirement, autonomous configuration promotion, merge,
publication, installation, or deployment.

## Remaining gate

The candidate is restored to **Ready to ship** after the graduated benchmark's
independent methodology review passed. Its prior release checkpoint was not
rerun. Merge, publication, installation, and deployment still require
**Push Live**.
