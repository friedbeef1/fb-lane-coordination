# FB Eval Record Template

Use the lifecycle in [docs/fb/evals.md](../fb/evals.md). Copy one `## Eval
Record` per stable scenario. New records start shadow; Product/BFM records every
authority change.

## Eval Record

Eval ID: EVAL-HARNESS-001
Eval type: harness | product
Authority: shadow | advisory | blocking | mechanical
Previous authority: none | shadow | advisory | blocking | mechanical
Authority change approval: Product approval: not required; Reference: initial-shadow-record | Product approval: approved; Reference: APPROVED-123
Authority change recorded by: Product/BFM
Authority decision: Product/BFM recorded the initial shadow authority.
Judgment: subjective | objective
Trigger: Replace with the event that selects this scenario.
Scenario: Replace with one concrete reproducible scenario.
Quality target: Replace with the approved observable quality bar.
Must pass: Replace with required behavior.
Must not happen: Replace with forbidden or misleading behavior.
Evidence required: Replace with concrete mechanical or judgment evidence.
Owner: Product/BFM or named responsible owner
Latest result: not run | pass | fail | blocked
Failure classification: None | Build failure | Brief failure | Eval failure | Environment failure
Revision: None - no failure has occurred.
Rerun result: not run | pass | fail | blocked | deferred | superseded
Disposition: open | passed | deferred | superseded
Promotion or demotion recommendation: Keep shadow until repeated evidence supports a change.
Advisory failure explanation: None - no advisory failure exists.
Root cause: None - no failure has occurred.
Regression case: None - no failure has occurred.
Fresh evidence: None - no failure has occurred.
Record consistency: Eval, handoff, board, session, and Git are not yet claiming closure.
Changed user decision approval: No user decision changed.
Approved brief revision: None - the approved brief is unchanged.
Mechanical origin and regression evidence: None - this is not an existing deterministic check.
Good example: Required for subjective product evals and optional for objective product evals; replace with a concrete passing output.
Bad example: Required for subjective product evals and optional for objective product evals; replace with a concrete insufficient output.

## Quality Gap

Keep this historical record after closure. Open gaps require the exact progress
state `Checking — product quality target missed`; closed gaps require a
non-Checking progress state and fresh closure evidence.

Eval ID: EVAL-PRODUCT-001
Gap status: open | closed
What is insufficient: Replace with the observed quality shortfall.
Failed quality dimension: Replace with one approved product-quality dimension.
Good example: Replace with a concrete sufficient output.
Bad example: Replace with the observed or representative insufficient output.
Responsible layer: Product | Design | Tech | Business
Next scoped revision: Replace with the smallest revision that preserves the target.
Evidence required for the next candidate: Replace with fresh original-scenario evidence.
Closed evidence: Required when Gap status is closed; name the fresh passing candidate and comparison.

## Selected eval record syntax

Repeat this exact human-readable field in Project Start Brief, Build Brief,
Verification Handoff, Task Receipt, Test This Now, and Verification Checkpoint:

`Selected eval records: EVAL-ID (authority, result, docs/evals/file.md#eval-id); EVAL-OTHER-ID (authority, result, docs/evals/file.md#eval-other-id).`

The same selected IDs, authority, latest result, and repo-local evidence reference
must appear in all six surfaces and match the referenced Eval Records.
