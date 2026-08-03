# Workstream-to-Workstream Queued Handoffs

Date: 2026-08-03  
Owner: Product / BFM  
Status: Approved design; implementation not started

## Purpose

Let one FB workstream pass evidence and a next planning question directly to
another workstream. For example, Discovery may queue research for Design
without routing the material through Product first.

The receiving workstream does not start automatically. It waits until James
opens that workstream task and asks it to continue the queued handoff.

## Authority Model

| Artifact or action | Meaning | Authority granted |
|---|---|---|
| Workstream handoff with `status: queued` | Planning or evidence is waiting for another named workstream | None; the recipient waits for the user |
| User says `Continue the queued <source> handoff` in the destination task | The destination may investigate the named question | Planning and evidence work only |
| Delivery handoff with `status: ready` | Actionable work is waiting for Product review | None until Product runs `$bfm`, dispositions it, and records the consolidated plan |
| Product/BFM runs `$bfm` | Product reconciles eligible delivery handoffs | Execution only for unlocked `Include now` scope in the durable plan |
| User says **Push Live** | Release boundary | Merge and deployment authority for the verified candidate |

Arrival, notification, and file creation never grant source-changing execution
authority.

## Workstream Handoff Contract

A directed planning handoff uses distinct metadata so it cannot be confused
with a Product-ready delivery handoff:

```yaml
---
type: fb-workstream-handoff
from_workstream: discovery
to_workstream: design
status: queued
source_task: TASK-071
---
```

Required content:

- question investigated;
- evidence gathered, with links to authoritative records;
- recommendation or current conclusion;
- requested next investigation;
- decisions and assumptions kept separate;
- dependencies, limits, and known conflicts;
- predecessor handoff when the work is part of a chain.

Allowed lifecycle states are:

- `queued` — delivered but waiting for the user in the destination workstream;
- `in_review` — the user explicitly asked the destination to continue;
- `consumed` — the destination completed its planning response and linked the
  resulting artifact;
- `deferred` — the destination or user intentionally postponed it;
- `superseded` — a newer linked handoff replaces it.

`ready` is deliberately excluded from this lifecycle. It remains the delivery
handoff status meaning **ready for Product review**, not approved or executable.

## Routing Flow

1. In a main workstream task, James explicitly asks to hand the current work to
   another named workstream.
2. The source creates the workstream handoff Markdown file and adds a compact
   index entry.
3. If Codex can identify the exact repository-scoped destination task, it sends
   only this notice:

   > `<Source>` handoff queued for `<Destination>` — planning only; waiting for
   > you. Open: `<handoff link>`

4. The destination remains idle. No investigation, coordination mutation, or
   source edit begins from arrival alone.
5. When James opens the destination task and explicitly asks it to continue the
   named handoff, the destination changes it to `in_review` and performs only
   its own planning/evidence mini-loop.
6. The destination records its result, marks the incoming handoff `consumed`,
   and links the resulting artifact.
7. If the result should enter delivery, the destination creates a separate
   `type: fb-lane-handoff` with `status: ready` for Product/BFM.

If task discovery or messaging is unavailable, FB still creates the file and
returns the exact paste-ready destination notice. It never claims delivery
succeeded without a tool result.

## Product and BFM Behavior

- Product is not a relay for workstream-to-workstream planning.
- `$bfm` ignores `fb-workstream-handoff` artifacts in `queued`, `in_review`,
  `deferred`, `consumed`, or `superseded` state.
- `$bfm` considers only valid Product-ready delivery handoffs under the existing
  intake snapshot and disposition contract.
- A delivery handoff may cite one or more consumed workstream handoffs as its
  evidence chain.
- Product may flag a queued workstream handoff as a dependency, but it cannot
  silently consume or execute it.

## Guardrails

- Only explicit user-directed routing creates a cross-workstream handoff.
- Main workstream tasks may route to other main workstreams. Sidechats retain
  the parent-thread-only rule and cannot redirect material to a different main
  task.
- Receiving workstreams remain plan/evidence-only. They cannot edit source,
  claim execution locks, commit implementation, run `$bfm`, or release.
- A handoff chain must retain predecessor links. A workstream must not bounce an
  unchanged question back to its source without new evidence or a concrete
  clarification request.
- Sensitive-operation and release gates remain unchanged.

## Plugin and Documentation Surfaces

Update the canonical workflow, start guidance, handoff template guidance,
coordination skill, all six workstream skills, Product/BFM guidance, packaged
mirrors, and concise public documentation. The destination notification must
use the same queue-only language everywhere.

No new public CLI command, hosted router, transcript capture, database, or
automatic chat discovery is required. Existing Codex task tools are used when
available; the Markdown handoff remains the durable contract.

## Verification

Add one focused root/package contract proving:

1. Discovery can queue a handoff to Design.
2. Arrival produces no destination work or source mutation.
3. Explicit continuation permits Design planning only.
4. Design can create a distinct Product-ready delivery handoff afterward.
5. `$bfm` ignores every non-delivery workstream-handoff state.
6. Missing destination tooling returns a truthful paste-ready fallback.
7. Sidechat parent-only routing still prevents cross-main-task redirection.
8. Every ordered pair among the six workstreams is valid except self-routing.
9. Unknown workstreams, self-routing, missing evidence, and missing requested
   next investigation are rejected.

Use focused RED/GREEN behavior checks, mechanical package synchronization,
syntax, links, and whitespace. Release validation remains a separate Product
checkpoint, and **Push Live** remains separate.

## Compatibility

Existing `fb-lane-handoff` files and their statuses remain unchanged. Existing
projects do not need migration. The new artifact type is additive and is
ignored by older Product intake logic rather than reinterpreted as executable
scope.
