---
type: fb-lane-handoff
task: TASK-075
lane: fb-product
status: implemented
okr_fit: aligned
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-075 — User workstream and Product/BFM control centre

Release candidate: `0.5.9-beta+codex.20260805042523`
Candidate state: Checking — not Ready to ship.
Changelog approval: approved by James on 2026-08-05.

## Intake Snapshot

| Workstream | Ready inputs | Disposition |
|---|---:|---|
| User | 1 | Include now — separate User evidence from Product/BFM control |
| Business | None | None relevant |
| Design | None | None relevant |
| Tech | None | None relevant |
| Discovery | None | None relevant |
| Bugs | None | None relevant |

Snapshot boundary: James's supplied Product handoff and sidebar-visibility
amendment before this `$bfm` invocation. Later ordinary handoffs wait for the
next cycle.

## Goal Alignment Session

Product Goal: Make FB's ownership and navigation obvious in every project.
Workstream Goal: Separate user evidence from Product/BFM orchestration.
Lane OKR Fit: aligned
User Approval Needed: no — James invoked `$bfm` after directing implementation.
Mini-loop Evidence: Existing onboarding already identifies, creates, titles,
pins, and verifies six repository-scoped tasks; this change extends and
clarifies that contract.
Evidence Against Product OKR: None identified.

## Project Start Brief

### What you asked for

Create six evidence-producing workstreams—User, Business, Design, Tech,
Discovery, and Bugs—plus one Product/BFM control centre, with all seven tasks
visible and pinned in the Codex sidebar.

### Your decisions

- Product/BFM reconciles, prioritizes, sequences, coordinates implementation,
  verifies, and prepares release; it is not a competing workstream.
- Product/User becomes User.
- `$bfm` executes only in Product/BFM.
- Setup creates or identifies all seven tasks, pins them when supported, reuses
  legacy tasks, creates only missing tasks, and reports failures honestly.

### Assumptions to confirm

- Existing technical `product` handoffs remain readable for compatibility.
- FB itself is migrated first; MJ, TT, and Unmirror follow through their own
  Product/BFM rollout tasks after the plugin candidate is verified. UI Skill is
  not assumed to need the full structure without a separate Product decision.

### Out of scope

App-level automatic chat discovery, implicit execution, transcript capture,
consumer-repository mutation in this slice, merge, marketplace publication,
reinstall, and deployment.

### Success looks like

Fresh and existing projects deterministically converge on seven repository-
scoped pinned tasks without duplicates, while the plugin and documentation tell
one clear six-workstream/one-control-centre story.

## Build Brief

1. Add a dedicated User workstream and make Product/BFM the named control role.
2. Implement repository-aware reuse/rename/create/pin planning for seven tasks.
3. Migrate Product/User to User and a lone legacy Product task to Product/BFM.
4. Preserve legacy handoff/runtime compatibility and idempotent receipts.
5. Align public docs, harness, diagrams, skills, templates, prompts, metadata,
   setup/version guidance, and generated plugin mirrors.
6. Add focused root/package behavior and structural contracts.
7. Verify proportionally and stop at the changelog/release boundary.

Changelog expectation: required — this changes the visible operating model,
onboarding, plugin skills, and upgrade behavior.

## Task Receipt

- **Changed surfaces:** seven-role onboarding planner and focused tests;
  dedicated User and Product/BFM skill/guidance model; public, setup, platform,
  template, prompt, metadata, version, release, and generated package surfaces.
- **Verification:** [TASK-075 QA](../qa/TASK-075.md).
- **Review state:** Checking — focused candidate evidence recorded; final
  release checkpoint intentionally not run.
- **Changelog:** drafted — [FB 0.5.9-beta](../../CHANGELOG.md#059-beta--2026-08-05).
- **Changelog approval:** approved by James on 2026-08-05.
- **External gates:** Final release checkpoint and Push Live.
- **Remaining owner/action:** Product/BFM runs the one final release checkpoint.

## Brief Validation

Status: Checking

- **Satisfied:** The canonical candidate, generated package, active release
  records, compatibility boundary, and focused evidence are aligned.
- **Missing:** The final release checkpoint and Push Live.
- **Next action:** Run the single final release checkpoint. Do not claim Ready
  to ship unless it passes.

## Failure Evidence

- **Failure:** Initial complete release validator stopped in the root CLI suite.
- **Observed:** One assertion required the superseded exact phrase “start in
  whichever workstream.”
- **Cause:** The product guidance intentionally changed to the more precise
  “start in whichever evidence-producing workstream,” but this legacy assertion
  was not updated with the rest of the contract.
- **Recovery attempted:** Update only the stale assertion, regenerate its
  package mirror, rerun the failed regression proof, then use the one permitted
  final complete validator pass.
- **Result:** Root regression proof passed 72/72; the generated package mirror
  is synchronized for the final complete pass.
- **Reusable lesson:** Structural wording contracts must move with intentional
  terminology changes; broad validation should identify drift without forcing
  product copy backwards.
