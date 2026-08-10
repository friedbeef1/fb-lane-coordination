# FB coordination retrospective — 2026-08-10

Scope: commits `1da10b5..74a017b`, covering 46 commits and the FB
0.5.12, 0.7.0, and 0.7.1 release lines. Consumer repositories appear only as
evidence of FB behavior; this retrospective does not assess or change their
products.

## Evidence boundary

This retrospective separates repository facts from interpretation. Git counts,
test outcomes, release artifacts, and recorded failures are observed. Any
effect on elapsed time, human attention, or tokens is an inference unless the
repository contains a direct measurement.

### Four-source check

| Source | Check performed | Result and use |
|---|---|---|
| Project Git | Inspected `1da10b5..74a017b`, release merges, changed paths, handoffs, QA, changelog, and current records | 46 commits: 43 non-merge commits and three release merges. 142 files changed. Generated root/package mirrors inflate the changed-file and line counts, so those counts are provenance, not productivity. |
| Purposeful `~/.codex` changes | Bounded inspection of recently changed skill/config paths without reading credential-bearing configuration | Recent reusable work included active-plugin runtime provenance, redacted config inspection, provider-isolated QA, and agent-writing guidance. These support the release proof boundary; cache, rollout, and vendor churn were excluded. |
| Obsidian | Attempted a read-only CLI search for FB, Graph Engineering, and TASK-081 | The `obsidian` CLI was unavailable on this host. No Obsidian claim is made, and no missing note is treated as approval or evidence. |
| Conversation decisions | Reconciled the decisions preserved in TASK-078, TASK-080, TASK-081, and the approved TASK-082 brief | Fail closed on incomplete setup; do not create duplicate sidebar tasks; keep public release copy product-generic; let FB choose Direct or graph orchestration; preserve focused slice proof, one candidate review, one repair, one release checkpoint, and explicit **Push Live**. |

## What changed

| Release or closeout | Observed outcome | Durable evidence |
|---|---|---|
| 0.5.12 | Fresh install and existing-project upgrade gained one plain-language GitHub entry point. Matching sidebar tasks are reused and setup reports safe reruns plainly. | [TASK-078 handoff](../handoffs/TASK-078.md) · [TASK-078 QA](../qa/TASK-078.md) · merge `414b191` |
| 0.7.0 | The repository graph became operational. `$bfm` now selects Direct BFM, graph-driven orchestration, or an authoritative-record fallback from deterministic signals; the user does not select the route. | [TASK-080 handoff](../handoffs/TASK-080.md) · [TASK-080 QA](../qa/TASK-080.md) · merge `c9d5d49` |
| 0.7.1 | Busy hosts can reconcile an exact project even when the native recent-task list is capped. Local candidate IDs are joined to current native project, task-detail, and pin evidence; private content is rejected and uncertainty fails closed. | [TASK-081 handoff](../handoffs/TASK-081.md) · [TASK-081 QA](../qa/TASK-081.md) · merge `3ef65a9` |
| Post-release correction | Public changelog evidence was generalized from a named consumer project to a consumer-project smoke while the exact named proof remained in QA. | commit `74a017b` · [TASK-081 QA](../qa/TASK-081.md) |

## What worked

| Safeguard | Observed result | Decision |
|---|---|---|
| Focused proof per slice | Setup, learning, graph, and inventory defects were caught close to their changed surface. | Keep. |
| One whole-candidate review | TASK-080 review found that the graph path was optional, repository-wide, weakly validated, and insufficiently tied to authoritative evidence—issues isolated slice tests could not prove. | Keep exactly one integrated review. |
| One consolidated repair | TASK-080 closed the material integration/privacy findings in one correction rather than spawning one repair per symptom. | Keep one candidate-wide repair maximum. |
| Circuit breaker | TASK-081 stopped before a third broad validator and reran only the failed Doctor/record proof after the permitted repair budget was exhausted. | Keep the breaker; a third broad pass requires a new Product decision. |
| Fail-closed setup | Capped, incomplete, private, unknown, or contradictory inventory did not become permission for guessed titles or blind task creation. | Keep in `fb-setup` and project setup. |
| Mechanical package generation | Canonical and packaged plugin copies stayed aligned through the manifest and synchronizer. | Keep one generation pass after canonical review. |
| Explicit **Push Live** | Candidate preparation, merge/publication, and installed-plugin replacement remained separate authority boundaries. | Keep as the sole live-release phrase. |

## Failures and root causes

