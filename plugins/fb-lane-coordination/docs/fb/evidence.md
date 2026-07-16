# Evidence and review

## Test This Now

Before asking a user to review, provide this short packet:

- **Outcome type:** <what is ready to assess>
- **Direct links:** <runnable links>
- **Exact steps and expectations:** <numbered actions and expected result>
- **Pass criteria:** <observable pass condition>
- **Known limits:** <what is not covered>
- **Failure-report format:** what happened, what was expected, link or screenshot, and environment.

If access is absent, state `Status: blocked — review access is missing`; do not
call it ready to test. For a not-yet-runnable v2 handoff, use `Blocked — no
review environment yet` and name the next Product/BFM action.

## Verification Handoff

Before testing is handed to the user, add `## Verification Handoff` to the
detailed task handoff with the candidate branch or commit, test-plan link,
exact commands, environment, results, runnable evidence links, manual pass
criteria, and recovery already attempted. Record the next Product/BFM recovery
action. Missing or stalled checks are pending or blocked evidence; ordinary
recovery stays with Product/BFM. Ask the user only for a real approval or an
external manual, device, or account gate.

## Quality and cleanup

Evidence names the exact split: delivered work, checks that passed, and any
remaining gate. UI work also needs actual visual verification: text must not
clip or spill, expected theme/assets must load, and responsive/interactions must
be checked. If external services were touched, record test mode, created
records/resources, cleanup evidence, or the pending cleanup gate.
