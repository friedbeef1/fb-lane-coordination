---
type: fb-lane-handoff
task: TASK-021
lane: fb-product
status: implemented
okr_fit: aligned
fb_harness: v2
Review state: not reviewable
---

# TASK-021 - FB Harness Redesign

## Goal Alignment Session

Product Goal: Let an everyday user move from an idea to an approved build brief and testable evidence with FB carrying routine coordination and QA work.
Workstream Goal: Turn the existing coordination model into a compact repository-local harness with an explicit hierarchy, safe migration path, and enforceable review evidence.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly approved the FB Harness Redesign implementation plan.
Mini-loop Evidence: First-project feedback showed that duplicated instructions obscured the plan/build boundary, lane roles, and test responsibilities. The shipped clarity contract now needs a compact canonical home and a small enforceable evidence gate.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Redesign FB as a reusable repository-local harness that reduces user coordination and testing burden while preserving the established ownership model.

Your decisions:

- The canonical manual is a small `docs/fb/` pack.
- Existing projects receive only a managed route block plus the pack; project-owned instructions stay intact.
- Review evidence is enforced only for new harness-v2 handoffs explicitly marked reviewable.
- There is no new command, wizard, dashboard, CI job, release, deployment, publication, or consumer-repository change.

Assumptions to confirm: None. The implementation plan supplies the defaults and explicit exclusions.

What FB will plan: A source hierarchy, concise entry points, safe bootstrap migration, and validator/doctor checks for complete review packets.

Out of scope: Changing technical identifiers, four-lane ownership, board technical statuses, historical handoffs, or an installed/released plugin.

Success looks like: A fresh or existing project has a compact, durable FB route; new v2 reviewable handoffs cannot close without actionable Test This Now evidence; old work remains valid.

Progress: Local verification and the final whole-branch re-review are complete; the candidate is ready for the local Product gate.

Next action: Product performs the local branch-diff review and decides whether to authorize a later merge/release action.

## Build Brief

Build a mirrored root/package `docs/fb/` harness pack; route active instructions to it; update bootstrap to create the pack and safely maintain only explicit route blocks; and extend the existing doctor/validator to enforce the opt-in v2 handoff evidence contract. Preserve the current first-project clarity behavior, board statuses, technical identifiers, and no-release boundary.

## Scope

- Root and packaged `docs/fb/` harness pack.
- Root/template/generated navigation-layer instructions and concise active docs/skills.
- Root/package bootstrap behavior and matching tests.
- Existing doctor/validator review-evidence validation with targeted fixtures.
- Coordination records and final verification only.

## Out Of Scope

- New commands, wizard, dashboard, eval runner, CI job, board-status replacement, release, deployment, publication, technical-ID migration, or consumer-project changes.
- Retrofitting or rewriting historical handoffs and project-owned instructions.

## Verification Handoff

Candidate: local branch `codex/fb-documentation-rebrand`; implementation commits `6c9ec20`, `8301463`, `7584aa9`, `6c90f58`, `a505206`, `b1be395`, `fba33f5`, and final fix `8c54c1c`.

Test plan: fresh creator-commerce bootstrap; existing-project bootstrap migration; focused harness-v2 fixtures; full root/package suites; recovery, syntax/parity, validator, doctor, diff/whitespace; and independent whole-branch re-review.

Environment and results: local macOS worktree, with validator/doctor verified against the clean committed candidate. The standalone fresh smoke created all five root/package-identical pack pages, kept both generated instruction files thin, preserved board → index → linked handoff read order and the first-project contract, and emitted no paused-platform artifacts. The existing-project smoke preserved user-owned prefix/suffix and malformed marker text, replaced only stale complete managed blocks, and was byte-identical after a second rerun. Final fix `8c54c1c` updated both setup skills to describe the completed canonical-pack install and exact managed-marker replacement boundary; made both canonical evidence pages author the full opt-in v2 contract; and made the mirrored validator/doctor reject placeholder-only values, numbered `TODO`/`TBD` or angle-bracket steps, and non-actionable blocked next actions. Focused v2 suites passed 14 checks in each mirror; full root/package CLI suites passed 45 checks in each mirror; `node tools/workspace-recovery-contract.test.cjs` passed; all four Node syntax checks passed; root/package CLI source, CLI tests, setup skills, and all five harness pages were byte-identical; `node tools/fb-lane.validate.cjs` passed; `node tools/fb-lane.cjs doctor` reported Ready; and committed-range diff/whitespace checks passed.

