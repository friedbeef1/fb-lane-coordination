# FB Beginner Clarity and Status Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FB explain its mode, progress, pauses, and next action in language an everyday non-technical user can understand while preserving the existing coordination engine.

**Architecture:** Keep all current board, handoff, session, eval, status-enum, and technical identifiers intact. Add a beginner-facing presentation layer to the canonical harness, skills, bootstrap output, CLI status command, and MCP status tool; retain the existing raw status table behind an explicit details flag.

**Tech Stack:** CommonJS Node.js CLI/MCP server, Markdown harness and skills, repository-local test scripts.

## Global Constraints

- Public product name remains `FB`; never expand it to `Fried Beef`.
- `BFM` means exactly `Build For Me`; active beginner-facing surfaces must not say `Build Flow Manager`.
- Technical identifiers and paths remain unchanged, including `fb-lane`, `fb-lane-coordination`, `$bfm`, MCP names, board enum values, session records, and eval records.
- Ordinary tiny work stays ordinary Codex work; coordinated planning does not imply building; source execution begins only after explicit `$bfm` approval.
- Default status output is beginner-facing; `status --details` and `fb_lane_status({details:true})` preserve the raw technical view.
- Internal `Staging QA` remains an enum but means a candidate awaiting verification; the actual environment is recorded separately.
- No popup, wizard, dashboard, persistent tutorial, autonomous judge, semantic scorer, release, publication, merge, deployment, plugin install, or consumer-repository change.
- New judgment-based eval scenarios start in `shadow`; no authority promotion occurs in this task.

---

### Task 1: Beginner interaction contract and terminology

**Files:**
- Modify: `docs/fb/start.md`
- Modify: `docs/fb/workflow.md`
- Modify: `docs/fb/evidence.md`
- Modify: `docs/fb/README.md`
- Modify: `README.md`
- Modify: `FAQ.md`
- Modify: `platforms/codex/README.md`
- Modify: `plugins/fb-lane-coordination/README.md`
- Modify: relevant root/package `skills/**/SKILL.md`
- Modify: `tools/fb-lane.cjs`
- Modify: `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Modify: `examples/my-app/AGENTS.md`
- Test: `tools/fb-lane.test.cjs`
- Test: `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`

**Interfaces:**
- Consumes: the existing canonical harness pack and bootstrap-managed route behavior.
- Produces: one beginner-facing mode/first-project/build-boundary contract shared by root, package, and generated projects.

- [ ] **Step 1: Write failing contract tests**

Add root/package assertions that require:

```text
This is a simple task, so I’ll handle it directly without lanes or a build brief.
FB will prepare the plan first. It is not building yet.
Build For Me (BFM) will now build and check the approved plan.
```

Also require the seven-field visible Project Start Brief, inline definitions for lane/handoff/BFM/gate/Quality Gap, three mode examples, preserved clarification format, and absence of active beginner-facing `Build Flow Manager`. Assert the stale inline `firstProjectContract` is absent and fresh bootstrap copies the contract.

- [ ] **Step 2: Run the focused tests and verify RED**

Run `node tools/fb-lane.test.cjs` and the packaged mirror. Expected: failure because the approved beginner contract and terminology are not yet present.

- [ ] **Step 3: Implement the canonical beginner contract**

Make `docs/fb/start.md` the sole first-project source. Put advanced eval/OKR/authority mechanics behind links to the internal workflow/eval pages instead of inside the visible brief. Add the ordinary-task sentence, planning-first sentence, plain definitions, three examples, seven visible brief fields, clarification format, and exact post-approval Build For Me sentence.

- [ ] **Step 4: Align active entry points and bootstrap**

Link or restate the concise contract in active public docs, root/package coordination/Product/BFM/setup skills, generated managed routes, and `examples/my-app/AGENTS.md`. Remove the unused inline `firstProjectContract` variable from both CLI mirrors. Preserve project-owned content during bootstrap.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run both mirrored CLI tests and confirm all checks pass with root/package source and test parity.

- [ ] **Step 6: Commit**

Commit the independently testable beginner-contract slice.

### Task 2: Beginner-facing status card

**Files:**
- Modify: `tools/fb-lane.cjs`
- Modify: `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Modify: `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`
- Modify: `docs/fb/workflow.md`
- Modify: `docs/fb/evidence.md`

