# TASK-072 QA — Lifecycle history reconciliation

Date: 2026-08-04
Scope: one-time evidence-led reconciliation of exactly 21 `Staging QA` tasks

## Safety contract

- Status changes are based on durable handoff, QA, Git, rejection, and release
  evidence; age and later version numbers are not closure evidence.
- Historical handoffs, QA, benchmark results, changelog entries, and Git
  references remain queryable.
- The evidence table is completed before any board, index, or Product-card
  status mutation.
- Uncertain work remains current and is marked `Blocked` with a Product owner
  and concrete reconciliation action.

## Before measurement

| Measure | Before |
|---|---:|
| Nonterminal task count | 21 |
| `status --context` | 11,197 characters; approximately 2,800 tokens |
| Product card | 21,241 characters; approximately 5,311 tokens |

Approximate tokens use the mechanical `ceil(characters / 4)` estimate.

## Pre-mutation evidence table

| Task | Current status | Linked handoff | Durable merge, release, acceptance, or rejection evidence | Chosen status | Remaining owner / action |
|---|---|---|---|---|---|
| TASK-061 | Staging QA | [Handoff](../handoffs/TASK-061.md); [QA](TASK-061.md) | Implementation commit `7bf8ef1` and safeguard record `ffc390b` are ancestors of published `0.5.1-beta` release commit `f3ed9a0`; the QA record passed 8/8 focused and 70/70 affected CLI tests. | Done | None; retain the handoff, QA, release, and Git references for historical lookup. |
| TASK-058 | Staging QA | [Handoff](../handoffs/TASK-058.md); [QA](TASK-058.md) | Merge commit `75541b4` explicitly includes TASK-058 and is an ancestor of published `0.5.1-beta` release commit `f3ed9a0`; the changelog preserves the approved Automatic BFM worktrees release entry. | Done | None; retain the handoff, QA, changelog, release, and Git references. |
| TASK-056 | Staging QA | [Handoff](../handoffs/TASK-056.md); [QA](TASK-056.md); [result](../benchmarks/repair-efficiency/README.md) | Commit `4244fff` preserves the completed prospective benchmark and is an ancestor of published `0.5.0-beta` release commit `708593a`; the approved release entry reports the bounded directional result. | Done | None; retain the benchmark limits and evidence. |
| TASK-055 | Staging QA | [Handoff](../handoffs/TASK-055.md); [TASK-056 result](../benchmarks/repair-efficiency/README.md) | Implementation commit `4244fff` is an ancestor of published `0.5.0-beta` release commit `708593a`; that release records the approved repair-efficiency behavior and its verification-backed limits. | Done | None; retain the implementation, changelog, benchmark, and Git references. |
| TASK-054 | Staging QA | [Handoff](../handoffs/TASK-054.md); [QA](TASK-054.md); [result](../benchmarks/real-work/README.md) | Closeout commit `4dc7bfa` is an ancestor of published `0.5.0-beta` commit `708593a`; the handoff and QA explicitly reject Preventive Graph FB as the default after it was 13.1% slower and used 34.7% more tokens, while preserving all 12 counted first passes. | Rejected | None; preserve the unfavorable benchmark and rejection rationale. |
| TASK-053 | Staging QA | [Handoff](../handoffs/TASK-053.md); [QA](TASK-053.md); [result](../benchmarks/control-loop/readiness95.md) | Accepted parity closeout `8b7eb0c` is an ancestor of published `0.5.0-beta` commit `708593a`; nine fresh version-3 runs passed the frozen gates and independent review returned ACCEPT with zero Critical or Important findings. | Done | None; retain the fixed-fixture limits and the rejected version-1/version-2 evidence. |
| TASK-052 | Staging QA | [Handoff](../handoffs/TASK-052.md); [QA](TASK-052.md); [result](../benchmarks/control-loop/preventive-context.md) | Rejection closeout `21e7856` is an ancestor of published `0.5.0-beta` commit `708593a`; the independent verdict rejects the autonomous comparison and authorizes no adoption, while preserving the controlled sensitivity result. | Rejected | None; preserve the controlled diagnostic and rejected autonomous evidence. |
| TASK-051 | Staging QA | [Handoff](../handoffs/TASK-051.md); [QA](TASK-051.md); [superseding review](../benchmarks/control-loop/context-efficiency-independent-review.md) | Rejection closeout `1dc5a30` is in published history before `0.5.0-beta`; the frozen candidate exceeded its 298,080 token-unit maximum, privacy failed as implementation evidence, the unsafe runtime was removed, and the handoff says adoption remains closed. | Rejected | None; preserve the frozen artifacts, superseding review, and rejected-candidate Git history. |
| TASK-048 | Staging QA | [Handoff](../handoffs/TASK-048.md); [QA](TASK-048.md); [experiment](../experiments/TASK-048-graduated-project-graph-pilot.md) | The controlled 6/6 result at `d7d4de3` became the evidence basis for accepted graph integration `98f9274`; both are ancestors of the `0.4.0-beta` release checkpoint `d3fe2e8`, PR #51 merge `4780a00`, and release closeout `f1de6b8`. | Done | None; preserve the pilot's narrow-scenario limits and the later integration/release chain. |
| TASK-047 | Staging QA | [Handoff](../handoffs/TASK-047.md); [QA](TASK-047.md); [pilot](../experiments/TASK-047-real-task-pilot.md) | Implementation `fa75068` was merged by PR #49 at `4b743ad`; it is an ancestor of the accepted graph release checkpoint `d3fe2e8` and remains the canonical normalized-record model used by later work. | Done | None; retain QA, the prospective pilot, PR #49, and Git history. |
| TASK-029 | Staging QA | [Handoff](../handoffs/TASK-029.md); [plan](../superpowers/plans/2026-07-17-fb-six-workstream-loop.md) | Implementation `90fa8cc` merged through PR #43 at `d2b10a0` and is an ancestor of the published `0.3.0-beta` release evidence commit `4a6005c`; the changelog records installed six-workstream skills and reconciliation. | Done | None; preserve the handoff, plan, PR #43, PR #44, release, and Git references. |
| TASK-028 | Staging QA | [Handoff](../handoffs/TASK-028.md); [spec](../superpowers/specs/2026-07-17-fb-efficiency-correction-design.md) | Release-first closeout `8a1d509` merged through PR #42 at `2f391f3` and is an ancestor of published `0.3.0-beta` evidence `4a6005c`; current harness guidance retains focused checks and explicit Product-owned release checkpoints. | Done | None; retain the approved policy, QA narrative, PR #42, and release history. |
| TASK-027 | Staging QA | [Handoff](../handoffs/TASK-027.md); [plan](../superpowers/plans/2026-07-17-complete-fb-product-story.md) | Final-review repair `21d224a` merged through PR #42 at `2f391f3` and is an ancestor of published `0.3.0-beta` evidence `4a6005c`; the merge/release resolves the handoff's now-stale Product re-review gate. | Done | None; preserve the repair findings, Product-story evidence, PR #42, and release chain. |
| TASK-026 | Staging QA | [Handoff](../handoffs/TASK-026.md); [plan](../superpowers/plans/2026-07-17-bfm-two-speed-efficiency.md) | Product-accepted closeout `e26a8c9` merged through PR #42 at `2f391f3` and is an ancestor of published `0.3.0-beta` evidence `4a6005c`; later releases continue the Quick/Full and proportional-verification contract. | Done | None; retain the handoff, two-speed evidence, PR #42, and release history. |
| TASK-025 | Staging QA | [Handoff](../handoffs/TASK-025.md); [plan](../superpowers/plans/2026-07-17-fb-product-positioning.md) | Product-accepted candidate `3af1f17` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; the released product model retained the comparison and positioning surfaces. | Done | None; preserve the positioning evidence, review limits, PR #42, and release history. |
| TASK-024 | Staging QA | [Handoff](../handoffs/TASK-024.md) | Product-accepted beginner candidate `cc13389` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; the handoff records no remaining internal implementation or review gate. | Done | None; retain the beginner-contract verification, PR #42, and release evidence. |
| TASK-022 | Staging QA | [Handoff](../handoffs/TASK-022.md) | Final submit-serialization repair `f94dce9` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; final combined review passed with no Critical, Important, or Minor finding. | Done | None; preserve the session-ledger handoff, repair chain, combined review, PR, and release history. |
| TASK-023 | Staging QA | [Handoff](../handoffs/TASK-023.md) | Final integrated lifecycle repair `fe733a1` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; final combined review accepted the Markdown eval lifecycle while keeping walkthrough evals shadow-only. | Done | None; preserve the eval records, Quality Gap repairs, combined review, PR, and release history. |
| TASK-021 | Staging QA | [Handoff](../handoffs/TASK-021.md); [plan](../superpowers/plans/2026-07-16-fb-harness-redesign.md) | Final harness-evidence fix `8c54c1c` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; the branch re-review found no Critical, Important, or Minor issue. | Done | None; preserve the v2 compatibility boundary, re-review, PR #42, and release evidence. |
| TASK-020 | Staging QA | [Handoff](../handoffs/TASK-020.md); [plan](../superpowers/plans/2026-07-16-fb-first-project-clarity.md) | Approval-before-BFM candidate `9bf95fd` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; root/package verification and first-project bootstrap smoke were accepted before merge. | Done | None; preserve onboarding QA, PR #42, and release history. |
| TASK-019 | Staging QA (handoff index was stale at `In Progress`) | [Handoff](../handoffs/TASK-019.md); [plan](../superpowers/plans/2026-07-16-fb-documentation-rebrand.md) | Rebrand implementation `bcdb01c` is an ancestor of PR #42 merge `2f391f3` and published `0.3.0-beta` evidence `4a6005c`; technical identifiers and historical records remained unchanged as required. | Done | None; correct the stale index projection and preserve the wording audit, PR, release, and Git history. |

