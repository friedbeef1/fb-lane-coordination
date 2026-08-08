# Project-Local Recursive Learning Design

Date: 2026-08-08
Owner: Product / BFM
Task: TASK-079

## Purpose

Make every project using FB learn from its own delivery outcomes. When a
feature is built incorrectly, inefficiently, or incompletely, BFM repairs the
current candidate within its existing budget and records a bounded,
evidence-backed lesson that can prevent the same class of mistake in later
related work.

This is project improvement, not primarily FB improving its own plugin. A
consumer project never silently exports its evidence to the FB repository.

## Product contract

The project learning loop is:

`Build → verify → diagnose → repair within the existing budget → close delivery
→ create one provisional lesson → apply it to the next relevant task → confirm,
revise once, reject, or retire`

The current feature and the future lesson are separate outcomes. Learning does
not reset repair counters, create nested repair loops, or delay **Ready to
ship** unless the observed failure is safety-critical.

Every meaningful failed or materially inefficient outcome may create one
provisional project lesson immediately. One-off noise, unverified claims, and
environment-only failures without a reusable recovery do not create an active
lesson.

## Authoritative records

Use existing FB sources of truth rather than adding a second coordination
system:

- the task handoff owns the diagnosis, current repair, and Learning Receipt;
- the QA artifact owns before/after and regression evidence;
- the project graph owns accepted dependency and context-routing changes;
- an Eval Record owns a reusable quality or regression scenario;
- a small generated learning index points to active lessons and their owning
  records without copying their narrative;
- clone-local JSONL stores privacy-safe observations and counters, never
  transcripts or product truth.

Each Learning Receipt contains a stable lesson ID, failure signature, affected
work type, diagnosed cause, current repair, proposed preventative treatment,
evidence references, safety class, lifecycle state, application count,
measured outcome, and owning authoritative record.

## Lesson lifecycle

Lessons use these states:

1. `provisional` — created from a meaningful evidenced outcome and available as
   advisory context for the next matching task;
2. `confirmed` — two later relevant applications show that the lesson helped
   without readiness or safety regression;
3. `revised` — the first later application shows a causally relevant but
   incomplete treatment; exactly one revised candidate is allowed;
4. `rejected` — the treatment fails its original or regression case, produces
   no measurable improvement, repeats without material change, or exhausts its
   single revision;
5. `retired` — the project or affected surface changed and the lesson no longer
   applies.

Safety and must-pass regressions reject and deactivate a lesson immediately.
A rejected lesson cannot return under a new ID without new evidence and an
explicit Product decision.

## What FB may learn automatically

After deterministic validation, Product/BFM may activate a reversible,
project-local treatment without another user prompt when it only:

- adds a relevant decision, dependency, or authoritative evidence reference to
  future graph-derived context;
- adds or selects an existing focused regression or acceptance scenario;
- records a proven recovery hint for the same environment and failure
  signature;
- increases the minimum verification or coordination treatment.

Automatic learning must never:

- invent or change a product decision, user priority, scope, or acceptance
  outcome;
- remove protected context, lower a safety or verification requirement, weaken
  an eval, or execute an arbitrary stored command;
- change application source, FB skills, prompts, evaluator authority, secrets,
  payments, privacy, authentication, provider state, migrations, destructive
  behavior, or release authority;
- merge, publish, deploy, or consume **Push Live**.

Broader changes become Product/BFM proposals. Potentially reusable FB-harness
lessons remain privacy-safe handoffs; consumer projects do not transmit them
automatically.

## Proof and rejection

A quality lesson is confirmable only when the original failure is fixed, the
related regression scenario passes, the treatment is causally connected to the
diagnosis, and no must-pass behavior becomes worse.

An efficiency lesson is confirmable only when the same accepted outcome is
preserved, safety does not regress, and observed tokens or wall time improve by
at least 10% on a comparable case. Modeled figures may justify a shadow trial
but cannot confirm a lesson.

Reject a candidate when its cause is unverified, evidence is missing, the
comparison changes criteria or environment, it only improves the original
fixture, it fails a held-out case, it reduces readiness or safety, its gain is
below the applicable threshold, or it merely changes wording without changing
the outcome.

## Loop and resource limits

- Quick BFM retains one diagnosis and one consolidated repair.
- Full BFM retains at most two material repair rounds.
- Learning never resets or extends those budgets.
- One provisional lesson is allowed per failure signature per BFM run.
- One lesson candidate may be active per signature.
- A provisional lesson receives at most one revision.
- No material progress stops the path immediately.
- Success stops the current loop immediately.
- Safety regression reverts immediately.
- After rejection, only Product may reopen the pattern using new evidence.

The learning experiment normally runs as a later bounded slice. The feature
delivery does not wait for it unless the lesson addresses a current safety
gate.

## Runtime integration

Add a focused learning module used by BFM closeout, session verification, and
doctor. It validates Learning Receipts, stores atomic clone-local observation
events, groups matching signatures, selects only relevant active lessons for a
future context packet, evaluates lifecycle transitions, and materializes a
compact project learning index.

No user-facing mode or mandatory new command is added. `$bfm` performs the
learning closeout automatically and reports one concise state:

- `Learning: none`;
- `Learning: observing <lesson-id>`;
- `Learning: provisional <lesson-id>`;
- `Learning: confirmed <lesson-id>`;
- `Learning: revised <lesson-id>`;
- `Learning: rejected <lesson-id> — <reason>`;
- `Learning: retired <lesson-id> — <reason>`.

Only matching lessons enter an agent's context packet. Unrelated lessons remain
linked and retrievable, preventing the learning layer from becoming context
bloat.

## Plugin and project behavior

Bootstrap and safe upgrade add the learning guidance and empty managed index
without overwriting project-owned content. Existing projects, handoffs, evals,
and graphs remain valid. Projects start learning from future verified outcomes;
historical records are not automatically reinterpreted.

Product, BFM, coordination, setup, graph, evidence, eval, session, and
guardrail guidance explain the same bounded lifecycle. Public documentation
presents Continuous Learning as a core capability beneath Graph Engineering,
not as autonomous self-modification.

Because this adds a substantive reusable project capability and persisted
record contract, the release candidate advances to `0.6.0-beta`. Publication
and installation still require **Push Live**.

## Verification

Focused contracts must prove:

- a meaningful failure creates one provisional lesson while a low-evidence
  one-off does not;
- the current repair budget cannot be reset or extended by learning;
- only a matching lesson enters a future context packet;
- two helpful later applications confirm a lesson;
- one incomplete application permits one revision, while another failure
  rejects it;
- safety or must-pass regression immediately reverts and rejects;
- no-progress, changed criteria, incompatible environments, fixture-only
  improvement, and sub-10% efficiency gains cannot confirm;
- automatic treatments are limited to the allowlist and cannot alter source,
  authority, sensitive policy, or release state;
- active records remain atomic and consistent across worktrees;
- raw prompts, transcripts, hidden reasoning, secrets, and private data are
  rejected;
- bootstrap preserves project-owned content and root/package mirrors remain
  mechanically identical.

Run focused learning, control-loop, eval, session, graph, bootstrap, metadata,
package-parity, syntax, link, and whitespace checks during implementation. Run
the complete validator once at the release checkpoint. Stop at **Ready to
ship** before **Push Live**.