**Interfaces:**
- Consumes: parsed board tasks, session records, `.codex/current_task.md`, and existing raw status output.
- Produces: default beginner status card plus raw technical details opt-in for CLI and MCP.

- [ ] **Step 1: Write failing status fixtures**

Cover active-session precedence, current-task fallback, highest-priority incomplete board fallback, and these mappings:

```text
intake/planning -> Understanding
approved/waiting -> Ready for your approval
execution -> Building
verification/local/staged -> Checking or Ready for review
closed -> Complete
genuine inability -> Blocked
```

Require fields for current objective, working mode, visible stage, completed work, pause reason, user input, next action/owner, and test/review link. Require default output to hide locks, authority, gates, and `Staging QA`; require `status --details` and MCP `details: true` to retain the current technical table.

- [ ] **Step 2: Run focused tests and verify RED**

Run the root CLI test. Expected: failure because status currently prints only the raw table and the MCP schema has no details flag.

- [ ] **Step 3: Implement status resolution and rendering**

Add small pure helpers for task selection, visible-stage mapping, beginner card rendering, and detail rendering. Extend parsed task detail only as needed for approved state, updates, blockers, links, and next owner/action. Make CLI and MCP use the same renderer and add an optional boolean MCP `details` property.

- [ ] **Step 4: Correct Staging QA semantics**

Change active generated/documented status definitions to say `Staging QA` is a candidate awaiting verification and that local, sandbox, staging, or completed-build environment is recorded separately. Do not rename or migrate the enum.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run root/package CLI tests, syntax checks, and source/test parity.

- [ ] **Step 6: Commit**

Commit the independently testable status slice.

### Task 3: Pause cards, shadow evals, and integrated verification

**Files:**
- Modify: `docs/fb/guardrails.md`
- Modify: `docs/fb/evals.md`
- Modify: `plugins/fb-lane-coordination/docs/fb/guardrails.md`
- Modify: `plugins/fb-lane-coordination/docs/fb/evals.md`
- Modify: relevant root/package skills and tests
- Create or modify: focused beginner-experience smoke fixtures under `tools/`

**Interfaces:**
- Consumes: beginner contract and status renderer from Tasks 1-2.
- Produces: one standard pause card, three shadow eval scenarios, and end-to-end beginner evidence.

- [ ] **Step 1: Write failing pause/eval smoke tests**

Require this visible structure for approval wait, recovery, locks, missing review access, and external-only action:

```text
Paused here

Why:
What FB already tried:
What can continue safely:
What I need from you:
Next action and owner:
What happens after:
```

Approval must read `Waiting for your approval`, not `Blocked`. Add shadow scenarios for beginner mode selection, status clarity, and stop/recovery clarity.

- [ ] **Step 2: Run focused tests and verify RED**

Run the new/extended focused smoke and confirm it fails on missing pause/eval requirements.

- [ ] **Step 3: Implement pause and eval guidance**

Put the canonical pause card in `docs/fb/guardrails.md`, route relevant skills to it, and add the three scenarios to `docs/fb/evals.md` as `shadow`. Keep internal evidence available in durable records while hiding it from beginner updates unless the user must judge it.

- [ ] **Step 4: Run the three onboarding smokes**

Verify tiny rename uses ordinary Codex; creator-commerce begins with planning and the seven-field brief; approved multi-surface work transitions through `$bfm` with the exact Build For Me sentence. Verify all review requests include direct links and step-by-step Test This Now evidence.

- [ ] **Step 5: Run the complete local gate**

Run root/package CLI, session, eval, recovery, validator, doctor, syntax, pack/source/test parity, bootstrap migration, creator-commerce, and whitespace checks.

- [ ] **Step 6: Independent reviews and closeout commit**

Obtain task-scoped spec/quality review for each slice and one whole-branch review. Fix and re-review all Critical/Important findings. Update TASK-024 board, handoff, index, current-task record, and Product card with exact evidence. Stop before merge, push, publication, install, or release.
