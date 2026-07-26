# Generic agent control loop

FB can add a repository-local control loop to an approved Build Brief:

`Understand → Route → Produce → Compare → QA → Diagnose/repair → Ready to ship`

These stages are **capabilities, not mandatory agents**. One agent may perform
several stages, or deterministic code may perform a stage without an agent.
They augment Product/User, Business, Design, Tech, Discovery, and Bugs; they do
not create new workstreams or change Product/BFM authority.

## Opt in through the Build Brief

Use the loop only where transformation, comparison, or diagnosed configuration
evolution is useful. The Build Brief names the enabled capabilities, criteria,
evidence, gates, and repair budget. Users describe the outcome; FB selects its
internal execution treatment.

A project may declare paths in `.fb-lane.json` without enabling autonomous
behavior:

```json
{
  "controlLoop": {
    "enabled": true,
    "profileManifest": "config/fb/control-loop-profiles.json",
    "goldenManifest": "config/fb/control-loop-golden.json"
  }
}
```

These paths are repository-relative. Existing Quick and Full BFM iteration,
time, safety, and approval limits remain authoritative.

## Route before spending

Deterministic rules run before agent judgment. A clear item is routed to
`process` or `skip`; a safety trigger overrides either route. Ambiguous cases
return `judgment_required` so an assigned agent can record an evidence-based
decision. A skipped transformation preserves the baseline artifact and avoids
unnecessary compute or quality degradation.

## Operational evidence and durable truth

Every stage may append one flat JSONL event under the Git common directory.
That clone-local ledger supports diagnosis across worktrees without becoming a
new source of product truth. It stores references, decisions, results, bounded
usage, and next actions—not transcripts, raw prompts, complete outputs, hidden
reasoning, credentials, environment values, secrets, or private data.

Committed Markdown remains curated product truth:

- the board says what is active;
- the handoff records what was decided and approved;
- the QA artifact records what was verified;
- Git records what changed.

Session verification checkpoints link to stage-event summaries and counts.
They do not copy the JSONL into committed records.

## Compare and gate without duplicating proof

Pairwise comparison evaluates a candidate directly against its preserved
baseline for named criteria. A required criterion without evidence blocks the
comparison; there is no opaque aggregate score. The result records whether the
candidate, baseline, or neither is acceptable.

Layered gates are non-duplicative:

- `focused` proves the smallest changed behavior;
- `comparison` proves the candidate is not worse than its baseline;
- `safety` protects sensitive boundaries;
- `integration` proves combined slices;
- `release` performs the explicitly requested release checkpoint.

Each selected gate has distinct evidence. Any unresolved required gate prevents
**Ready to ship**.

## Bounded diagnosis and configuration evolution

Diagnosis consumes only curated events, eval evidence, candidate diffs, and
observed failures. It classifies a Build, Brief, Eval, or Environment failure
and proposes a bounded next action. Quick BFM keeps one repair. Full BFM keeps
at most two material repair loops, requires progress before every repeat, and
stops on no progress, timeout, exhausted budget, or a changed user decision.

Prompt or configuration changes are written to an isolated clone-local
candidate. Baseline and candidate run against the same frozen golden fixtures,
settings, model reference, limits, and grader contract. Missing cases,
selective reruns, changed criteria, incompatible environments, or discarded
unfavourable outcomes block the recommendation.

Canonical configuration changes require exact Product approval tied to the
candidate and benchmark evidence. The loop never promotes itself, changes eval
authority, edits canonical configuration, merges, publishes, or deploys.
Only **Push Live** authorizes the final release action.

## Deliberate limits

FB does not add a hosted logger, hosted dashboard, semantic scoring platform,
transcript capture, automatic external adapter, mandatory agent per stage, or
autonomous configuration promotion. If richer telemetry is useful, it may
supply optional evidence; approved briefs, handoffs, QA, and Product closeout
remain authoritative.
