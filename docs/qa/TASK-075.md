# TASK-075 QA — User workstream and Product/BFM control centre

Date: 2026-08-05
Status: Done — published and installed
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
| Release checkpoint | pass — clean committed candidate; CLI 72/72, sessions 39/39, evals 19/19, beginner 11/11, positioning, two-speed, efficiency 25/25, Doctor Ready, and whitespace pass |

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

The permitted final complete pass then reached the beginner-experience suite
and stopped on two additional Product/User-era assertions. Both current
scenarios already describe conditional User selection, the Product/BFM control
centre, and matching workstream intake. Product classified this as the same
stale-contract cause and prepared the second, final focused repair batch. The
harness circuit breaker prevents another complete validator automatically;
after the focused beginner proof passes, another full pass requires explicit
Product direction.

Focused recovery result: root beginner-experience suite passed 11/11, the
packaged suite passed 11/11, 60 declared mirrors were regenerated, and
whitespace passed. No third complete-validator run was attempted.

James then approved an exceptional additional checkpoint. It exposed remaining
Product/User-era literals in the positioning contract while the canonical
README, Why FB page, and graph diagrams already used User plus the Product/BFM
control centre. The consolidated positioning repair passed in root and package
contexts and regenerated all 60 declared mirrors.

James approved one final complete validator. That run passed CLI 72/72,
sessions 39/39, evals 19/19, beginner experience 11/11, positioning, two-speed,
and efficiency 25/25. Doctor then stopped only on the clean-worktree gate
because the approved positioning repair was still uncommitted. This was a
release sequencing error, not a functional failure. The repair is now being
committed; no additional complete pass is authorized automatically.

James then approved one clean-worktree release checkpoint. The committed
candidate passed the complete validator: CLI 72/72, sessions 39/39, evals
19/19, beginner experience 11/11, positioning, two-speed, efficiency 25/25,
Doctor Ready, package parity, syntax, and committed-diff whitespace. TASK-075 is
Ready to ship; Push Live remains the only release authorization.

## Live publication

| Proof | Result |
|---|---|
| GitHub readiness | `validate` passed for PR #59 in 42 seconds |
| GitHub merge | PR #59 merged to `main` as `3e7f31c` |
| Marketplace refresh | `fb-lane` upgraded with no errors |
| Installed plugin | `fb-lane-coordination@fb-lane` installed and enabled at `0.5.9-beta+codex.20260805042523` |
| Installed roles | dedicated User and Product/BFM skills plus Business, Design, Tech, Discovery, and Bugs present |
| Installed onboarding | seven pinned repository-scoped tasks and Product/BFM-only `$bfm` wording verified |
| Bundled MCP | `cwd: "."`; `./tools/fb-lane.cjs mcp`; both JavaScript entry points pass syntax |

Publication is complete. A new Codex task is required to load the refreshed
skills and MCP server. Consumer repositories remain unchanged until FB setup is
rerun in each repository.
