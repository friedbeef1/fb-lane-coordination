# Cross-Workstream Queued Handoffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any FB main workstream queue a durable planning/evidence handoff for another workstream while keeping the recipient idle until the user explicitly asks it to continue.

**Architecture:** Add one small internal validator/renderer for the new `fb-workstream-handoff` artifact, integrate it into doctor and the existing BFM scanner boundary, then teach the canonical harness and skills the same queue-and-wait flow. Package mirrors are generated mechanically; no public command, hosted router, transcript capture, or automatic chat discovery is added.

**Tech Stack:** Node.js CommonJS, Markdown/YAML frontmatter, built-in `node:test`/`assert`, existing FB CLI doctor/scanner, mechanical package synchronizer.

## Global Constraints

- A queued workstream handoff grants no authority and starts no destination work.
- Only an explicit user request in the destination main task permits planning/evidence work.
- Receiving workstreams never edit source, claim implementation locks, run `$bfm`, merge, or release.
- `status: ready` remains reserved for Product-ready delivery handoffs.
- `$bfm` ignores every `fb-workstream-handoff` lifecycle state.
- Sidechats still route only to their originating parent task.
- **Push Live** remains the only merge/deployment authorization.
- Implementation prepares an unreleased FB 0.5.5-beta candidate; no push, publication, marketplace upgrade, installation, or deployment occurs.

---

### Task 1: Add the deterministic workstream-handoff contract

**Files:**
- Create: `tools/fb-workstream-handoff.cjs`
- Create: `tools/fb-workstream-handoff.test.cjs`
- Create: `templates/docs/handoffs/workstream-handoff-template.md`
- Modify: `tools/fb-package-manifest.json`

**Interfaces:**
- Produces: `WORKSTREAMS`, `WORKSTREAM_HANDOFF_STATES`, `parseFrontmatter(markdown)`, `validateWorkstreamHandoff(markdown)`, `renderQueuedNotice(record)`, and `validateWorkstreamHandoffDirectory(directory)`.
- Validation returns an array of actionable strings; an empty array means valid.
- `renderQueuedNotice` returns `<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <link>`.

- [ ] **Step 1: Write the failing unit contract**

Create `tools/fb-workstream-handoff.test.cjs` with fixtures that assert:

```js
const assert = require('node:assert');
const {
  WORKSTREAMS,
  validateWorkstreamHandoff,
  renderQueuedNotice,
} = require('./fb-workstream-handoff.cjs');

const valid = (from, to) => `---
type: fb-workstream-handoff
from_workstream: ${from}
to_workstream: ${to}
status: queued
source_task: TASK-071
---
# ${from} to ${to}
## Question investigated
Which evidence should ${to} evaluate next?
## Evidence
- [Approved design](../superpowers/specs/2026-08-03-workstream-to-workstream-handoffs-design.md)
## Recommendation
Review the evidence from the ${to} perspective.
## Requested next investigation
Identify one decision-changing ${to} recommendation.
## Decisions
- Queue and wait for the user.
## Assumptions
- The destination task exists.
## Dependencies and limits
- Planning only; no source execution.
`;

for (const from of WORKSTREAMS) {
  for (const to of WORKSTREAMS.filter(value => value !== from)) {
    assert.deepStrictEqual(validateWorkstreamHandoff(valid(from, to)), []);
  }
}
assert.match(renderQueuedNotice({ from: 'Discovery', to: 'Design', link: 'docs/handoffs/TASK-071-discovery-to-design.md' }), /planning only; waiting for you/);
```

Also assert rejection of self-routing, unknown workstreams, `status: ready`, missing evidence link, empty requested-next-investigation content, and missing source task.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tools/fb-workstream-handoff.test.cjs`

Expected: FAIL with `Cannot find module './fb-workstream-handoff.cjs'`.

- [ ] **Step 3: Implement the minimal pure module**

Implement six canonical slugs (`product`, `business`, `design`, `tech`, `discovery`, `bugs`), five lifecycle states (`queued`, `in_review`, `consumed`, `deferred`, `superseded`), frontmatter parsing, required-section extraction, evidence-link validation, and the exact queued notice. Do not write files or send messages from this module.

- [ ] **Step 4: Add the reusable template and package declarations**

Create the template using the approved frontmatter and seven required headings. Add the module, test, and template to `tools/fb-package-manifest.json`.

- [ ] **Step 5: Run GREEN and synchronize mirrors**

Run:

```bash
node tools/fb-workstream-handoff.test.cjs
node tools/fb-package-sync.cjs --write
cd plugins/fb-lane-coordination && node tools/fb-workstream-handoff.test.cjs
```

Expected: all 30 ordered non-self pairs pass in root and package contexts.

- [ ] **Step 6: Commit Task 1**

```bash
git add tools/fb-workstream-handoff.cjs tools/fb-workstream-handoff.test.cjs templates/docs/handoffs/workstream-handoff-template.md tools/fb-package-manifest.json plugins/fb-lane-coordination
git commit -m "feat: validate queued workstream handoffs"
```

---

### Task 2: Enforce the queue boundary in doctor and BFM scanning

**Files:**
- Modify: `tools/fb-lane.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Modify: `tools/fb-workstream-handoff.test.cjs`