## After measurement and archival retrieval

| Measure | Before | After |
|---|---:|---:|
| Nonterminal task count | 21 | 0 |
| `status --context` | 11,197 characters; approximately 2,800 tokens | 208 characters; approximately 52 tokens |
| Product card | 21,241 characters; approximately 5,311 tokens | 1,018 characters; approximately 255 tokens |
| Archived target retrieval | Not applicable | 21/21 task IDs found in [August archive](../board/archive/2026-08.md) |
| False omissions | Not applicable | 0 |

Approximate tokens use the mechanical `ceil(characters / 4)` estimate. The
Product card's completed legacy narrative was preserved verbatim in the August
archive under `Legacy FB-Product workstream narrative`; it remains retrievable
alongside every archived task row and detail record.

## Focused verification

- `renderBoardContext(PROJECT_BOARD.md)` returned the active-context packet
  with its historical lookup link (207 characters).
- `fb_project_context` retrieval for `TASK-061` returned an archived-history
  route containing both the task ID and archive reference.
- `node tools/fb-lane.cjs status --context` completed and produced the 208
  character active-context packet above.
- `node tools/fb-lane.cjs doctor` completed successfully.
- `git diff --check` completed successfully.

## FB 0.5.6-beta release slice

Release candidate: `0.5.6-beta+codex.20260804045203`

