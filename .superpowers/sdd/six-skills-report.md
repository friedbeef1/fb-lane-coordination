# Task 2 — Six-workstream skills report

## Scope completed

- Added plugin-only `fb-discovery` and `fb-bugs` skills.
- Aligned Product/User, Business, Design, Tech, coordination, BFM, and setup
  skills to the six-workstream mini-loop, handoff, Ready to ship, and Push Live
  contract.
- Kept `product` as the Product/User technical slug.
- Made BFM call exported `scanWorkstreamHandoffs` semantics from
  `tools/fb-lane.cjs`; the skill does not duplicate scanner selection logic.
- Updated canonical root coordination/setup skills and generated their declared
  package mirrors. Discovery and Bugs remain plugin-only.

## RED → GREEN evidence

1. Discovery RED: `node tools/fb-six-skills.test.cjs` failed with `ENOENT` for
   `plugins/fb-lane-coordination/skills/fb-discovery/SKILL.md`.
2. Discovery GREEN: the focused behavior contract passed before Bugs was added.
3. Bugs RED: with Discovery still green, the same command failed with `ENOENT`
   for `plugins/fb-lane-coordination/skills/fb-bugs/SKILL.md`.
4. Bugs GREEN: the focused behavior contract passed.
5. Existing-skill alignment RED: the focused contract failed because
   `fb-product/SKILL.md` did not name the canonical six workstreams.
6. Alignment GREEN: all targeted skills passed the focused contract.

## Focused verification

- `node tools/fb-six-skills.test.cjs`
- `node tools/fb-package-sync.cjs --check`
- `node --check tools/fb-six-skills.test.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-six-skills.test.cjs`
- `git diff --check`

No full validator, publication, install, merge, deployment, or push was run.

## Self-review

- Confirmed Bugs cannot mark a report ready without observable reproduction.
- Confirmed Discovery separates findings, inference, and hypotheses.
- Corrected the BFM example to resolve `./tools/fb-lane.cjs` from project root.
- Confirmed inactive workstreams require no manufactured handoff.
- One repair loop was used after an atomic multi-file patch context mismatch; no
  partial edit landed and progress resumed immediately.
