# TASK-075 QA — User workstream and Product/BFM control centre

Date: 2026-08-05
Status: Checking
Candidate: `fb-product/TASK-075-replace-product-user-with-user-add-the-product-bfm-control-centre-and-converge-onboarding-on-seven-pinned-repository-tasks`
Release candidate: `0.5.9-beta+codex.20260805042523`
Changelog approval: approved by James on 2026-08-05

## Focused evidence

| Proof | Result |
|---|---|
| Seven-role onboarding and migration | root/package 40/40 pass |
| Root/package operating-model contract | 2/2 pass after bounded package-aware contract repair |
| Plugin metadata and version contracts | root/package 4/4 pass for `0.5.9-beta+codex.20260805042523` |
| Declared package mirrors | 60/60 synchronized once and parity checked |
| Syntax and JSON | 10/10 changed JavaScript files pass `node --check`; 3/3 JSON files parse |
| Links, records, and doctor | pass; Doctor exits 0 with only expected dirty-worktree attention before commit |
| Whitespace | `git diff --check` pass |
| Changelog approval | approved by James on 2026-08-05 |
| Final release checkpoint | pending — single authorized complete validator pass |

## Bounded verification repairs

The first packaged control-centre run exposed root-only assumptions in the new
focused contract and an exact-model omission in the standalone package README.
The README now states the canonical model, and the mirrored test distinguishes
canonical-only surfaces from packaged paths while preserving byte parity. The
focused root/package contract then passed 2/2.

Doctor initially blocked because the TASK-075 board Goal Alignment Session did
not repeat the approval and justification already recorded in the handoff. The
board now carries those authoritative fields; Doctor exits 0 and reports only
the expected uncommitted-candidate attention.

## Initial release-checkpoint failure

The single initial complete validator reached the root CLI regression suite and
stopped on one stale structural assertion requiring the old phrase “start in
whichever workstream.” The shipped runtime and generated guidance already use
the approved, more precise phrase “start in whichever evidence-producing
workstream.” Product classified this as a test-contract failure, not missing
behavior. The one consolidated release repair updates that assertion, mirrors
it mechanically, and reruns only the failed regression proof before the
permitted final complete pass.

Focused recovery result: root regression suite passed 72/72, the package mirror
was regenerated mechanically, and whitespace passed.

No push, merge, marketplace publication, reinstall, or consumer-project rollout
is authorized before the normal release boundary.
