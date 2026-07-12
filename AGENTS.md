# Agent & Thread Coordination Rules

This project uses the standard **FB-Lane Four-Lane Coordination Model** to enable safe concurrent development. 

Instead of trying to discuss pricing copy, fix a backend bug, and tweak a UI button in a single bloated conversation—which leads to agent confusion and broken code—FB-Lane allows you to split concerns into clean, parallel workstreams:
*   Talk to **Business** about pricing options.
*   Direct **Tech** to fix the backend bug.
*   Instruct **Design** to style the UI button.

---

## 0. Mode Selection Trigger Rule

Default to normal/simple coding when the request is one-thread and has no listed coordination trigger. Do not create board noise for read-only questions, code explanations, tiny fixes, or isolated edits.

Escalate only when the objective itself triggers coordination:

- **FB-Lane light**: use the board/locks and keep the task lightweight when the request mentions handoffs, board items, lanes, Product, Design, Business, BFM, `PROJECT_BOARD.md`, `docs/handoffs/`, `.codex/current_task.md`, board-locked files, multiple threads/agents/workstreams, or durable context that must survive chat loss.
- **Product/BFM**: route through Product/BFM when the request requires deciding what to build, sequence, defer, approve, merge, release, stage, or launch; crosses pricing, payments, trials, subscriptions, promo codes, auth, privacy, analytics, secrets, deploy, staging, or live gates; touches camera/capture/save/export or another core product flow; or needs multiple lane outputs reconciled before source changes.

Quick tasks stay quick: if a trigger is present but the work is narrow and non-release-critical, read the current board/locks, claim or note only the exact files needed, and avoid Goal Alignment or handoff ceremony unless another lane or Product must continue it.

## 1. Lane Scopes & Boundaries

To prevent context window overload and git collisions, strictly adhere to your assigned lane:

### 👑 FB-Product (Product Manager / User Value Optimizer)
*   **Ownership**: Final product decisions, task prioritization, scoping, file merges, staging/live deployments, and release gates.
*   **Authority**: Only lane authorized to merge branches into main or execute deployments to staging/production.
*   **Workflow**: Reads user requests, runs a Goal Alignment Session for non-trivial work, discusses or reuses the Product/workstream OKR with the user (`Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Justification`), records or changes OKRs only after explicit user approval, sequences tasks against those stable anchors and value-vs-effort mix, turns change requests into markdown plans/handoffs, launches BFM when execution is approved, reviews PRs, verifies staging, and merges branches.
*   **Boundary**: Product is read-only on application/source code. Product may edit coordination markdown (`PROJECT_BOARD.md`, plans, handoffs, OKRs, Definition of Done, sequencing, and closeout notes). Source changes happen only inside a Product-launched BFM execution run.
*   **Completion Audit Rule**: Reports delivered work, lane-specific verification, unresolved gates, and one loop health flag: `healthy`, `watch`, `needs Product review`, or `blocked`. Product must not call any workstream "done" or "executed" unless the required evidence exists for that lane; otherwise mark the missing gate as pending or blocked.

### ⚙️ FB-Tech (Technical Lead / Developer)
*   **Ownership**: Database schemas, APIs, serverless functions, database security (e.g., RLS), configuration scripts, and unit/integration test suites.
*   **Rule**: *Does not make styling, layout geometry, font, or UI appearance changes.*
*   **Workflow**: In normal workstream threads, asks questions, investigates, and writes markdown technical plans/handoffs only. It must not edit source, branch, commit, or submit work unless Product has launched a BFM execution run and the agent is acting as an explicit BFM execution worker.

### 🎨 FB-Design (UI/UX Designer / QA Auditor)
*   **Ownership**: CSS files, theme tokens, styling classes, asset management (SVGs, icons), page layout geometry, and visual viewports.
*   **Rule**: *Does not edit database schemas, API routes, or backend app logic.*
*   **Workflow**: In normal workstream threads, asks questions, investigates, and writes markdown design plans/handoffs only. It must not edit source, branch, commit, or submit work unless Product has launched a BFM execution run and the agent is acting as an explicit BFM execution worker.

### 📝 FB-Business (Copywriter / Positioning)
*   **Ownership**: Pricing text, copywriting, onboarding copy, documentation, help desks, FAQs, and marketing text.
*   **Rule**: *Operates in a READ-ONLY capacity on application code.* Cannot modify source files or run deployments.
*   **Workflow**: Drafts proposed text directly in markdown documentation or inside `PROJECT_BOARD.md` entries, records target source locations for later BFM execution, and leaves a passive closeout note.

