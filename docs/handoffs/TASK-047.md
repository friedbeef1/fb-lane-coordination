---
type: fb-lane-handoff
task: TASK-047
lane: fb-product
status: implemented
approval: approved
record_model: normalized-v1
okr_fit: aligned
---

# TASK-047 — Durable Efficiency and Evidence Normalization

## Approved Decision

Use one authoritative home for each durable fact. Other surfaces may show a compact linked summary but must not become a competing source of truth.

| Surface | Authoritative content |
|---|---|
| Project board | Active status, owner, scope, gate, blockers, and links |
| Handoff index | Routing only |
| Task handoff | Approved decisions, assumptions, scope, dependencies, acceptance, and supersession |
| Workstream card | Current lane task IDs, blockers, next action, and links |
| QA artifact | Commands, candidate, environment, timestamps, results, counts, and redacted raw output |
| Git | Source and commit history |

## Assumptions

- Enforcement is prospective through `record_model: normalized-v1`; historical records are not retrofitted.
- Deterministic checks validate structure and consistency. Product still judges meaning, risk, and whether evidence is sufficient.
- Verification fingerprints use explicit inputs. Any relevant mismatch invalidates reuse.
- Token and cost metrics may be `unavailable`; the harness must not estimate them from transcripts.

## Goal Alignment Session

Product Goal: Reduce FB coordination overhead without weakening evidence or release safety.
Workstream Goal: Give Product/BFM one durable, deterministic record model that keeps duplicated context out of routine work.
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: Focused root/package contracts prove the model before the plugin mirror is accepted.
Evidence Against Product OKR: None identified; efficiency remains a measured hypothesis rather than a published claim.

## Scope

Canonical normalized-record guidance, focused validator/doctor integration, risk-triggered lane review, verification reuse, event-driven health checks, compact closeout records, local metrics, relevant skills/templates, and mechanically generated plugin mirrors.

## Out of Scope

Historical rewrites, semantic automatic judgment, hosted monitoring, dashboards, transcript capture, external telemetry, release checkpoint, publication, push, merge, or deployment.

## Acceptance Criteria

- Normalized records have one authoritative home and link rather than copy detail.
- Deterministic checks catch inconsistent statuses, missing approval/task identity, invalid supersession, copied workstream detail, unsafe light routing, and stale verification evidence.
- Health checks are tied to meaningful transitions.
- BFM and Normal closeouts use fixed compact shapes.
- Metrics treat efficiency targets as hypotheses until a pre-registered experiment demonstrates them.
- Canonical and packaged guidance remain mechanically aligned.

## Other lanes

Other lanes: no impact detected — this task changes the shared coordination harness and linked guidance, while Product/BFM owns the cross-workstream contract and no application, provider, payment, privacy, authentication, or release surface changes.

## Verification

Focused root/package normalized-record contracts passed 11/11 each; the
existing CLI/bootstrap contract passed 70/70; 41 package mirrors, affected
syntax, TASK-047 links, and whitespace passed. See [TASK-047 QA](../qa/TASK-047.md).

## Compact Closeout

Status: Local Staging QA
Delivered: Prospective normalized records, risk-triggered review, deterministic verification reuse, event-driven health checks, compact closeout, privacy-safe QA output, local metric structure, canonical guidance, and generated plugin mirrors.
Commit/worktree: `codex/fb-durable-efficiency-evidence` / `/Users/jamesyeang/Documents/fb-lane/recovered-worktree`
Checks: Root/package records 11/11 each; CLI/bootstrap 70/70; package parity, syntax, focused links, and whitespace passed.
Evidence: [TASK-047 QA](../qa/TASK-047.md)
Remaining gates: Optional Product review; no release checkpoint requested.
Next owner: Product / BFM
Release boundary: No push, merge, publication, marketplace update, installation, or deployment is authorized.

## Release boundary

Local implementation and focused verification only. No release checkpoint, push, merge, publication, or deployment is authorized.