### TDD evidence

- The new lifecycle/history release contract failed first because the active
  manifest still exposed `0.5.5-beta+codex.20260803212323`.
- After canonical implementation, the root and packaged contracts both passed
  for the exact 0.5.6-beta build.
- Focused skill checks found two wording gaps introduced by the coordination
  skill reduction: explicit source-of-truth language and the canonical beginner
  pause-card route. One bounded wording repair restored both contracts without
  re-expanding the operating manual.

### Focused results

| Proof | Result |
|---|---|
| Six-workstream runtime contract | pass |
| Board context and lifecycle diagnostics | 12/12 pass |
| Project graph and archived retrieval | 13/13 pass |
| Packaged graph/MCP guidance | 7/7 pass after focused wording repair |
| Beginner experience | 11/11 pass after focused wording repair |
| Lifecycle/history release contract | root and package pass |
| Plugin metadata contract | root and package pass |
| Package mirrors | 58 declared mirrors synchronized |
| Changed Markdown links and anchors | 23/23 files pass |
| Affected JavaScript and JSON syntax | pass |
| Whitespace | pass |
| Doctor | exit 0; historical pre-v3 OKR warning remains, release worktree intentionally dirty before commit |

The frequently loaded coordination skill fell from 915 to 472 words while
retaining distinct workstream, `$bfm`, sidechat, safety, changelog, current
orientation, and historical retrieval boundaries.

### Open release gate

- Changelog approval: approved by James on 2026-08-04 — [0.5.6-beta entry](../../CHANGELOG.md#056-beta--2026-08-04).
- One new release checkpoint remains after the approved historical
  compatibility repair.
- Push, merge, marketplace publication, reinstall, and deployment remain
  unauthorized.

### Release-checkpoint repair

The initial full pass stopped when the compact coordination skill no longer
contained two direct navigation phrases and several legacy contracts still
required duplicated or stale prose. One consolidated repair restored the
`start.md` and default `status` routes, updated factual/structural assertions,
kept ready handoffs as Product-intake candidates, and regenerated 58 mirrors.

Focused recovery evidence:

- root CLI contract: 70/70;
- positioning: root/package pass;
- efficiency: 25/25;
- automatic worktrees: 11/11;
- changelog closeout: root/package 13/13;
- six-skill behavior: pass;
- package parity and whitespace: pass.

The permitted final full validator pass ran after this repair. Every runtime,
session, eval, onboarding, positioning, two-speed, and efficiency suite passed.
Doctor then returned `Needs attention` because 42 historical pre-v3 tasks lack
modern board OKRs; the validator requires the literal `Ready` result. No third
automatic repair or validator pass was attempted. Product must decide whether
that historical warning is informational for release readiness or requires an
evidence-led retrofit. Retrospective OKRs must not be invented.

### Historical compatibility repair

James approved the prospective compatibility boundary on 2026-08-04. The
collector now distinguishes current obligations from historical absence:

| Proof | Result |
|---|---|
| Pre-v3 record without modern board OKRs | visible compatibility notice; non-blocking |
| Pre-v3 task with terminal `Superseded` status | visible compatibility notice; non-blocking |
| Active board task without approved OKRs | blocking warning |
| `fb_harness: v3` or `record_model: normalized-v1` without approved OKRs | blocking warning |
| Focused historical boundary regression | root/package pass, including superseded and active legacy cases |
| Root CLI suite | 71/71 pass |
| Packaged CLI suite | 71/71 pass |
| Package mirrors | 58/58 synchronized |
| Affected Node syntax | pass |
| Whitespace | pass |

This repair does not retrofit historical decisions or weaken prospective
requirements. One new release checkpoint remains before the candidate can
claim **Ready to ship**.