**Interfaces:**
- Consumes: `validateWorkstreamHandoffDirectory(directory)` from Task 1.
- Preserves: `scanWorkstreamHandoffs(rootDir)` selects only `type: fb-lane-handoff` with `status: ready`.
- Produces: doctor result `Workstream handoffs` with an actionable invalid-file list or a clean result.

- [ ] **Step 1: Extend the failing contract**

Add fixtures proving:

```js
const { scanWorkstreamHandoffs } = require('./fb-lane.cjs');

// A queued Discovery → Design artifact exists beside one Product-ready handoff.
// scanWorkstreamHandoffs selects only the Product-ready delivery handoff.
assert.deepStrictEqual(result.selected, ['docs/handoffs/TASK-071-design-delivery.md']);
```

Add a doctor fixture with an invalid self-routed workstream handoff and assert doctor reports the exact file and reason. Assert validation and scanning leave fixture file contents and Git state unchanged.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node tools/fb-workstream-handoff.test.cjs`

Expected: FAIL because doctor does not yet load the workstream-handoff validator.

- [ ] **Step 3: Integrate the validator into doctor**

Require the Task 1 module from `tools/fb-lane.cjs`. During doctor, scan `docs/handoffs`, report invalid workstream handoffs as a warning with the file and repair action, and report a clean result when every directed artifact is valid. Do not add a public CLI command.

- [ ] **Step 4: Preserve the scanner type boundary**

Keep the existing exact check:

```js
if (!metadata || metadata.type !== 'fb-lane-handoff') continue;
```

Add a regression assertion so future refactors cannot treat `queued` workstream artifacts as Product-ready scope.

- [ ] **Step 5: Run focused root/package proof**

Run:

```bash
node tools/fb-workstream-handoff.test.cjs
node tools/fb-lane.test.cjs
node tools/fb-package-sync.cjs --write
cd plugins/fb-lane-coordination && node tools/fb-workstream-handoff.test.cjs
```

Expected: workstream contract and existing CLI suite pass.

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/fb-lane.cjs tools/fb-lane.test.cjs tools/fb-workstream-handoff.test.cjs plugins/fb-lane-coordination
git commit -m "feat: keep queued handoffs outside BFM intake"
```

---

### Task 3: Teach every workstream and Product the same routing behavior