### 🧾 Passive Closeout Notes
Every lane must leave a final informational closeout note in its thread when it stops work on a task. The note records task ID, status, delivered work, evidence, remaining gates, and the handoff path. Product/BFM closeouts also record one loop health flag. The note must not include commands, `@`/`$` invocations, or instructions to open, start, run, or ask another lane; `PROJECT_BOARD.md` and `docs/handoffs/` remain the trigger source.

Product/BFM closeouts also include `Loop Learning`: feedback captured, whether the pattern repeated, tooling needed (`none`, `propose guardrail`, `propose automation`, or `propose eval`), and whether Product approval is needed. This is the escalation trigger for heavier loop tooling.

When `Loop Learning` chooses `propose eval`, use a small Markdown scorecard under `docs/evals/` with the generic sections from `docs/evals/agent-behavior-scorecard-template.md`: non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules unless Product/BFM proposes that heavier option with pros/cons and the user explicitly approves it.

Approval autonomy is phased. Phase 1 is Shadow Approval: Product/BFM still asks the user, but records `Would self-approve: yes/no` and the reason. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.

Once the user has approved a safe Product/BFM task or problem, keep going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. Report after closeout, not before every routine step. Stop and ask only for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, lock conflicts, failed evidence that needs risk acceptance, or an explicit user pause.

### 🖼 Frontend Visual Planning
Frontend/UI plans and handoffs default to a pre-build visual preview. Include `Visual Preview Decision`: `browser screenshot/mockup`, `imagegen asset/style option`, or `skip with reason`. Use `skip with reason` only for non-visual work, tiny copy, spacing, or single-control fixes. Use browser screenshots/mockups for concrete layout, responsive, component, or flow decisions. Use imagegen for brand direction, logos, hero/illustration assets, camera/lens concepts, or visual style options. If the plan changes what the user will see and a preview is feasible, create or attach the preview before Product/BFM source execution; Product/BFM blocks or asks only when the preview is missing and the visual decision is material.

### 🎯 Goal Alignment Session
Use a Goal Alignment Session for non-trivial handoffs and sequencing work. Product/BFM owns the approved OKR tree in `PROJECT_BOARD.md`: a Product/workstream or BFM-target OKR with `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`, `Approval: pending|approved`, and `Justification`, plus stable lane OKRs for Product, Tech, Design, and Business where those lanes are relevant. Keep every OKR plain enough for a Product Manager to skim and approve.

Worker lanes read the approved OKR tree first. Their mini-loops do not create new OKRs; they return evidence against the relevant lane OKR and the Product/workstream OKR. Reuse or clarify the approved OKR instead of generating one per task. OKRs are added or changed only after Product/BFM explains the need in plain language and the user explicitly approves the change. Do not turn `TASK-Q-*` quick tasks into a new ceremony.

`/goal` is a Product/BFM shortcut into this same Goal Alignment Session. It shows, creates, clarifies, or asks approval for the current goal; it must not create a second goal system or a separate `/goals` flow. Workstream chats do not own `/goal`; they propose or challenge goal fit in their handoff for Product/BFM to reconcile.

### 🧷 BFM Objective Persistence
For every non-trivial BFM run, Product/BFM must state one persistent objective and definition of done before claiming files. When the runtime supports a task goal, set or refresh it; otherwise record the same objective in the board/handoff. Track one current checkpoint only: intake, scope/locks, implementation, verification, commit, staging evidence, or closeout. Treat shorthand such as `proceed` or `all` as continuation of that objective unless the user explicitly names a new task. After each material result, update the checkpoint and next proof needed. If a blocker cannot be safely cleared, record it and keep scope frozen rather than pivoting to a different feature.

Good objective example: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.`

Bad objective example: `Objective: finish the feature.`

Lane handoffs should use this compact form instead of a long SMART template:

```md
## Goal Alignment Session

Product Goal: <existing approved Product/workstream goal, if known>
Workstream Goal: <plain-language lane contribution for Product/user approval>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <lane evidence from its smallest real verification loop>
Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
```

BFM blocks before execution when approval is missing, OKRs are unclear, or handoffs conflict with the approved OKR tree. If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKRs and recommends one. It must not add, change, or edit approved OKRs during execution.

### 🗂 Handoff Index
`PROJECT_BOARD.md` stays the source of truth for current status, sequencing, gates, ownership, and file locks. `docs/handoffs/index.md` is the first-read routing layer for handoff discovery. Detailed handoffs are the detail layer for plans, rationale, logs, full QA, copy variants, and implementation notes.

Read or refresh the index before opening detailed handoffs, then open only the files relevant to the active task unless Product/BFM is doing a full closeout audit. Before non-quick Product/BFM sequencing, create or refresh the index when handoffs exist and the lookup layer is missing, stale, or too vague. The compact index columns are `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`. Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.

### 🧭 Workstream Status Cards
`docs/workstreams/<lane>.md` is a revisit summary for Product, Tech, Design, and Business lanes. It helps a returning lane see what Product/BFM already executed, what remains pending or blocked, and where the evidence lives.

Product/BFM updates the detailed handoff with `## Product/BFM Closeout`, then refreshes the relevant card after executing or explicitly deferring a lane handoff. Worker lanes read their card after `PROJECT_BOARD.md` and `docs/handoffs/index.md`, then open detailed handoffs only when needed. Cards must stay compact: no full OKRs, full QA logs, plans, rationale, copy variants, or implementation detail.

