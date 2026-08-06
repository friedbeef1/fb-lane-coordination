---
name: fb-setup
description: Use when a user wants to initialize, bootstrap, reconcile, or repair FB coordination in the current Codex project.
---

# Set up FB

**REQUIRED SUB-SKILL:** Use
`fb-lane-coordination:project-coordination-setup`. Complete the canonical setup
workflow for the current repository.

This shortcut must preserve the canonical contract: bootstrap FB
idempotently, reconcile the seven repository-scoped Product/BFM, User,
Business, Design, Tech, Discovery, and Bugs tasks, create only what is missing,
verify pinning where Codex exposes it, and leave all new tasks idle.

Report unavailable task creation, discovery, renaming, or pinning honestly and
provide the canonical manual fallback. Do not duplicate setup policy here.
This shortcut does not invoke `$bfm`, start workstream investigations, approve
source changes, merge, publish, or deploy.
