---
name: fb-lane
description: Use when coordinating concurrent Codex work across Product, Tech, Design, and Business lanes with FB-Lane board claims, file locks, handoffs, and Product integration.
---

# FB-Lane Coordination

Use this skill when the user wants multiple Codex instructions to run concurrently without lanes stepping on each other.

Codex supplies the concurrency. FB-Lane supplies shared coordination:

- `PROJECT_BOARD.md` is the source of truth for tasks, owners, locks, links, and QA state.
- `.codex/current_task.md` records the active claimed task for a lane.
- `docs/handoffs/index.md` is the first-read routing table for handoff discovery.
- `docs/workstreams/<lane>.md` is the compact revisit card for what Product/BFM already executed, what remains pending or blocked, and where evidence lives.
- `docs/handoffs/` carries lane plans and evidence back to Product/Captain.
- The `fb-lane` MCP server or `node tools/fb-lane.cjs` commands perform status, claim, submit, and merge operations.

## Scope Boundary

FB-Lane is a thin coordination protocol, not a default wrapper for all Codex work.

Default to normal/simple coding for one-thread work with no listed coordination trigger. Skip FB-Lane for read-only questions, simple code explanations, tiny fixes, isolated edits, or independent work where Codex worktrees are enough. When skipping, use ordinary Codex workflow and avoid creating board noise.

Use FB-Lane light when the objective mentions handoffs, board items, lanes, BFM, Product, Design, Business, coordination files such as `PROJECT_BOARD.md`, `docs/handoffs/`, or `.codex/current_task.md`, board-locked files, multiple threads/agents/workstreams, or durable context that must survive chat loss. Keep quick tasks lightweight: read the board/locks, claim or note only the exact files needed, and avoid Goal Alignment or handoff ceremony unless another lane or Product must continue it.

Escalate to Product/BFM when the work requires deciding what to build, sequence, defer, approve, merge, release, stage, or launch; crosses pricing, payments, trials, subscriptions, promo codes, auth, privacy, analytics, secrets, deploy, staging, or live gates; touches camera/capture/save/export or another core product flow; or needs multiple lane outputs reconciled before source changes.

For non-trivial lane work, use the approved Product/workstream or BFM-target OKR in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`. Stable lane OKRs are standing Product, Tech, Design, and Business quality anchors. Product/BFM owns that OKR tree and adds or changes it only after discussion and explicit user approval. Do not generate a fresh OKR for every task, and do not apply this ceremony to `TASK-Q-*` quick tasks.

Normal workstream threads are read-only planning lanes. Product, Tech, Design, and Business may ask questions, investigate, critique, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.

If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, confirm whether to prepare the Product/BFM handoff or execute there as an explicit one-off exception before editing source.

Awareness, isolation, integration: `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup; branches/worktrees isolate execution like separate desks; BFM integrates outcomes like Product/release review. Worktrees do not replace coordination: no disappearing into a private worktree, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.

Workstream status cards are summaries only. Product/BFM refreshes the relevant `docs/workstreams/<lane>.md` card after executing or explicitly deferring a lane handoff. Returning lanes read the board, the handoff index, then their lane card before opening detailed handoffs. Do not put full OKRs, QA logs, plans, rationale, copy variants, or implementation detail in cards.

Frontend/UI handoffs include `Visual Preview Decision`: `skip`, `browser screenshot/mockup`, or `imagegen asset/style option`. Skip tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for actual UI layout, responsive, component, or flow decisions. Use imagegen only for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options where generated bitmap exploration helps. If visual uncertainty is meaningful, Product/BFM includes or requests the visual artifact before source execution.

## BFM Visible Card and Approval Fix

### Pre-Execution Card Snapshot
Before BFM claims files, edits, deploys, or completes work, show the visible board card snapshot: card ID, status, lane/owner, area, scope, locks, linked handoffs, blockers, gates, checks, branch/PR/staging URL if known, intentional dirty state, and goal details: objective, key results, definition of done, approval state, and justification.

### Goal Approval Gate
If multiple cards match, show the candidates and recommend one. If approval is missing, pending, stale, changed, or unclear, stop and ask. No claiming files, edits, deploys, or completion before approval.

### Post-Action Card Summary
After BFM acts, summarize card ID, final status, changed files, checks run, remaining gates, next owner, and whether live deploy is still blocked.

## User-Facing Quickstart

When the user asks how to start, what to do after install, or says `$fb-lane status`, keep the answer short and immediately actionable:

