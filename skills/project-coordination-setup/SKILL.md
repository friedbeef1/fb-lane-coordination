---
name: project-coordination-setup
description: Use when bootstrapping an FB-coordinated project with board, handoff, workstream, and harness routes.
---

# Set up an FB-coordinated project

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

Default execution uses focused proof per slice, one consolidated behavioral
repair maximum across the candidate, one whole-candidate review, and one final
release checkpoint. Do not create separate review or re-review loops for
individual slices. Safety, sensitive-operation, authority, worktree/lock,
changelog, and **Push Live** gates remain unchanged.

`$fb-setup` is the primary public invocation for this canonical setup workflow.
Natural-language setup requests and the long-form skill invocation remain
compatible fallbacks.

FB is **Graph Engineering for Everyday People**. Setup installs the
repository-local product-delivery map that connects workstreams, decisions,
evidence, dependencies, implementation, verification, and release state. It
does not require a graph database, knowledge graph, or GraphQL.

Bootstrap includes `docs/fb/control-loop.md`. Projects opt in through the Build
Brief and may configure repository-relative `controlLoop.profileManifest` and
`controlLoop.goldenManifest` paths in `.fb-lane.json`. Do not enable hosted
logging, transcript capture, or autonomous configuration promotion.

The bootstrap installs the canonical eleven-page [FB harness](../../docs/fb/README.md)
pack and adds or updates a thin managed route in `AGENTS.md` and
`.codex/rules.md`. Fresh projects receive the pack and routes. On reruns, the
bootstrap preserves project-owned text and replaces only a complete block from
`<!-- fb-harness-route-start -->` through `<!-- fb-harness-route-end -->`;
unmatched markers and all text outside that exact boundary remain untouched.

The public model is six evidence-producing workstreams plus one Product/BFM
control centre and seven pinned repository-scoped Codex tasks. The evidence
workstreams are User, Business, Design, Tech, Discovery, and Bugs. Setup
preserves existing project-owned cards and adds only missing cards. Each
relevant evidence-producing workstream runs a
mini-loop and records a ready or blocked `docs/handoffs/<TASK-ID>.md` for the BFM
scanner; inactive workstreams need no manufactured work. BFM stops at **Ready to
ship**. Only **Push Live** authorizes merge or deployment.

Fresh bootstrap also creates a clone-local onboarding receipt in the Git common
directory, shared by every worktree in that clone. Non-Git projects use ignored
`.fb/onboarding.json`. It prints one permission question introducing FB. Relay
that question to the user exactly once:

> May I reuse and pin matching repository-scoped sidebar tasks, rename legacy
> matches where needed, and create only the missing roles: Product/BFM, User,
> Business, Design, Tech, Discovery, and Bugs?

This approval is for deterministic reconciliation of the seven-role set, not
blanket creation of seven new tasks. Prefer reuse. Do not rename, pin, or create
tasks before explicit Yes. On No, record
`node tools/fb-onboarding.cjs permission declined`. Workstream planning may
continue, but `$bfm` source execution and an empty-queue claim remain blocked
until exact-project setup is granted and verified. On
Yes, record `node tools/fb-onboarding.cjs permission granted`, then own the
native exact-project reconciliation below. The Node CLI plans and verifies
inventory files; it does not call the sidebar or Codex-native task controls.

### Sidebar identity repair

An optional `.fb-lane.json` `taskTitlePrefix` defines this repository's
expected visible titles; it defaults to `FB`. The prefix is presentation only,
not identity authority. Exact project ID, canonical root, stable task ID,
complete native details, and pinned state remain authoritative.

Duplicate-looking suites and prefix, rename, archive, or repair requests must
enter exact-project reconciliation before any task mutation. Migrate supported
generic or legacy bindings by stable-ID rename and create only a role proved
absent. `archive` is never a planner or
`attemptedActions` action: reconcile first, then archive only an exact task ID
for a noncanonical task with explicit authority; never archive from title alone
or archive a canonical binding.

After a prefix or rename mutation, fresh evidence and the receipt must prove all seven roles with exact titles and pinned state, including all seven repository-expected visible titles and the same task IDs.
If FB was installed, upgraded, or replaced in this task, open a fresh Codex task
before any plugin-dependent setup or repair mutation.

### Native exact-project reconciliation

1. Resolve the canonical repository root. Call `list_projects` and select one
   exact project ID whose canonical repository path identifies that root. If
   the project is absent, ambiguous, or path identity disagrees, stop without
   mutation and give the role-specific manual fallback.
