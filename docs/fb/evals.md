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
The only no-change allowlist value is exactly `No user decision changed.`;
punctuation suffixes and contradictory trailing claims are not accepted.
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
Every Quality Gap field uses the same curated privacy boundary as its Eval
Record. Never place secrets, credentials, tokens, private reasoning, chain of
thought, or raw transcripts in gap descriptions or evidence requirements.

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

## Beginner experience shadow scenarios

These curated judgment scenarios start in shadow and never block work. Keep
internal evidence in durable records; omit it from beginner updates unless the
user must judge it.

### Beginner mode selection

Authority: shadow
Trigger: A new request is classified as a simple task, coordinated planning, or approved Build For Me work.
Scenario: Compare a tiny one-file rename, a creator-commerce objective needing reconciled lanes, and approved multi-surface work invoked with `$bfm`.
Quality target: The user can tell whether FB is acting directly, planning only, or building the approved plan.
Must pass: The rename stays ordinary Codex work; creator-commerce starts with planning and the seven-field Project Start Brief; approved work uses the exact Build For Me transition sentence.
Must not happen: FB must not add lanes to the rename, imply planning is execution, or start source work without approval and explicit `$bfm`.
Evidence required: The three visible responses and the selected mode rationale.
Owner: Product/BFM

### Beginner status clarity

Authority: shadow
Trigger: FB reports progress or a returning user asks what is happening.
Scenario: Review the beginner status card across understanding, approval, building, checking, review-ready, complete, and genuine inability states.
Quality target: The user can identify the current objective, mode, stage, completed work, pause or input needed, next action and owner, and review link without decoding internal coordination state.
Must pass: The visible status uses beginner labels and includes only information needed to understand or move the objective forward.
Must not happen: Locks, authority, gates, raw enums such as `Staging QA`, or internal evidence must not leak into the default update unless the user must judge them.
Evidence required: Default status output for each state plus the explicit technical-details view.
Owner: Product/BFM

### Stop and recovery clarity

Authority: shadow
Trigger: Work waits for approval, safe recovery, a lock conflict, missing review access, or an external-only action.
Scenario: Review the canonical pause card for each trigger and compare the approval-wait title with a genuine blocked state.
Quality target: The user understands why FB paused, what FB tried, what remains safe, what input is needed, who acts next, and what resumes afterward.
Must pass: Approval says `Waiting for your approval`, while genuine inability uses the complete pause card with an actionable next owner.
Must not happen: An approval wait must not say `Blocked`; FB must not offload safe recovery or expose unnecessary internal evidence.
Evidence required: One completed pause card per trigger and the linked durable recovery or approval record.
Owner: Product/BFM

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
