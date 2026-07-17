# FB Six-Workstream Loop Implementation Plan

## Global constraints

- One FB process: workstream mini-loops create handoff MD files; `$bfm` scans all six, integrates ready work, tests, and stops at Ready to ship; only Push Live authorizes merge/deploy.
- Workstreams: Product/User (technical slug `product`), Business, Design, Tech, Discovery, Bugs.
- All six are planning/evidence surfaces outside BFM. BFM is integration/execution, not a seventh workstream.
- BFM scans all six and uses relevant ready handoffs; inactive workstreams report `None relevant`.
- Preserve existing four-workstream identifiers and historical records. Add `discovery` and `bugs`; no transcript capture or chat discovery.
- Bootstrap reruns preserve project-owned content and add only missing Discovery/Bugs workstream templates.
- Canonical root sources generate declared package mirrors. No publication, install, merge, deployment, or consumer-repository mutation.
- Focused tests only during implementation. Full validator is reserved for an explicit release checkpoint.

## Task 1: Runtime, handoff, bootstrap, and BFM scan contract

Write a focused six-workstream test RED, then extend CLI/MCP/session workstream values, handoff metadata, generated workstream cards, and bootstrap migration. Add a deterministic six-workstream scan that selects only `ready`, reports blocked and None relevant, excludes actioned/deferred/done, and stops on duplicate/contradictory ready handoffs. Preserve old records. Generate package mirrors. Commit `feat: add six-workstream runtime contract`.

## Task 2: Workstream skills

Create `fb-discovery` and `fb-bugs` separately with failing behavior/pressure scenarios first. Discovery owns unknowns, research, experiments, competitor/opportunity/feasibility evidence; Bugs owns reproduction, severity, affected users, regression evidence, and blocks reports without observable reproduction evidence. Update Product/User, Business, Design, Tech, coordination, BFM, and setup skills to the same mini-loop/handoff/scan contract. Root/package skill copies align. Commit `feat: add discovery and bugs workstreams`.

## Task 3: One public product story and closeout

Rewrite README as the one-process guide: problems, six workstreams, big/mini-loop diagram, handoff creation, `$bfm`, automated checks, optional links, Push Live, install/use, honest Codex/Capacitor/Spec Kit/BMAD comparison, and Focus Bridge/Fried Beef FAQ. Align FAQ, plugin README, Codex guide, why-FB reference, canonical harness pages, bootstrap guidance, board/index/handoff/current-task/Product card. Add/extend focused factual and structural documentation tests; generate mirrors; run focused six-workstream, skill, docs, sync, syntax, links, and whitespace checks. Commit `docs: explain the six-workstream FB loop`.

## Final gate

Independent whole-candidate review against these constraints. Repair only Critical/Important findings within two loops. Do not run a full validator, publish, install, merge, or deploy without a separately requested release checkpoint and Push Live.
