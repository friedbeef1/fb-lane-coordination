# Project-local continuous learning

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

FB improves the **consumer project** from its own verified delivery outcomes. It does not send project evidence back to the FB repository or another project.

```text
Build → verify → diagnose → repair within the existing budget → close
  ↓
one provisional lesson
  ↓ next relevant task only
confirm → revise once → reject or retire
```

## What becomes a lesson

One meaningful, evidenced failure or avoidable rework may create one
**provisional** lesson. The record names the failure signature, cause, current
repair, owning handoff, QA evidence, relevant work types, and one allowlisted
treatment. FB keeps one active lesson per failure signature.

The lifecycle is deliberately small:

| State | Meaning |
|---|---|
| `provisional` | A verified outcome produced a plausible reusable lesson. |
| `confirmed` | Two later, distinct and comparable applications helped. |
| `revised` | One later application was relevant but incomplete; one revision is allowed. |
| `rejected` | The lesson failed, repeated incompleteness, missed its measured benefit, or caused a safety/must-pass regression. |
| `retired` | The lesson is no longer relevant to current work. |

A safety or must-pass regression rejects and deactivates the lesson immediately.
An efficiency lesson counts only with the same accepted outcome and at least a
10% observed token or wall-time improvement. Changed criteria or environments
are not counted as confirmation.

## What FB may change automatically

Automatic treatments are limited to these structure-only actions:

- `add_context_ref`
- `add_dependency`
- `select_existing_check`
- `recovery_hint`
- `raise_verification_floor`

FB never automatically edits application source, prompts, skills, eval
authority, product decisions, scope, sensitive policy, or release authority.
Product/BFM must assess any broader improvement proposal normally.

Learning never creates a second repair system. Quick BFM keeps its one
consolidated repair; Full BFM keeps at most two material repairs. Learning may
improve the evidence or context supplied to an already-permitted repair, but it
cannot reset the repair budget, add another retry, or keep a no-progress run
alive.

## Relevant context, not growing history

The durable registry lives at `docs/learning/index.md`. Full detail remains in
the owning handoff and QA artifact. Clone-local observations live under the Git
common directory and exclude transcripts, prompts, private reasoning, secrets,
tokens, and unredacted private data.

For a new task, FB selects only active lessons whose work types match the
current graph node. Unchanged or unrelated lessons remain linked and
retrievable instead of being copied into every worker packet. There is never
automatic cross-project transmission of learning data.

## Closeout

Prospective Full BFM handoffs use `learning_contract: v1`. Before the final
verification checkpoint, Product/BFM records either:

```text
Learning: none — <concrete reason no reusable lesson emerged>
```

or a compact `## Project Learning` receipt linking a lesson already recorded
in `docs/learning/index.md` and its QA evidence. Closeout and `doctor` validate
the records; they do not apply another repair. Historical handoffs remain
valid without retrofit.

Internal CLI and MCP learning operations record, select, or transition evidence
only. They do not execute treatment text and do not authorize release. Only
**Push Live** authorizes merge, publication, installation, or deployment.
