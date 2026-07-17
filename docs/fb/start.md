# Start an FB objective

FB uses the smallest mode that fits the work. Simple work stays direct;
coordinated work is planned before any source-changing execution begins.

## Choose the mode

### Simple task

Example: change one label in one file with no shared locks or durable handoff.

This is a simple task, so I’ll handle it directly without lanes or a build brief.

### Coordinated planning

Example: plan a creator-commerce launch that needs Product, copy, and technical
questions reconciled before anyone changes source.

FB will prepare the plan first. It is not building yet.

### Approved Build For Me

Example: the user has approved the reconciled plan and explicitly invoked
`$bfm` for the bounded implementation.

Build For Me (BFM) will now build and check the approved plan.

## Terms in plain language

- **Lane:** a focused planning view, such as Product, Tech, Design, or Business.
- **Handoff:** the durable note that passes decisions, scope, and evidence to the next owner.
- **Build For Me (BFM):** the execution mode used only after approval and explicit `$bfm`.
- **Gate:** a required approval, review, or check before work moves forward.
- **Quality Gap:** the recorded difference between the approved target and the result that was checked.

## Project Start Brief

For a first project or new non-trivial objective, Product presents exactly this
visible brief before requesting lane output or clarification questions:

- **What you asked for:** <plain-language outcome>
- **Your decisions:** <choices already made>
- **Assumptions to confirm:** <only assumptions that could change the plan>
- **What FB will plan:** <bounded planning work>
- **Out of scope:** <explicit exclusions>
- **Success looks like:** <observable outcome and review evidence>
- **Next action:** <one immediate Product action or user decision>

## Clarifications

Name each selected lane, its distinct question, and the decision or risk its
answer changes. Also write `Skipped lanes: <lanes and reason>`. Every
clarification includes **Why this matters**, a **Recommended default**, and
**What changes if you choose differently**.

## How FB works

1. Lanes investigate and plan different parts.
2. Product combines findings into one build brief.
3. You approve the brief.
4. Only after explicit `$bfm`, BFM builds and checks it.

After approval and explicit `$bfm`, say:

Build For Me (BFM) will now build and check the approved plan.

## Progress and pauses

- **Progress:** Understanding your idea → Ready for your approval → Building → Checking → Complete
- **Blocked:** Blocked — <reason> / next action

## Internal planning details

The visible brief stays concise. Product records goal alignment, approval,
locks, sequencing, and visual-preview decisions through [workflow.md](workflow.md).
Eval selection, authority, evidence types, judgment boundaries, and Quality Gap
closure live in [evals.md](evals.md). Ordinary lanes remain plan-only until the
explicit Build For Me boundary is cleared.
