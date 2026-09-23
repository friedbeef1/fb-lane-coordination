---
task: TASK-093
status: passed
---

# TASK-093 — Focused hardening evidence

## Candidate

Patch release `0.10.1-beta+codex.20260923044148`, based on public `ce259d07`
and verified implementation `bb15411`. Release preparation uses the clean
`codex/TASK-093-release` worktree at `/private/tmp/fb-task093-release`.
The original durable worktree and verified backup remain preserved.

## Focused verification

The detailed checks and failures below remain the source of proof. The final
metadata-boundary correction passed 36 efficiency tests, real-index/record
checks, packaged checker proof and 93-mirror parity. One whole-candidate review
preceded the consolidated repair; the subsequent narrow correction was
explicitly user-directed. Release metadata receives its focused contract.

## Release checkpoint

Result: passed. Final full validation on source candidate `90af5f9` passed:
72 CLI, 35 migration, 39 session, 19 eval, 13 beginner, 36 efficiency checks,
positioning/two-speed contracts, 93-mirror parity, Doctor and whitespace.
The isolated installed MCP server exposes 14 tools. No further runtime changes
or local broad reruns are included in the coordination-only publication record.

Requested by James's current Push Live instruction. Plan: targeted record
preflight on the clean committed release candidate, then one full repository
validator, plugin metadata/validation, and GitHub readiness. Merge and global
installation happen only after these required checks pass. The original
worktree preflight produced no output and timed out at 30 seconds; it is not
passing evidence. The clean release worktree is the changed recovery condition.

## Provenance

## Live release verification

James's current Push Live instruction authorized this release. [PR #72](https://github.com/friedbeef1/fb-lane-coordination/pull/72)
passed GitHub readiness (44 seconds) and merged as
`aa03038ae40d696be66890f6be4c86ad88bd2f26`. The published candidate is
`e8d2efa4308388689c8c3c1501360a9f434a4dc7`; final runtime proof applies to
`90af5f9`, with only coordination evidence added afterward.

The configured Git marketplace upgraded to that exact merge. Supported
`codex plugin add fb-lane-coordination@fb-lane` installed and enabled
`0.10.1-beta+codex.20260923044148`. All 96 declared distribution artifacts
match the release bytes. Installed manifests resolve correctly and the bundled
MCP runtime returns 14 tools, including `fb_project_context`. No cache edits,
app deployments, sidebar recreation or paid evaluation calls occurred.

The source checkout remains clean after the record closeout commit. The primary
checkout and all unrelated work are preserved. A fresh Product/BFM task must
load the new plugin before further plugin-dependent work; existing evidence
workstreams need not be recreated. This old task performs only release-record
closeout after installation.

### Active-project adoption — partial, not blanket completion

| Project | Verified result | Remaining owner/action |
|---|---|---|
| FB framework | Published, globally installed, exact runtime proof passed | Fresh Product/BFM task loads replaced skills |
| Memory App | Eleven managed files updated; all 31 runtime/harness files match; syntax, status, whitespace and unchanged-file hashes pass; same seven pinned tasks reused | Local managed edits intentionally uncommitted alongside active app work; next Product refresh rebuilds stale derived graph |
| MÉJA | Exact root verified; local harness includes five files not matching known published history | Product reconciles custom onboarding/records/workflow/evidence/session files in an isolated managed slice before adoption |
| Unmirror | Exact active canonical root verified; 51 tracked dirty files include FB runtime, harness and instructions | Product resolves active overlapping FB-file ownership; no overwrite attempted |
| Tough Talks | Current Git worktree identified, but migration manifest refers to the former bare checkout; customized runtime/harness also present | Product repairs canonical migration identity with evidence, then reconciles managed differences; do not flip bare configuration or update the old root |

Shared plugin availability does not prove every repository-local runtime was
upgraded, every existing task reloaded, or every application bug was fixed.
Other visible projects without a verified FB harness were not bootstrapped.
No consumer application source or live application was changed.

### Release-checkpoint repair evidence

The initial full checkpoint on `02eeb4e` passed 72 CLI and 35 migration checks,
then stopped in the session contract: the bare request `coordinate lanes`
incorrectly selected Quick BFM. The focused RED reproduced it; the consolidated
release repair retains Full BFM for bare lane/workstream coordination without
restoring false positives for harmless filenames or explicitly excluded work.
No sensitive-operation or authority criterion was relaxed.

The remaining downstream checks were inspected before the final full pass:
19 eval checks, 13 beginner checks, positioning and two-speed passed. Doctor
identified missing explicit external-gate/remaining-owner labels on TASK-093;
those coordination fields were completed in the same release repair batch.
Metadata checks caught missing build references and the old TASK-091 selection;
only current release records and assertions were aligned, not historical evidence.

The isolated supported installation succeeded in a temporary Codex profile.
All 96 declared package/distribution artifacts matched byte-for-byte, and the
installed checker passed the actual handoff index. The current Codex CLI has
no `plugin validate` subcommand; package metadata, repository contracts and
actual installer/runtime proof are used, not an invented validation result.

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

Implementation and release are now explicitly approved. At release preparation,
no push, merge, publication, global installation or consumer adoption has yet
been performed. Earlier local-only boundaries above are historical evidence,
superseded only by the current handoff's scoped release amendment.
Passive task notices are not sent: exact destination bindings and a passive
non-activating transport have not been proven in this task. Repository evidence
is the durable result; task delivery remains pending.

## Links

- [Handoff](../handoffs/TASK-093.md)
