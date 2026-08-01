# TASK-059 Directional Three-Tier Results

This small real-Codex simulation compares a flat Vanilla brief with the same
facts compiled as an Efficient-Graph FB packet. It intentionally uses one
representative historical task per tier rather than presenting a 36-run study
as scientific certainty.

## Result

| Tier | Task | Vanilla time | Graph time | Time change | Vanilla tokens | Graph tokens | Token change | Local readiness |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Easy | Unmirror intro preference | 4m 10s | 3m 22s | **19.4% faster** | 801,742 | 570,040 | **28.9% fewer** | 100% / 100% |
| Medium | MÉJA sync warning | 4m 52s | 3m 59s | **17.9% faster** | 988,917 | 682,198 | **31.0% fewer** | 100% / 100% |
| Difficult | Unmirror iOS camera safety | 4m 02s | 4m 46s | **18.2% slower** | 1,594,150 | 642,181 | **59.7% fewer** | 100% / 100% |
| **Total** | Three paired outcomes | **13m 04s** | **12m 07s** | **7.3% faster** | **3,384,809** | **1,894,419** | **44.0% fewer** | **100% / 100%** |

The strongest directional signal is lower input context: Efficient Graph used
1,868,702 input tokens versus Vanilla's 3,357,743. Output tokens were similar
(25,717 versus 27,066). That is consistent with the graph packet reducing
context rereads rather than suppressing the implementation work itself.

## What this indicates

- Efficient Graph produced the same accepted local outcomes with **1,490,390
  fewer raw provider tokens** across these three pairs.
- Total wall time improved by only **56.955 seconds**. Graph was faster on Easy
  and Medium, but slower on the Difficult native-iOS task.
- Both arms used one repair on every task. This experiment does **not** show
  fewer repair loops.
- The practical current claim is therefore: selective graph context looks
  promising for token efficiency, but it has not demonstrated a reliable
  across-the-board speed advantage.

## Calibration correction

The first grader version used four broad or exact-name checks. That made
90–95% readiness impossible to express and rejected correct alternative
implementations. The paid candidates themselves were not changed.

| Tier | Stored exact-name score | Semantic outcome regrade | Why it changed |
|---|---:|---:|---|
| Easy | 90% / 90% | 100% / 100% | Both candidates normalized invalid Android values through differently named helpers. |
| Medium | 42.86% / 42.86% | 100% / 100% | Both implemented the alert, dismissal, styling, and non-blocking local-play behavior with different class/handler names. |
| Difficult | 70% / 65% | 100% / 100% | Both guarded capability access behind active-video policies and covered invalid/valid connection cases with different policy APIs. |

The corrected graders accept semantic alternatives, still require every
must-pass outcome, and reject mutations that remove persistence, invalid-value
normalization, accessibility, dismissal, active-connection checks, or
video-input checks.

## Limits

- “100%” means all defined static/local requirements passed. Production-adjacent
  follow-up subsequently passed focused Web and Android checks, the standalone
  MÉJA verifier, native iOS simulator tests, and unsigned physical-iPhone target
  builds for both arms. See the
  [production-adjacent verification](TASK-059-production-adjacent-verification.md).
- Real-camera use, signing, provider-backed behavior, visual quality, store
  release, and production readiness remain unverified.
- Three task pairs are directional evidence, not a universal percentage.
- All runs used `gpt-5.4` and one bounded repair; other models and repositories
  may behave differently.
- Cached input tokens are included in raw provider totals.
- Human attention was not measured.

The machine-readable measurements and immutable checkpoint hashes are in
[TASK-059-directional-results.json](TASK-059-directional-results.json).
