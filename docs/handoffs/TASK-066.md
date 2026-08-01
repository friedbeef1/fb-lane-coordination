---
type: fb-lane-handoff
task: TASK-066
lane: fb-product
status: in progress
okr_fit: aligned
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-066 — Automatic local verification

## Goal Alignment Session

Product Goal: Keep BFM autonomous for routine verification while preserving genuine user and release boundaries.
Workstream Goal: Make system-run verification the operational default, not merely a preferred review format.
Lane OKR Fit: aligned
User Approval Needed: no — James explicitly approved this generic FB-Lane behavior.
Mini-loop Evidence: The current evidence contract says system verification is primary, but James was still asked whether routine local tests should be run.
Evidence Against Product OKR: None identified.

## Project Start Brief

- **Requested:** Automatically run every test Codex can perform and make that the generic FB-Lane default.
- **Decision:** BFM executes all safe, locally available verification itself and records the evidence before involving the user.
- **Safety:** User involvement remains mandatory for physical-device actions, unavailable credentials/accounts, payments, destructive or provider-state changes, subjective Product judgment, and explicit live release approval.
- **Out of scope:** A new runner, CI automation, broader permissions, provider mutation, publication, plugin installation, or cache refresh.
- **Success:** Future BFM runs do not delegate routine builds, tests, linting, browser/simulator smoke, package checks, or Git checks to the user.

## Build Brief

1. Add a focused failing structural contract for the automatic local-verification rule and its external-boundary exceptions.
2. Add the minimal rule to canonical BFM and evidence guidance.
3. Generate package mirrors and run the focused root/package contract, package parity, doctor, and whitespace checks.
4. After James's explicit Push Live approval, prepare FB `0.5.3-beta+codex.20260801141345`, run the complete release validator, fast-forward GitHub `main`, upgrade the marketplace, reinstall, and verify the active cache.

Changelog expectation: required — [FB 0.5.3-beta](../../CHANGELOG.md#053-beta--2026-08-01), approved through James's explicit 2026-08-01 Push Live instruction.

## Task Receipt

- Delivered: generic automatic-local-verification contract in canonical and packaged BFM/evidence guidance.
- Changed surfaces: canonical/package BFM and evidence guidance, focused skill contract, and TASK-066 coordination records.
- External gate: Push Live approved by James on 2026-08-01 for GitHub `main`, marketplace publication, reinstall, and active-cache verification.

## Verification Handoff

- The focused contract must fail before the guidance exists.
- It must pass after canonical guidance and package mirrors are updated.
- Package parity, doctor, and whitespace checks must pass.

## Product/BFM Closeout

Status: In Progress — FB 0.5.3-beta release checkpoint.
Actioned By: FB-Product / BFM.
Result: BFM now runs every safe locally executable check automatically and asks the user only for physical-device, unavailable-access, sensitive external-state, subjective Product, destructive, or live-release evidence.
Evidence: The focused skill contract failed before guidance, passed after the canonical update and package generation, and package parity/doctor/whitespace evidence is recorded in [TASK-066 QA](../qa/TASK-066.md).
Remaining: Complete release validation, publish GitHub `main`, upgrade the marketplace, reinstall, and verify the active cache.
Closeout Note: Push Live was explicitly approved on 2026-08-01. No unrelated consumer repository or provider state is in scope.
Loop Learning: Repeated pattern: yes; tooling needed: guidance contract only; Product approval needed: only for later release.
