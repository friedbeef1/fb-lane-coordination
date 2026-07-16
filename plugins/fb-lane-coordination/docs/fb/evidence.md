# Evidence and review

## Test This Now

Harness-v2 review enforcement is opt-in. Add `fb_harness: v2` to the detailed
handoff and use one exact visible `Review state` value:

- `not reviewable`
- `runnable sandbox`
- `staging candidate`
- `completed build`

An approved initial v2 handoff must contain both `## Project Start Brief` and
`## Build Brief`. Historical and other non-v2 handoffs are exempt. A v2 handoff
with `Review state: not reviewable` is also exempt from review-packet checks.
The other three states are reviewable and require a complete `## Test This Now`
packet before `doctor` will accept them.

Before asking a user to review, provide concrete, actionable values in this
canonical bullet/bold format; do not leave `TODO`, `TBD`, example tokens, or
angle-bracket prompts in place:

- **Outcome type:** Runnable sandbox for the approved build
- **Direct links:** [Open the review surface](review/sandbox.html)
- **Exact steps and expectations:**
  1. Open the direct link and confirm the approved build loads.
  2. Complete the named review flow and compare the visible result with the Build Brief.
- **Pass criteria:** The approved flow completes and the expected result is visible.
- **Known limits:** External account and device coverage are not included in this review.
- **Failure-report format:** what happened, what was expected, link or screenshot, and environment.

Local Markdown links must resolve relative to the handoff file. Remote links
are checked only for valid Markdown-link shape and are not fetched.

If access is absent, state `Status: blocked — review access is missing`; do not
call it ready to test. For a not-yet-runnable v2 handoff, use this blocking form
with a concrete next action:

```md
Blocked — no review environment yet
Next Product/BFM action: create the runnable review environment and add its direct Markdown link.
```

This remains blocked until Product/BFM completes the action and supplies the
runnable review environment.

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