**Files:**
- Create: `tools/fb-cross-workstream-guidance.test.cjs`
- Modify: `skills/fb-lane-coordination/SKILL.md`
- Modify: `skills/fb-product/SKILL.md`
- Modify: `skills/bfm/SKILL.md`
- Modify: `skills/fb-business/SKILL.md`
- Modify: `skills/fb-design/SKILL.md`
- Modify: `skills/fb-tech/SKILL.md`
- Modify: `skills/fb-discovery/SKILL.md`
- Modify: `skills/fb-bugs/SKILL.md`
- Modify: `docs/fb/start.md`
- Modify: `docs/fb/workflow.md`
- Modify: `docs/fb/guardrails.md`
- Modify: `README.md`
- Modify: `FAQ.md`
- Modify: `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
- Modify: `tools/fb-package-manifest.json`

**Interfaces:**
- Consumes: the artifact states and exact notification from Task 1.
- Produces: one consistent natural-language workflow across canonical and packaged skills/docs.

- [ ] **Step 1: Write the failing guidance contract**

Create a structural test requiring all six workstream skills to state:

```text
<Source> handoff queued for <Destination> — planning only; waiting for you.
```

The test must also require explicit user-directed routing, destination-idle behavior, `Continue the queued <source> handoff`, plan/evidence-only continuation, a separate Product-ready handoff, `$bfm` exclusion, truthful fallback, and sidechat parent-only routing. Reject text that says arrival starts, activates, delegates, or executes the recipient.

- [ ] **Step 2: Run the contract and verify RED**

Run: `node tools/fb-cross-workstream-guidance.test.cjs`

Expected: FAIL because the current skills route every actionable result directly to Product/BFM.

- [ ] **Step 3: Update canonical skills**

Add one concise shared section to coordination, Product, BFM, and each workstream skill:

- main workstream + explicit user request may create a directed queued handoff;
- if exact destination task tools are available, send only the queue notice;
- otherwise return a paste-ready notice and direct link;
- destination remains idle until the user explicitly continues it;
- destination planning may produce a separate Product-ready delivery handoff;
- non-Product tasks redirect `$bfm` intent to Product/BFM without running it.

Place the BFM Product-task entry guard before onboarding or activation guidance.

- [ ] **Step 4: Update canonical harness and public docs**

Add the queue flow to `start.md` and `workflow.md`, retain sidechat restrictions in `guardrails.md`, and add one short Discovery → Design example to README/FAQ. Keep the main onboarding sequence unchanged; cross-workstream routing is an optional planning path, not a second setup workflow.

- [ ] **Step 5: Update installed plugin prompt**

Add a default-prompt item describing directed queued workstream handoffs. Remove any wording that lets a non-Product task run `$bfm`. Do not claim automatic task discovery or delivery when task tools are unavailable.

- [ ] **Step 6: Generate and verify package mirrors**

Run:

```bash
node tools/fb-package-sync.cjs --write
node tools/fb-cross-workstream-guidance.test.cjs
cd plugins/fb-lane-coordination && node tools/fb-cross-workstream-guidance.test.cjs
node tools/fb-package-sync.cjs --check
```

Expected: root/package guidance agrees and all declared mirrors match.

- [ ] **Step 7: Commit Task 3**

```bash
git add README.md FAQ.md docs/fb skills tools/fb-cross-workstream-guidance.test.cjs tools/fb-package-manifest.json plugins/fb-lane-coordination
git commit -m "docs: add queued cross-workstream routing"
```

---

### Task 4: Prepare the unreleased plugin candidate and closeout evidence

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `plugins/fb-lane-coordination/plugin.json`
- Modify: `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
- Modify: `README.md`
- Modify: `FAQ.md`
- Modify: `docs/setup.md`
- Modify: `docs/versioning.md`
- Modify: `platforms/codex/README.md`
- Modify: `tools/fb-plugin-metadata.test.cjs`
- Create: `docs/handoffs/TASK-071.md`
- Create: `docs/qa/TASK-071.md`
- Modify: `docs/handoffs/index.md`
- Modify: `docs/workstreams/fb-product.md`
- Modify: `PROJECT_BOARD.md`
- Modify: `.codex/current_task.md`

**Interfaces:**
- Produces: unreleased `0.5.5-beta+codex.<UTC-build>` metadata and a candidate-matched changelog draft.
- Preserves: published build `0.5.4-beta+codex.20260801143809` until explicit **Push Live**.

- [ ] **Step 1: Draft the changelog entry and metadata test first**

Require the 0.5.5 entry to state:

- **What changed:** explicit workstream-to-workstream queued planning handoffs;
- **Why it matters:** evidence can move directly between specialist workstreams without Product acting as a relay;
- **Compatibility:** existing Product-ready handoffs remain valid and `$bfm` still runs only in Product/BFM;
- **Installation or upgrade:** no action until release; after release, upgrade the marketplace plugin and start a new Codex task.

Mark changelog approval pending and show the exact draft to James before Ready to ship.

- [ ] **Step 2: Generate one UTC build identifier and update active metadata**

Use `date -u +%Y%m%d%H%M%S` once. Apply that exact build to both manifests, current-version documentation, and the metadata contract. Do not rewrite historical releases.

- [ ] **Step 3: Record TASK-071 handoff and QA evidence**

The handoff records the approved design, exact commits, checks, limits, changelog decision, and external gates. QA records RED/GREEN evidence and states that no release checkpoint, push, publication, installation, or deployment occurred.

- [ ] **Step 4: Run the focused candidate gate**

Run:

```bash
node tools/fb-workstream-handoff.test.cjs
node tools/fb-cross-workstream-guidance.test.cjs
node tools/fb-plugin-metadata.test.cjs
node tools/fb-package-sync.cjs --check
node --check tools/fb-workstream-handoff.cjs
node --check tools/fb-lane.cjs
git diff --check
node tools/fb-lane.cjs doctor
```

Expected: all focused checks pass; doctor is Ready after commit.

- [ ] **Step 5: Commit the candidate**

```bash
git add CHANGELOG.md README.md FAQ.md PROJECT_BOARD.md .codex/current_task.md docs platforms plugins tools
git commit -m "release: prepare FB 0.5.5 queued handoffs"
```

- [ ] **Step 6: Stop at the Product gates**

Show James the exact changelog entry for approval. Do not run a full release validator, push, merge, publish, reinstall, or deploy until Product separately approves the release checkpoint and later says **Push Live**.
