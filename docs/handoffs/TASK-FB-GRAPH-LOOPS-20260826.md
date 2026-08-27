---
type: fb-lane-handoff
task: TASK-FB-GRAPH-LOOPS-20260826
lane: fb-discovery
status: in-progress
approval: approved
record_model: normalized-v1
---

# FB Graph, State, and Loop Model

Date: 2026-08-26  
Source: FB · Discovery  
Next owner: Product/BFM

## User Decision

James approved a compatibility-first graph-contract change: unify state and
transition rules, formalize node and edge directionality, preserve v1 reads,
and keep authority fail closed. First-class loop evidence follows only after
the contract is stable; orchestration decomposition remains a later decision.

## Evidence

Inspection of installed FB 0.9.4 found a useful product-delivery graph but
separate vocabularies for task lifecycle, Product disposition, integration,
verification, lessons, and release. Existing node and edge aliases remain
readable, while procedural loop runs are not yet first-class graph entities.

## Recommendation

1. Introduce one versioned machine-readable contract for nodes, edges, aliases,
   directionality, entity-specific states, terminal states, and transitions.
2. Preserve v1 aliases on reads and emit canonical values on new writes.
3. Make authority-sensitive relationships source-cited and incapable of
   inferring approval, verification, release, or **Push Live**.
4. Add loop-run evidence in a later Product slice.
5. Defer orchestration decomposition until both contracts are stable.

## Product Disposition

Disposition: **Include now** in TASK-091 for the versioned graph contract only.
Loop-run evidence and orchestration decomposition are deferred to later Product
decisions.

## Links

- [Product Build Brief](TASK-091.md)
- [TASK-091 QA](../qa/TASK-091.md)

## Product/BFM Result

Outcome: in progress.  
Delivered work: Exact-project identity recovery completed; graph contract Slice
1 is underway.  
Evidence: [TASK-091 QA](../qa/TASK-091.md).  
Remaining gate: Focused graph proof, candidate review, and Ready to ship.  
Final status: in progress.  
Return delivery: kickoff pending.  
Result fingerprint: pending.
