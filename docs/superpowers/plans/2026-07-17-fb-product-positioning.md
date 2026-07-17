# FB Product Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an evidence-backed, diagrammed explanation of FB beside vanilla Codex and Kurrent Capacitor.

**Architecture:** `docs/why-fb.md` is the canonical public comparison and the packaged plugin carries a byte-identical mirror. Existing entry points remain short routers. A focused Node test enforces positioning, evidence links, diagrams, and root/package parity.

**Tech Stack:** Markdown, Mermaid, Node.js assertions, existing FB validator.

## Global Constraints

- Preserve the approved three-line positioning verbatim.
- Treat FB and Capacitor as overlapping in session recall, evidence, and evaluation.
- Ground every pain point in repository evidence from actual user feedback or its recorded eval reproduction.
- Keep technical identifiers and runtime behavior unchanged.
- No release, publication, deployment, hosted capture, transcript capture, or autonomous judge.

---

### Task 1: Positioning contract and evidence page

**Files:** `tools/fb-product-positioning.test.cjs`, packaged mirror, `docs/why-fb.md`, and packaged mirror.

- [ ] Write the focused contract test and run it; expect failure because the canonical page is absent.
- [ ] Add the canonical page and packaged mirror with the approved framing, honest comparison, two Mermaid diagrams, evidence-linked pain-point table, and examples.
- [ ] Run the focused test; expect all positioning checks to pass.

### Task 2: Public entry points and validation

**Files:** Root/package README routers, FAQ, root/package harness overviews, and validator.

- [ ] Add concise links and a short comparison answer without duplicating the full page.
- [ ] Add syntax, mirror, and execution checks for the focused test to the validator.
- [ ] Run the focused test, full validator, doctor, and whitespace checks; expect clean passes.

### Task 3: Coordination closeout

**Files:** Board, handoff index, TASK-025 handoff, current-task record, and Product card.

- [ ] Record TASK-025 ownership, scope, boundaries, and initial evidence before public-doc edits.
- [ ] Close the task with exact test evidence and retain the separate release/publish gate.
- [ ] Review the final diff for unsupported comparisons, fabricated pain points, broken links, and root/package drift.
