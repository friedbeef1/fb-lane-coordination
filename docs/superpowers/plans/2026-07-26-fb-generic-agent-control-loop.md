# FB 0.5 Generic Agent Control Loop Implementation Plan

## Goal

Add a generic, repository-local control loop:

`Understand → Route → Produce → Compare → QA → Diagnose/repair → Ready to ship`

The control loop augments the six workstreams. Its stages are capabilities, not
mandatory agents. It remains bounded by the approved brief, existing FB
efficiency budgets, Product authority, and explicit **Push Live** approval.

## Global Constraints

- Keep FB Codex-only, fully open source, repository-local, and independent of an
  FB-hosted service.
- Do not capture transcripts, raw prompts, complete agent outputs, private
  reasoning, secrets, credentials, private data, or estimated token usage.
- Do not add mandatory agent-per-stage execution, an always-LLM router,
  autonomous eval promotion, canonical config promotion, merge, publication, or
  deployment.
- Rules decide clear routing cases. Ambiguous routing returns
  `judgment_required`; an assigned agent records the evidence-based decision.
- Quick BFM retains one repair. Full BFM permits at most two material repair
  loops with a progress comparison before every repeat.
- Use canonical root sources and generate declared plugin mirrors once per
  complete task candidate.
- Use TDD for runtime behavior: focused tests must fail for the missing behavior
  before production implementation.
- Stop implementation at **Ready to ship**. `0.5.0-beta` publication,
  marketplace upgrade, installation, merge, and deployment require explicit
  **Push Live**.

## Task 1 — Routing, Stage Events, Comparison, and Gates

Create `tools/fb-control-loop.cjs` and its focused root test. Add it to the
package manifest and integrate its deterministic doctor/package checks without
adding a public user command.

The module must provide:

- A rules-first router accepting artifact reference, description, metadata
  reference, criteria IDs, cost/degradation risk, safety triggers, and optional
  deterministic route rules. It returns `process`, `skip`, or
  `judgment_required`, with reason and evidence references.
- Safety triggers override process/skip. Skip preserves the baseline artifact
  reference and records that transformation compute was avoided.
- A flat stage-event schema. Required top-level fields are:
  `schemaVersion`, `eventId`, `timestamp`, `runId`, `sessionId`, `taskId`,
  `stage`, `capability`, `attempt`, `decision`, `result`, `artifactRef`,
  `baselineRef`, `candidateRef`, `criteriaIds`, `evidenceRefs`,
  `failureClass`, `durationMs`, `inputTokens`, `outputTokens`, `cost`,
  and `nextAction`.
- Values may be scalar, null, or arrays of strings; nested objects are invalid.
  Usage fields accept authoritative non-negative values or `unavailable`.
- Events append atomically to
  `<git-common-dir>/fb-lane/events/<runId>.jsonl`, are visible across
  worktrees, and reject unsafe identifiers and paths.
- Forbidden-content validation rejects secret/token/environment-value fields,
  transcript/raw-prompt/complete-output/private-reasoning fields, and obvious
  credential material.
- Baseline comparison records criterion-level results plus one verdict:
  `candidate`, `baseline`, `tie`, or `blocked`. Required criteria without
  evidence force `blocked`; no opaque aggregate score is added.
- Gate aggregation supports `focused`, `comparison`, `safety`, `integration`,
  and `release` gates. Selected gates have distinct evidence references.
  Unresolved required gates prevent **Ready to ship**.

Integrate stage-event summaries with existing session verification checkpoints
and doctor using links/counts only; never copy JSONL into committed Markdown.
Add the bundled MCP tools needed for internal agents to validate/record an event
and evaluate deterministic routing. MCP input and output use the same flat
schema and authority boundaries.

Focused tests must cover clear process/skip, safety override, ambiguous routing,
degradation protection, original preservation, flat-schema rejection, privacy
rejection, concurrent atomic appends, cross-worktree reads, comparison
verdicts, missing evidence, distinct gates, and Ready-to-ship prevention.

Commit Task 1 and complete a task-scoped spec/quality review before Task 2.

## Task 2 — Diagnosed Configuration Evolution

Begin only after Task 1 passes review.

Extend the control-loop module with:

- A canonical profile manifest contract mapping stable profile IDs to
  repository-relative prompt/config files and their baseline hashes.
- A golden-fixture manifest contract containing stable case IDs, human-labelled
  expectations, artifact references, criteria IDs, must-pass behavior, and
  must-not-happen behavior.
- A diagnoser that consumes only curated stage events, eval evidence, candidate
  diffs, and observed failures. It classifies `Build failure`,
  `Brief failure`, `Eval failure`, or `Environment failure`.
- A clone-local candidate store at
  `<git-common-dir>/fb-lane/candidates/<candidateId>/`. It contains the proposed
  config, baseline/candidate hashes, frozen fixture manifest hash, bounded
  results, and promotion recommendation.
- A benchmark comparison that runs baseline and candidate against the identical
  frozen golden case set, settings, model reference, limits, and grader
  contract. It preserves failures and rejects missing cases, selective reruns,
  altered criteria, or incompatible environments.
- A promotion validator that always requires explicit Product approval tied to
  the exact candidate and benchmark evidence. It never edits canonical config,
  promotes eval authority, merges, publishes, or deploys.

Use existing repair limits rather than introducing a separate `K`. A repeated
candidate requires material configuration or evidence change; no-progress,
timeout, exhausted budget, or changed user decision stops with an actionable
Product boundary.

Focused tests must cover valid manifests, path/hash safety, frozen case parity,
unfavorable-result preservation, regression detection, candidate isolation,
failure classification, progress comparison, budget stops, and promotion
rejection without exact approval.

Commit Task 2 and complete a task-scoped spec/quality review before Task 3.

## Task 3 — Harness, Plugin, Documentation, and Release Candidate

Add canonical `docs/fb/control-loop.md`, route it from the harness overview, and
update workflow, evidence, eval, guardrail, session, coordination, BFM, Product,
Tech, and setup guidance only where the new contract changes behavior.

Document:

- stages are capabilities, not new workstreams or mandatory separate agents;
- projects opt in through the Build Brief and optional `.fb-lane.json`
  `controlLoop` paths;
- deterministic rules precede agent judgment;
- clone-local JSONL is operational evidence and committed Markdown remains
  curated product truth;
- pairwise comparison, layered non-duplicative gates, bounded diagnosis, golden
  fixtures, isolated candidates, Product promotion approval, and **Push Live**;
- no hosted logger, dashboard, semantic scoring platform, transcript capture,
  automatic adapter, or autonomous production update.

Update `.fb-lane.json` guidance with optional `controlLoop` enablement,
profile-manifest path, and golden-manifest path only. Existing iteration limits
remain authoritative.

Update bootstrap to install the new canonical page, package manifest/mirrors,
active metadata/default prompts, version guidance, and changelog for
`0.5.0-beta`. Preserve historical versions and technical identifiers.

Add focused structural contracts proving root/package wording and behavior
parity, bootstrap migration/preservation, current version consistency, six
workstreams unchanged, no user-facing execution-mode choice, and no autonomous
promotion/deployment claims.

Run focused control-loop, session/eval/efficiency integration, MCP, bootstrap,
package synchronization, metadata, syntax, links, and whitespace checks. Run
the complete validator once at the explicit release checkpoint. Record TASK-050
board, handoff, QA, changelog decision, and independent whole-branch review.

Push a review branch and report **Ready to ship** with optional GitHub links.
Do not merge, publish, reinstall, or deploy without **Push Live**.