2. Call `list_threads({"limit":50})`; `limit` is its only reliably supported
   argument on current hosts. Do not pass `projectId`, repository path, search,
   `query`, or invented pagination arguments. The response's `pinnedThreads`
   array is the native complete pinned-task set; `threads` may contain exactly
   50 global non-pinned tasks and therefore be incomplete.
   - When the non-pinned response is below the limit, filter it by the already
     verified exact project ID and canonical repository path as before.
   - When it reaches the limit, run the read-only local adapter. First run
     `node tools/fb-onboarding.cjs local-candidates --repository-root <canonical-root> --project-id <project-id>`.
     It reads only active task IDs, roots, archive state, and source kind from
     Codex `state_5.sqlite`, which is not sufficient authority by itself;
     helper, guardian, and spawned subagent rows are
     excluded. For every returned candidate ID, call `read_thread` once to get
     its current title and root. Save one metadata-only JSON evidence bundle
     containing the exact project ID/root/host/kind, task IDs/titles/roots,
     pinned membership, and native availability fields. Never save previews,
     turns, messages, tool items, rollout paths, or raw thread responses. Then run
     `node tools/fb-onboarding.cjs inventory-local <native-evidence.json> --repository-root <canonical-root> --project-id <project-id>`.
   This joined evidence must prove exact-project identity and completeness.
   The state database has no saved project ID and may have stale title or pin
   fields. The adapter succeeds only
   when the exact local saved project, complete read-only candidate set, current
   per-task native details, and native pinned-task set agree. Unsupported local
   row kinds, missing details, unavailable native sources, or contradictory
   project/root/pin evidence fail closed before mutation. Save only the
   adapter's proven-complete object with `complete: true` and `tasks`.
3. Run
   `node tools/fb-onboarding.cjs plan <initial-inventory.json> --repository-root <canonical-root> --project-id <project-id>`.
   Stop on `complete: false`. Execute only the deterministic action objects
   returned by this plan. `reuse` means no native action and must never mutate
   a task. This makes setup safe to run again: re-list a complete inventory,
   plan again, create only roles still missing, and preserve existing project
   work.
4. Before each non-`reuse` native tool call, append one privacy-safe ledger row
   with contiguous `sequence`, `action` (`create`, `rename`, or `pin`), canonical
   `workstream`, and `outcome`; update `outcome` to `succeeded`, `failed`, or
   `unknown` after the call and add only the returned `taskId` when available.
   Never put prompts, titles, provider responses, error messages, or timestamps
   in `attemptedActions`. Then use
   the real Codex controls: `create_thread` for `create`, `set_thread_title`
   for `rename`, and `set_thread_pinned({ pinned: true })` for `pin`. A created
   task uses the exact project, a local environment rather than a worktree, and
   the idle prompt from
   `node tools/fb-onboarding.cjs prompt <workstream> <canonical-root>`. Pass the
   action title when `create_thread` supports it. After a created task returns
   an ID, confirm its title; if it is not exact, record another attempted call
   and use `set_thread_title` with the plan action's title before the planned
   pin. Retain failed and unknown rows honestly across any later rerun; never
   discard partial-failure history from `attemptedActions`.
5. On any unavailable control, rejected call, missing created-task ID, or other
   partial failure, stop immediately. Keep onboarding unreconciled, report the
   complete attempted action ledger, and emit the role-specific manual
   fallback. For a successful or uncertain newly created role, tell the user
   to locate and verify that task; never create or recreate a duplicate.
6. After every planned action succeeds, Re-list the exact project through
   `list_threads` and again prove the inventory complete. If the non-pinned
   response is capped, rerun `local-candidates`, `read_thread` for every current
   candidate, and `inventory-local`; do not reuse the pre-mutation evidence.
   Save the final JSON
   inventory with the normalized field `attemptedActions` (use `[]` when the
   plan needed no native mutation). It must show all seven repository-expected visible titles:
   Product/BFM, User, Business, Design, Tech, Discovery, and Bugs. These are
   exact titles with the same task IDs and pinned state; the strict receipt must
   preserve those bindings.
7. Only then run
   `node tools/fb-onboarding.cjs reconcile <final-inventory.json> --repository-root <canonical-root> --project-id <project-id>`.
   This strict route verifies the final inventory and writes the clone-local
   receipt. A failed reconcile remains unreconciled and must be reported with
   the attempted action ledger; never translate an attempted call into success.

Product/User is a legacy User title; a lone legacy Product title maps to
Product/BFM. If native controls or complete inventory are unavailable, create
nothing. For each role, state the precise next action from the plan or observed
state: reuse the exact task, rename the named legacy task, pin the named task,
or create only if absent. Generate the corresponding paste-ready idle prompt
with `node tools/fb-onboarding.cjs prompt <workstream> <canonical-root>`. If
inventory completeness itself is unknown, provide all seven prompts and tell
the user to create only roles not already present. Pinning never starts work,
approves scope, invokes `$bfm`, or authorizes release. Only **Push Live**
authorizes merge, publication, or deployment. Bootstrap reruns do not repeat
the question or overwrite the decision receipt.

Use the exact plain-language status for a successful repeat setup. Report:
`FB setup is safe to run again: only missing or outdated FB-managed setup was
updated, and existing project work was preserved.`

