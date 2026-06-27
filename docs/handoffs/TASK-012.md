# TASK-012 - Stable OKR Alignment

## Task

- **ID**: TASK-012
- **Owner**: FB-Product
- **Scope**: Clarify FB-Lane so OKRs are stable Product/workstream and lane alignment anchors, while mini-loops return evidence against those anchors.
- **Out of Scope**: Hard-blocking `submit`, creating more per-task OKR churn, or making lanes invent OKRs during execution.

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: Documentation, skills, templates, generated prompts, packaged plugin files, and doctor checks now use stable OKR-tree language with mini-loop evidence fields.
Evidence Against Product OKR: No blocking evidence identified.

## What Changed

- Reframed README, FAQ, and `docs/loop-engineering.md` around stable Product/workstream OKRs, stable lane OKRs, and mini-loop evidence.
- Updated Product, BFM, lane, setup, quickstart, and coordination skills so agents read existing approved OKRs first and stop for explicit user approval before any OKR addition or change.
- Updated handoff guidance to use `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR`.
- Updated root and packaged CLI doctor checks to warn on missing approved OKR alignment or implied unapproved OKR changes, while keeping `TASK-Q-*` quick tasks exempt and leaving `submit` behavior unchanged.
- Synced generated prompt artifacts and packaged plugin copies, and bumped the packaged plugin build suffix to `0.1.2+codex.20260627191525`.

## Verification Evidence

- Stable OKR wording scan passed across docs, skills, templates, generated prompts, and packaged plugin files; no stale dynamic-OKR wording remained in active guidance.
- `node --check tools/fb-lane.cjs` passed.
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` passed.
- Root/package CLI parity passed: `diff -q tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs`.
- Root/package generated agent JSON parity passed for Product, Tech, Design, and Business.
- Template parity passed for `AGENTS.md` and `CLAUDE.md`.
- JSON parse passed for 2 plugin manifests and 8 generated agent JSON files.
- Skill metadata validation passed for 8 packaged plugin skills and 3 root skills.
- `node tools/fb-lane.test.cjs` passed 10 regression checks.
- Doctor fixture matrix passed:
  - approved Product/lane OKR with aligned handoff: no alignment warning
  - missing section on `TASK-###`: warning
  - handoff implying an unapproved OKR addition without approved board update: warning
  - missing section on `TASK-Q-####`: no warning
- `node tools/fb-lane.cjs doctor` passed all setup and OKR checks; before commit it warned only about expected uncommitted changes.
- `git diff --check` passed.

## Remaining Gates

- None.

## Product Status Recommendation

implemented

Closeout note - TASK-012: implemented. Delivered: stable Product/workstream OKR and lane OKR model, mini-loop evidence fields, advisory doctor checks for missing/unapproved OKR alignment, generated prompt/package sync, and plugin build suffix `0.1.2+codex.20260627191525`. Evidence: wording scan, CLI syntax/parity, doctor fixture matrix, JSON parse, skill validation, repo doctor, regression tests, and `git diff --check`. Remaining: None. Handoff: docs/handoffs/TASK-012.md.