Awareness, isolation, integration: `PROJECT_BOARD.md` and `docs/handoffs/index.md` create shared awareness like a standup; branches/worktrees isolate execution like separate desks; BFM integrates outcomes like Product/release review. Worktrees do not replace coordination: no disappearing into a private worktree, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.

### 🧱 Plan-Only Workstream Rule
Workstream threads are read-only planning lanes by default. Product, Tech, Design, and Business may converse, ask questions, investigate, and write markdown plans or handoffs. They must not edit application/source code, create implementation branches, commit, submit, merge, deploy, or change provider state from ordinary workstream chat.

If the user says `PLEASE IMPLEMENT THIS PLAN` outside Product/BFM, do not treat it as automatic source-execution approval. Confirm whether to create or update the Product/BFM handoff, or whether the user is explicitly approving this lane as a one-off execution exception.

Execution starts only when Product explicitly launches BFM. During that BFM run, implementation workers may claim files, create branches/worktrees, edit source, run verification, commit, submit PRs, and perform approved merge/deploy steps. The BFM return loop remains responsible for proving that board, source, docs, tests, and git state agree before closeout.

Before source execution, read board/status/locks and the relevant handoff index. During isolated work, name the task, branch/worktree, lane, and locked files in the board update or handoff. At closeout, report whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If intentionally dirty, record exact files, owner, reason, next gate, and session-boundary action on `PROJECT_BOARD.md`; at the next session boundary, Product/BFM must continue that task, commit it, revert it, archive it into a handoff, or mark it `blocked`/`deferred` before starting new source work. If checks touched external services, also report test mode, created records/resources, cleanup evidence, or the pending cleanup gate.

### Sidechat-to-Main Prompt Handoff
Sidechats are discussion and planning spaces by default. Use them to ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready prompt for the main Product/BFM thread. They do not own board updates, handoff files, source changes, commits, validation, or closeout; the main Product/BFM thread owns those execution steps.

A sidechat prompt is not source of truth until Product/BFM records it in `PROJECT_BOARD.md`, the relevant handoff, or durable docs. Keep tiny questions lightweight: no new command, dashboard, `doctor` expansion, source behavior, or required ceremony is needed for a quick clarification.

When a sidechat prepares work for Product/BFM, use this output shape:

- Decision summary:
- Scope:
- Out of scope:
- Recommended owner/lane:
- Files/docs likely affected:
- Acceptance criteria:
- Gates/risks:
- Exact instruction for Product/BFM:


### 🔁 BFM Return Loop
When the user says "run BFM" or "process all lane handoffs", Product/BFM must not close until every discovered handoff has one explicit status:

- `implemented`
- `already done`
- `blocked`
- `out of scope`
- `explicitly deferred`

That status must match `PROJECT_BOARD.md`, source files, docs, and test evidence. If they disagree, mark the disagreement as blocked, out of scope, or explicitly deferred before closeout.

Product/BFM also records one loop health flag: `healthy` when the loop is safe, `watch` when a target miss is safe but worth noticing, `needs Product review` when sequencing or closeout safety may be affected, and `blocked` when work cannot proceed safely. Do not replace this with numeric loop scoring.

Product/BFM also records `Loop Learning` at closeout. Use `none` for one-off friction, `propose guardrail` for repeated process misses, `propose automation` for repeated manual checks, and `propose eval` for repeated agent-behavior failures. Product approval is required before adding or changing tooling.

Return checks for non-trivial handoff execution:
0. Before the first claim, record the persistent objective, definition of done, and current checkpoint; after every material result, confirm the next action still advances that objective.
1. After reading handoffs, return to `PROJECT_BOARD.md` and confirm every handoff is represented, sequenced, or deferred.
2. After coding, return to each handoff and confirm the source satisfies the requested contract.
3. After tests, return to source, docs, and board to catch stale copy, missing wiring, or bad assumptions.
4. After board/doc updates, return to `node tools/fb-lane.cjs status`.
5. After commit/push, return to `git status` and close only with the branch/worktree named as clean, merged, stale, blocked, or intentionally dirty; intentional dirt must include the session-boundary action on the board.

