# FB-Lane Coordination for Codex

This Codex plugin packages the FB-Lane coordination workflow:

- skills for Product, Tech, Design, Business, and overall lane coordination
- an `fb-lane` MCP server backed by `tools/fb-lane.cjs`
- a repo marketplace entry at `.agents/plugins/marketplace.json`

Codex already provides the concurrency. FB-Lane provides the shared state and guardrails:
`PROJECT_BOARD.md`, file claims, `.codex/current_task.md`, handoff docs, and Product/Captain
integration gates.

## Install

From Codex, add this repo as a marketplace and install the plugin:

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

Then start a new Codex thread and ask for `@fb-lane` or one of the bundled skills.

## Typical Prompt

```text
@fb-lane
Run these concurrently:
@fb-design create prep-screen icon options.
@fb-tech check whether the auth flow is safe.
@fb-business rewrite the onboarding copy.
Then have Product sequence the handoffs and flag conflicts.
```

## Workspace Requirement

The target repo should have `AGENTS.md`, `PROJECT_BOARD.md`, and `tools/fb-lane.cjs`.
If they are missing, ask Codex to bootstrap FB-Lane from this plugin before starting lane work.