```text
Start with $fb-lane status.
Then describe the work normally.
Product gives direction and splits the work. Workstreams write markdown plans/handoffs. Product launches BFM when execution should begin; BFM execution workers read board/status/locks and the handoff index, claim files, name the task/branch/worktree/lane/locks, use worktrees where helpful, verify, and return evidence for Product sequencing.
```

For BFM/all-handoff processing, Product/BFM must build a five-lane handoff ledger before sequencing: `FB-Lane`, `FB-Product`, `FB-Tech`, `FB-Design`, and `FB-Business`. Each slot must name matching handoff files or state `no handoff found`; every found handoff must end as `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.

## Story Split Pass

Before BFM prioritizes or sequences a run, decide whether the request should be split into smaller stories. Split when the batch mixes unrelated lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work. If splitting helps, show child stories with owner/lane, scope, dependencies, locks/gates, and recommended order. If not, say `No split needed` and continue. Then run the Dependency And Lock Pass on the resulting stories or original item.

## Dependency And Lock Pass

For BFM/all-handoff sequencing, classify each five-lane ledger item. Capture status, owner, locks, dependencies, blockers, gates, approval, and required checks. Assign exactly one classification: `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`.

## Unblocked Sequence

Execute only `ready now` items. Do not claim or touch files locked by another active lane. If work overlaps locked files, split independent unlocked work or defer with the blocking task named. If everything is blocked, stop with the recommended next unblock action.

## Recheck Before Claim

Rerun lane status immediately before claiming or editing. If locks changed, resequence instead of using stale assumptions.

Objective examples:

- Good: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`
- Bad: `Objective: finish the feature.`

Useful examples:

```text
$fb-lane
Split this across Product, Tech, Design, and Business.
Workstreams should write markdown plans/handoffs and return to Product.
Product should launch BFM when execution is approved.
Product should sequence the final integration and tell me what is ready to merge.
Product and normal workstream threads should not edit source directly.

$fb-product what is ready to merge?
$fb-design improve the prep-screen icons.
$fb-tech check whether this auth flow is safe.
$fb-business rewrite the onboarding copy.
```

## Start Of Work

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, `docs/handoffs/index.md` if present, relevant `docs/workstreams/<lane>.md` cards if present, and `.codex/current_task.md` if present.
2. Run or request FB-Lane status:
   - MCP: call `fb_lane_status` with `workspacePath` set to the active repo root when needed.
   - CLI fallback: `node tools/fb-lane.cjs status`.
3. If setup looks suspect, run `node tools/fb-lane.cjs doctor` before claiming work.
4. Identify whether the user is asking Product to orchestrate lanes or directly addressing lane threads.
5. Before any ordinary workstream output, keep changes to markdown plans/handoffs. Source writes, file claims, branches, commits, submits, merges, deploys, and provider changes happen only inside Product-launched BFM execution.
6. If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, confirm whether to prepare the Product/BFM handoff or execute there as an explicit one-off exception before editing source.
6. For non-trivial work, confirm the task detail block has one approved `Goal Alignment Session` block in `PROJECT_BOARD.md` with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval`, and `Justification`. Product/BFM writes or changes that block only after explicit user approval; `/goal` is only a Product/BFM shortcut into that same session. Worker lanes do not own `/goal`; they report missing, unclear, or misaligned OKRs in handoffs.
7. Keep lane handoffs compact and include a real Markdown heading so `doctor` can validate it:
   ```md
   ## Goal Alignment Session

   Product Goal: <existing approved Product/workstream goal, if known>
   Workstream Goal: <plain-language lane contribution for Product/user approval>
   Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
   User Approval Needed: yes | no
   Mini-loop Evidence: <lane evidence from its smallest real verification loop>
   Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
   ```
8. Product/BFM reconciles those fields before sequencing execution or merge. If a handoff conflicts with approved OKRs, BFM proposes aligned alternatives for approach, scope, or sequence and recommends one; it does not dynamically create or edit OKRs during execution.
9. After Product/BFM executes or explicitly defers a lane handoff, refresh the relevant `docs/workstreams/<lane>.md` card.
10. Do not modify files locked by another active lane.

## Handoff Lookup

Use progressive disclosure. `PROJECT_BOARD.md` stays the source of truth for current status, ownership, sequencing, gates, and file locks. `docs/handoffs/index.md` is routing, and detailed handoffs are detail. Read or refresh the index before opening detailed handoffs, then open only the files relevant to the active task unless Product/BFM is doing a full closeout audit.

Before non-quick Product/BFM sequencing, create or refresh the index when handoffs exist and the lookup layer is missing, stale, or too vague. Keep the index compact with `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`. Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.

For lane revisit UX, read `docs/workstreams/<lane>.md` after the board and handoff index. The card is a summary only and should contain `Last Updated`, `Lane`, `Current Summary`, `Already Executed By Product/BFM`, `Still Pending / Blocked`, and `Evidence Links`.

## Direct Lane Prompt Convention

Treat prompts like these as lane routing instructions:

```text
$fb-design create prep-screen icon options.
$fb-tech check whether the auth flow is safe.
$fb-business rewrite onboarding copy.
$fb-product decide whether this should go to staging.
```

Codex may discuss safe independent pieces concurrently. Product/Captain remains responsible for sequencing, conflict resolution, BFM launch, staging decisions, and final merge. Individual workstream threads remain responsible for their plans, evidence, handoffs, and closeout; BFM execution workers handle claims, source changes, verification, and submit steps.

## Handoff Rule

Any non-trivial lane output must create or update `docs/handoffs/<TASK-ID>.md` with:

- task ID and scope
- `## Goal Alignment Session` with `Product Goal`, `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` from `AGENTS.md`
- files changed in BFM execution or proposed by workstream planning
- checks performed
- decisions and tradeoffs
- risks, blockers, and dependencies
- next owner

