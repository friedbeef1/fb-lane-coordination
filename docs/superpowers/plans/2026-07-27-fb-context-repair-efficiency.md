# FB Context and Repair Efficiency Implementation Plan

## Goal

Keep the reviewed graduated graph and safety controls while reducing raw input
context, repeated evidence reads, repair rehydration, and elapsed work. The
candidate is adopted only when it is at least 10% below the frozen Process-all
baseline for both modeled token units and modeled elapsed time, remains within
one percentage point of reviewed Graduated FB readiness, misses no required
control, and retains 100% immediate safety response.

## Global Constraints

- Preserve the reviewed TASK-050 Process-all, Full FB, and Graduated FB records
  byte-for-byte; add a new candidate arm rather than rewriting prior evidence.
- Keep the current graduated-level policy, six workstreams, safety triggers,
  Product authority, repair budgets, technical identifiers, and **Push Live**.
- Context packets may contain only the current objective, active task and
  workstream, decisions, assumptions, acceptance criteria, required output,
  changed evidence excerpts, and repository-relative references to unchanged
  evidence. They must reject transcripts, accumulated conversation history,
  private reasoning, secrets, credentials, and unredacted private data.
- Canonical repository records remain authoritative. Derived graph/context
  packets route and compress; they never approve scope, resolve contradictions,
  or replace the board, handoff, QA artifact, or Git.
- One focused diagnosis may produce one consolidated repair packet. Only the
  failed proof is rerun. Success, one no-progress cycle, or exhausted existing
  repair budget stops the loop.
- Provider input/output tokens and elapsed time are accepted only when
  authoritative; otherwise record `unavailable`. Operational metrics remain
  clone-local and exclude transcripts and prompt/output bodies.
- Use TDD for every runtime behavior. Generate package mirrors only after a
  canonical task candidate passes review.
- Do not activate candidate guidance or plugin behavior unless the modeled and
  real-Codex adoption gates both pass. No merge, publication, marketplace
  update, installation, or deployment is authorized.

## Task 1 — Delta Context Compiler

Extend the canonical project-graph runtime with an opt-in context compiler and
focused tests.

The worker compiler accepts a safe task ID, one of the six workstreams, a
concrete question, a required-output description, and optional previously known
source hashes. It returns `fb-context-packet-v1` with:

- task ID, workstream, route, current objective, active task node;
- user/approved decisions, assumptions, acceptance criteria, and required
  output;
- changed evidence containing repository-relative source, SHA-256, and bounded
  relevant excerpts;
- unchanged evidence containing repository-relative source and SHA-256 only;
- next source-state hashes, citations, fallback reason, and packet metrics.

The packet may cite at most four sources, embed no more than 4,000 characters
of changed evidence overall and 1,600 per source, and never embed the complete
handoff or QA document. A repeated call with returned source-state hashes must
move unchanged evidence to references and avoid embedding it again.

Add a BFM reconciliation compiler that scans all six workstreams and returns
only `ready`, `blocked`, changed, or conflicting handoffs, with explicit `None
relevant` dispositions. Completed, implemented, deferred, done, and unchanged
content is reference-only or excluded. Duplicate/contradictory ready task IDs
remain a blocking error.

Return a safe normalized-record fallback whenever the graph is unhealthy,
sources are missing, or required fields are contradictory. Add no public CLI
command and do not activate skill guidance in this task.

Focused RED/GREEN tests cover extraction, caps, changed/unchanged behavior,
all six workstreams, None relevant, status exclusion, contradiction,
unhealthy fallback, path safety, and forbidden-content rejection.

## Task 2 — Consolidated Repair and Local Efficiency Evidence

Extend the control-loop/efficiency runtime without changing the graduated
router.

Add a consolidated repair planner that consumes one curated diagnosis, current
candidate identity, previous candidate identity, one or more failed proof IDs,
passed proof IDs, evidence references, existing Quick/Full budget authority,
and visible safety triggers. It returns exactly one of:

