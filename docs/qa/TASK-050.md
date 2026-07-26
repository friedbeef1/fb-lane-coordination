---
type: fb-qa
task: TASK-050
status: checking
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
- Graduated-control simulator: the pre-registered four-scenario, 24-case,
  three-seed, three-arm experiment wrote 864 arm/case records exactly once.
  Process-all, Full FB, and Graduated FB produced 66.7%, 78.5%, and 74.0%
  product-ready outcomes respectively. Graduated FB used 328,390 modeled token
  units versus 313,920 for process-all and 385,740 for Full FB. Its 1,542
  modeled token units per ready outcome were lower than both alternatives.
  Immediate sensitive-trigger protection was 100%, but exact-level graduation
  accuracy was only 38.9%, with 106 false and 70 missed graduations and only
  7/36 step-down successes. The unfavorable policy result is retained and
  means the fixed thresholds are not yet a recommended production default.
  These are deterministic modeled results, not observed Codex usage. See the
  [full graduated result](../benchmarks/control-loop/graduated.md) and
  [machine evidence](../benchmarks/control-loop/graduated-results.json).
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

The candidate returned to **Checking** while the graduated benchmark receives
an independent methodology and evidence review. Its prior release checkpoint
is not being rerun. Merge, publication, installation, and deployment still
require **Push Live** after Product restores **Ready to ship**.
