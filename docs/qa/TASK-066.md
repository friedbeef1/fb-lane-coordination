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

## Remaining gate

Local candidate only. Merge, publication, installation, and cache refresh need
a later explicit Push Live approval.
