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

## Way of Working and Distribution

This is the default FB delivery contract, not a task-specific exception.

- The canonical `docs/fb/` harness defines automated verification, optional
  review evidence, Ready-to-ship state, safety precedence, and the Push Live
  approval boundary.
- Root coordination, Product, BFM, lane-routing, setup, and quickstart skills
  use the same contract and terminology.
- Bootstrap-generated project instructions route new and upgraded projects to
  this workflow without overwriting project-owned instructions.
- The Codex plugin receives mechanically generated copies of every canonical
  runtime, test, harness, and shared-skill surface declared in the package
  manifest. Plugin-only skills restate the same user-facing behavior without
  creating a second policy source.
- Root README, FAQ, setup, Codex guide, plugin README, examples, and templates
  explain the simple sequence: automated checks, optional links, Ready to ship,
  then Push Live approval.
- Existing technical identifiers, commands, board statuses, package IDs, and
  safety gates remain compatible. Historical records remain factual.

Documentation must not describe routine user testing, PR review, staging, a
handoff file, or owner transfer as a required verification stage. Those may
provide evidence or coordination, but automated checks determine readiness.

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
- canonical harness, bootstrap output, shared skills, plugin-only routers, and
  public documentation present the same delivery sequence;
- generated plugin mirrors match their declared canonical sources;
- no active guidance makes routine user QA, PR review, staging, handoff-file
  creation, or owner transfer a prerequisite for Ready to ship.

The implementation slice runs focused tests, package synchronization, syntax,
whitespace, and doctor. It does not perform a live push.
