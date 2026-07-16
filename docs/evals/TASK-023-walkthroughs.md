# TASK-023 Eval Walkthrough Evidence

These shadow records preserve the two approved walkthroughs. They recommend
future guardrails but make no authority change.

## Eval Record

Eval ID: EVAL-HARNESS-DIRECT-LINK-001
Eval type: harness
Authority: shadow
Previous authority: none
Authority change approval: Product approval: not required; Reference: initial-shadow-record
Authority change recorded by: Product/BFM
Authority decision: Product/BFM recorded the initial shadow authority; no promotion occurred.
Judgment: objective
Trigger: A reviewable Test This Now packet is prepared.
Scenario: The initial packet omits its direct review link.
Quality target: The reviewer can open the named candidate directly from the packet.
Must pass: The direct Markdown link exists and resolves to the intended review surface.
Must not happen: A missing link is described as runnable or passing evidence.
Evidence required: Original missing-link failure, revised packet, fresh link resolution, and regression case.
Owner: Product/BFM
Latest result: pass
Failure classification: Eval failure
Revision: Added the direct Markdown link without weakening the review-access target.
Rerun result: pass - the original missing-link scenario resolves in the focused TASK-023 walkthrough.
Disposition: passed
Promotion or demotion recommendation: Recommend a mechanical direct-link guardrail for Product review; remain shadow with no automatic promotion.
Advisory failure explanation: None - this record remains shadow.
Root cause: The handoff author omitted the direct-link field from the initial review packet.
Regression case: Focused test removes the direct link and expects deterministic rejection before restoring it.
Fresh evidence: `node tools/fb-eval.test.cjs` reran the original scenario and passed after revision.
Record consistency: TASK-023 handoff, eval record, focused test, board status, and branch diff identify the same shadow walkthrough.
Changed user decision approval: No user decision changed; approval was not required.
Approved brief revision: None - the approved brief is unchanged.
Mechanical origin and regression evidence: None - mechanical status is only recommended and was not applied.

## Eval Record

Eval ID: EVAL-PRODUCT-CREATOR-SPECIFICITY-001
Eval type: product
Authority: shadow
Previous authority: none
Authority change approval: Product approval: not required; Reference: initial-shadow-record
Authority change recorded by: Product/BFM
Authority decision: Product/BFM recorded the initial shadow authority; no promotion occurred.
Judgment: subjective
Trigger: A creator-commerce candidate produces recommendations for a named product, audience, and channel.
Scenario: The initial functional candidate returns generic recommendations unrelated to the ceramics launch and workshop-buyer audience.
Quality target: Recommendations are useful and specific to the supplied creator-commerce context.
Must pass: Each recommendation names relevant product, audience, channel, and concrete next action.
Must not happen: Functional but generic output is called complete or the quality target is weakened to pass.
Evidence required: Initial generic output, complete Quality Gap, revised candidate, and fresh side-by-side Product comparison.
Owner: Product/BFM
Latest result: pass
Failure classification: Eval failure
Revision: Bound each recommendation to the named product, audience, and channel while preserving the specificity target.
Rerun result: pass - the original creator-commerce scenario passes the concrete Good/Bad comparison.
Disposition: passed
Promotion or demotion recommendation: Keep shadow until repeated product scenarios support an authority decision.
Advisory failure explanation: None - this record remains shadow.
Root cause: The initial recommendation path failed to use the supplied commerce context.
Regression case: Focused test preserves the original generic-output comparison and complete Quality Gap requirements.
Fresh evidence: `node tools/fb-eval.test.cjs` produced a new candidate fixture and reran the original quality comparison.
Record consistency: TASK-023 handoff, Quality Gap, focused test, board status, and branch diff identify the same shadow walkthrough.
Changed user decision approval: No user decision changed; approval was not required.
Approved brief revision: None - the approved brief is unchanged.
Mechanical origin and regression evidence: None - this remains subjective Product judgment.
Good example: For the ceramics launch, send a two-message cart-recovery sequence to prior workshop buyers and compare recovered checkouts after 48 hours.
Bad example: Post more often and improve engagement on social media.

Progress: Complete — product quality target met

## Quality Gap

Eval ID: EVAL-PRODUCT-CREATOR-SPECIFICITY-001
Gap status: closed
What is insufficient: The initial functional candidate gives generic recommendations that ignore supplied creator-commerce context.
Failed quality dimension: output relevance and specificity
Good example: Ground each action in the ceramics launch, workshop-buyer audience, channel, and measurable next step.
Bad example: Improve engagement and use social media more.
Responsible layer: Product
Next scoped revision: Bind each recommendation to product, audience, and channel inputs without changing the approved target.
Evidence required for the next candidate: Fresh original-scenario output and a side-by-side Product comparison against the Good/Bad examples.
Closed evidence: The fresh contextual candidate passed the original Good/Bad comparison in `node tools/fb-eval.test.cjs` without weakening the target.
