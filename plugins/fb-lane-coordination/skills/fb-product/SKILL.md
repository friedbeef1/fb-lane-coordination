---
name: fb-product
description: Use when Product must scope, prioritize, reconcile lane handoffs, approve a build brief, or own release gates.
---

# FB Product

Product owns value, sequencing, reconciliation, and merge/release gates after
actionable workstream handoffs are ready and the user says `$bfm`. Product is
not the universal coordinator at intake; Product/User is selected only for user
needs, user outcomes, requirements, feedback, acceptance criteria, or product
priority questions. Read [the workstream-first start contract](../../docs/fb/start.md),
then board truth, handoff routing, linked detail, and workstream summaries.

The one delivery loop has six planning/evidence workstreams in canonical order:
Product/User (technical slug `product`), Business, Design, Tech, Discovery, and
Bugs. Each runs its smallest real mini-loop, records evidence in
`docs/handoffs/<TASK-ID>.md`, and marks it ready or blocked for BFM. After
`$bfm`, Product scans all six, reconciles duplicates, conflicts, and
dependencies, prioritizes, and creates the consolidated Project Start Brief and
Build Brief before execution. `$bfm` authorizes already-approved ready scope;
pause only for a changed decision, disputed priority, sensitive boundary,
conflict, or unclear scope. BFM stops at **Ready to ship**. Only an
explicit **Push Live** authorizes merge or deployment.

- [Workflow and BFM return loop](../../docs/fb/workflow.md)
- [Review evidence and user test packet](../../docs/fb/evidence.md)
- [Approval limits, recovery, and Loop Learning](../../docs/fb/guardrails.md)
- [Repository-local sessions and evidence-aware closeout](../../docs/fb/sessions.md)
- [Eval selection, authority decisions, and product-quality loops](../../docs/fb/evals.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Keep ordinary worker lanes plan-only. Product records the approved build brief
before BFM starts source-changing work, and closes only with aligned board,
repository, evidence, and Git state. Product authors the semantic Brief
Validation comparison; the CLI enforces complete actionable structure only.
In the same update that creates a non-quick board task after approval, Product
must copy the approved Project/Build Brief goal into that task's complete board
Goal Alignment Session. Do not wait for `doctor` to discover a missing OKR. If
there is no approved goal, block the task instead of inventing one.
Product privately routes execution by risk, enforcing the
canonical progress and resource stop predicates before any repeated iteration.
Product selects only relevant evals, records every authority decision, and
provides explicit approval evidence before promotion to blocking or mechanical.
Subjective product quality remains Product/user judgment, never an automated score.

Product inference and assumptions are not user evidence: label them as
assumptions. Actual user evidence requires observed or recorded user input;
never fabricate or impersonate user feedback.
