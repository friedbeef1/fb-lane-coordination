# TASK-016 - Codex Plugin Handoff Index Progressive Disclosure

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: Added bootstrap, doctor, test, docs, and Codex plugin skill changes so agents read `docs/handoffs/index.md` before detailed handoffs.
Evidence Against Product OKR: None identified

## What Changed

- Added `docs/handoffs/index.md` as the first-read lookup table.
- Updated bootstrap to create `docs/handoffs/index.md`.
- Updated `doctor` to warn when a project has at least four detailed handoffs and no index.
- Updated BFM/Product/fb-lane Codex skills to use index-first handoff lookup.
- Updated README, FAQ, Loop Engineering docs, setup docs, Codex platform docs, and packaged plugin README.

## Scope Boundary

This is for the FB-Lane Codex plugin and bootstrapped FB-Lane projects. It does not change the Chrome/browser plugin and does not import the full Google OKF framework.

## Verification

- `node tools/fb-lane.test.cjs`
- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Root/package CLI parity diff

## Closeout

Status: implemented.
Remaining: full repository validator and CI/PR review.
