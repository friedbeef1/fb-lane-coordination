---
type: fb-lane-handoff
task: TASK-090
lane: fb-product
status: staging-qa
approval: approved
record_model: normalized-v1
fb_harness: v3
worktree: /private/tmp/fb-task-090
sensitive: false
work_types: coordination, documentation, plugin-guidance
surface: Product/BFM return loop and packaged Codex plugin
---

# TASK-090 - Workstream result return

Candidate build: `0.9.4-beta+codex.20260821034517`.

## Approved brief

When Product/BFM acts on a workstream handoff, it must leave the result in the
originating workstream rather than making the lane rediscover it later.

## Goal Alignment Session

Product Goal: Keep the graph useful after Product/BFM action by returning the
verified result to the evidence-producing workstream that originated it.

Workstream Goal: Make a reopened workstream show the Product disposition,
delivery evidence, and remaining gate without starting another execution loop.

Lane OKR Fit: aligned.

User Approval Needed: no — James explicitly approved this bounded behavior.

Mini-loop Evidence: The prior harness wrote detailed closeout and refreshed a
card but did not require exact-task result delivery or idempotent fallback.

Evidence Against Product OKR: None identified.

## Build Brief

- Record a compact Product/BFM result in every dispositioned handoff.
- Refresh the exact originating workstream card after that record changes.
- Send one grouped passive summary per affected workstream and BFM cycle to the
  exact receipt-bound sidebar task.
- Include Include now, Blocked, Deferred, Duplicate, Rejected, and Superseded.
- Do not resend an unchanged result.
- When task messaging is unavailable, preserve the durable result, mark return
  delivery pending, and provide paste-ready text without claiming delivery.

Changelog expectation: required.

## Assumptions

- Codex task messaging remains an agent capability rather than a repository CLI
  API; the plugin skill must use the exact receipt-bound task ID.
- Historical `## Product/BFM Closeout` records remain valid and are not
  retrofitted.

## Dependencies

The existing onboarding receipt provides exact project-scoped task IDs. The
existing workstream-card refresh provides the durable revisit surface.

## Acceptance Criteria

- All six Product dispositions receive a result, including non-execution paths.
- Multiple changed results for one workstream produce one grouped notice.
- An unchanged result is not resent.
- Missing task messaging preserves durable evidence and reports pending.
- A passive result never starts work, invokes `$bfm`, or changes release authority.

## Scope boundaries

No new command, workstream, task discovery mechanism, release, merge,
publication, or global installation.

## Approval

Approved by James in the current Product/BFM conversation on 2026-08-21.

## Verification plan

One focused root/package behavioral contract, package synchronization, affected
syntax, links, and whitespace.

## Brief Validation

Result: pass.

Satisfied criteria and evidence: The focused canonical/package contract covers
all dispositions, required result fields, exact task identity, grouping,
idempotency, six workstream reopen behavior, and the unavailable-tool fallback.

Missing criteria and next actions: Publication and installed-runtime proof are
not authorized until **Push Live**.

Approved scope-change references: James's approval in the current Product/BFM
conversation.

## Task Receipt

Approved brief and decisions: Return every Product/BFM result to its originating
workstream durably and passively without creating another execution loop.

Confirmed assumptions and scope changes: Existing tasks, handoffs, commands,
runtime interfaces, and historical closeouts stay compatible.

Branch and changed surfaces: `codex/TASK-090-workstream-result-return`; canonical
workflow/records guidance, Product/BFM and six workstream skills, public concise
copy, version metadata, changelog, focused contract, and generated package.

Checks, failures, recovery, and results: The focused contract first failed on
the absent result-return behavior, then passed in root and package. Existing
Product/BFM guidance and plugin metadata contracts pass in both contexts; 88
mirrors are aligned; affected syntax and whitespace pass. A disposable
three-handoff mock grouped two Bugs results into one exact-task notice, kept an
unavailable Design return pending with paste-ready evidence, and sent zero
duplicate messages on an identical second cycle.

Review state, direct links, limits, and external gates: completed nonvisual
plugin candidate. See [TASK-090 QA](../qa/TASK-090.md). The current Codex CLI
does not expose a `plugin validate` subcommand, so package metadata and mirror
contracts provide the local plugin proof. Publication remains gated by **Push
Live**.

Repository state: Isolated worktree based on public `main`; candidate changes
are scoped to TASK-090.

Remaining owner and action: Product/BFM may run the release checkpoint only
after **Push Live**, then publish/reinstall the exact build and require a fresh
Codex task.

Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#094-beta--2026-08-21).

## Product/BFM Closeout

The return-loop contract is implemented in canonical and packaged guidance.
Focused root/package behavior and package parity passed. Release remains
unauthorized until **Push Live**.

## Verification Handoff

- QA: [TASK-090 QA](../qa/TASK-090.md)
- Board: [TASK-090 board record](../../PROJECT_BOARD.md#task-090---workstream-result-return)
- Staging review: [PR #69](https://github.com/friedbeef1/fb-lane-coordination/pull/69)
- System verification: passed for the local `0.9.4-beta` candidate.
