# Start an FB objective

Describe the objective or question. Whenever planning or evidence would help,
start in whichever of the six workstreams matches the question. FB selects the
useful path; users do not choose an execution mode at intake.

## The six workstreams

- **Product/User:** selected only for user needs, user outcomes, requirements, feedback, acceptance criteria, or product priority questions. It is not the universal coordinator at intake.
- **Business:** market, positioning, pricing, distribution, and commercial risks.
- **Design:** flows, interaction, accessibility, information design, and visual quality.
- **Tech:** architecture, feasibility, security, performance, and integrations.
- **Discovery:** unknowns, research, experiments, and decision-changing evidence.
- **Bugs:** reproduction, severity, affected users, and regression evidence.

Each relevant workstream uses the same mini-loop: **Question → Investigate →
Gather evidence → Recommend → Create ready handoff MD**. A workstream that is
not relevant does no manufactured work. Record **None relevant** only when a six-workstream scan or report requires a disposition for every workstream.

## First bootstrap

After repository bootstrap, FB introduces itself and asks once for permission
to create six repository-scoped Codex sidebar tasks. These are durable entry
points for Product/User, Business, Design, Tech, Discovery, and Bugs—not six
mandatory agents or approval gates.

With permission, FB detects exact current and legacy workstream tasks and
creates only missing ones. A legacy four-task project gains Discovery and Bugs;
a current six-task project gains nothing. New tasks start idle with their
workstream question and do no investigation, source editing, or handoff work
until the user asks them something.

If Codex does not expose project/task creation tools—or cannot obtain a
complete repository-scoped task list—FB says so and provides paste-ready
prompts for manual task creation. It never guesses that a task is missing or
implies that sidebar tasks exist without tool evidence. Declining setup does
not disable FB.

## The single public sequence

1. FB starts in whichever workstream or workstreams match the question.
2. Each relevant workstream investigates and creates a ready handoff MD.
3. When the actionable ready handoffs are assembled, the user says `$bfm`.
4. `$bfm` activates Product reconciliation. Product must scan all six workstreams, reconcile duplicates, conflicts, and dependencies, prioritize the ready scope, and create the consolidated Project Start Brief and Build Brief as the durable record before source execution.
5. `$bfm` authorizes execution of already-approved ready scope. Product pauses for the user only when reconciliation reveals a changed decision, disputed priority, sensitive boundary, conflict, or unclear scope.
6. BFM implements and verifies the reconciled scope, then stops at **Ready to ship**. Only **Push Live** authorizes release, merge, or deployment.

`$bfm` remains the supported invocation. If a user types `/bfm`, FB may
interpret that as intent to run `$bfm`; `/bfm` is not a separate installed
command.

## Terms in plain language

- **Workstream:** a focused planning and evidence view.
- **Handoff:** the durable note that passes decisions, scope, and evidence to the next owner.
- **Build For Me (BFM):** the post-handoff reconciliation and execution boundary activated by `$bfm`.
- **Gate:** a required approval, review, or check before work moves forward.
- **Quality Gap:** the recorded difference between the approved target and the result that was checked.

## Project Start Brief

During Product reconciliation after ready handoffs and `$bfm`, Product creates
this visible seven-field brief together with the Build Brief:

- **What you asked for:** <plain-language outcome>
- **Your decisions:** <choices already made>
- **Assumptions to confirm:** <only assumptions that could change the plan>
- **What FB will plan:** <bounded planning work>
- **Out of scope:** <explicit exclusions>
- **Success looks like:** <observable outcome and review evidence>
- **Next action:** <one immediate Product action or user decision>

## Clarifications

Each relevant workstream names its distinct question and the decision or risk
its answer changes. Every clarification includes **Why this matters**, a
**Recommended default**, and **What changes if you choose differently**.
Product asks again after `$bfm` only for a changed decision, disputed priority,
sensitive boundary, conflict, or unclear scope found during reconciliation.

## Progress and pauses

- **Progress:** Investigating → Handoffs ready → Reconciling → Building → Checking → Ready to ship
- **Blocked:** Blocked — <reason> / next action

## Internal planning details

The public flow above stays singular. FB may classify and route work internally
to enforce risk, lock, review, and verification budgets, but it does not ask the
user to select those routes. Product records goal alignment, approval, locks,
sequencing, and visual-preview decisions through [workflow.md](workflow.md).
Eval selection, authority, evidence types, judgment boundaries, and Quality Gap
closure live in [evals.md](evals.md).