| Failure | Root cause | Recovery that occurred | Durable prevention |
|---|---|---|---|
| Archive/fallback fixtures omitted new learning files in TASK-079 and four graph files in TASK-080 | Runtime dependency closure existed as parallel handwritten lists | Focused integration tests caught both omissions before publication | Derive archive fixtures from `tools/fb-package-manifest.json`; do not create a file-list skill. |
| TASK-081 record validation arrived after broad suites | `validateNormalizedRepository` treated `record_model` as the only prospective opt-in, while the selected v3 handoff omitted it; Doctor also ran late in the broad sequence | Two broad passes surfaced handoff fields, then board Gate/Justification | Add a selected-task release preflight that validates the complete invariant regardless of an omitted marker; require the marker in every new normalized template. |
| Record repair became field-by-field | The repair addressed the reported handoff fields instead of comparing handoff and board against the complete canonical contract | A second broad pass found the board fields | Report every invariant in one preflight result and make one consolidated record repair. |
| A repeated dependency lesson was not applied | `LESSON-RELEASE-FALLBACK-001` remained provisional with no recorded application even after the same failure class recurred | The focused test caught the second omission independently | Make the dependency set mechanical. Preserve learning lifecycle evidence without promoting a provisional file-list lesson to a skill. |
| Installed-cache verification ran a source-layout test | Source checkout, package source, marketplace, and installed cache were treated as interchangeable proof environments | Runtime, skill, MCP, manifest, and adapter checks passed; the root-layout failure was correctly treated as non-gating | Put an environment-to-proof matrix in canonical guidance and `fb-release`; installed proof must exercise installed artifacts. |
| Release refresh assumed the wrong marketplace route | Release guidance named an upgrade command but did not first classify the configured marketplace as local or Git | The configured local source was refreshed manually | `fb-release` inspects source type before selecting the supported refresh path. |
| Public copy named a consumer project | Internal QA wording was reused as public product wording | Commit `74a017b` made the changelog generic | Public release copy stays product-generic; named consumer proof remains linked QA. |
| TASK-080 and TASK-081 retained mutable-state drift | Candidate-time statements were copied into live closeout sections instead of being clearly separated or reconciled | No complete current-state repair had been recorded before TASK-082 | Repair only current-state claims; preserve historical candidate evidence under explicitly historical headings. |

## Why the lean execution cadence remains

The evidence supports a large loop made from bounded slices:

```text
implement bounded slice
→ focused automated proof
→ next slice
→ one whole-candidate review
→ one consolidated repair if needed
→ one release checkpoint
```

The slice proof caught local dependency and privacy defects. The candidate
review caught integration defects that a local proof could not. The single
repair prevented per-finding context rebuilds. The circuit breaker prevented a
third broad pass after repeated record failures. The history does **not**
contain authoritative token or elapsed-time totals, so it cannot quantify the
net savings of this cadence.

## Promotion decisions

| Finding | Promotion | Reason |
|---|---|---|
| Explicit live plugin release transaction | **New skill: `fb-release`** | It has a distinct trigger—**Push Live** in Product/BFM—and a reusable, high-risk sequence across candidate identity, marketplace source, merge/publication, reinstall, installed proof, and durable closeout. |
| Early complete release-record check | **Mechanical guardrail plus existing-skill update** | Deterministic structure belongs in a preflight; BFM/Product must invoke it immediately after record creation. |
| New normalized handoff marker | **Template and mechanical guardrail** | A field omission is mechanically detectable and does not require agent judgment. |
| Archive dependency closure | **Mechanical guardrail** | One canonical manifest is safer and cheaper than another skill or lesson prose. |
| Exact-project task inventory and privacy join | **Existing setup-skill responsibility** | TASK-081 already established the setup-specific trigger and fail-closed contract. |
| Direct-versus-Graph route selection | **No action** | BFM already owns and tests this route. Another skill would duplicate ownership. |
| Public generic wording | **Existing release guidance** | One concise release rule is sufficient; a separate writing skill would be disproportionate. |
| Retrospective method | **No new FB skill** | Existing Loop Learning and retrospective guidance already cover it; TASK-082 is evidence, not a new operating role. |
| Installed runtime provenance | **`fb-release` plus environment matrix** | It is a branch inside release execution, not an independently memorable user action. |

Exactly one new skill is therefore justified.

## Environment-to-proof summary

| Environment | Authoritative proof |
|---|---|
| Canonical source checkout | Source/runtime tests, package generation/parity, focused record preflight, Doctor, and the repository release validator. |
| Fresh clone or CI | Portability, clean checkout behavior, package generation, and supported repository tests without clone-local state. |
| Configured marketplace | Proven marketplace source identity and the refresh operation appropriate to its local or Git source type. |
| Installed cache | Exact installed version and package identity, skill discovery, runtime syntax/exports, bundled manifest, and MCP resolution. Root-only source-layout tests are not installed-runtime authority. |

## Remaining limits

- Guidance and a skill reduce variance but cannot make future mistakes
  impossible; deterministic checks own facts that can be enforced.
- Marketplace and Codex host interfaces may change. Release execution must
  inspect current tool schemas and configured source type rather than rely on a
  remembered command.
- Replacing a plugin does not hot-reload the current Codex task. A new task is
  required before plugin-dependent mutation.
- Consumer-project smokes prove the named behavior only. They do not prove all
  product behavior, physical-device behavior, or universal time/token savings.
- Obsidian evidence was unavailable in this run because its CLI was absent.
- Project-specific names and implementation detail belong in linked QA, not
  public release copy.

## Next action

TASK-082 implements the promoted guardrails, prepares FB 0.8.0-beta, runs one
whole-candidate review and one final release checkpoint, then stops at **Ready
to ship**. Merge, marketplace publication, reinstall, and live verification
still require **Push Live**.
