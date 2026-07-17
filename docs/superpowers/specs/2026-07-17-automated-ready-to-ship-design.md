# Automated Ready-to-Ship Design

## Purpose

Make the ordinary FB delivery path simple and enforceable: FB performs routine
verification, shows optional review evidence, and asks James for one final live
approval.

## User Contract

For an ordinary release candidate:

1. FB runs the selected automated checks itself.
2. A failed required check keeps the candidate in `Checking` and FB owns
   recovery within the declared loop budget.
3. When required checks pass, FB shows direct links as optional evidence rather
   than asking James to perform routine QA.
4. FB reports `Ready to ship` and displays exactly:

   > Automated checks passed. Optional review links are available above.  
   > Say **Push Live** to deploy.

5. No live mutation occurs until James says `Push Live` in the current
   conversation.

## Safety Precedence

Auth, privacy, payments, secrets, destructive data, migrations, provider state,
permissions, lock conflicts, unclear scope, and release configuration retain
their existing focused safety checks and approvals. These checks run before the
Ready-to-ship prompt. Passing ordinary automated tests never bypasses them.

## One Authoritative Verification Path

CLI submit, MCP submit, and session verification reuse use the same policy and
evidence record:

- selected automated checks and results;
- candidate commit and changed surfaces;
- safety-gate results or explicit not-applicable values;
- optional review links;
- `Ready to ship | Checking | Blocked` result;
- live approval state: `not requested | requested | used`.

`--no-tests` cannot produce `Ready to ship` or authorize a live action. A
verification checkpoint is reusable only when it explicitly records the
required automated checks as passed for the same candidate commit and no
runtime-affecting change followed it.

## Live Boundary

`Push Live` is the sole ordinary user prompt after verification. It authorizes
only the already-verified candidate and must be consumed once. A different
commit, failed check, unresolved safety gate, missing environment, or stale
approval returns the candidate to `Checking` or `Blocked` and requires a fresh
prompt after recovery.

This design does not itself deploy, merge, publish, or release anything.

## Verification

Focused root/package tests must prove:

- CLI and MCP share the same automated-verification decision;
- required checks fail closed and `--no-tests` cannot mark work ready;
- optional links never become mandatory routine user QA;
- valid evidence produces the exact Ready-to-ship prompt;
- safety triggers override the ordinary path;
- checkpoint reuse requires the same candidate and explicit passed checks;
- `Push Live` is required, candidate-bound, and single-use.

The implementation slice runs focused tests, package synchronization, syntax,
whitespace, and doctor. It does not perform a live push.