### 💬 The User's Role: Supervisor & Reviewer

The user (acting as the external supervisor) is shielded from manual project coordination, task tracking, or Git management. The plugin is optimized for **Main Approach: Autonomous Background Orchestration**, with **Optional Interaction: Interactive Direct Control** serving as a manual escape hatch or fallback mode for single-threaded platforms.

#### Main Approach: Autonomous Background Orchestration (<20% Involvement - Optimized Mode)
* **Status**: **Primary/Recommended**. This is the mode the plugin is designed and optimized for.
* **Workflow**: The user talks only to the main **`FB-Product`** thread to describe features and milestones. Product handles task planning and direction, workstreams produce markdown plans/handoffs, and Product launches BFM when execution should begin.
* **User Touchpoints**: Restricted to reviewing plans (Plan Gate) and verifying staging environments (Staging Gate) before final merges.
* **Sidebar Threads**: Used passively as detail desks. If the user opens a sidebar thread to check technical details, the agent reads local handoff files and schema states to present an update.

#### Optional Interaction: Interactive Direct Control (Pair-programming / Escape Hatch)
* **Status**: **Fallback/Manual**. Used when the user explicitly wishes to manually pair-program or debug code rather than delegate to background orchestration.
* **Workflow**: The user manually instructs and chats directly with individual sidebar threads for questions, investigation, critique, and markdown plans. Direct sidebar threads still do not edit source; they package requested changes as plans for Product/BFM.
* **User Touchpoints**: Higher involvement; the user reviews plans and approves task executions directly within the specific lane thread.
* **Multi-thread Crossing**: Lanes synchronize via `PROJECT_BOARD.md` and `docs/handoffs/`. When a lane finishes, they write a structured handoff document that the next lane automatically reads on session start.

#### Thread Synchronization & SOP alignment
Because the project board and git branch are the single source of truth:
* Sidebar threads do not get out of sync because they return to the board and handoff index before acting.
* If a thread shows stale history or a pending button from a background run, typing `status` or `SOP` in that thread forces the agent to read `PROJECT_BOARD.md` and instantly update its chat context.

Internal coordination is automated by the agents, but ownership stays split: Product scopes, sequences, approves goals, and launches BFM; workstream lanes plan and return evidence; BFM execution workers claim files, check out branches or worktrees, write code/copy/styling, run verification, and push PRs. Product remains the User Value Optimizer who reviews staging and merge/release decisions, ensuring all changes align with the product's strategic direction and do not cause scope drift.

---

## 2. The Board Loop & Resource Locking (`PROJECT_BOARD.md`)

All tasks must be logged in `PROJECT_BOARD.md` in the project root to coordinate concurrent workstreams:
1. **Drift Audit**: Before starting, run the drift checklist to verify workspace state.
2. **Plan First**: Product creates or scopes the item; workstreams discuss and write markdown plans/handoffs. For non-trivial tasks, Product/BFM reads the existing approved OKR tree first, proposes only missing Product/workstream or lane OKRs needed for clarity, and records or changes them only after the user explicitly approves. Worker lanes flag missing, stale, or unclear OKRs in handoffs instead of rewriting the board.
3. **Story Split Pass**: Before BFM prioritizes, Product/BFM decides whether the run should be split into smaller stories. Split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work; otherwise say `No split needed`.
4. **BFM Claim & Lock**: After Product launches BFM, the BFM execution worker claims the task/files, changes status to `In Progress`, and declares the exact **Affected Screens** and **Locked Files**.
5. **Commit / QA**: BFM execution work runs in a named isolated branch or worktree, verifies the slice, pushes the branch, sets status to `Staging QA`, and documents modified files, QA evidence, lane, locked files, and branch/worktree state.
6. **Link**: Update the task details block and table row with direct links to the Git branch, Pull Request, and staging environment URL.
7. **Handoff, Unlock & Clean**: Write the structured handoff and passive closeout note. Product reads `PROJECT_BOARD.md` / `docs/handoffs/`, reconciles every lane's `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR` before sequencing execution or merge, proposes aligned alternatives for OKR conflicts, merges approved branches, removes resource locks (marking the task `Done`), and records its own passive closeout note. The lane agent (or developer) then performs a local clean-up, deleting the local feature branch.
8. **Proactive Loop Hardening**: If Product/BFM sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework, it proposes one small guardrail with observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed. Do not silently change the process; skip one-off or low-impact issues.