Final review: [TASK-021 whole-branch re-review](../../.superpowers/sdd/TASK-021-whole-branch-rereview.md) reviewed `dab4934..8c54c1c`, confirmed all three prior Important findings fixed, and found no remaining Critical, Important, or Minor issue. It authorizes no merge, publication, release, deployment, plugin install, or consumer-repository change.

Exact local commands:

```sh
node tools/workspace-recovery-contract.test.cjs
FB_LANE_TEST_FOCUS=v2 node tools/fb-lane.test.cjs
FB_LANE_TEST_FOCUS=v2 node plugins/fb-lane-coordination/tools/fb-lane.test.cjs
node tools/fb-lane.test.cjs
node plugins/fb-lane-coordination/tools/fb-lane.test.cjs
node --check tools/fb-lane.cjs
node --check plugins/fb-lane-coordination/tools/fb-lane.cjs
node --check tools/fb-lane.test.cjs
node --check plugins/fb-lane-coordination/tools/fb-lane.test.cjs
cmp -s tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs
cmp -s tools/fb-lane.test.cjs plugins/fb-lane-coordination/tools/fb-lane.test.cjs
cmp -s skills/project-coordination-setup/SKILL.md plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md
diff -qr docs/fb plugins/fb-lane-coordination/docs/fb
node tools/fb-lane.validate.cjs
node tools/fb-lane.cjs doctor
git diff --check dab4934..8c54c1c
```

Runnable evidence links: not applicable. Review state remains `not reviewable` because this is a reusable harness/plugin change with no deployed UI or consumer repository.

Manual pass criteria:

- `AGENTS.md` is concise and routes readers to the durable pack, board, index, and handoff.
- Fresh bootstrap creates all five pack pages and thin route guidance.
- Existing-project bootstrap retains user text and updates only the marked route blocks.
- The canonical evidence page authors the full v2 marker/state/brief/Test This Now/link/blocking contract.
- V2 reviewable handoffs require concrete, actionable Test This Now evidence and reject placeholder-only/TODO/TBD/angle-bracket values; planning-only and historical handoffs still pass.

Recovery: The source worktree contained an unrelated uncommitted Task 4 report, so clean-tree validator/doctor evidence was produced in a clean local clone without modifying or hiding that file. No further recovery was needed. Missing review access is recorded as `Blocked — no review environment yet` with the exact next action; routine verification recovery remains Product/BFM-owned before asking the user to intervene.

## Product/BFM Closeout

Status: Staging QA (local review only).
Actioned By: FB-Product / BFM.
Result: The compact mirrored harness pack, thin routes, safe fresh/existing bootstrap migration, corrected setup guidance, canonical v2 authoring contract, and actionable review-evidence gate are implemented and locally verified. Placeholder-only/TODO/TBD/angle-bracket evidence and non-actionable blocked next actions are rejected.
Evidence: Implementation commits `6c9ec20`, `8301463`, `7584aa9`, `6c90f58`, `a505206`, `b1be395`, `fba33f5`, and final fix `8c54c1c`; standalone fresh/existing smokes; focused v2 14-check suites in each mirror; full root/package 45-check suites; recovery-contract pass; four syntax checks; source/test/setup/five-page-pack parity; validator pass; doctor Ready; committed-range diff/whitespace pass; and a final whole-branch re-review with no remaining Critical, Important, or Minor issue.
Remaining: Product local gate, then any separately authorized merge/release decision. There is no deployed UI, so `Review state: not reviewable` remains correct.
Closeout Note: No push, publication, release, deployment, merge, plugin install, or consumer-repository change occurred or is authorized by this closeout.
Loop Health: healthy.
Loop Learning: Feedback captured: repeated instruction duplication and unstructured review evidence; Repeated pattern?: yes; Tooling needed?: smallest existing validator/doctor extension; Product approval needed?: no - explicit implementation approval received.
