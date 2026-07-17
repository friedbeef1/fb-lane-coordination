---
type: fb-lane-handoff
task: TASK-025
lane: fb-product
status: in-progress
okr_fit: aligned
---

# TASK-025 - FB Product Positioning and Comparison

## Goal Alignment Session

Product Goal: Help everyday users understand when vanilla Codex, Kurrent Capacitor, and FB are useful without hiding their overlap.
Workstream Goal: Publish an honest, evidence-backed comparison with rendered diagrams and real user-feedback pain-point mapping.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly requested this positioning and documentation slice.
Mini-loop Evidence: TASK-020 records first-project confusion; TASK-022 records durable recall needs; TASK-023 reproduces review-link and product-quality gaps; TASK-024 records pause, status, and recovery clarity failures.
Evidence Against Product OKR: None identified.

## Scope

- Add one canonical comparison page and a packaged mirror.
- Explain the overlap and different emphases of Codex, Kurrent Capacitor, and FB.
- Map every problem claim to recorded user feedback or eval evidence.
- Add two Mermaid diagrams and three concrete examples.
- Link the page from active root/package entry points and enforce it with a focused contract test.

## Out Of Scope

- Runtime changes, external integration, transcript capture, hosted storage, autonomous evaluation, release, publication, deployment, merge, or consumer-project changes.

## Verification Handoff

Candidate: local branch `codex/fb-beginner-clarity` after TASK-024.

Test plan: run the focused positioning contract red/green, full validator, doctor, link and wording scans, root/package parity, and whitespace checks.

Manual pass criteria: the three systems are compared honestly; Capacitor/FB overlap is explicit; all pain points cite repository evidence; the diagrams render as Mermaid; and no claim says Capacitor replaces or is categorically separate from FB.

Recovery: Product/BFM owns broken-link, wording, parity, and validator repair before review.

## Product/BFM Closeout

Status: In Progress.
Actioned By: FB-Product / BFM.
Result: Pending implementation and verification.
Evidence: Baseline beginner 10/10, recovery contract, validator, and doctor Ready passed before edits.
Remaining: Implement, verify, and review locally. Release and all external-action gates remain closed.
Loop Learning: Feedback captured: yes; Repeated pattern?: yes; Tooling needed?: focused documentation contract; Product approval needed?: no - the slice was explicitly approved.
