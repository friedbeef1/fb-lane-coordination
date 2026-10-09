# Autonomous BFM: show the plan, then keep moving

An explicit `$bfm` invocation in Product/BFM authorizes planning and routine
execution toward the user's stated outcome. Recognize `/bfm` as the same user
intent where supported. Show the complete prioritized queue and Build Brief
before starting; this is an explanation, not a routine second approval request.
Continue through implementation, focused proof, integration and preparation of
the verified candidate. Do not end a turn merely to recommend the next safe,
in-scope step: take it. Keep the user informed while Codex is still working.

This contract replaces mandatory queue-specific “okay”, phased routine
self-approval, and one-repair limits for **Product-directed Full BFM recovery**.
It does not replace Quick slice limits, release-validator limits, or hard gates.
Existing projects with an explicit stricter plan-only/approval rule keep that
rule until their owner changes it. A handoff notification is not `$bfm` and
does not activate planning or execution. Evidence workstreams remain planning
surfaces; sidechat authority and exact task identity stay unchanged.

## Permission is capability, not scope

Full Access means the host permits tools; it does not supply missing user
decisions, spend consent, credentials, or release authority. FB never changes
Codex permissions, clicks an approval for the user, or tries another route to
bypass a denial. When the host can request required permission, request it once
for the exact operation. Otherwise report the access blocker and continue only
independent work that is already permitted.

Routine sequencing, diagnosis, tests, repairs and faithful record updates need
no further approval within the invoked scope. Reuse concrete existing approvals;
do not ask again merely because a permission exists. Pause for a changed product
outcome, disputed priority, genuinely unclear scope, unresolved locks, or a
required privacy/authentication/payment/provider/destructive-operation gate.
**Push Live** remains required for merge, publication, installation and deployment.
An explicit review-only request stays read-only even with Full Access.

## Five recovery attempts per issue

1. Identify the failed acceptance criterion and keep one stable issue ID.
2. Diagnose a concrete cause; consolidate related fixes into one attempt.
3. Make the smallest supported correction and rerun only the failed proof.
4. If it passes, stop recovery immediately and move to the next authorized step.
5. If it fails, record the approach, candidate/evidence delta, observed result
   and proof link. Try a distinct supported correction without asking “go ahead”.
6. After **five unsuccessful attempts on that issue**, stop its automatic work
   and send a clear note. Do not make a sixth attempt automatically.

Five is a ceiling, not a quota. If there is no distinct evidence-backed action,
or permissions, safety, cost or scope block progress, stop that issue earlier.
A no-progress attempt counts as failed; it does not require a prompt when a
different supported correction remains available. Renaming an issue, spawning
another worker, reslicing, upgrading from Quick to Full or resuming a chat never
resets the count. Include earlier Quick repair attempts in the same issue ledger.
Do not weaken tests, expand scope, rerun unchanged commands, or spend unapproved
credits to exhaust the allowance. A changed candidate/evidence reference must
represent real change, not a renamed file or reworded report.

Use `evaluateBfmRecovery` from `tools/fb-efficiency.cjs` after each focused attempt.
Persist its returned `state` as a JSON block in the existing task QA artifact;
read that block on resume. Supply the stable `issueId`, concrete `approach`,
`deltaRef`, `evidenceRef`, and observed `outcome` (`passed` or `failed`). A current
`blockingGate` takes precedence even if attempts remain. The helper checks
structure and budget; it cannot prove semantic progress or grant permissions.
Product/BFM must verify the cited evidence and applicable gates itself.

The stop note states: what remains broken; the five attempts and their results
(or the earlier concrete blocker); preserved candidate and evidence links;
what can continue independently; and the smallest recommended next decision.
Deliver it in the current Product/BFM chat. Use existing exact-task result
notices when available; do not create new chats or claim undelivered messages.

## Keep verification proportional

Quick time/iteration limits still bound each slice. Product/BFM reslices or
routes remaining work through Full BFM without a routine approval prompt; it
does not reset the recovery count. Preserve green proof for unchanged work.
Keep focused proof per slice, one whole-candidate review, and the final release
checkpoint. Five focused recoveries do **not** permit five full validators,
five reviewers, nested repair loops, or bypassing a failed release checkpoint.
The existing initial-plus-final broad-check limit still applies. Complete
available focused recovery first; reserve the final broad pass for its candidate.

## Shared communication across all roles

Apply this communication rule in User, Business, Design, Tech, Discovery, Bugs
and Product/BFM. While work continues, say **Codex is still working**. At
completion, say **Task completed** or an equally clear completion phrase.
End each ordinary user-facing update with two separate lines:

**TLDR:** One concise sentence explaining the outcome or current state.
**Recommendation:** The useful next step; execute routine authorized steps
without turning the recommendation into another approval request. Offer
Yes/No or numbered choices only when a material user decision is needed.

Preserve required machine-readable formats and quiet monitoring.

## Examples

| Situation | Product/BFM action |
|---|---|
| Clear `$bfm` request, complete intake, tools permitted | Show plan, then execute; no “okay?” |
| Second failed correction, different supported fix available | Record failure and continue within the same five-attempt budget |
| Fifth failure | Send the stop note; no sixth automatic attempt |
| Full Access, no release authorization | Prepare candidate; do not merge or deploy |
| Workstream sends a ready handoff | Acknowledge/queue only; do not start BFM |
| Missing access or material decision | Name the exact blocker; do not bypass it |