- `repair`: one minimal packet containing the current brief, candidate/diff,
  specific failure, required evidence, and failed proofs to rerun;
- `ready`: all required proofs passed, so stop immediately;
- `blocked-no-progress`: candidate/evidence did not materially change;
- `blocked-budget`: existing repair authority is exhausted;
- `blocked-safety`: the required safety boundary is unresolved.

Passed proofs cannot be scheduled again. A second Quick repair, third Full
repair, repeated no-progress candidate, or unresolved safety gate cannot
produce another packet.

Extend flat clone-local stage events with optional non-negative or
`unavailable` context metrics: context bytes, changed source count, reused
source count, and repeated-read count. Keep input/output tokens and duration as
the authoritative efficiency fields. Add an aggregate helper that reports raw
tokens, elapsed time, repeated reads, and repair passes without storing prompt
or output content.

Focused RED/GREEN tests cover the five decisions, failed-proof-only rerun,
budget/safety precedence, no-progress stop, flat metric validation, aggregation,
privacy rejection, and backward compatibility with existing events.

## Task 3 — Frozen Modeled Adoption Experiment

Add one context-efficient candidate arm to the reviewed 288-case graduated
benchmark using the exact prior truth, settings, seeds, public observations,
fallibility draws, and first-three-arm records.

Before the authoritative run, freeze and hash:

- the candidate context-cost and repair-reuse model;
- target thresholds;
- runner/grader implementation;
- reused reviewed evidence identity;
- a declaration that unfavorable results are preserved and no selective rerun
  or post-result threshold tuning is allowed.

The adoption gate requires all of:

- no more than 298,080 modeled token units;
- no more than 557.3 modeled minutes;
- readiness of at least 79.2%;
- zero missed required controls;
- 100% immediate safety-trigger response;
- unresolved failures no greater than reviewed Graduated FB;
- no weakening of privacy or release boundaries.

Write a machine-readable result and readable report showing raw tokens and raw
time first, then readiness and tokens per ready outcome. If any predicate
fails, preserve the rejected result, leave active guidance/plugin unchanged,
and skip Task 4’s real-Codex/adoption work.

Focused tests prove exact reproduction of all 864 reviewed records, common
draws, recomputation, hash/metadata binding, mutation rejection, threshold
logic, and honest rejected-result preservation.

## Task 4 — Real-Codex Check, Adoption, Documentation, and Mirrors

Run only if Task 3 passes every modeled predicate.

Run six isolated real-Codex comparisons using the same model and bounded
settings:

- current Graduated FB and context-efficient FB on clean evolving work;
- both arms on repeated-failure recovery;
- both arms on sensitive work.

Use equal starting snapshots and identical facts, decisions, success criteria,
and safety triggers. Record authoritative provider input/output tokens, elapsed
wall time, summed agent runtime, repeated source reads, repair passes, and
outcome checks. Do not store transcripts, raw prompts, complete outputs, or
private reasoning. Preserve every valid unfavorable run and do not repeat a run
to improve the result.

The real-Codex gate requires the context-efficient arm to use at least 10% fewer
raw tokens and 10% less elapsed wall time in aggregate, with no outcome,
required-control, or safety regression. If it fails, preserve the evidence and
do not activate the candidate.

Only after both gates pass:

- make delta worker/reconciliation packets and consolidated repair the active
  canonical BFM behavior;
- expose the internal MCP surfaces required to compile packets and record safe
  metrics, without adding a user command;
- update the harness, coordination, Product, BFM, setup guidance, and concise
  public documentation;
- state that users do not choose an execution mode;
- report raw time/tokens before outcome-normalized measures and label modeled
  evidence separately from observed Codex evidence;
- generate declared plugin mirrors mechanically once.

Run focused runtime, MCP, session/efficiency, package-context, parity, syntax,
links, and whitespace checks plus one independent whole-branch review. Do not
run another complete release checkpoint unless Product later requests a
release. Stop at local **Ready to ship**; **Push Live** remains separate.
