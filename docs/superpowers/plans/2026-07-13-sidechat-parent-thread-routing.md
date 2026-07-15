# Sidechat Parent-Thread Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every FB-Lane sidechat hand off only to its originating main thread, with a paste-ready fallback when that parent is unavailable.

**Architecture:** `docs/sidechat-parent-thread-routing.md` is the canonical contract. Project instructions, source skills, packaged skills, and bootstrap artifacts link to it and restate the compact rule, while the existing sidechat handoff format stays unchanged.

**Tech Stack:** Markdown, Node.js `node:test`, FB-Lane Codex plugin.

## Global Constraints

- Parent-thread-only routing; role, project, title, recency, and Product/BFM status are never selectors.
- A missing parent returns the paste-ready handoff to the user and never routes to another thread.
- A non-parent main treats received material as ordinary user-provided context.
- Product/BFM records accepted decisions durably before they become source of truth.
- No routing automation, thread discovery, publication, release, paused-integration testing, or four-lane-model changes.

---

### Task 1: Canonical contract and project entry points

**Files:**
- Create: `docs/sidechat-parent-thread-routing.md`
- Modify: `AGENTS.md`, `docs/loop-engineering.md`, `README.md`
- Test: `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`

**Produces:** One canonical rule covering parent-only delivery, prohibited inference, no-parent fallback, receiving-main behavior, and Product/BFM ownership.

- [ ] Add a failing root/package assertion that the canonical doc contains the parent-only, no-inference, and no-parent rules and the project entry points link to it.
- [ ] Run `node --test tools/fb-lane.test.cjs --test-name-pattern="parent-thread"` and confirm it fails before the document exists.
- [ ] Add the canonical document and a short link beside each existing sidechat handoff section without changing the paste-ready field list.
- [ ] Re-run the focused root test and confirm it passes.
- [ ] Commit: `git commit -m "docs: add sidechat parent routing contract"`.

### Task 2: Source, package, and bootstrap distribution

**Files:**
- Modify: `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`
- Modify: `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`, `plugins/fb-lane-coordination/skills/bfm/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
- Modify: `templates/AGENTS.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Test: `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`

**Produces:** The packaged plugin, root source copies, and newly bootstrapped Codex projects inherit the same safe routing contract.

- [ ] Extend the root/package failing assertion to require parent-routing language in each applicable skill plus generated `docs/sidechat-parent-thread-routing.md` and generated `AGENTS.md` link.
- [ ] Run both `node --test ... --test-name-pattern="parent-thread"` commands and confirm they fail before the distribution changes.
- [ ] Add a concise rule: hand off only to the originating parent; never infer a destination; on missing parent return the paste-ready text; non-parent mains treat it as ordinary user context.
- [ ] Add the canonical file to bootstrap output, maintain correct per-file Markdown links, and copy the root CLI/test to the packaged mirrors.
- [ ] Re-run both focused suites and `cmp -s` for the CLI and test mirrors; each must exit 0.
- [ ] Commit: `git commit -m "docs: distribute sidechat parent routing"`.

### Task 3: Verification and Product closeout

**Files:**
- Modify: `PROJECT_BOARD.md`, `docs/handoffs/index.md`
- Create: `docs/handoffs/TASK-Q-20260713-SIDECHAT-PARENT.md`

**Produces:** Review-ready evidence and an explicit no-release/no-publication gate.

- [ ] Run root/package test suites, both Node syntax checks, CLI/test mirror comparisons, `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check`.
- [ ] Record exact passing evidence in the handoff; mark the task `Staging QA`, not `Done`, with no live routing, plugin publication, or release attempted.
- [ ] Commit: `git commit -m "docs: record sidechat routing verification"`.
