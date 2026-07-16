# Start an FB objective

For a first project or new non-trivial objective, Product presents this brief
before requesting lane output or clarification questions:

## Project Start Brief

- **What you asked for:** <plain-language outcome>
- **Your decisions:** <choices already made>
- **Assumptions to confirm:** <only assumptions that could change the plan>
- **What FB will plan:** <bounded planning work>
- **Out of scope:** <explicit exclusions>
- **Success looks like:** <observable outcome>
- **Progress:** Understanding your idea → Ready for your approval → Building → Checking → Complete
- **Blocked:** Blocked — <reason> / next action
- **Next action:** <one immediate Product action or user decision>

## How FB works

1. **Lanes plan:** Product selects only relevant lanes; each answers a distinct question.
2. **Product prepares:** Product reconciles the lane plans into one build brief and recommends a path.
3. **You approve:** Product asks for approval of that build brief before any build starts.
4. **BFM builds:** Only after explicit `$bfm` does BFM execute the approved build brief.

Name each selected lane, its distinct question, and the decision or risk its
answer changes. Also write `Skipped lanes: <lanes and reason>`. Every
clarification includes **Why this matters**, a **Recommended default**, and
**What changes if you choose differently**.

## Approval boundary

For non-trivial work, Product owns one approved Goal Alignment Session on the
board: `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`,
`Approval`, and `Justification`. Each relevant lane handoff has a compact
`## Goal Alignment Session` with:

```md
Product Goal: <existing approved Product/workstream goal, if known>
Workstream Goal: <plain-language lane contribution for Product/user approval>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <smallest real verification evidence>
Evidence Against Product OKR: <weakening/blocking evidence> | None identified
```

Worker lanes return that evidence against the existing goal; they do not create
a new OKR for every task. `/goal` is only a Product/BFM shortcut into this same
session. Quick `TASK-Q-*` work may skip this extra ceremony.

Before source-changing work, Product records the build brief and approval.
Ordinary lane chats are plan-only; BFM is the execution mode after Product has
cleared the approval gate. See [workflow.md](workflow.md).

## Visual Preview Decision

For a user-visible UI plan, record `browser screenshot/mockup`, `imagegen
asset/style option`, or `skip with reason`. Skip only for non-visual work or a
tiny copy, spacing, or single-control change. Attach a feasible material visual
preview before BFM source execution; Product/BFM blocks or asks only when that
material decision lacks a preview.
