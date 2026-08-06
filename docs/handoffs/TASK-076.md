---
type: fb-lane-handoff
task: TASK-076
lane: fb-product
status: implemented
okr_fit: aligned
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-076 — Exact FB setup shortcut

Release candidate: `0.5.10-beta+codex.20260806151502`
Candidate state: Checking — focused implementation verification in progress.
Changelog approval: approved by James on 2026-08-06.

## Intake Snapshot

| Workstream | Ready inputs | Disposition |
|---|---:|---|
| User | 1 | Include now — make project setup exact and less ambiguous |
| Business | None | None relevant |
| Design | None | None relevant |
| Tech | 1 | Include now — add a thin delegating skill and package contract |
| Discovery | None | None relevant |
| Bugs | None | None relevant |

Snapshot boundary: James's request for a short `$` or `/` setup invocation and
approval of the dedicated `$fb-setup` skill approach. Later ordinary handoffs
wait for the next Product/BFM cycle.

## Goal Alignment Session

Product Goal: Make FB setup short, exact, and difficult to misinterpret.
Workstream Goal: Add one memorable skill invocation without duplicating setup
policy or adding runtime machinery.
Lane OKR Fit: aligned
User Approval Needed: no — James approved the proposed approach and asked for
implementation.
Mini-loop Evidence: Existing active setup docs rely on the natural request
`Set up FB in this project.`, while the installed plugin already has one
canonical setup skill that can safely be delegated to.
Evidence Against Product OKR: None identified.

## Project Start Brief

### What you asked for

Provide one exact `$` or `/` invocation for setting up FB so users do not depend
on ambiguous natural-language wording.

### Your decisions

- Use `$fb-setup` as the primary invocation.
- Keep existing setup behavior rather than creating a separate onboarding path.
- Update the plugin and active documentation.

### Assumptions to confirm

- Codex plugin skills use `$` invocation, so `/fb-setup` must not be presented
  as an installed slash command.
- The existing long-form setup skill and natural-language request remain useful
  compatibility fallbacks.

### Out of scope

New CLI commands, app-level task controls, setup-policy redesign, consumer-repo
mutation, merge, marketplace publication, reinstall, and deployment.

### Success looks like

Users can invoke `$fb-setup`; it deterministically delegates to the canonical
setup workflow; active root and packaged docs lead with the shortcut; package
and skill validation remain green.

## Build Brief

1. Add a thin `fb-setup` skill that requires the canonical setup skill.
2. Preserve seven-task reconciliation, idempotency, idle-task, manual-fallback,
   `$bfm`, and release boundaries.
3. Make `$fb-setup` primary in active root and packaged setup guidance.
4. Retain and document the long-form and natural-language fallbacks.
5. Add one focused root/package structural contract and generate mirrors once.
6. Version the user-visible plugin interface as FB 0.5.10-beta.
7. Stop for changelog approval before the release checkpoint.

Changelog expectation: required — this adds a user-visible plugin skill and
changes the primary installation-to-setup workflow.

## Task Receipt

- **Changed surfaces:** setup skill, active setup guidance, package manifest,
  generated plugin mirrors, metadata/default prompt, version and changelog.
- **Verification:** [TASK-076 QA](../qa/TASK-076.md).
- **Review state:** not reviewable — focused verification is still running.
- **Changelog:** drafted — [FB 0.5.10-beta](../../CHANGELOG.md#0510-beta--2026-08-06).
- **Changelog approval:** approved by James on 2026-08-06.
- **External gates:** Release checkpoint, GitHub integration, marketplace
  publication, and reinstall remain unapproved.
- **Remaining owner/action:** Product/BFM requests one clean release checkpoint.

## Brief Validation

Status: blocked

- **Satisfied:** Approved scope, interface decision, compatibility boundary,
  focused validation evidence, release boundary, and changelog approval are
  recorded.
- **Missing:** One clean release checkpoint.
- **Next action:** Request explicit Product approval for the release checkpoint.
