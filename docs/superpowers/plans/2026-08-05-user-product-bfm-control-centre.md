# TASK-075 — User workstream and Product/BFM control centre

## Purpose

Replace the combined Product/User lane with six evidence-producing workstreams
and one Product/BFM control centre, including seven visible pinned Codex tasks.

## Global constraints

- Public model: User, Business, Design, Tech, Discovery, Bugs, plus Product/BFM.
- Product/BFM is the control centre, not a seventh competing workstream.
- `$bfm` executes only in Product/BFM; pinning never starts or approves work.
- Fresh onboarding creates or identifies seven repository-scoped tasks and
  verifies every task is pinned when Codex exposes task controls.
- Reuse unambiguous legacy tasks, rename Product/User to User, reuse a lone
  Product task as Product/BFM, create only missing tasks, and remain idempotent.
- Preserve legacy `product` handoffs and historical records as compatible input.
- Report partial discovery, creation, rename, or pin failures honestly.
- Canonical sources are reviewed before package mirrors are generated once.
- No merge, marketplace publication, reinstall, or consumer-repository mutation
  before the normal release boundary.

## Task 1 — Runtime and focused contract

Implement the seven-role onboarding model in `tools/fb-onboarding.cjs` and its
focused tests. Add deterministic repository-scoped inventory planning that
returns reuse, rename, create, and pin actions without performing app mutation.
Keep legacy receipt migration compatible and make new reconciliation require
all seven roles. Prove fresh, legacy six-task, partial-failure, cross-repository,
and repeated-run behavior.

## Task 2 — Canonical product model and plugin guidance

Add the dedicated User skill and redefine Product/BFM as the control centre.
Align BFM, setup, coordination, all workstream skills, public/harness docs,
diagrams, templates, metadata, version guidance, and focused structural
contracts. Preserve historical records and technical identifiers.

## Task 3 — Package, verification, and release evidence

Review the complete canonical candidate, generate declared plugin mirrors once,
run focused root/package contracts plus parity, metadata, syntax, links,
whitespace, doctor, and the one final release validator after changelog approval.
Record TASK-075 QA and stop at Ready to ship until Push Live.
