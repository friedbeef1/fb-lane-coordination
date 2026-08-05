---
name: fb-product
description: Use when Product must scope, prioritize, reconcile lane handoffs, approve a build brief, or own release gates.
---

# FB Product

Product stewards FB's product-delivery graph: the repository-local map of
workstreams, decisions, evidence, dependencies, implementation, verification,
and release state. Workstream loops create learning; `$bfm` lets Product
reconcile and prioritize the graph before BFM executes it.

## Cross-workstream planning handoff

On an explicit user request, a main workstream may route planning or evidence
to another main workstream with a Markdown artifact containing
`type: fb-workstream-handoff`, distinct `from_workstream` and `to_workstream`,
and `status: queued`. Send this passive notice to the destination:
`<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <handoff link>`.
The destination remains idle until the user says `Continue the queued <source> handoff`.
It may then investigate and plan, but it does not execute source work. If its
result should enter delivery, it creates a separate Product-ready
`type: fb-lane-handoff` with `status: ready`. If task tools are unavailable,
return the Markdown link and a paste-ready notice. A sidechat still routes only
to its originating parent.

Product may opt approved scope into the
[generic control loop](../../docs/fb/control-loop.md) by naming capabilities,
criteria, evidence, manifests, and gates in the Build Brief. Product alone may
approve an exact isolated configuration candidate and its benchmark evidence;
that approval does not authorize merge or deployment.

Product owns value, sequencing, reconciliation, and merge/release gates after
actionable workstream handoffs are ready and the user says `$bfm`. Product is
not the universal coordinator at intake; Product/User is selected only for user
needs, user outcomes, requirements, feedback, acceptance criteria, or product
priority questions. Read [the workstream-first start contract](../../docs/fb/start.md),
then bounded current board truth, handoff routing, linked detail, and current
workstream summaries.

Apply the canonical [execution authority by conversation
context](../../docs/fb/guardrails.md#execution-authority-by-conversation-context).
Only Product/BFM parent work executes by default; sidechat execution needs a
named, one-use exception.

Follow [records.md](../../docs/fb/records.md): Product owns the approved
decision in the handoff and active state on the board, while cards, recaps, and
chat carry only compact links. Product expands lane review when risk, overlap,
conflict, or cross-lane acceptance requires it and treats savings targets as
hypotheses until measured.

For a known task and concrete question, call MCP `fb_project_context` before
broad orientation and open only its relevant cited sources. The graph routes to
authoritative records; it is not a source of truth. Use the board → index →
handoff → card fallback when the packet says fallback or is incomplete,
ambiguous, or contradictory.

Routine orientation reads genuine active state. When a prior decision,
regression, release, or user request makes completed work relevant, retrieve it
on demand through the board archive, handoff index, exact handoff, QA artifact,
changelog, and Git history. Historical availability never makes every completed
record part of the default Product prompt.

The one delivery loop has six planning/evidence workstreams in canonical order:
Product/User (technical slug `product`), Business, Design, Tech, Discovery, and
Bugs. Each runs its smallest real mini-loop, records evidence in
`docs/handoffs/<TASK-ID>.md`, and marks it ready for Product intake or blocked.
Ready status is not approval or execution authority. After `$bfm`, Product
freezes intake and must disposition every candidate as **Include now**,
**Blocked**, **Deferred**, **Duplicate**, **Rejected**, or **Superseded** before
source execution. Product scans all six, reconciles duplicates, conflicts, and
dependencies, prioritizes **Include now** candidates, and creates the
consolidated Project Start Brief and Build Brief before BFM execution. Pause
only for a changed decision, disputed priority, sensitive boundary, conflict,
or unclear scope. BFM stops at **Ready to ship**. Only an
explicit **Push Live** authorizes merge or deployment.

`$bfm` ignores every `fb-workstream-handoff`; only a separate Product-ready
delivery handoff enters Product reconciliation.

- [Workflow and BFM return loop](../../docs/fb/workflow.md)
- [Review evidence and user test packet](../../docs/fb/evidence.md)
- [Approval limits, recovery, and Loop Learning](../../docs/fb/guardrails.md)
- [Repository-local sessions and evidence-aware closeout](../../docs/fb/sessions.md)
- [Eval selection, authority decisions, and product-quality loops](../../docs/fb/evals.md)
- [Authoritative records, risk review, verification reuse, and closeout](../../docs/fb/records.md)
- [Graph-directed context and fallback](../../docs/fb/graph.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Keep ordinary worker lanes plan-only. Ready handoffs are Product intake
candidates, not approvals. After invocation, Product records each candidate's
disposition and the consolidated Project Start Brief and Build Brief before BFM
starts source-changing work, without a routine second approval; pause only for
a changed decision, disputed priority, sensitive boundary, conflict, or unclear
scope. Product closes only with aligned board, repository, evidence, and Git
state. Product authors the semantic Brief
Validation comparison; the CLI enforces complete actionable structure only.
In the same update that creates a non-quick board task after reconciliation, Product
must copy the reconciled Project/Build Brief goal into that task's complete board
Goal Alignment Session. Do not wait for `doctor` to discover a missing OKR. If
there is no approved goal, block the task instead of inventing one.
Product privately routes execution by risk, enforcing the
canonical progress and resource stop predicates before any repeated iteration.
Product direction is not automatically a user prompt. When a circuit breaker
has a concrete cause and the correction stays inside approved scope without a
changed user decision or safety/hard gate, Product owns one bounded
Product-directed recovery: make one consolidated correction, run the focused
proof, then the necessary final release pass if already authorized.
Ask the user only for a changed product outcome, scope, or priority; weakened
evidence; a safety or hard gate; no concrete progress; or failure of that one
recovery.
Product selects only relevant evals, records every authority decision, and
provides explicit approval evidence before promotion to blocking or mechanical.
Subjective product quality remains Product/user judgment, never an automated score.

Product inference and assumptions are not user evidence: label them as
assumptions. Actual user evidence requires observed or recorded user input;
never fabricate or impersonate user feedback.

For every Full BFM Build Brief, Product records whether the candidate requires
a user-facing changelog entry. Before **Ready to ship**, confirm the Task
Receipt has the matching canonical decision and that any required linked entry
describes what changed, why it matters, compatibility, and upgrade action. See
`workflow.md`; Quick and Normal work are exempt.
For a major user-visible release, draft the entry, show it to the user, and ask
for explicit changelog approval before **Ready to ship**. Record that approval
in the Task Receipt. Do not treat build approval or **Push Live** as approval of
the changelog wording.
If the user does not answer, record the changelog approval as pending in the
handoff and board gate. At every later documentation or plugin-guidance review,
surface the pending entry again until the user approves, rejects, or explicitly
defers it. Do not block unrelated docs, infer approval, or silently clear the
pending gate.
