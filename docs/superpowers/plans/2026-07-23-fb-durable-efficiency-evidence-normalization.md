# FB Durable Efficiency and Evidence Normalization Implementation Plan

> **For Codex:** Execute this plan in order with focused RED/GREEN proof. Do not run a release checkpoint, publish, merge, or deploy.

**Goal:** Reduce duplicated coordination context while retaining deterministic evidence, risk, verification-reuse, and closeout safety.

**Architecture:** Add one prospective normalized-record contract and pure validation module. Existing records remain historical and valid unless they opt into `record_model: normalized-v1`. The existing doctor consumes the module, canonical `docs/fb/` explains the operating policy, and package mirrors are generated once.

**Tech stack:** Node.js CommonJS, Markdown records, Node test runner, existing FB package synchronizer.

---

### Task 1: Claim and specify the normalized record model

- [x] Add TASK-047 to the board, index, Product card, and canonical handoff.
- [x] Record the one-authoritative-home map and prospective compatibility boundary.

### Task 2: Add deterministic contracts in RED

- [x] Add focused tests for record ownership, board/handoff consistency, supersession, workstream-card duplication, lane escalation, verification fingerprints, health transitions, closeout shapes, and metric records.
- [x] Run the test and confirm failures are caused by the missing implementation.

### Task 3: Implement the focused validator and doctor integration

- [x] Add the smallest pure module that satisfies the focused contract.
- [x] Integrate prospective repository findings into the existing doctor.
- [x] Keep semantic Product judgment and historical retrofit out of deterministic validation.

### Task 4: Align the harness and installed plugin guidance

- [x] Add the canonical normalized-record page and route it from the harness overview.
- [x] Update workflow, evidence, guardrails, sessions, coordination, setup, Product/BFM, and workstream guidance with links rather than duplicated policy.
- [x] Add QA and handoff templates where they reduce free-form repetition.
- [x] Generate declared package mirrors mechanically after canonical changes.

### Task 5: Verify and close locally

- [x] Run the focused root/package record contract and directly affected doctor/package checks.
- [x] Run package synchronization check, affected syntax, links, and whitespace.
- [x] Record results in TASK-047 and stop without push, merge, publication, deployment, or a release checkpoint.
