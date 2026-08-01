# TASK-066 QA Evidence

Date: 2026-08-01
Candidate: `product/TASK-066-auto-local-verification`

## RED/GREEN contract

- RED: `node tools/fb-six-skills.test.cjs` failed because BFM did not require
  automatic execution of every safe locally executable check.
- GREEN: the same command passed after updating canonical BFM/evidence guidance
  and generating package mirrors.

The contract requires:

- automatic local unit, integration, end-to-end, build, lint, typecheck,
  package, Git, browser, simulator, deployment-source, and safe smoke checks;
- no delegation of routine tests or recovery to the user; and
- user input only for physical-device, unavailable-access, payment/provider,
  destructive, subjective Product, or live-release boundaries.

## Release evidence

- James explicitly approved Push Live on 2026-08-01.
- The complete `node tools/fb-lane.validate.cjs` release validator passed.
- GitHub `main` advanced through release commit `dfc37b9`.
- The marketplace upgrade and plugin reinstall succeeded.
- Codex reports `fb-lane-coordination@fb-lane` installed and enabled as
  `0.5.3-beta+codex.20260801141345`.
- The installed cache contains the automatic local-verification rule in
  `skills/bfm/SKILL.md` and the no-routine-user-test rule in
  `docs/fb/evidence.md`.
