---
name: fb-setup
description: Use when a user wants to initialize, bootstrap, reconcile, repair, rename, archive, or resolve duplicate-looking FB coordination tasks in the current Codex project.
---

# Set up FB

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

**REQUIRED SUB-SKILL:** Use
`fb-lane-coordination:project-coordination-setup`. Complete the canonical setup
workflow for the current repository.

Treat `Install or update FB from GitHub and set it up in this project.` as the
same setup intent after the current plugin has loaded. The plugin cannot install
itself before it is loaded; the public GitHub instructions let Codex detect and
perform that machine-level step, then a new task continues here.

Treat duplicate-looking task suites and prefix, rename, archive, or repair requests as setup intent. Enter exact-project reconciliation before any task mutation.
Never infer project identity or a mutation target from a visible title. If FB
was installed, upgraded, or replaced in this task, require a fresh Codex task
before any plugin-dependent setup or repair mutation.

This shortcut must preserve the canonical contract. Setup is safe to run again:
update only what is missing or outdated, preserve existing project work, and
operate from the active canonical checkout. Reconcile the seven repository-scoped exact-project Product/BFM, User, Business, Design, Tech, Discovery, and Bugs tasks, create only what is missing, verify pinning where
Codex exposes it, and leave all new tasks idle. Checkout moves use the canonical
transactional migration and keep former roots recoverable until explicit
retirement approval.

Setup adds rebuildable derived graph support without overwriting project-owned
boards, records, handoffs, learning, or instruction text. It adds no graph
database. Missing or unhealthy derived state falls back to authoritative
Markdown and Git records.

Report unavailable task creation, discovery, renaming, or pinning honestly and
provide the canonical manual fallback. On a capped native non-pinned task list, use the canonical read-only local candidate plus native-detail join; never use `state_5.sqlite` alone or weaken duplicate detection. Do not duplicate setup policy here.
This shortcut does not invoke `$bfm`, start workstream investigations, approve
source changes, merge, publish, or deploy.
