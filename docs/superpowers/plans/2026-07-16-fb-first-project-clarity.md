# FB First-Project Clarity Implementation

## Global constraints

- Preserve the existing contract: lanes plan, Product prepares/approves the build brief, and BFM builds only after the user explicitly says `$bfm`.
- Do not add a persistent wizard, new CLI command, new status model, publication, release, deployment, technical-ID migration, or consumer-repository change.
- Keep root and packaged plugin mirrors aligned.
- Use visible plain-language states: `Understanding your idea`, `Ready for your approval`, `Building`, `Checking`, `Complete`; a blocked state must say `Blocked — <reason> / next action`.

## Task 1: First-project and review contracts in skills and guides

- Add the Project Start Brief sections: What you asked for, Your decisions, Assumptions to confirm, What FB will plan, Out of scope, Success looks like, Progress, and Next action.
- Place the How FB works card directly after the Project Start Brief and before lane output/questions. Its four steps explain lanes, Product, approval, and BFM in plain language.
- Require selected lanes to name their distinct question and the decision/risk it changed; name skipped lanes.
- Require each clarification question to give Why this matters, a recommended default, and what changes if the user chooses differently.
- Define the short user-facing Test This Now packet: outcome type, direct links, exact steps and expectations, pass criteria, known limits, and failure-report format. Missing review access must be a blocked state.
- Apply this contract to the packaged coordination, Product, BFM, and setup skills plus active README, FAQ, Codex guide, plugin README, and loop guide.

## Task 2: Bootstrap contract and regression coverage

- Add a concise generated version of the first-project contract and How FB works card to bootstrapped `AGENTS.md` and `.codex/rules.md`.
- Change bootstrap quick-start wording so new users describe a project normally; retain `status` as a returning-project health command.
- Add root/package tests that fail before the behavior is present, then prove generated files include the build boundary, decision/assumption separation, progress states, `$bfm` handoff, and Test This Now contract.
- Keep root/package CLI and test files byte-aligned.

## Task 3: Verification and closeout

- Smoke a fresh bootstrap and inspect generated guidance against the creator-commerce scenario.
- Run root/package test suites, Node syntax, root/package parity, validator, doctor, and whitespace checks.
- Update board, handoff index, detailed handoff, and Product workstream card with evidence and remaining gates.
- Run task reviews after each implementation slice and a whole-branch review at the end.

## Session handoff

Status: Task claimed; no implementation slices dispatched yet.

Decisions: Natural-language first-project guidance; planning first; explicit `$bfm` build handoff; How FB works card immediately below the Project Start Brief; adaptive lane selection; plain-language user progress; Test This Now packets with clickable links and exact test steps.

Next step: Implement Task 1, then review it before modifying bootstrap/test coverage.
