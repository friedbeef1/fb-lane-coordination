# Markdown Eval Lifecycle

The optional [generic control loop](control-loop.md) may use selected eval
evidence during diagnosis and frozen golden-fixture comparison. It does not
semantically score work, promote eval authority, or replace Product approval.

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

## Evaluation results

An **eval** is the measuring instrument: one named scenario, quality target,
and pass condition. An **evaluation** is the process of selecting one or more
evals, applying them to a candidate, examining their evidence, recording the
results, and deciding what happens next.

An eval definition is not a result. A result is candidate-specific and must
link to evidence. Use this compact view in the Verification Handoff or Task
Receipt when several selected evals need a readable summary; it links to the
authoritative Eval Records rather than replacing them.

| Eval | Kind | Authority | Result | Evidence | Effect |
|---|---|---|---|---|---|
| Direct review link | Objective | Mechanical | Pass | Linked QA check | Continue |
| Required fields | Objective | Blocking | Fail | Validator output | Repair required |
| Visual polish | Subjective | Advisory | Needs improvement | Linked screenshots | Product review |

The flow is: `eval definition → candidate → result → evidence → delivery
decision`. A result without evidence is only a claim; an eval without a result
is only a definition.

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

For a Build failure, make the smallest **sufficient and causally relevant**
correction, not the smallest diff. Before editing, record the diagnosed cause,
the concrete correction, and the expected observable change. The repair is
meaningful only when it addresses that cause, materially improves source,
behavior, evidence, blocker recovery, or an approved decision, passes the
original failed scenario, and adds or passes a focused regression check. It
must not weaken the eval, special-case only the fixture, move or displace the
failure, or compromise the approved product outcome.

Compare every repair candidate with the previous one. If the expected behavior
and evidence did not materially change, record one no-progress cycle and stop;
do not spend another iteration circling the same symptom. A passed original
scenario plus focused regression evidence stops the loop immediately.

BFM continues the bounded scoped loop until pass or until its repair budget,
scope, time, no-progress rule, or direction requires a Product decision. Close
a prior failure only when the original scenario passes, is explicitly deferred,
or is superseded by an approved brief revision.
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

### EVAL-HARNESS-MODE-001 — Beginner workstream-first route

Authority: shadow
Trigger: A new request needs planning or evidence, relevant workstream handoffs become ready, or the user says `$bfm`.
Scenario: Follow one visible workstream-first route from the matching workstream discussions through ready handoffs, `$bfm`, Product reconciliation, consolidated Project Start Brief and Build Brief recording, and execution.
Quality target: The user sees one continuous route and is never asked to choose an execution mode.
Must pass: Product/User is selected only for user needs, outcomes, requirements, feedback, acceptance criteria, or product priority; relevant workstreams create ready handoffs before `$bfm`; after invocation Product scans all six, reconciles and records both briefs without a routine second approval.
Must not happen: Product/User must not become universal intake, Project Start Brief must not precede workstream handoffs, and FB must not expose a mode menu or mode-selection rationale.
Evidence required: The visible workstream-first sequence, conditional Product/User selection, ready-handoff evidence, and post-`$bfm` reconciliation/brief record.
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
