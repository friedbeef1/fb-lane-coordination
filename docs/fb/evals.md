# Markdown Eval Lifecycle

FB evals are curated Markdown evidence, not an autonomous judge. Product/BFM
selects only scenarios relevant to the approved brief. Do not run all catalog evals.
Mechanical checks remain deterministic. Product judgment remains explicit and visible.

## Record contract

Create a stable, unique repo-local `Eval ID` in `docs/evals/` from
[the eval record template](../evals/eval-record-template.md). Each record has:

- `Eval type: harness | product`
- `Authority: shadow | advisory | blocking | mechanical`
- `Judgment: subjective | objective`; mechanical evals are objective
- trigger, scenario, quality target, must-pass and must-not-happen behavior
- evidence required, owner, and latest result (`pass | fail | blocked | not run`)
- failure classification, revision, rerun result, disposition (`open | passed | deferred | superseded`), and promotion or demotion recommendation
- authority history, Product/BFM recorder and decision, and approval evidence
- concrete Good example and Bad example for subjective product judgment; objective product evals may omit them

Evidence is curated. Never record transcripts, private reasoning, secrets,
credentials, tokens, hosted analytics, or external capture without a separate
explicit approval and privacy review.

## Authority lifecycle

- **Shadow:** records evidence and never blocks. Every new eval starts here.
- **Advisory:** a failure must be fixed or explicitly explained in the task handoff.
- **Blocking:** a failure keeps progress at Checking until fixed, explicitly deferred, or accepted at the documented Product boundary.
- **Mechanical:** an objective existing validator/doctor check; preserve its origin and regression evidence. An unresolved failure blocks closeout.

Product/BFM records every authority change. Promotion to blocking or mechanical
requires the exact positive form `Product approval: approved; Reference:
APPROVED-...`. The same parser governs changed user decisions and deferred or
superseded Product-boundary dispositions. Negated, missing-reference,
ambiguous, automatic, self-approved, or self-promoted evidence is invalid.
No new eval becomes blocking during TASK-023. A noisy or ambiguous eval receives an
immediate demotion recommendation; Product records the decision.

## Selection and evidence flow

Project Start Brief and Build Brief record the quality bar, selected eval IDs
and authority, mechanical versus judgment evidence, and remaining user
judgment. BFM records selected results in Verification Handoff and Task Receipt.
Test This Now names what was evaluated, direct link, exact scenarios and
expected results, known quality gaps, and required user judgment. A
`session checkpoint --reason verification` records the selected results and
evidence.

All six surfaces repeat `Selected eval records: EVAL-ID (authority, result,
docs/evals/file.md#eval-id); ...`. The selected IDs, authority, latest result,
and evidence reference must match exactly across the surfaces and the repo-local
Eval Record.

`session close --outcome completed` leaves shadow failures visible and
nonblocking, requires an advisory fix or explanation, and blocks unresolved
blocking or mechanical failures. Board, handoff, eval record, session recap,
and Git must agree.

## Failure and revision loop

Before revision, classify the failure as `Build failure`, `Brief failure`,
`Eval failure`, or `Environment failure`. Never weaken an eval to make it pass.
A functional but insufficient product stays exactly
`Checking — product quality target missed` and receives a complete
open `## Quality Gap` with: Gap status; What is insufficient; Failed quality dimension; Good
example; Bad example; Responsible layer (`Product | Design | Tech | Business`);
Next scoped revision; and Evidence required for the next candidate. Preserve the
gap after closure with `Gap status: closed`, non-Checking progress, and fresh
`Closed evidence` tied to a passed record. Progress and lifecycle are scoped to
their matching Eval Record and Quality Gap, so a repository can retain closed
history while a different record has a current open gap.

BFM continues the scoped loop until pass or until scope, time, or direction
requires a user decision. Close a prior failure only when the original scenario
passes, is explicitly deferred, or is superseded by an approved brief revision.
The lifecycle is coherent only as `open` with a non-passing latest/rerun result,
`passed` with latest/rerun pass, `deferred` with latest blocked/rerun deferred,
or `superseded` with latest blocked/rerun superseded and an approved brief revision.
Preserve fresh evidence, root cause, regression case, remaining limits, record
consistency, and explicit approval for any changed user decision. Loop Learning
records classification, revision, rerun, regression, and the promotion,
demotion, or mechanical recommendation.

## Initial harness catalog

These are reusable scenario names, not automatically selected checks:

- first-project clarity
- plan-versus-build boundary
- decisions versus assumptions
- distinct lane contribution
- parent-thread-only sidechat routing
- Test This Now completeness
- honest progress and blocked states
- verification and recovery ownership

Existing deterministic protections keep mechanical status. New judgment
scenarios start shadow.

## Reusable product-quality categories

Projects define concrete scenarios and examples in their Build Brief. The
reusable categories are only:

- usefulness
- workflow completeness
- usability and clarity
- visual polish
- reliability
- output relevance and specificity
- trust and safety
- fit against approved product promise

They are not numeric scores.

Do not add an eval runner, semantic judge, score, dashboard, CI eval job,
automatic authority promotion, hosted capture, or external integration from
this lifecycle.
