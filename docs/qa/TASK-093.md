# TASK-093 — Focused hardening evidence

## Provenance

Public main verified on 2026-09-23: `ce259d07b668ea81ef907beceffe9122f5f3c765`.
Installed task-loaded plugin: `0.10.0-beta+codex.20260827100222`.
New candidate starts from that exact public commit in a durable linked worktree.
No installed cache, consumer project, sidebar task, or marketplace was changed.

## Recovery boundary

The old `/private/tmp/fb-eval-architecture-v2` checkout is absent. Exact commit
lookup for `6250bda0776b0283a0be3ff5337b6423bec59558` and
`06b48a3614fa6b66a0a3afdd48737960d2d4fa46` failed in the known primary
repositories. Exact-object and direct refs/reflogs checks also found neither
commit in `github-recovery`, `recovered-worktree`, `sidechat-plain-setup-wording`,
`sidechat-task072`, `task043-worktree`, or `task072-lifecycle-history` beneath
the coordination shell. These six paths share four object stores. No matching
TASK-092 artifact or bundle was found there. No private transcripts, remote
fetch, or unbounded filesystem recovery was used. Not-found does not prove
permanent loss; the original eval candidate remains a separate recovery gate.
No old source or successful verification is fabricated.

## Evidence classification

Previously described scripted performance profiles, expected-answer mocks and
generated labels validate harness mechanics only. They do not measure actual FB
effectiveness, human agreement, time savings or token savings. No new performance
claim or paid comparison belongs to this correction.

## Checks

| Proof | Evidence | Result |
|---|---|---|
| Owned Quick scope | New real-Git regression contract, `node --test tools/fb-quick-scope.test.cjs` | 11 passed; initial missing helpers failed, then symlink/proof-invalidation regressions failed before correction |
| Routing and focused checks | Runtime slice `ed4c39f`; `node --test tools/fb-efficiency.test.cjs` | 29 passed after initial 4/28 failing regressions |
| Existing records compatibility | Runtime slice `ed4c39f`; `node tools/fb-records.test.cjs` | 16 passed before guidance integration |
| Guidance | `4c2862b`; cross-workstream guidance contract and result-return contract | 7 guidance tests passed; result-return passed |
| Submission safety | `node tools/fb-ready-to-ship.test.cjs` | 5 passed, including bypass rejection and candidate-bound sensitive approval |
| Integration finding | Existing two-speed contract | Failed on multi-workstream scope being classified Quick; consolidated repair required |
| Integration finding | New document checker against active harness pages | Fenced/inline Markdown examples were incorrectly treated as real links; consolidated repair required |

One integrated review inspected canonical candidate `39c6982`. It confirmed
six actionable issues: quoted sensitive words, unknown negative-looking safety
assessment, affirmative multi-lane coordination, global whitespace scope,
Markdown code examples, and fragment-only anchors. The same repair also covers
realpath containment before reading a document or link target. Package generation
follows that single consolidated repair. No broad validator ran.

The independent reviewer also applied the guidance to saved-only, unavailable
messaging, exact successful messaging, and healthy/fallback graph scenarios.
The responses distinguished saved from delivered, kept recipients passive,
and used bounded source-cited context with an explicit fallback. These are
scenario responses, not proof of a real message being delivered.

## Initial final checks and circuit breaker (preserved history)

The consolidated behavioral repair is commit `c520440`. Five new adversarial
tests failed first and passed after repair. The remaining unfenced example URL
in `evidence.md` was marked as example code instead of weakening link validation.

| Check | Result |
|---|---|
| `node --test tools/fb-efficiency.test.cjs tools/fb-quick-scope.test.cjs tools/fb-two-speed.test.cjs tools/fb-ready-to-ship.test.cjs` | 47/47 tests pass; ready-to-ship additionally reports five focused checks |
| `node --test tools/fb-records.test.cjs tools/fb-cross-workstream-guidance.test.cjs tools/fb-workstream-result-return.test.cjs` | 24/24 tests pass |
| Packaged two-speed context | Pass; no duplicate packaged unit suite |
| Package sync generation and `--check` | 93 mirrors aligned |
| Active harness pages, setup, TASK-093 handoff/QA link checks | Pass |
| Packaged document checker against canonical evidence and TASK-093 records | Pass; packaged runtime dependency resolves |
| Affected Node files | 14 tracked syntax checks plus the two newly generated package files pass |
| `git diff --check ce259d0` | Pass |
| Final check including the real handoff index | **Fail**: `docs/handoffs/index.md: task ID does not match filename` |

Failure: the checker accepts fenced link examples but scans the complete source
for `task:` metadata, including an index's fenced handoff template.

Observed: adding `docs/handoffs/index.md` to the otherwise passing focused
document command reproduces the failure. The index has type
`fb-lane-handoff-index`, not `fb-lane-handoff`.

Cause: task-identity validation is path-shaped and not limited to the actual
frontmatter of a task handoff. The new check's fixtures did not cover the real
index example.

Recovery attempted: the one whole-candidate review and consolidated repair
have already completed. No second behavioral repair or broad rerun is attempted.

Result: local candidate blocked, not Ready to ship. Freeze and preserve it.

Next owner/action: Product/BFM should limit identity validation to real task
handoff frontmatter, preserve ordinary index link checks, and add one regression
covering a fenced sample plus a genuinely mismatched handoff. Rerun that failed
proof, synchronize the two affected mirrors, and reuse unchanged green evidence.

Reusable lesson: a Markdown index and a task handoff share a directory, not a
schema. Test real representative documents alongside synthetic fixtures.

## User-directed narrow continuation — resolved 2026-09-23

James requested that the candidate be made proper before continuing. The
follow-up changes only the checker's metadata boundary and its regressions:
task identity now comes from opening frontmatter, never body examples; the
index is not a task handoff, but its real links are still validated. There was
no new subagent, whole-candidate review, broad validator or unrelated repair.

Two new tests failed on the old checker, then passed with the correction.
They cover a handoff index with a fenced template, a real broken index link,
legacy body examples, a mismatched real task ID and a normalized handoff with
an empty task ID. Existing selected-record, safety and containment tests remain.

| Final focused proof | Result |
|---|---|
| `node --test tools/fb-efficiency.test.cjs` | 36/36 pass |
| Actual handoff index, TASK-093 handoff/QA and active README/evidence/workflow document check | Pass |
| Packaged document checker against the actual index and TASK-093 handoff | Pass |
| Mechanical package generation and parity | 93 mirrors aligned |
| Changed checker/test Node syntax and whitespace | Pass |

The previous 47-test and 24-test bundles remain historical same-source proof
for unchanged parts, not newly rerun totals. The final index-check blocker is
resolved. Local candidate is eligible for release sequencing, not installed,
published or live. Final commit and restorable artifacts are recorded in the
external `Documents/fb-lane/artifacts/TASK-093-preservation.md` receipt.

## Local efficiency evidence

These checks demonstrate selection and correctness, not a measured production
time/token saving. Provider usage and comparative wall-time savings are
unavailable. Synthetic labels are not human calibration. No new benchmark has
been run or advertised.

## Authority and limits

User approved implementation. No release checkpoint, push, merge, publication,
global installation or consumer adoption has been performed or authorized here.
Passive task notices are not sent: exact destination bindings and a passive
non-activating transport have not been proven in this task. Repository evidence
is the durable result; task delivery remains pending.

## Links

- [Handoff](../handoffs/TASK-093.md)
