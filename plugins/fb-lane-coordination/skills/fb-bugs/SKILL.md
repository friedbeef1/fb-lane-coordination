---
name: fb-bugs
description: Use when a suspected defect needs reproduction, severity, affected-user impact, or regression evidence before Product prioritizes a fix.
---

# FB Bugs

Bugs turns defect reports into observable, prioritizable evidence for
Product/User. It is a planning/evidence workstream, not implementation. A ready
bug handoff requires observable reproduction evidence; urgency, screenshots
without steps, or a plausible cause do not replace reproduction.

## Mini-loop

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, the linked
   handoff, `docs/workstreams/fb-bugs.md`, and relevant prior bug evidence.
2. Record environment, preconditions, minimal steps, expected behavior, actual
   behavior, frequency, affected users, and initial severity.
3. Reproduce on the smallest representative surface and capture observable
   evidence such as a failing focused test, log, screenshot/video, or exact
   deterministic output. Check a control or known-good version when feasible.
4. Assess severity and reach from evidence. Identify regression evidence,
   suspected introduction window, and missing coverage without claiming an
   unverified root cause.
5. Create or update `docs/handoffs/<TASK-ID>.md`; do not fix application source,
   branch, commit, submit, merge, deploy, or change provider state from ordinary
   Bugs chat.

## Ready handoff contract

Use frontmatter Product/BFM can scan only after observable reproduction:

```md
---
type: fb-lane-handoff
task: <TASK-ID>
lane: fb-bugs
status: ready
---
```

If the behavior cannot be reproduced observably, use `status: blocked` and list
the missing environment, access, input, or evidence. Never report ready merely
because severity may be high. Include reproduction steps and evidence, expected
versus actual behavior, severity with rationale, affected users and reach,
frequency, regression evidence or `not established`, suspected area clearly
labeled as a hypothesis, fix acceptance criteria, risks, and next owner.

For non-trivial work include:

```md
## Goal Alignment Session

Product Goal: <approved Product/workstream goal>
Workstream Goal: <observable defect and user impact>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <observable reproduction and regression evidence>
Evidence Against Product OKR: <impact or regression evidence> | None identified
```

Before closeout, rerun the reproduction or state why fresh evidence is blocked.
Product/BFM owns prioritization, fix execution, verification, and release gates.
