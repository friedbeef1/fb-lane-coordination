# FB for Codex

FB is the supported Codex distribution for **FB 0.6.0-beta: Graph Engineering
for Everyday People**. The current release candidate is
`0.6.0-beta+codex.20260808104938`. FB is an open-source Codex plugin that turns
scattered AI conversations into a living product-delivery graph. Codex provides
threads, skills, and worktrees; FB connects their decisions, evidence,
dependencies, implementation, verification, and release state.
The public model is six evidence-producing workstreams plus one Product/BFM
control centre and seven pinned repository-scoped Codex tasks.

## Start

1. Paste this into Codex while your project is open:

   ```text
   Install or update FB from https://github.com/friedbeef1/fb-lane-coordination and set it up in this project.
   ```

   Codex detects whether installation or upgrade is needed. If refreshed, open
   a new task so the current plugin can load. Manual fallback:

   ```bash
   codex plugin marketplace add friedbeef1/fb-lane-coordination
   codex plugin add fb-lane-coordination@fb-lane
   ```

2. Open the project and invoke `$fb-setup`. It bootstraps FB and reconciles the
   seven pinned repository tasks without duplicating existing setup.
3. Discuss questions in the relevant User, Business, Design, Tech,
   Discovery, or Bugs workstreams.
4. For actionable findings say `Create a handoff MD for Product/BFM.`
5. After actionable handoffs are ready, say `$bfm` in Product/BFM. The control centre scans all six,
   shows the complete intake ledger from the canonical checkout, reconciles and
   prioritizes, creates the durable briefs, and BFM implements, tests, and stops at
   **Ready to ship**. Say **Push Live** only when you want merge and deployment.

Exact-project setup and checkout moves fail closed. Migration atomically records
one canonical root, quarantines recoverable former roots, and rebinds all seven
pinned tasks before Product/BFM execution continues.

Product/BFM approves routine candidate-faithful changelog wording and one
release checkpoint without a user prompt. It interrupts you only for a changed
product decision, material scope, a sensitive gate, or **Push Live**.

## Operating routes

The canonical pack is [docs/fb](../../docs/fb/README.md):

- [start](../../docs/fb/start.md) for workstream-first intake and `$bfm` reconciliation;
- [workflow](../../docs/fb/workflow.md) for lanes, BFM, and source-of-truth roles;
- [evidence](../../docs/fb/evidence.md) for Test This Now and Verification Handoff;
- [guardrails](../../docs/fb/guardrails.md) for safety, sidechat routing, recovery, and Loop Learning.
- [sessions](../../docs/fb/sessions.md) for durable task intake, promotion, checkpoints, recall, review, and closeout.

For local rule snippets, use [workflow-rules.md](workflow-rules.md). See
[setup](../../docs/setup.md) and [versioning](../../docs/versioning.md) for
technical installation and release context.
