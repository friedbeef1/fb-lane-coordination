---
type: fb-lane-handoff
task: TASK-031
lane: fb-product
status: implemented
okr_fit: aligned
fb_harness: v3
Review state: not reviewable
---

# TASK-031 — Full BFM Changelog Closeout and FB 0.3.1-beta

## Goal Alignment Session

Product Goal: Keep FB release history clear to users without adding noise to small work.
Workstream Goal: Gate Full BFM closeout on a deliberate changelog decision and rebuild the Codex plugin.
Lane OKR Fit: aligned
User Approval Needed: no — implementation was explicitly approved; Push Live remains separate.
Mini-loop Evidence: Focused deterministic closeout contract and release metadata checks.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Require every Full BFM run to decide whether its delivered candidate needs a changelog entry and release FB 0.3.1-beta.
Your decisions: Full BFM only; Quick and Normal are exempt; historical records remain unchanged; stop at Ready to ship.
Assumptions to confirm: The existing GitHub marketplace and PR #48 remain the release path.
What FB will build: Candidate-bound closeout enforcement, canonical/plugin guidance, focused tests, and 0.3.1-beta metadata.
Out of scope: Merge, marketplace publication, plugin reinstall, and deployment before Push Live.
Success looks like: Full v3 work cannot close or submit with a missing or inconsistent changelog decision, while historical v2 and lighter work remain compatible.

## Build Brief

Implement deterministic v3 Full BFM changelog enforcement through closeout, submission, verification reuse, and release-checkpoint evidence. Update canonical docs and skills, generate package mirrors, and rebuild active plugin metadata.

Release build: `0.3.1-beta+codex.20260718021942`

Changelog expectation: required

## Task Receipt

Approved brief and decisions: The approved Full-only closeout and 0.3.1-beta release-candidate boundaries were followed.
Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#031-beta-2026-07-18)
Confirmed assumptions and approved scope changes: PR #48 remains the integration vehicle; no scope change was required.
Branch, source commits, and changed surfaces: Branch codex/fb-honest-comparison; commit recorded after focused verification; closeout runtime, canonical/package guidance, tests, and release metadata changed.
Checks, failures, recovery, and results: Focused changelog contract recorded RED then GREEN; directly affected checks and release checkpoint results are recorded at closeout.
Review state, direct links, limits, and external gates: Local release candidate; [PR #48](https://github.com/friedbeef1/fb-lane-coordination/pull/48); Push Live is still required.
Repository state: Candidate is committed locally and prepared for the parent Product/BFM integration pass.
Remaining owner and action: Parent Product/BFM runs final integration/release evidence, pushes PR #48, and stops at Ready to ship.

## Brief Validation

Status: pass
Satisfied criteria and evidence: The focused contract covers required, not-required, mismatch, link, fields, candidate range, exemptions, and release evidence.
Missing criteria: No approved implementation criterion remains missing after the focused gate.
Reason: The candidate implements the approved Full-only deterministic boundary and version surfaces.
Owner: Product/BFM.
Next action: Run the final release checkpoint and prepare PR #48 for Ready to ship.
Approved scope-change references: The original approved plan applies without a scope change.

## Verification Handoff

Candidate: Local commit recorded in the implementation report.
Test plan: Focused changelog-closeout, session/submission/release, metadata, parity, syntax, links, whitespace, then one final validator.
Commands and results: Recorded in `/private/tmp/fb-task031-impl-report.md` and the final Product/BFM closeout.
Environment: Local isolated Git worktree on codex/fb-honest-comparison.
Runnable evidence links: [PR #48](https://github.com/friedbeef1/fb-lane-coordination/pull/48)
Manual pass criteria: Product confirms the changelog describes the delivered candidate in user language.
Recovery attempted: One bounded implementation pass; no repeated broad gate.
Known limits: Marketplace publication and installed-plugin smoke wait for Push Live.
Next Product/BFM recovery action: If a focused gate fails, apply one consolidated repair or stop for Product direction.

## Test This Now

- **Outcome type:** Local Codex plugin release candidate
- **Direct links:** Optional review link — [PR #48](https://github.com/friedbeef1/fb-lane-coordination/pull/48)
- **Exact steps and expectations:**
  1. Open PR #48 and confirm the Full BFM changelog decision and 0.3.1-beta package metadata are present.
- **Pass criteria:** Focused and release-checkpoint evidence pass for the exact candidate.
- **Known limits:** Public installation happens only after Push Live.
- **Failure-report format:** failing check, expected result, candidate commit, and observed output.