Product must read handoffs before integration.

## Return-Loop Rule

When the user says "run BFM" or "process all lane handoffs", Product must not close until every discovered handoff has one explicit status: `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`.
Product must also show the five-lane ledger in the chat stream so missing FB-Business, FB-Design, FB-Product, FB-Tech, or FB-Lane handoffs are visible rather than silently skipped.

Return checks are mandatory for non-trivial handoff execution:

- after handoff intake, return to `PROJECT_BOARD.md`;
- after coding, return to the handoff contracts;
- after tests, return to source, docs, and board;
- after board/doc updates, return to lane status;
- after commit/push, return to `git status` and name whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty.

Close only when board, source, docs, and tests agree, or the disagreement is explicitly recorded.
If repo state is intentionally dirty at closeout, record exact files, owner, reason, next gate, and session-boundary action in `PROJECT_BOARD.md`. At the next session boundary, Product/BFM must continue that exact task, commit it, revert it, archive it into a handoff, or mark it `blocked`/`deferred` before starting new source work.
Add one loop health flag at closeout: `healthy`, `watch`, `needs Product review`, or `blocked`. Use this instead of numeric loop scoring.
Add `Loop Learning` at closeout: feedback captured, repeated pattern (`no|yes`), tooling needed (`none|propose guardrail|propose automation|propose eval`), and Product approval needed (`no|yes`).

## Proactive Loop Hardening

Product/BFM should proactively propose loop hardening when it sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework. Propose one small guardrail at a time with the observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed. Do not silently change the process; skip one-off or low-impact issues.
Use `Loop Learning` as the escalation trigger. Choose `none` for one-off friction, `propose guardrail` for repeated process misses, `propose automation` for repeated manual checks, and `propose eval` for repeated agent-behavior failures.

When it chooses `propose eval`, propose a small Markdown scorecard under `docs/evals/` using the generic sections from `docs/evals/agent-behavior-scorecard-template.md`. Do not create an eval runner, dashboard, numeric score, CI eval job, or larger `doctor` rule unless that heavier option is separately approved.

Approval autonomy is phased. Product/BFM starts with Shadow Approval, may recommend Phase 2 after one day or three matching decisions with no material miss, and may recommend Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate. The user approves phase changes. Workstreams may mark `safe to auto-accept`, but Product/BFM owns actual self-approval and never self-approves risky surfaces.

Once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. It still stops for hard gates such as live deploy, secrets, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence needing risk acceptance, or an explicit pause.

## Product Completion Audit

Product/Captain must report lane status with separate evidence buckets:

- delivered work present
- lane-specific verification passed with named evidence
- required lane gate pending
- blocked
- superseded

Do not collapse those into a generic "executed" or "done" label. A lane can deliver work while its required gate remains pending: Tech may still lack tests, Design may still lack screenshot/viewport evidence, Business may still need copy approval or integration, and Product may still need staging/release evidence. Product must state that distinction clearly before merge or staging recommendations.
Product must also state the loop health flag so directional misses are visible without turning the loop into a scorecard.

## Finish

End by updating `PROJECT_BOARD.md` with status, modified files, checks, links, risks, and next owner. Use Product/Captain as the final endpoint for multi-lane work.