### Transactional migration between checkouts

Setup and reconciliation run only from the active canonical checkout. If FB
detects a former, quarantined, or otherwise noncanonical root, stop before
repository or task mutation and use the existing `fb-lane.cjs migration`
inventory, commit, and rebind routes. Product/BFM must disposition every
discovered branch, commit/tree, worktree, dirty-file, handoff, and routing
difference before the runtime atomically records one canonical root plus
quarantined former roots. Rebind succeeds only from a proven-complete
exact-project inventory with all seven tasks pinned. Former roots stay
recoverable; retirement requires fresh matching evidence and explicit approval.
Do not recreate migration discovery or drift rules in this skill.

The installed [start.md](../../docs/fb/start.md) defines the single public
workstream-first path: **Goal → Split → only the relevant workstreams → Verify
evidence → Merge findings → Implement → Verify candidate → One clear result**.
Relevant workstreams use **Send this to Product.** to create handoffs ready for Product
intake; ready is queued for Product review, not approval or execution. Only
`$bfm` freezes the intake, makes Product disposition and sequence every
candidate, records the Build Brief, and starts execution of the included scope.

Complete task inventory and identity reconciliation run on setup, install,
upgrade, canonical-root change, task drift, or duplicate evidence. Routine
`$bfm` validates the healthy receipt fingerprint without enumerating or
reconciling sidebar tasks.

The installed [graph.md](../../docs/fb/graph.md) defines graph-directed
orientation. For a known task and question, agents call MCP
`fb_project_context` and open only its relevant cited authoritative records.
The graph is not a source of truth. Missing, stale, unhealthy, incomplete, or
contradictory packets fall back to the board → index → handoff → card route.
Bootstrap and upgrade add derived graph support under ignored `.fb/graph/`
without overwriting project-owned boards, records, handoffs, learning, or
instruction text. The graph is rebuilt from the active canonical checkout;
former roots stay quarantined and recoverable through the migration contract.

For routine session orientation, use CLI
`node tools/fb-lane.cjs status --context` or MCP
`fb_lane_status({context:true})`. It returns a bounded active-only board packet.
Open the full board only when that packet is insufficient or contradictory.
Completed-task closeout mechanically archives older terminal board history
after the board exceeds 64 KiB, while retaining the three most recent terminal
rows and every active or blocked row. This adds no user ceremony.
Completed history remains searchable on demand through the board archive,
handoff index, exact handoff, QA artifacts, changelog, and Git history; setup
must never restore old completed narrative to routine orientation merely to
make it accessible.

- [First-project contract and approval boundary](../../docs/fb/start.md)
- [Board/index/handoff/workstream roles and execution](../../docs/fb/workflow.md)
- [Review and verification evidence](../../docs/fb/evidence.md)
- [Safety, recovery, sidechat, and escalation policy](../../docs/fb/guardrails.md)
- [Repository-local session lifecycle and privacy boundary](../../docs/fb/sessions.md)
- [Markdown eval lifecycle and Quality Gaps](../../docs/fb/evals.md)
- [Normalized records, verification reuse, and compact closeout](../../docs/fb/records.md)
- [Project-local continuous learning](../../docs/fb/learning.md)

The installed `guardrails.md` is also the source for the canonical beginner pause card.
Use it for approval waits and genuine stops.

After setup, each matching workstream owns its investigation and ready handoff.
Product owns reconciliation and sequencing only after `$bfm`; source-changing
execution starts through that approved BFM boundary.

The installed harness retains private agent routing and keeps package mirrors
generated from canonical root files. Do not add a second
board/index/session record for Quick BFM; its single Quick Record and local
Efficiency Receipt are the durable boundary.

The harness distinguishes focused checks, immediate safety gates, and release
checkpoints. A full validator needs a Product-owned release-checkpoint request;
under [standing delegated approvals](../../docs/fb/workflow.md#standing-delegated-approvals),
Product/BFM creates that request without a user prompt after focused evidence
and candidate-bound changelog verification pass. A Markdown handoff artifact or
review transfer alone is not a request.
Its generated Quick Records retain historical review fields for compatibility,
but the default process does not create per-slice reviewer loops. Review the
complete candidate once after focused slice proof.
Projects may configure `hooks.focusedTest` and a
`timeouts.focusedTestMinutes` value of at most 10 in `.fb-lane.json`; otherwise
runtime Quick work uses bounded `npm test`.
The 5- or 15-minute target applies to one execution slice, not the complete
outcome. During `$bfm`, split predictable work up front into the smallest useful
dependency graph. Full BFM may coordinate many slices for hours and use parallel
agents or subagents for independent, non-overlapping locks. Keep dependent,
shared-file, sensitive, and unresolved-decision work sequential; verify each
slice narrowly and reserve broad validation for the release checkpoint.
