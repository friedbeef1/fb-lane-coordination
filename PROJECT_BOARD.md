# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Candidate awaiting verification. Record the actual local, sandbox, staging, or completed-build environment separately.
- `Done`: Checked, verified, and merged to production by FB-Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-082 | Done | FB-Product / BFM | Coordination retro, release hardening, and FB `0.8.0-beta+codex.20260810034353` | Retrospect commits `1da10b5..74a017b`; add one `fb-release` skill, targeted release preflight, manifest-derived archive fixtures, environment-specific proof, record repairs, and generated plugin mirrors | None; published and installed | [PR #65](https://github.com/friedbeef1/fb-lane-coordination/pull/65) merged as `742de6e`; exact build installed and enabled; [Handoff](docs/handoffs/TASK-082.md); [QA](docs/qa/TASK-082.md) |
| TASK-081 | Done | FB-Product / BFM | Complete exact-project sidebar inventory and FB `0.7.1-beta+codex.20260809105651` | Replace the capped global non-pinned listing with a read-only, exact-root local candidate enumeration joined to current native project, thread-detail, and pinned-task evidence; preserve duplicate protection and fail closed | None; published and installed | [PR #64](https://github.com/friedbeef1/fb-lane-coordination/pull/64) merged as `3ef65a9`; exact build installed and enabled; [Changelog](CHANGELOG.md#071-beta--2026-08-09); [Handoff](docs/handoffs/TASK-081.md); [QA](docs/qa/TASK-081.md) |
| TASK-080 | Done | FB-Product / BFM | Automatic Direct-vs-Graph BFM routing and `0.7.0-beta+codex.20260809013127` | Make `$bfm` select Direct, graph-driven, or authoritative-record fallback automatically while Markdown/Git remain authoritative | None; published and installed | [PR #63](https://github.com/friedbeef1/fb-lane-coordination/pull/63) merged as `c9d5d49`; exact build installed and enabled; router skill and bundled MCP route verified; [Handoff](docs/handoffs/TASK-080.md); [QA](docs/qa/TASK-080.md) |
| TASK-079 | Superseded | FB-Product / BFM | Project-local recursive learning and `0.6.0-beta+codex.20260808104938` | Make each FB project learn bounded preventative lessons from its own verified delivery outcomes without creating nested repair loops | Learning runtime, harness guidance, plugin mirrors, focused contracts, version/release records | Candidate and evidence preserved; incorporated into TASK-080 / FB 0.7.0; [Handoff](docs/handoffs/TASK-079.md); [QA](docs/qa/TASK-079.md) |
| TASK-078 | Done | FB-Product / BFM | One-sentence GitHub setup and `0.5.12-beta+codex.20260808093008` | Integrate task-reuse permission, plain-language safe reruns, and one GitHub install-or-upgrade prompt into the canonical plugin release | None; published and installed | [PR #61](https://github.com/friedbeef1/fb-lane-coordination/pull/61) merged as `414b191`; exact build installed and enabled; [Handoff](docs/handoffs/TASK-078.md); [QA](docs/qa/TASK-078.md) |
| TASK-Q-20260808-ONBOARDING-REUSE | Done | FB-Product / BFM | Codex onboarding | Make setup approval explicitly authorize reuse, rename, and pin of matching project tasks, with creation only for missing lanes | None; source/docs/tests only | User-approved in current conversation; 54 focused tests passed; root/package parity and `git diff --check` passed |
| TASK-077 | Superseded | Side conversation, one-off approved | Plain-language FB setup status | Replace user-facing setup jargon with clear safe-rerun wording | None; absorbed into TASK-078 | Candidate `228610d` integrated through `e14ab9b`; release evidence belongs to TASK-078 |
| TASK-FB-PRODUCT-BFM-RELIABILITY-20260807 | Done | FB-Product / BFM | Canonical-project and complete-intake reliability; FB 0.5.11-beta | Enforce the canonical checkout, complete seven-role intake ledger, exact-project onboarding, and transactional migration | None; published and installed | [PR #60](https://github.com/friedbeef1/fb-lane-coordination/pull/60) merged as `57d1053`; `0.5.11-beta+codex.20260807112648` installed and enabled; [Handoff](docs/handoffs/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807.md); [QA](docs/qa/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807.md) |
| TASK-076 | Superseded | FB-Product / BFM | Exact FB setup invocation, delegated internal approvals, and FB 0.5.10-beta | Add `$fb-setup`; let Product/BFM approve routine changelog wording and one release checkpoint without user prompts; preserve material, sensitive, and **Push Live** gates | Setup and Product/BFM skills, active docs, focused contracts, plugin mirrors, version/changelog | Candidate preserved at `0b8039f`; release checkpoint superseded by the combined reliability candidate; [Handoff](docs/handoffs/TASK-076.md); [QA](docs/qa/TASK-076.md) |
| TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807 | Done | FB-Product / BFM | Checkout migration reliability | Detect same-path handoff drift, model checkout lifecycle, block noncanonical writes, and expose pending task rebind | None; absorbed into published 0.5.11 | Guard included in [PR #60](https://github.com/friedbeef1/fb-lane-coordination/pull/60) and installed 0.5.11 build; [Handoff](docs/handoffs/TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807.md); [QA](docs/qa/TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807.md) |
| TASK-075 | Done | FB-Product / BFM | User workstream and Product/BFM control centre; FB 0.5.9-beta | Replace Product/User with User, add the Product/BFM control centre, and converge onboarding on seven pinned repository tasks | Canonical candidate, generated package mirrors, version/metadata contracts, and release records | Published and installed `0.5.9-beta+codex.20260805042523`; PR #59 merged as `3e7f31c`; [Handoff](docs/handoffs/TASK-075.md); [QA](docs/qa/TASK-075.md) |
| TASK-074 | Done | FB-Product / BFM | Graph Engineering positioning and FB 0.5.8-beta | Make Graph Engineering the headline product category, align the public story and packaged plugin, and preserve existing runtime contracts | None; published and installed | [Handoff](docs/handoffs/TASK-074.md); [QA](docs/qa/TASK-074.md); [PR #58](https://github.com/friedbeef1/fb-lane-coordination/pull/58) merged as `72bfab0`; exact build installed and enabled |
| TASK-073 | Done | FB-Product / BFM | Evaluation results, meaningful repair, and FB 0.5.7-beta | Show eval results clearly, reject superficial repair loops, and publish `0.5.7-beta+codex.20260804131420` | None; published and installed | [Handoff](docs/handoffs/TASK-073.md); [QA](docs/qa/TASK-073.md); [PR #57](https://github.com/friedbeef1/fb-lane-coordination/pull/57) merged as `c1e63f1`; exact build installed and enabled |
| TASK-072 | Done | FB-Product / BFM | Lifecycle truth, historical retrieval, and FB 0.5.6-beta | Keep routine orientation current-state only while preserving complete on-demand history; publish `0.5.6-beta+codex.20260804045203` | None; published and installed | [Handoff](docs/handoffs/TASK-072.md); [QA](docs/qa/TASK-072.md); [PR #56](https://github.com/friedbeef1/fb-lane-coordination/pull/56) merged as `894d4a1`; exact build installed and enabled |
| TASK-071 | Done | FB-Product / BFM | Cross-workstream planning handoffs | Queue cross-workstream planning and keep routine circuit-breaker recovery with Product/BFM | Published and installed as `0.5.5-beta+codex.20260803212323` | [Handoff](docs/handoffs/TASK-071.md); [QA](docs/qa/TASK-071.md); PR #54 merged as `2c3dc4c` |
| TASK-067 | Done | FB-Product / BFM | Conversation execution authority + Plugin Release | Define conversation authority and publish FB `0.5.4-beta+codex.20260801143809` | None; published and installed globally | [Handoff](docs/handoffs/TASK-067.md); [QA](docs/qa/TASK-067.md); PR #53 merged as `cfa1632` |
| TASK-066 | Done | FB-Product / BFM | Verification autonomy + Plugin Release | Require BFM to run every safe locally executable check itself and publish FB 0.5.3-beta after explicit Push Live approval | None; published and installed | [Handoff](docs/handoffs/TASK-066.md); [QA](docs/qa/TASK-066.md); published build `0.5.3-beta+codex.20260801141345` |
| TASK-Q-20260713-SIDECHAT-PARENT | Done | FB-Product | Coordination | Define and distribute a parent-thread-only sidechat handoff rule for this project and the Codex FB-Lane plugin | `docs/sidechat-parent-thread-routing.md`, `AGENTS.md`, bundled FB-Lane coordination skills and docs | [Handoff](docs/handoffs/TASK-Q-20260713-SIDECHAT-PARENT.md); released in [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39) as `0.2.0-beta+codex.20260716052513` |

---

### TASK-082 - FB coordination retro and release hardening

*   **Status**: Done — PR #65 passed GitHub readiness and merged as `742de6e`;
    the configured local marketplace was refreshed, and exact build
    `0.8.0-beta+codex.20260810034353` is installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Coordination reliability, plugin release execution, records, packaging, and retrospective evidence.
*   **Scope**: Produce the approved 46-commit retro; add exactly one model-invoked `fb-release` skill; shift complete candidate-record validation before broad gates; derive archive fixtures from the package manifest; repair current TASK-080/TASK-081 state drift; prepare FB `0.8.0-beta+codex.20260810034353`.
*   **Out of Scope**: Consumer-project source changes, historical-record retrofits, merge, marketplace publication, global reinstall, or deployment before **Push Live**.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB releases repeatable and fail early on incomplete or contradictory durable evidence without adding duplicate ceremony.
    *   **Key Results**: One release skill with exact authority and provenance checks; one-pass record preflight; manifest-derived archive dependencies; complete environment-to-proof guidance; accurate current records; focused proof, one candidate review, and one release checkpoint.
    *   **Definition of Done**: Root/package release contracts, skill validation, package parity, syntax, links, Doctor, whitespace, whole-candidate review, one final validator, GitHub readiness, and a review candidate all pass.
    *   **Gate / Review Point**: Stop at **Ready to ship** after pushing a review candidate. Merge, publication, and reinstall require a later explicit **Push Live**.
    *   **Approval**: approved — James supplied and explicitly requested implementation of TASK-082.
    *   **Justification**: The last three releases exposed repeatable late-record, dependency-closure, marketplace-source, and installed-proof mistakes that deterministic preflight and one narrow release owner can prevent.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-082.md) · [QA](docs/qa/TASK-082.md) · [retro](docs/retros/2026-08-10-fb-coordination-retro.md).
*   **Locks**: None. `MEJA-123` owns its separate setup/runtime follow-up based
    on the released TASK-082 commit and does not alter this completed record.

---

### TASK-081 - Complete exact-project sidebar inventory

*   **Status**: Done — `0.7.1-beta+codex.20260809105651` published and installed.
*   **Owner / Thread**: FB-Product / BFM, delegated from the MÉJA Product task.
*   **Area**: First-run setup inventory and duplicate-safe reconciliation.
*   **Scope**: Add the smallest complete local-host inventory route by joining
    verified saved-project identity, a read-only exact-root Codex state query,
    current per-task native details, and the native pinned-task set.
*   **Out of Scope**: MÉJA application changes, blind task creation, weakened
    duplicate protection, transcript capture, push, merge, publication,
    reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Let `$fb-setup` reconcile the seven sidebar tasks even
        when the global non-pinned list reaches its fixed 50-task limit.
    *   **Key Results**: Complete user-visible candidate enumeration for one
        canonical root; current titles and pin state from native controls;
        helper/subagent exclusion; fail-closed identity and evidence checks.
    *   **Definition of Done**: Focused root/package contracts, package parity,
        syntax, links, whitespace, durable handoff/QA, and a clean local commit.
    *   **Gate / Review Point**: One clean release-candidate checkpoint before
        **Ready to ship**; **Push Live** remains the publication boundary.
    *   **Approval**: approved — James explicitly delegated this remaining FB
        repair to Product/BFM and prohibited publication without Push Live.
    *   **Justification**: Busy Codex hosts need complete duplicate-safe setup
        without forcing users to archive unrelated task history.
*   **Gate / Review Point**: James said **Push Live**; PR #64 passed readiness,
    merged, and the exact plugin build was installed. A new MÉJA Product/BFM
    task must now invoke `$fb-setup`.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-081.md) ·
    [QA](docs/qa/TASK-081.md).

---

### TASK-080 - Graph-driven orchestration

*   **Status**: Done — [PR #63](https://github.com/friedbeef1/fb-lane-coordination/pull/63)
    merged as `c9d5d49`; `0.7.0-beta+codex.20260809013127` is installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Derived graph schema/compiler, active-subgraph context,
    dependency-aware scheduling, invalidation, bounded learning integration,
    status projections, plugin guidance, and release evidence.
*   **Scope**: Execute the eight slices in the approved
    [implementation plan](docs/superpowers/plans/2026-08-08-fb-graph-driven-orchestration.md)
    from the verified FB 0.6.0 candidate.
*   **Out of Scope**: Graph database, hosted service, cross-project learning,
    invented decisions, changed safety/release authority, merge, publication,
    reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB's repository-local graph determine the smallest
        relevant context and safe execution sequence while durable records
        remain authoritative.
    *   **Key Results**: Deterministic source-cited graph; correct dependencies
        and conflicts; no unnecessary reopen; relevant-only context; visible
        fallback; package parity; one final release checkpoint.
    *   **Definition of Done**: Eight bounded slices pass focused proof, one
        whole-candidate review and one consolidated repair close material
        findings, complete release evidence and GitHub readiness pass, and the
        exact plugin is installed and verified.
    *   **Approval**: approved — James supplied the plan, asked Product/BFM to
        run it, and explicitly authorized the live release in this task.
    *   **Justification**: The graph should drive coordination rather than act
        only as an optional reading aid.
*   **Gate / Review Point**: Focused proof ran per slice; one whole-candidate
    review, one consolidated repair if needed, and one final release checkpoint
    govern the candidate. `$bfm` chooses Direct, graph-driven, or visible
    authoritative fallback through deterministic preflight; the user never
    selects the route. Per-slice reviewer/re-review ceremonies are not required.
    Sensitive-operation and release gates remain unchanged. Live release was
    explicitly authorized by James in the current Product/BFM task.
*   **Links & Deliverables**: [plan](docs/superpowers/plans/2026-08-08-fb-graph-driven-orchestration.md) ·
    [handoff](docs/handoffs/TASK-080.md) · [QA](docs/qa/TASK-080.md).

---

### TASK-079 - Project-local recursive learning

*   **Status**: Superseded — its verified learning candidate is incorporated
    into TASK-080 / FB 0.7.0; historical evidence remains factual.
*   **Owner / Thread**: FB-Product / BFM.
*   **Scope**: Connect verified project outcomes to bounded provisional lessons,
    relevant future context, confirmation, one revision, rejection, and
    retirement; update the reusable plugin and project harness.
*   **Out of Scope**: Autonomous source or prompt mutation, cross-project data
    transmission, unbounded repair, automatic eval-authority changes, merge,
    publication, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Let each FB consumer project reuse verified delivery
        lessons without increasing retry loops or broad context.
    *   **Key Results**: Project-local registry and observations; relevant-only
        selection; bounded lifecycle; prospective Full BFM closeout gate;
        root/package/plugin parity; release checkpoint pass.
    *   **Definition of Done**: `0.6.0-beta` candidate passes focused contracts,
        doctor, and one complete release validator, then stops at Ready to ship.
    *   **Approval**: approved by James in the current Product/BFM task.
    *   **Justification**: Consumer projects should improve from verified
        outcomes without hidden source changes, cross-project transfer, or
        additional repair attempts.
*   **Gate / Review Point**: Product/BFM standing delegation approved faithful
    changelog wording and one release checkpoint; **Push Live** remains the
    merge, marketplace publication, and reinstall boundary.
*   **Links & Deliverables**:
    [design](docs/superpowers/specs/2026-08-08-project-recursive-learning-design.md) ·
    [plan](docs/superpowers/plans/2026-08-08-project-recursive-learning.md) ·
    [handoff](docs/handoffs/TASK-079.md) · [QA](docs/qa/TASK-079.md).

---

### TASK-078 - One-sentence GitHub setup

*   **Status**: Done — [PR #61](https://github.com/friedbeef1/fb-lane-coordination/pull/61)
    merged as `414b191`; `0.5.12-beta+codex.20260808093008` is installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Setup skills, installation documentation, plugin metadata,
    release records, focused contracts, and generated mirrors.
*   **Scope**: Integrate TASK-077 and TASK-Q-20260808-ONBOARDING-REUSE; let
    users point Codex at GitHub with one sentence; preserve existing project
    work and create only genuinely missing sidebar roles.
*   **Out of Scope**: Runtime command changes, MCP changes, automatic hot-load
    in the current Codex task, and consumer-repository mutation.
*   **Goal Alignment Session**:
    *   **Objective**: Make fresh install and safe upgrade start the same way.
    *   **Key Results**: One public GitHub sentence; plain-language repeat
        setup; deterministic task reuse; root/package contracts and release
        checkpoint pass.
    *   **Definition of Done**: Focused setup, onboarding, metadata, parity,
        syntax, links, whitespace, doctor, and one final validator pass;
        candidate stops at **Ready to ship**.
    *   **Approval**: approved by James in the current Product/BFM task.
    *   **Justification**: Users should not need to remember marketplace
        commands or migration terminology to install or upgrade FB safely.
*   **Gate / Review Point**: Faithful changelog wording and the one release
    checkpoint passed; James then authorized **Push Live**. GitHub merge,
    marketplace installation, and active-bundle verification passed.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-078.md) ·
    [QA](docs/qa/TASK-078.md) ·
    [changelog](CHANGELOG.md#0512-beta--2026-08-08).

---

### TASK-FB-PRODUCT-BFM-RELIABILITY-20260807 - Canonical project and complete intake

*   **Status**: Done — [PR #60](https://github.com/friedbeef1/fb-lane-coordination/pull/60)
    merged as `57d1053`; `0.5.11-beta+codex.20260807112648` is installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Scope**: Canonical checkout enforcement; exact-project seven-role
    reconciliation; complete fail-closed intake; visible dependency/lock-aware
    ledger and sequencing; transactional migration; plugin guidance, tests,
    mirrors, and a local release candidate.
*   **Out of Scope**: Unmirror application behavior, destructive checkout
    retirement, provider state, publication, installation/cache replacement,
    merge, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Make Product/BFM a reliable visible control centre that
        cannot lose approved work or operate from the wrong project.
    *   **Key Results**: Wrong-checkout mutation fails closed; all six evidence
        workstreams plus Product/BFM are reconciled visibly; same-path drift and
        incomplete inventory cannot disappear; migration remains recoverable.
    *   **Definition of Done**: Focused migration, onboarding, intake, CLI/MCP,
        session, package, consumer, syntax, doctor, and whitespace evidence pass;
        release remains separately gated.
    *   **Approval**: approved by James through the Unmirror Product/BFM handoff
        on 2026-08-07.
    *   **Justification**: The Unmirror split-brain incident demonstrated a real
        missed Design amendment and incomplete sidebar reconciliation.
*   **Gate / Review Point**: Release complete. Checkout retirement remains a
    separate destructive-operation decision.
*   **Links & Deliverables**:
    [handoff](docs/handoffs/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807.md) ·
    [QA](docs/qa/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807.md) ·
    [changelog](CHANGELOG.md#0511-beta--2026-08-07).

---

### TASK-076 - Exact FB setup shortcut

*   **Status**: Superseded — the 0.5.10 candidate and its release checkpoint
    were absorbed into the combined 0.5.11 reliability candidate. Its
    historical handoff and QA remain factual; it is no longer an active
    **Ready to ship** route.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Setup skill, active setup documentation, plugin metadata,
    versioning, focused contracts, and generated package mirrors.
*   **Scope**: Add `$fb-setup` as the exact primary invocation; let Product/BFM
    approve routine candidate-faithful changelog wording and one release
    checkpoint without user prompts; preserve compatibility and external gates.
*   **Out of Scope**: New CLI or slash commands, setup-policy redesign,
    consumer-repository mutation, merge, publication, reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB setup short, exact, and difficult to
        misinterpret without creating a second onboarding system.
    *   **Key Results**: `$fb-setup` exists as a thin canonical skill; active
        root and package guidance leads with it; long-form and natural-language
        fallbacks remain; root/package and metadata contracts pass.
    *   **Definition of Done**: Focused shortcut, skill, package, metadata,
        beginner, link, syntax, whitespace, doctor, changelog approval, and one
        final release checkpoint pass.
    *   **Approval**: approved.
    *   **Justification**: James approved the dedicated thin-skill approach and
        asked Product/BFM to implement it in this task.
*   **Gate / Review Point**: Superseded by
    `TASK-FB-PRODUCT-BFM-RELIABILITY-20260807`; use that candidate's pending
    release state. Material decisions, sensitive gates, and **Push Live**
    remain with James.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-076.md) ·
    [QA](docs/qa/TASK-076.md) ·
    [design](docs/superpowers/specs/2026-08-06-fb-setup-shortcut-design.md).

---

### TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807 - Checkout migration guard

*   **Status**: Done — absorbed into FB 0.5.11, published through PR #60, and installed.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Checkout migration reliability and BFM handoff intake.
*   **Scope**: Detect same-relative-path handoff drift by SHA-256 and metadata;
    model explicit machine-local checkout lifecycle and registration; block CLI,
    MCP, and session mutations outside the canonical checkout; keep task rebind
    visibly open until every pending task has moved.
*   **Out of Scope**: Publication, installation, active-cache replacement,
    merge, consumer-repository mutation, checkout deletion, or implicit
    retirement.
*   **Goal Alignment Session**:
    *   **Objective**: Make checkout migration content-safe, visible,
        reversible, and impossible to close before task rebind.
    *   **Key Results**: Same-path drift fails closed; noncanonical writes fail
        before mutation; lifecycle and task-rebind state are visible; existing
        orphan detection and BFM ordering remain intact.
    *   **Definition of Done**: Focused and full runtime tests, syntax, package
        parity, doctor, whitespace, and a clean local commit pass.
    *   **Gate / Review Point**: Local verified candidate only. Publication,
        installation, cache replacement, merge, and retirement require explicit
        James approval.
    *   **Approval**: approved.
    *   **Justification**: James explicitly directed implementation in this
        clean checkout on 2026-08-07.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807.md) ·
    [QA](docs/qa/TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807.md).

---

### TASK-075 - User workstream and Product/BFM control centre

*   **Status**: Done — `0.5.9-beta+codex.20260805042523` published, installed,
    and enabled.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Onboarding runtime, sidebar migration, skills, public and harness
    documentation, plugin metadata, templates, contracts, and package mirrors.
*   **Scope**: Establish User, Business, Design, Tech, Discovery, and Bugs as
    evidence workstreams; establish Product/BFM as the control centre; converge
    fresh and legacy projects on seven pinned repository-scoped tasks.
*   **Out of Scope**: Consumer-repository mutation in this slice, app-level task
    discovery, implicit execution, merge, publication, reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Make ownership and navigation obvious without weakening
        compatibility or release authority.
    *   **Key Results**: Seven-task setup is repository-scoped and idempotent;
        Product/User migrates to User; Product/BFM is unique; all observed tasks
        are pinned or exact failures are reported; root/package guidance agrees.
    *   **Definition of Done**: Focused runtime and structural contracts,
        package parity, metadata, syntax, links, whitespace, doctor, changelog
        approval, and one final release checkpoint pass.
    *   **Approval**: approved.
    *   **Justification**: James invoked `$bfm` after directing implementation
        of the frozen TASK-075 scope in Product/BFM.
*   **Gate / Review Point**: Complete. James approved the changelog, clean
    release checkpoint, and **Push Live**. PR #59 passed GitHub readiness and
    merged as `3e7f31c`; marketplace upgrade, reinstall, and active verification
    passed.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-075.md) ·
    [QA](docs/qa/TASK-075.md) ·
    [plan](docs/superpowers/plans/2026-08-05-user-product-bfm-control-centre.md).

---

### TASK-074 - Graph Engineering positioning

*   **Status**: Done — PR #58 merged as `72bfab0`; marketplace upgraded;
    `0.5.8-beta+codex.20260804153114` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Public product category, explanation, diagram, plugin guidance,
    marketplace copy, metadata, versioning, and structural contracts.
*   **Scope**: Make **Graph Engineering for Everyday People** the headline;
    explain graph as the delivery map and loops as movement inside it; preserve
    `$bfm` navigation/execution and **Push Live** release authority; package as
    `0.5.8-beta+codex.20260804153114`.
*   **Out of Scope**: Runtime behavior changes, graph database or GraphQL
    concepts, technical identifier migration, consumer-repository changes,
    merge, marketplace publication, reinstall, or deployment before approval.
*   **Goal Alignment Session**:
    *   **Objective**: Give FB a clear, understandable category that accurately
        describes how it connects scattered conversations to product delivery.
    *   **Key Results**: Graph Engineering is the primary active tagline; one
        accessible explanation and primary diagram tell the same story; plugin
        and public metadata agree; historical facts and runtime contracts remain
        unchanged.
    *   **Definition of Done**: Focused positioning, metadata, release, package
        parity, link, syntax, and whitespace checks pass; James approves the
        changelog; one final release checkpoint then passes.
*   **Gate / Review Point**: Complete. James approved the changelog and **Push
    Live**; GitHub readiness, merge, marketplace reinstall, and active checks
    passed.
    *   **Approval**: approved through `$bfm` intake of James's ready Product
        positioning handoff.
    *   **Justification**: Product reconciled the sole incoming handoff and
        selected one bounded release slice with no competing work.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-074.md) ·
    [QA](docs/qa/TASK-074.md).

---

### TASK-073 - Evaluation results and meaningful repair

*   **Status**: Done — PR #57 merged as `c1e63f1`; marketplace upgraded;
    `0.5.7-beta+codex.20260804131420` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM, named one-off sidechat exception.
*   **Area**: Eval result visibility and repair quality.
*   **Scope**: Distinguish eval definitions from evaluation results; add a
    compact result table; require sufficient, causally relevant repairs,
    original-scenario rerun, focused regression proof, and no-progress stop.
*   **Out of Scope**: New semantic judge, numeric score, automatic eval
    promotion, plugin version change, publication, merge, or reinstall.
*   **Goal Alignment Session**:
    *   **Objective**: Make eval outcomes understandable while preventing
        cosmetic repairs that merely circle a failed criterion.
    *   **Key Results**: Root/package guidance agrees; selected results link to
        evidence and delivery effect; superficial repairs fail the contract.
    *   **Definition of Done**: Focused root/package eval tests, 58-mirror
        parity, syntax, and whitespace pass.
    *   **Gate / Review Point**: James approved the exact 0.5.7-beta changelog
        wording on 2026-08-04. The release checkpoint and publication passed.
    *   **Approval**: approved.
    *   **Justification**: James explicitly confirmed the named one-off
        sidechat documentation and plugin update.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-073.md) ·
    [QA](docs/qa/TASK-073.md).

---

### TASK-072 - Lifecycle truth and historical retrieval

*   **Status**: Done — PR #56 merged as `894d4a1`; marketplace upgraded;
    `0.5.6-beta+codex.20260804045203` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Active-state orientation, lifecycle reconciliation, archived
    retrieval, and plugin release guidance.
*   **Scope**: Reconcile historical Staging QA truth; keep active board packets
    and workstream cards compact; preserve exact archives, handoffs, QA, and Git
    retrieval; align Product/BFM/setup/coordination guidance and release
    metadata.
*   **Out of Scope**: Technical identifier changes, automatic deletion,
    publication, merge, marketplace upgrade, reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce routine orientation overhead without hiding or
        weakening durable historical evidence.
    *   **Key Results**: Zero unsupported lifecycle closure; current packets
        contain genuine active state; all 21 reconciled tasks remain exactly
        retrievable; ready remains Product intake rather than execution; root
        and package guidance agree.
    *   **Definition of Done**: Focused lifecycle, board, graph, onboarding,
        metadata, parity, syntax, link, and whitespace checks pass; changelog
        wording is approved; the one final release validator then passes.
    *   **Gate / Review Point**: James approved the drafted 0.5.6-beta
        changelog and the historical compatibility repair on 2026-08-04.
        The single release checkpoint passed; invented retrospective OKRs remain
        forbidden. James approved **Push Live** and publication completed.
    *   **Approval**: approved.
    *   **Justification**: James explicitly approved execution of the lifecycle
        truth and historical retrieval plan in this Product/BFM parent task.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-072.md) ·
    [QA](docs/qa/TASK-072.md) ·
    [changelog draft](CHANGELOG.md#056-beta--2026-08-04).

---

### TASK-071 - Workstream-to-workstream queued handoffs

*   **Status**: Ready to ship — `0.5.5-beta+codex.20260803212323`; release checkpoint and revised changelog passed; **Push Live** required.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Cross-workstream planning and evidence routing
*   **Scope**: Let any main workstream queue a durable planning handoff for
    another named workstream, with no automatic destination work and no
    execution authority.
*   **Out of Scope**: Source execution outside Product/BFM, automatic chat
    discovery, hosted routing, transcript capture, release, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Move useful evidence directly between FB workstreams
        without turning Product into a relay or allowing handoff arrival to
        trigger unplanned work.
    *   **Key Results**: A distinct queued artifact type; explicit source and
        destination; user-controlled continuation; Product-ready output remains
        separate; `$bfm` ignores unfinished workstream handoffs.
    *   **Definition of Done**: The approved design is reviewed, implementation
        follows a focused RED/GREEN contract, canonical/package guidance agrees,
        and release remains behind its normal Product checkpoint.
    *   **Gate / Review Point**: James reviews the written design before Product
        writes the implementation plan.
    *   **Approval**: approved
    *   **Justification**: James explicitly approved queue-and-wait behavior for
        workstream-to-workstream handoffs on 2026-08-03.
*   **Links & Deliverables**: [design](docs/superpowers/specs/2026-08-03-workstream-to-workstream-handoffs-design.md) · [plan](docs/superpowers/plans/2026-08-04-cross-workstream-handoffs.md) · [handoff](docs/handoffs/TASK-071.md) · [QA](docs/qa/TASK-071.md).

### TASK-067 - Sidechat execution authority

*   **Status**: Done — published to GitHub `main`, marketplace upgraded, and
    `0.5.4-beta+codex.20260801143809` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Conversation execution authority
*   **Scope**: Define Product/BFM parent execution, workstream-parent planning,
    sidechat read-only behavior, and named one-use sidechat exceptions.
*   **Out of Scope**: Runtime permission machinery, CLI changes, unrelated
    consumer source changes, deployment, or provider mutation.
*   **Goal Alignment Session**:
    *   **Objective**: Prevent accidental sidechat mutation without slowing
        approved Product/BFM parent execution.
    *   **Key Results**: One canonical four-context table, explicit confirmation
        prompt, consumed exception, unchanged safety gates, and concise links from
        BFM plus all six workstream skills.
    *   **Definition of Done**: Focused skill contract, 53-mirror parity,
        metadata, complete validator, doctor, syntax, links, whitespace,
        GitHub merge, marketplace upgrade, reinstall, and active guidance pass.
    *   **Gate / Review Point**: Complete. James approved the changelog, push,
        merge, marketplace upgrade, and active-repository adoption on 2026-08-01.
    *   **Approval**: approved
    *   **Justification**: James supplied a ready Product/BFM handoff in this
        parent task and directed Product/BFM to implement the smallest solution.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-067.md) ·
    [QA](docs/qa/TASK-067.md) · [PR #53](https://github.com/friedbeef1/fb-lane-coordination/pull/53).

### TASK-066 - Automatic local verification

*   **Status**: Done — published to GitHub `main`, marketplace upgraded, and
    `0.5.3-beta+codex.20260801141345` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Verification autonomy
*   **Scope**: Make automatic execution the generic default for every safe,
    locally executable test, build, lint, typecheck, simulator/browser smoke,
    package consistency, Git, and deployment-source check available to BFM.
*   **Out of Scope**: Physical-device actions, unavailable credentials or
    accounts, payments, destructive/provider-state changes, subjective Product
    judgment, live release approval, CI automation, or a new test runner.
*   **Goal Alignment Session**:
    *   **Objective**: Remove routine test work from the user while preserving
        real human, external-access, and release boundaries.
    *   **Key Results**: Generic BFM and evidence guidance require automatic
        local verification, record results before asking for input, and name
        the narrow categories that still require the user.
    *   **Definition of Done**: The focused root/package skill contract fails
        before the guidance, passes after it, package mirrors match, and the
        isolated candidate is clean and committed.
*   **Gate / Review Point**: Complete. Focused skill contract, complete release
        validator, package parity, syntax/whitespace, doctor, GitHub `main`,
        marketplace upgrade, reinstall, and active-cache verification passed.
    *   **Approval**: approved
    *   **Justification**: James explicitly requested that all tests Codex can
        perform be run automatically and that this become generic FB behavior.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-066.md) ·
    [QA](docs/qa/TASK-066.md) · release build
    `0.5.3-beta+codex.20260801141345`.
