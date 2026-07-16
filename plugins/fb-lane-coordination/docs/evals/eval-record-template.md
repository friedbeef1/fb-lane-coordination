# FB Eval Record Template

Use the lifecycle in [docs/fb/evals.md](../fb/evals.md). Copy one `## Eval
Record` per stable scenario. New records start shadow; Product/BFM records every
authority change.

## Eval Record

Eval ID: EVAL-HARNESS-001
Eval type: harness | product
Authority: shadow | advisory | blocking | mechanical
Previous authority: none | shadow | advisory | blocking | mechanical
Authority change approval: not required - initial shadow record | explicit Product approval reference
Authority change recorded by: Product/BFM
Authority decision: Product/BFM recorded the initial shadow authority.
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
Promotion or demotion recommendation: Keep shadow until repeated evidence supports a change.
Advisory failure explanation: None - no advisory failure exists.
Root cause: None - no failure has occurred.
Regression case: None - no failure has occurred.
Fresh evidence: None - no failure has occurred.
Record consistency: Eval, handoff, board, session, and Git are not yet claiming closure.
Changed user decision approval: No user decision changed.
Mechanical origin and regression evidence: None - this is not an existing deterministic check.
Good example: Required for subjective product evals; replace with a concrete passing output.
Bad example: Required for subjective product evals; replace with a concrete insufficient output.

## Quality Gap

Use this only while the exact progress state is
`Checking — product quality target missed`.

Eval ID: EVAL-PRODUCT-001
What is insufficient: Replace with the observed quality shortfall.
Failed quality dimension: Replace with one approved product-quality dimension.
Good example: Replace with a concrete sufficient output.
Bad example: Replace with the observed or representative insufficient output.
Responsible layer: Product | Design | Tech | Business
Next scoped revision: Replace with the smallest revision that preserves the target.
Evidence required for the next candidate: Replace with fresh original-scenario evidence.
