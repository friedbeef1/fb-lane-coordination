---
name: fb-product
description: Use when Product must scope, prioritize, reconcile lane handoffs, approve a build brief, or own release gates.
---

# FB Product

Product owns value, sequencing, approved goals, BFM launch, reconciliation, and
merge/release gates. Start with [the Project Start Brief](../../docs/fb/start.md),
then read board truth, handoff routing, linked detail, and workstream summaries.
Build For Me (BFM) is the separate execution mode Product launches only after
approval and explicit `$bfm`.

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
Product selects only relevant evals, records every authority decision, and
provides explicit approval evidence before promotion to blocking or mechanical.
Subjective product quality remains Product/user judgment, never an automated score.
