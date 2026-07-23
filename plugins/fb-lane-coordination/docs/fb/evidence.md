# Evidence and review

Store complete command output and verification fingerprints in the authoritative
QA artifact described by [records.md](records.md). Handoffs and chat link to it
instead of copying logs.

Use the seven-field Project Start Brief and Build For Me (BFM) boundary from
[start.md](start.md). Execution begins only after approval and explicit `$bfm`;
then prepare the execution and review evidence here.

## Test This Now

Harness-v2 review enforcement is opt-in. New Full BFM handoffs use
`fb_harness: v3`, which preserves the v2 review rules and adds the canonical
[changelog closeout decision](workflow.md#internal-approval-record). Historical
v2 handoffs remain valid. Add `fb_harness: v2` to an older detailed
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

The board enum `Staging QA` means only that a candidate awaits verification.
Record its actual environment separately as local, sandbox, staging, or
completed build; the enum alone is not evidence of a staging deployment.

For an accessible candidate, record this canonical bullet/bold packet. Do not
leave `TODO`, `TBD`, example tokens, or angle-bracket prompts in place. System
verification is primary; review links are optional and `Your input needed: none`
does not ask the user to perform routine manual testing:

- **System verification:** passed — smoke/result/evidence are recorded below.
- **Your input needed:** none.
- **Outcome type:** Runnable sandbox for the approved build
- **Direct links:** Optional review links — [Open the review surface](review/sandbox.html)
- **Exact steps and expectations:**
  1. System smoke opens the candidate and records the result/evidence.
  2. System verification confirms the approved flow and expected result.
- **Pass criteria:** System smoke passes and its recorded evidence matches the approved flow.
- **Known limits:** External account and device coverage are not included in this review.
- **Failure-report format:** what happened, what was expected, link or screenshot, and environment.
- **What was evaluated:** selected eval IDs and authority with the evaluated surface.
- **Exact scenarios and expected results:** original scenario plus concrete expectation.
- **Known quality gaps:** unresolved gaps or an explicit scoped none/limit.
- **Required user judgment:** only subjective judgment, unavailable access, a real
  device/account/payment/permission gate, a scope-changing decision, or final
  release approval not replaced by checks.

Local Markdown links must resolve relative to the handoff file. Remote links
are checked only for valid Markdown-link shape and are not fetched.

If access is absent, state `Status: blocked — review access is missing`; do not
call it ready to test. For a not-yet-runnable v2 handoff, use the
[canonical beginner pause card](guardrails.md#canonical-beginner-pause-card)
with a concrete next action:

```md
Paused here

Why: Blocked — no review environment yet; review access is missing.
What FB already tried: Confirmed that no runnable review environment or direct link is available.
What can continue safely: Product/BFM can prepare the environment and preserve completed verification evidence.
What I need from you: Nothing yet unless Product/BFM identifies an external access decision only you can make.
Next action and owner: Product/BFM owns review-access recovery.
Next Product/BFM action: Create the runnable review environment and add its direct Markdown link.
What happens after: FB verifies the link, updates Test This Now, and returns the candidate for review.
```

This remains blocked until Product/BFM completes the action and supplies the
runnable review environment.

System-run smoke is the default review contract. An accessible candidate says
`System verification: passed`, records its smoke/result/evidence, may include
review links, and says `Your input needed: none`. A handoff file is a Markdown
artifact: it is not itself an owner transfer, review package, or release
checkpoint.

## Verification Handoff

Before testing is handed to the user, add `## Verification Handoff` to the
detailed task handoff with the candidate branch or commit, test-plan link,
exact commands, environment, results, runnable evidence links, manual pass
criteria, and recovery already attempted. Record the next Product/BFM recovery
action. Missing or stalled checks are pending or blocked evidence; ordinary
recovery stays with Product/BFM. Ask the user only for a real approval or an
external manual, device, or account gate.

When evals are selected, Verification Handoff and Task Receipt include
`Selected eval results and evidence`. A failure closes only with the original
scenario rerun, fresh evidence, root cause, regression case, record/Git
consistency, visible limits, and approval for changed user decisions. See
[evals.md](evals.md).

At a release checkpoint, evidence also records the passing changelog decision
against the exact candidate commit. A missing, stale, unresolved, or
candidate-mismatched decision cannot be reused and cannot reach **Ready to
ship**.

## Quality and cleanup

Evidence names the exact split: delivered work, checks that passed, and any
remaining gate. UI work also needs actual visual verification: text must not
clip or spill, expected theme/assets must load, and responsive/interactions must
be checked. If external services were touched, record test mode, created
records/resources, cleanup evidence, or the pending cleanup gate.