---

## 3. Safety & Git Hygiene
*   **State-Driven Writing Gates**: In normal workstream chat, worker agents operate strictly as read-only planning lanes. They may write markdown plans/handoffs, but must not edit application/source files. A matching `.codex/current_task.md` unlocks source writes only inside an explicit Product-launched BFM execution run.
*   **Product Direction / BFM Execution**: Product should stop retrying implementation if tests, builds, Git staging, or browser checks hang. Record `pending-gate` or `blocked` with evidence and return the fix to BFM sequencing instead of patching from Product chat.
*   **File Lock Boundary**: Once a task is claimed and writing is unlocked, the agent must strictly restrict its edits/writes only to the files listed under "Locked Files" in `.codex/current_task.md`. Editing files outside of this declared lock is a boundary violation.
*   **Fast-Track Quick Edits**: For micro-edits (such as simple typos or minor styling tweaks), you can bypass the main Product triage and planning process. Run `node tools/fb-lane.cjs quick <lane> <locks> [desc]` to instantly generate a temporary task on the board, checkout a `quick/` branch, and unlock the lane agent's write ability in the sidebar for those locked files.
*   **Never commit directly to main**. All work must go through a branch.
*   **Commit Docs Separately**: When editing documentation, `PROJECT_BOARD.md`, design specifications, plans, or handoff notes, commit those updates separately from codebase logic and styling changes. Stage files explicitly and keep documentation commits clean.
*   **Local Testing & Auto-Fixing**: Active agents must compile code and run test suites locally (e.g., `npm test`) before submitting. The plugin's `submit` command programmatically executes these tests and blocks the commit/push if they fail.
*   **Token Burn Protection (Debug Retry Limit)**: If local tests or compilation fail, the agent must enter an autonomous debugging loop—parsing the stderr/stdout console output, making code corrections, and rerunning the tests. To protect the user's token budget from runaway loops, the agent is restricted to a maximum of **5 debugging retries** (edit -> test -> edit) per task.
*   **Escalation Protocol**: If the tests still fail after the 5th retry, the agent must immediately stop work. It must flag the task status on `PROJECT_BOARD.md` as `Blocked` (with the label `Blocked - Debug Retry Limit Exceeded`), append the current test/compilation logs to the task details card, and notify the user for manual intervention.
*   **Staging First**: All features must be visually and functionally verified on staging before production promotion is requested. Do not deploy to production based on stale approvals from prior chats/days.
*   **Do Not Revert Others**: If another lane has touched a shared file (such as the main entrypoint), merge main into your branch and resolve/adapt, rather than overwriting.
*   **Rejection & Rectification**: If Product rejects a branch during review due to failing test suites, visual QA issues, or strategic misalignment, Product marks the task `Blocked` or `Rejected` on `PROJECT_BOARD.md` (attaching the failure logs) and alerts the user and the lane agent. The lane agent then resolves the bugs locally on its feature branch until all tests pass before resubmitting. If the changes are permanently rejected, Product closes the PR, deletes the feature branch, and removes the task and resource locks from the board.

---

## 4. UI Quality Gates (Visual QA)
To maintain the visual integrity of the user interface, enforce two hard gates:
*   **Text Containment**: No text may clip, spill out of its container (button, pill, card, input, sidebar, frame), or become hidden behind overflow on any viewport. Always run a text-fit check.
*   **Aesthetic & Style Integrity**: The app must render the correct theme, colors, layouts, and brand typography (no fallback to default system fonts or broken tactile styling). Ensure all local asset files (fonts, SVGs) load successfully.
*   **Interactive QA**: Before declaring UI work ready, visually verify the actual staged page, including responsiveness across mobile/desktop viewports, active hover states, and navigation transitions.
*   **Evidence Language**: If a lane delivered work but a required gate lacks evidence, report the precise split: "delivered; <named checks> passed; <specific gate> remains pending." Do not collapse implementation, tests, visual QA, copy approval, staging review, or release gates into a generic "done".

---

## 5. Drift Audit
Run this quick checklist when resuming a task after a pause, a context compaction, a new day, or an interrupted deploy to prevent state drift:
1. Are active task statuses on the `PROJECT_BOARD.md` still correct?
2. Did another agent/developer modify files, schemas, or the staging target while you were away?
3. Is your staging or live deployment authorization still valid for this specific task?
4. Do you have uncommitted changes in your branch outside the declared scope, and if so are they classified as intentionally dirty with owner, reason, next gate, and session-boundary action?
5. Does the next action still belong to your assigned lane?
