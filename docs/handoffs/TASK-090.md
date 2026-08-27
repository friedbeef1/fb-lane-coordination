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

When Product/BFM materially involves a workstream, it must leave a passive
kickoff after the Build Brief is frozen and return the eventual result to the
originating workstream rather than making the lane rediscover either boundary
later.

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
- After the Build Brief and slice ownership are frozen, send one passive
  kickoff to each materially involved, exact receipt-bound workstream task.
- Include the task ID, assigned scope, expected evidence, Product/BFM ownership,
  and repository brief link in that kickoff.
- Refresh the exact originating workstream card after that record changes.
- Send one grouped passive summary per affected workstream and BFM cycle to the
  exact receipt-bound sidebar task.
- Include Include now, Blocked, Deferred, Duplicate, Rejected, and Superseded.
- Do not resend an unchanged result.
- Cap delivery at one kickoff and one terminal/result notice per involved
  workstream per BFM run, except for a material status change requiring James's
  attention.
- When task messaging is unavailable, preserve the durable result, mark return
  delivery pending, and provide paste-ready text without claiming delivery.
- A notice is visibility only. It never activates the task, continues a queued
  cross-workstream handoff, delegates execution, or weakens sidechat-parent,
  receipt/rebind, sensitive-operation, or **Push Live** gates.

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
- Every materially involved workstream receives one passive kickoff only after
  the Build Brief and slice ownership are frozen.
- Multiple changed results for one workstream produce one grouped notice.
- An unchanged result is not resent.
- Missing task messaging preserves durable evidence and reports pending.
- A passive result never starts work, invokes `$bfm`, or changes release authority.
- Private agents may implement, but the exact sidebar task still receives the
  bounded visibility trail without being activated.

## Scope boundaries

No new command, workstream, task discovery mechanism, public release, merge, or
marketplace publication. James authorized supported local installation of this
exact candidate for verification; installed-cache editing remains forbidden.

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

Missing criteria and next actions: Public marketplace publication and merge are
not authorized until **Push Live**. Supported local candidate installation and
installed-artifact proof are authorized in the current conversation.

Approved scope-change references: James's approval in the current Product/BFM
conversation.

## Task Receipt

Approved brief and decisions: Give every materially involved workstream one
passive kickoff and return every Product/BFM result durably, without creating
another execution loop.

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
plugin candidate. See [TASK-090 QA](../qa/TASK-090.md). GitHub readiness passed
for source commit `704f958`; the supported local install is enabled as exact
build `0.9.4-beta+codex.20260821034517`, with 93/93 package/cache parity and 14
installed MCP tools. Public merge/publication remains gated by **Push Live**.

Repository state: Isolated worktree based on public `main`; candidate changes
are scoped to TASK-090.

Remaining owner and action: Start a fresh Codex task to load the installed
0.9.4 skill and MCP runtime. Public merge/publication still requires **Push
Live**.

Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#094-beta--2026-08-21).

## Product/BFM Closeout

The kickoff-and-return contract is implemented in canonical and packaged
guidance. Focused root/package behavior and package parity passed. Public
release remains unauthorized until **Push Live**.

## Verification Handoff

- QA: [TASK-090 QA](../qa/TASK-090.md)
- Board: [TASK-090 board record](../../PROJECT_BOARD.md#task-090---workstream-result-return)
- Staging review: [PR #69](https://github.com/friedbeef1/fb-lane-coordination/pull/69)
- System verification: passed for source, GitHub readiness, installed artifacts,
  and installed MCP resolution for the `0.9.4-beta` candidate.

## Gate

External gates: James says **Push Live** for PR #69 before Product/BFM may
merge or publish the marketplace build. The separately authorized local
candidate install and installed-artifact verification are complete.

Remaining owner/action: Open a fresh Codex task for loaded-runtime use.
Product/BFM keeps PR #69 staged for optional review; after an explicit **Push
Live**, run the public release checkpoint and merge/publish the exact build.
