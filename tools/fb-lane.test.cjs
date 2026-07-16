#!/usr/bin/env node
'use strict';

// Regression tests for the fb-lane CLI hardening.
//
// These cover the command-injection fix: runGit must never hand
// caller-supplied data to a shell, and task IDs / lane names that flow into
// branch names are validated up front. Run with:  node tools/fb-lane.test.cjs
//
// No external test runner or dependencies — just node's built-in assert.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const {
  runGit,
  assertSafeTaskId,
  assertSafeLane,
  assertSafeBranchName,
} = require('./fb-lane.cjs');

let passed = 0;
const testFocus = process.env.FB_LANE_TEST_FOCUS;
const cliPath = path.join(__dirname, 'fb-lane.cjs');
const exactProgress = 'Understanding your idea → Ready for your approval → Building → Checking → Complete';
const exactBlocked = 'Blocked — <reason> / next action';
const exactHowFbWorks = [
  '1. Lanes investigate and plan different parts.',
  '2. Product combines findings into one build brief.',
  '3. You approve the brief.',
  '4. Only after explicit `$bfm`, BFM builds and checks it.'
].join('\n');

function assertExactFirstProjectContract(label, source) {
  assert.match(source, new RegExp(`\\*\\*Progress:\\*\\* ${exactProgress}`), `${label} must use the exact approved progress wording`);
  assert.match(source, new RegExp(`\\*\\*Blocked:\\*\\* ${exactBlocked.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`), `${label} must make blocked work actionable`);
  const howFbWorks = source.match(/## How FB works\n([\s\S]*?)(?=\n## |\s*$)/);
  assert.ok(howFbWorks, `${label} must include How FB works`);
  assert.strictEqual(howFbWorks[1].trim(), exactHowFbWorks, `${label} must contain exactly the four ordered FB steps`);
}

function test(name, fn) {
  if (testFocus && !name.includes(testFocus)) return;
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('assertSafeTaskId');
test('accepts conventional task IDs', () => {
  ['TASK-001', 'TASK-Q-5624', 'task_42', 'A.1'].forEach(id =>
    assert.strictEqual(assertSafeTaskId(id), id)
  );
});
test('rejects shell metacharacters', () => {
  ['TASK; rm -rf ~', 'a$(touch x)', 'a`id`', 'a&&b', 'a|b', 'a b', '', '--upload-pack=x']
    .forEach(id => assert.throws(() => assertSafeTaskId(id), /Invalid task ID/));
});
test('rejects non-strings', () => {
  [undefined, null, 42, {}].forEach(id =>
    assert.throws(() => assertSafeTaskId(id), /Invalid task ID/));
});

console.log('assertSafeLane');
test('accepts the known lanes', () => {
  ['Tech', 'Design', 'Business', 'Product', 'tech'].forEach(l =>
    assert.strictEqual(assertSafeLane(l), l));
});
test('rejects injection payloads', () => {
  ['tech; rm -rf ~ #', 'a/b', 'a b', '1tech', '', '-x']
    .forEach(l => assert.throws(() => assertSafeLane(l), /Invalid lane/));
});

console.log('assertSafeBranchName');
test('rejects empty or option-like names', () => {
  ['', '-d', '--force'].forEach(b =>
    assert.throws(() => assertSafeBranchName(b), /unsafe branch name/));
  assert.strictEqual(assertSafeBranchName('tech/TASK-001-fix'), 'tech/TASK-001-fix');
});

console.log('runGit (no shell)');
// Build a throwaway git repo so runGit has something real to talk to.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-test-'));
const prevCwd = process.cwd();
try {
  process.chdir(tmp);
  execFileSync('git', ['init', '-q'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 't@t'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 't'], { stdio: 'ignore' });
  fs.writeFileSync(path.join(tmp, 'f'), 'x');
  execFileSync('git', ['add', 'f'], { stdio: 'ignore' });
  execFileSync('git', ['commit', '-qm', 'init'], { stdio: 'ignore' });

  test('runs a normal command via an args array', () => {
    assert.strictEqual(runGit(['rev-parse', '--is-inside-work-tree']), 'true');
  });

  test('a string of literal args still works', () => {
    assert.strictEqual(runGit('rev-parse --is-inside-work-tree'), 'true');
  });

  test('shell metacharacters in an argument are NOT executed', () => {
    const sentinel = path.join(tmp, 'PWNED');
    // If a shell were involved, "; touch PWNED" would create the sentinel.
    // With execFileSync the whole string is one git revision argument, so git
    // simply fails to resolve it and the sentinel is never created.
    assert.throws(() => runGit(['rev-parse', '--verify', 'HEAD; touch PWNED']));
    assert.ok(!fs.existsSync(sentinel), 'expected no shell-created sentinel file');
  });

  test('command-substitution payloads are inert', () => {
    const sentinel = path.join(tmp, 'SUBST');
    assert.throws(() => runGit(['rev-parse', '--verify', '$(touch SUBST)']));
    assert.ok(!fs.existsSync(sentinel), 'expected no command-substitution side effect');
  });
} finally {
  process.chdir(prevCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('handoff index');
function writeDoctorFixture(root, handoffCount = 4) {
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(root, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Agents\n');
  fs.writeFileSync(path.join(root, '.codex', 'rules.md'), '# Rules\n');
  fs.writeFileSync(path.join(root, 'tools', 'fb-lane.cjs'), '// fixture\n');
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Ready | FB-Tech | Test | Test task | (None) | [Handoff](docs/handoffs/TASK-001.md) |

### TASK-001 - Test task
* **Status**: Ready
* **Goal Alignment Session**:
  * **Objective**: Keep handoff lookup cheap.
  * **Key Results**:
    * Agents can find the active handoff from an index.
  * **Definition of Done**: Doctor reports the index state.
  * **Gate / Review Point**: Product review.
  * **Approval**: approved
  * **Justification**: The task has multiple handoffs.
`);
  for (let i = 1; i <= handoffCount; i += 1) {
    const name = i === 1 ? 'TASK-001.md' : `TASK-${String(i).padStart(3, '0')}.md`;
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', name), `# ${name}

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: fixture evidence
Evidence Against Product OKR: None identified
`);
  }
}

function approvedV2Handoff(reviewState, body = '') {
  return `---
type: fb-lane-handoff
task: TASK-001
lane: fb-product
status: ready
fb_harness: v2
Review state: ${reviewState}
---

# TASK-001

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: fixture evidence
Evidence Against Product OKR: None identified

**Objective**: Verify the v2 review packet.
**Key Results**: Review evidence is actionable.
**Definition of Done**: Doctor accepts complete evidence.
**Gate / Review Point**: Product review.
**Approval**: approved
**Justification**: This fixture models an approved initial handoff.

## Project Start Brief

What you asked for: A reviewable fixture.

## Build Brief

Build the smallest reviewable fixture.
${body}`;
}

function completeReviewPacket(link) {
  return `
## Test This Now

- **Outcome type:** Reviewable fixture
- **Direct links:** [Open the review surface](${link})
- **Exact steps and expectations:**
  1. Open the direct link.
  2. Confirm the review surface loads and shows the fixture result.
- **Pass criteria:** The fixture result is visible without an error.
- **Known limits:** This fixture has no external service coverage.
- **Failure-report format:** What happened; what was expected; direct link or screenshot; environment.
`;
}

function runDoctor(root) {
  return spawnSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
}

function assertCodexBootstrap(args) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-bootstrap-'));
  try {
    const output = execFileSync('node', [cliPath, 'bootstrap', ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const brandLine = ['FB 0.2.0-beta:', 'AI', 'Loop', 'Engineering', 'for', 'Everyday', 'People'].join(' ');
    assert.ok(!output.includes(brandLine), 'bootstrap console output must not repeat the current FB model line');
    const bundledPack = path.join(__dirname, '..', 'docs', 'fb');
    const generatedPack = path.join(root, 'docs', 'fb');
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md']) {
      const bundled = path.join(bundledPack, page);
      const generated = path.join(generatedPack, page);
      assert.ok(fs.existsSync(generated), `expected bootstrap to create docs/fb/${page}`);
      assert.strictEqual(fs.readFileSync(generated, 'utf8'), fs.readFileSync(bundled, 'utf8'), `expected docs/fb/${page} to match the installed pack`);
    }
    const indexPath = path.join(root, 'docs', 'handoffs', 'index.md');
    assert.ok(fs.existsSync(indexPath), 'expected bootstrap to create docs/handoffs/index.md');
    assert.match(fs.readFileSync(indexPath, 'utf8'), /type: fb-lane-handoff-index/);
    const evalTemplatePath = path.join(root, 'docs', 'evals', 'agent-behavior-scorecard-template.md');
    assert.ok(fs.existsSync(evalTemplatePath), 'expected bootstrap to create docs/evals/agent-behavior-scorecard-template.md');
    assert.ok(!fs.readFileSync(evalTemplatePath, 'utf8').includes(brandLine), 'generated scorecard must not repeat the current FB model line');
    assert.match(fs.readFileSync(evalTemplatePath, 'utf8'), /Non-Product Execution Gate/);
    assert.match(fs.readFileSync(evalTemplatePath, 'utf8'), /## Verification Handoff/);
    assert.match(fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8'), /Sidechat-to-Main Prompt Handoff/);
    const sidechatRoutingPath = path.join(root, 'docs', 'sidechat-parent-thread-routing.md');
    assert.ok(fs.existsSync(sidechatRoutingPath), 'expected bootstrap to create sidechat parent-routing guidance');
    assert.match(fs.readFileSync(sidechatRoutingPath, 'utf8'), /one eligible destination:\s*the originating main thread/i);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /sidechat-parent-thread-routing\.md/);
    const board = fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8');
    const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const codexRules = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    assert.ok(!board.includes(brandLine), 'generated project board must not repeat the current FB model line');
    for (const [label, source] of [['PROJECT_BOARD.md', board], ['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /sidechat-parent-thread-routing\.md/, `${label} must link to the canonical rule`);
      assert.doesNotMatch(source, /paste-ready prompt for the main Product\/BFM thread/i, `${label} must not choose a destination by Product/BFM role`);
    }
    for (const [label, source] of [['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /<!-- fb-harness-route-start -->/, `${label} must include the managed FB route`);
      assert.match(source, /<!-- fb-harness-route-end -->/, `${label} must close the managed FB route`);
      assert.match(source, /docs\/fb\/README\.md/, `${label} must route to the installed FB pack`);
      assert.match(source, /First project, plan, lanes, or approval: \[start\.md\]\(docs\/fb\/start\.md\)/, `${label} must map first-project work to start.md`);
      assert.match(source, /Ownership, BFM execution, and closeout: \[workflow\.md\]\(docs\/fb\/workflow\.md\)/, `${label} must map workflow work to workflow.md`);
      assert.match(source, /Test This Now and Verification Handoff: \[evidence\.md\]\(docs\/fb\/evidence\.md\)/, `${label} must map evidence and recovery work to evidence.md`);
      assert.match(source, /Sidechat-parent routing and recovery: \[guardrails\.md\]\(docs\/fb\/guardrails\.md\)/, `${label} must map sidechat-parent work to guardrails.md`);
      assert.match(source, /\[the project sidechat rule\]\(docs\/sidechat-parent-thread-routing\.md\)/, `${label} must retain the sidechat-parent route`);
      const boardRead = source.indexOf('`PROJECT_BOARD.md`');
      const indexRead = source.indexOf('`docs/handoffs/index.md`');
      const handoffRead = source.indexOf('the linked handoff');
      assert.ok(boardRead >= 0 && boardRead < indexRead && indexRead < handoffRead, `${label} must state the board → index → linked handoff read order`);
      assert.doesNotMatch(source, /## Project Start Brief|## Test This Now|### Verification Handoff/, `${label} must remain a thin route layer`);
    }
    assert.match(output, /Describe your new project normally/, 'bootstrap quick start must lead with normal project description');
    assert.match(output, /Lanes investigate and plan different parts/, 'bootstrap quick start must say that lanes plan');
    assert.match(output, /Product combines findings into one build brief/, 'bootstrap quick start must say that Product prepares the build brief');
    assert.match(output, /You approve the brief\. Only after explicit \$bfm, BFM builds and checks it\./, 'bootstrap quick start must put user approval before the explicit $bfm build boundary');
    assert.match(output, /returning project health/, 'bootstrap quick start must reserve status for returning-project health');
    assert.match(codexRules, /docs\/fb\/guardrails\.md/, 'Codex rules must route sidechat authority through the harness');
    assert.ok(!fs.existsSync(path.join(root, '.mcp.json')), 'expected bootstrap not to create project MCP config');
    assert.ok(!fs.existsSync(path.join(root, '.claude')), 'expected bootstrap not to create Claude Code files');
    assert.ok(!fs.existsSync(path.join(root, 'agents')), 'expected bootstrap not to create Antigravity files');
    assert.doesNotMatch(output, /Antigravity|Claude Code|MCP/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('bootstrap replaces only a complete stale managed route and remains byte-stable', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-existing-bootstrap-'));
  const staleRoute = '<!-- fb-harness-route-start -->\nold managed route\n<!-- fb-harness-route-end -->';
  const agentsPrefix = '# Project-owned AGENTS\n\nKeep this exact project instruction.\n\n';
  const agentsSuffix = '\n\nKeep this exact AGENTS suffix.\n';
  const rulesPrefix = '# Project-owned rules\n\nKeep this exact custom rule.\n\n';
  const rulesSuffix = '\n\nKeep this exact rules suffix.\n';
  const agentsBefore = `${agentsPrefix}${staleRoute}${agentsSuffix}`;
  const rulesBefore = `${rulesPrefix}${staleRoute}${rulesSuffix}`;
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsBefore, 'utf8');
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'rules.md'), rulesBefore, 'utf8');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    const agentsAfterFirstRun = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const rulesAfterFirstRun = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    for (const [label, prefix, suffix, after] of [['AGENTS.md', agentsPrefix, agentsSuffix, agentsAfterFirstRun], ['.codex/rules.md', rulesPrefix, rulesSuffix, rulesAfterFirstRun]]) {
      assert.ok(after.startsWith(prefix), `${label} must preserve its project-owned prefix verbatim`);
      assert.ok(after.endsWith(suffix), `${label} must preserve its project-owned suffix verbatim`);
      assert.doesNotMatch(after, /old managed route/, `${label} must replace the stale managed route`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-start -->/g) || []).length, 1, `${label} must retain one managed route start marker`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-end -->/g) || []).length, 1, `${label} must retain one managed route end marker`);
      assert.match(after, /docs\/fb\/README\.md/, `${label} must route to the installed pack`);
    }
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agentsAfterFirstRun, 'AGENTS.md route update must be idempotent');
    assert.strictEqual(fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8'), rulesAfterFirstRun, '.codex/rules.md route update must be idempotent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('bootstrap preserves unmatched route-start markers while appending one complete managed route', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-marker-bootstrap-'));
  const unmatchedStart = '<!-- fb-harness-route-start -->\nproject-owned unfinished note';
  const agentsBefore = `# Project-owned AGENTS\n\n${unmatchedStart}\n`;
  const rulesBefore = `# Project-owned rules\n\n${unmatchedStart}\n`;
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsBefore, 'utf8');
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'rules.md'), rulesBefore, 'utf8');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    const agentsAfterFirstRun = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const rulesAfterFirstRun = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    for (const [label, before, after] of [['AGENTS.md', agentsBefore, agentsAfterFirstRun], ['.codex/rules.md', rulesBefore, rulesAfterFirstRun]]) {
      assert.ok(after.startsWith(before), `${label} must preserve unmatched project-owned text verbatim`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-start -->/g) || []).length, 2, `${label} must append a complete route after its unmatched start marker`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-end -->/g) || []).length, 1, `${label} must append one managed route end marker`);
      assert.match(after, /docs\/fb\/README\.md/, `${label} must append the canonical harness route`);
    }
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agentsAfterFirstRun, 'AGENTS.md marker migration must be idempotent');
    assert.strictEqual(fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8'), rulesAfterFirstRun, '.codex/rules.md marker migration must be idempotent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('bootstrap preserves legacy routes while appending one complete managed route', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-legacy-bootstrap-'));
  const legacyRoute = '<!-- fb-lane-start -->\nlegacy project-owned routing text\n<!-- fb-lane-end -->';
  const agentsBefore = `# Project-owned AGENTS\n\n${legacyRoute}\n`;
  const rulesBefore = `# Project-owned rules\n\n${legacyRoute}\n`;
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsBefore, 'utf8');
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'rules.md'), rulesBefore, 'utf8');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    const agentsAfterFirstRun = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const rulesAfterFirstRun = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    for (const [label, before, after] of [['AGENTS.md', agentsBefore, agentsAfterFirstRun], ['.codex/rules.md', rulesBefore, rulesAfterFirstRun]]) {
      assert.ok(after.startsWith(before), `${label} must preserve legacy project-owned text verbatim`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-start -->/g) || []).length, 1, `${label} must append one managed route start marker`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-end -->/g) || []).length, 1, `${label} must append one managed route end marker`);
      assert.match(after, /docs\/fb\/README\.md/, `${label} must append the canonical harness route`);
    }
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agentsAfterFirstRun, 'AGENTS.md legacy migration must be idempotent');
    assert.strictEqual(fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8'), rulesAfterFirstRun, '.codex/rules.md legacy migration must be idempotent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log('sidechat parent-thread routing');
test('documents the parent-only sidechat routing rule across source and package entry points', () => {
  const repoRoot = process.cwd();
  const canonicalPath = path.join(repoRoot, 'docs', 'sidechat-parent-thread-routing.md');
  assert.ok(fs.existsSync(canonicalPath), 'expected canonical sidechat parent-routing document');
  const canonical = fs.readFileSync(canonicalPath, 'utf8');
  assert.match(canonical, /one eligible destination:\s*the originating main thread/i);
  assert.match(canonical, /must not choose a destination.*role.*project.*name.*recency.*Product\/BFM status/is);
  assert.match(canonical, /cannot be identified or reached.*paste-ready handoff.*must not send, redirect, or imply/is);
  assert.match(canonical, /ordinary\s+user-provided context/i);

  const entryPoints = [
    '.codex/rules.md',
    'AGENTS.md',
    'FAQ.md',
    'README.md',
    'docs/loop-engineering.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'skills/quickstart/SKILL.md',
    'templates/AGENTS.md',
    'templates/PROJECT_BOARD.md',
    'plugins/fb-lane-coordination/README.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-tech/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-design/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-business/SKILL.md'
  ];
  for (const relativePath of entryPoints) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    if (!source.includes('sidechat-parent-thread-routing.md')) {
      assert.match(source, /(?:docs\/)?fb\/guardrails\.md/, `${relativePath} must route sidechat policy through the harness`);
      continue;
    }
    assert.match(source, /sidechat-parent-thread-routing\.md/, `${relativePath} must link to the canonical rule`);
    assert.match(source, /only to its (?:originating )?parent|only eligible destination|originating parent main thread/i, `${relativePath} must forbid non-parent delivery`);
    assert.match(source, /ordinary user-provided context/i, `${relativePath} must protect non-parent receiving threads`);
    assert.doesNotMatch(source, /paste-ready prompt for the main Product\/BFM thread/i, `${relativePath} must not choose a destination by Product/BFM role`);
  }
});

test('documents the verification handoff and recovery contract across source, package, and bootstrap', () => {
  const repoRoot = process.cwd();
  const scorecards = [
    'docs/evals/agent-behavior-scorecard-template.md',
    'templates/docs/evals/agent-behavior-scorecard-template.md',
    'plugins/fb-lane-coordination/docs/evals/agent-behavior-scorecard-template.md'
  ];
  for (const relativePath of scorecards) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /## Verification Handoff/, `${relativePath} must include the verification handoff checklist`);
    assert.match(source, /Test plan.*link/i, `${relativePath} must require a test plan link`);
    assert.match(source, /Next Product\/BFM recovery action/i, `${relativePath} must require the next recovery action`);
  }

  const entryPoints = [
    'AGENTS.md',
    '.codex/rules.md',
    'templates/AGENTS.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const relativePath of entryPoints) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    if (!source.match(/Verification Handoff/i) || !source.match(/next Product\/BFM recovery action/i)) {
      assert.match(source, /(?:docs\/)?fb\/evidence\.md/, `${relativePath} must route verification guidance through the harness`);
      continue;
    }
    assert.match(source, /Verification Handoff/i, `${relativePath} must direct Product/BFM to the verification handoff`);
    assert.match(source, /next Product\/BFM recovery action/i, `${relativePath} must require agent-owned recovery`);
  }

  for (const relativePath of ['tools/fb-lane.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.cjs']) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /docs\/fb\/evidence\.md/, `${relativePath} must generate the verification route`);
    assert.match(source, /docs\/fb\/guardrails\.md/, `${relativePath} must generate the recovery route`);
  }
});

test('documents the completed bootstrap and v2 review-authoring contract across source and package', () => {
  const repoRoot = process.cwd();
  const setupSkills = [
    'skills/project-coordination-setup/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const relativePath of setupSkills) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /bootstrap (?:installs|copies) the canonical six-page (?:FB harness|\[FB harness\]\([^)]*\))\s*pack/i, `${relativePath} must describe the completed pack install`);
    assert.match(source, /thin managed route/i, `${relativePath} must describe thin managed routes`);
    assert.match(source, /preserv(?:e|es|ing) project-owned text/i, `${relativePath} must preserve project-owned text`);
    assert.match(source, /fb-harness-route-start.*fb-harness-route-end/is, `${relativePath} must name the managed replacement boundary`);
    assert.doesNotMatch(source, /does not yet install this pack|Task 2 owns that migration/i, `${relativePath} must not retain pre-migration setup guidance`);
  }

  const evidencePages = [
    'docs/fb/evidence.md',
    'plugins/fb-lane-coordination/docs/fb/evidence.md'
  ];
  for (const relativePath of evidencePages) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /fb_harness:\s*v2/, `${relativePath} must document the v2 opt-in marker`);
    assert.match(source, /not reviewable.*runnable sandbox.*staging candidate.*completed build/is, `${relativePath} must list every exact Review state`);
    assert.match(source, /Project Start Brief.*Build Brief/is, `${relativePath} must require both approved initial briefs`);
    assert.match(source, /historical|non-v2/i, `${relativePath} must document the non-v2 exemption`);
    assert.match(source, /not reviewable[\s\S]*exempt|exempt[\s\S]*not reviewable/i, `${relativePath} must document the planning-only exemption`);
    assert.match(source, /relative to the handoff/i, `${relativePath} must document local-link resolution`);
    assert.match(source, /remote[\s\S]*Markdown-link shape/i, `${relativePath} must document remote-link validation`);
    assert.match(source, /Blocked — no review environment yet[\s\S]*Next Product\/BFM action/is, `${relativePath} must document blocked missing access`);
  }
});

test('all nine active Task-1 contract surfaces keep exact progress and blocked wording', () => {
  const repoRoot = process.cwd();
  const startGuide = fs.readFileSync(path.join(repoRoot, 'docs', 'fb', 'start.md'), 'utf8');
  assert.match(startGuide, new RegExp(`\\*\\*Progress:\\*\\* ${exactProgress}`), 'docs/fb/start.md must keep the exact approved progress wording');
  const activeContractSurfaces = [
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md',
    'README.md',
    'FAQ.md',
    'platforms/codex/README.md',
    'plugins/fb-lane-coordination/README.md',
    'docs/loop-engineering.md'
  ];

  for (const relativePath of activeContractSurfaces) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /(?:docs\/)?fb\/start\.md/, `${relativePath} must route first-project guidance to the canonical harness page`);
  }
});

test('bootstrap defaults to Codex-only output', () => {
  assertCodexBootstrap([]);
});

test('bootstrap accepts --platform codex', () => {
  assertCodexBootstrap(['--platform', 'codex']);
});

test('bootstrap accepts --codex-only', () => {
  assertCodexBootstrap(['--codex-only']);
});

for (const platform of ['all', 'claude', 'claude-code', 'antigravity']) {
  test(`bootstrap rejects --platform ${platform} without writing files`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-rejected-platform-'));
    try {
      assert.throws(
        () => execFileSync('node', [cliPath, 'bootstrap', '--platform', platform], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe']
        }),
        (error) => {
          assert.match(error.stderr, /Invalid platform/);
          assert.match(error.stderr, /paused; collaborators welcome/);
          assert.match(error.stderr, /docs\/paused-integrations\.md/);
          return true;
        }
      );
      assert.deepStrictEqual(fs.readdirSync(root), [], 'rejected bootstrap must leave its temp directory empty');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test('CLI source contains no stale non-Codex runtime or claim guidance', () => {
  const source = fs.readFileSync(cliPath, 'utf8');
  assert.doesNotMatch(source, /\b(?:includeClaude|includeAntigravity|agentConfigs)\b/);
  assert.doesNotMatch(source, /(?:Create Antigravity agent config|Create Claude Code lane subagents|claudeAgentsDir)/);
  assert.doesNotMatch(source, /CLAUDE_PROJECT_DIR/);
  assert.doesNotMatch(source, /&& claude/);
  assert.doesNotMatch(source, /Claude Code/);
});

test('repository contains no legacy runtime or configuration entry points', () => {
  let root = __dirname;
  while (!fs.existsSync(path.join(root, 'tools', 'fb-lane.validate.cjs'))) {
    const parent = path.dirname(root);
    assert.notStrictEqual(parent, root, 'could not find repository root');
    root = parent;
  }

  for (const legacyPath of ['.mcp.json', 'tools/run_lane.py', 'CLAUDE.md', 'templates/CLAUDE.md']) {
    assert.ok(!fs.existsSync(path.join(root, legacyPath)), `expected ${legacyPath} to be absent`);
  }
});

test('active Codex guides and demo use only the Codex bootstrap contract', () => {
  let root = __dirname;
  while (!fs.existsSync(path.join(root, 'tools', 'fb-lane.validate.cjs'))) {
    const parent = path.dirname(root);
    assert.notStrictEqual(parent, root, 'could not find repository root');
    root = parent;
  }

  const activeCodexPaths = [
    'docs/loop-engineering.md',
    'docs/setup.md',
    'platforms/codex/README.md',
    'plugins/fb-lane-coordination/README.md',
    'examples/my-app/README.md',
    'codex-lane-demo/AGENTS.md',
  ];
  for (const relativePath of activeCodexPaths) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.doesNotMatch(source, /\b(?:Claude(?: Code)?|Antigravity)\b/i, `${relativePath} must be Codex-only`);
    assert.doesNotMatch(source, /\b(?:project\s+)?MCP\s+config(?:uration)?\b/i, `${relativePath} must not promise project MCP configuration`);
  }
  assert.ok(!fs.existsSync(path.join(root, 'codex-lane-demo', 'CLAUDE.md')), 'expected demo Claude instructions to be absent');
});

test('doctor does not require project MCP configuration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 0);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.doesNotMatch(output, /project MCP config|\.mcp\.json/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor warns when many handoffs have no index', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 1);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff index/);
    assert.match(output, /docs\/handoffs\/index\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor warns when index lacks dependency gate columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `---
type: fb-lane-handoff-index
status: active
---

# Handoff Index

| Task / Topic | Lane | Status | Fit | Detail |
|---|---|---|---|---|
| TASK-001 | FB-Tech | Ready | aligned | [TASK-001.md](TASK-001.md) |
`);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /old-style/);
    assert.match(output, /Depends \/ Blocks \/ Gate/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor accepts non-quick handoffs with compact index columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 4);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `---
type: fb-lane-handoff-index
status: active
---

# Handoff Index

| Task / Topic | Lane | Status | Depends / Blocks / Gate | Checks / Evidence | Detail |
|---|---|---|---|---|---|
| TASK-001 | FB-Tech | Ready | Product gate | Doctor fixture | [TASK-001.md](TASK-001.md) |
`);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff index/);
    assert.doesNotMatch(output, /Missing docs\/handoffs\/index\.md/);
    assert.doesNotMatch(output, /old-style/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor does not require an index for quick-only handoffs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 0);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-Q-1234.md'), '# quick\n');
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff lookup is present or not needed yet/);
    assert.doesNotMatch(output, /Missing docs\/handoffs\/index\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log('harness-v2 review evidence');
test('doctor accepts an approved v2 initial handoff with briefs and a resolvable local review link', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.mkdirSync(path.join(root, 'docs', 'handoffs', 'review'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'review', 'sandbox.html'), '<p>review</p>');
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('runnable sandbox', completeReviewPacket('review/sandbox.html'))
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 0, result.stdout || result.stderr);
    assert.doesNotMatch(result.stdout, /❌ Review evidence/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor accepts every v2 reviewable state with a complete review packet', () => {
  const fixtures = [
    ['runnable sandbox', 'review/sandbox.html', true],
    ['staging candidate', 'https://review.example.test/staging', false],
    ['completed build', 'review/build.html', true],
  ];

  for (const [reviewState, link, needsLocalFile] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      if (needsLocalFile) {
        fs.mkdirSync(path.join(root, 'docs', 'handoffs', 'review'), { recursive: true });
        fs.writeFileSync(path.join(root, 'docs', 'handoffs', link), '<p>review</p>');
      }
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff(reviewState, completeReviewPacket(link))
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 0, `${reviewState}: ${result.stdout || result.stderr}`);
      assert.doesNotMatch(result.stdout, /❌ Review evidence/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks an approved v2 initial handoff missing either required brief', () => {
  for (const heading of ['Project Start Brief', 'Build Brief']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      const sectionPattern = new RegExp(`\\n## ${heading}[\\s\\S]*?(?=\\n## )`);
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff('runnable sandbox', completeReviewPacket('https://review.example.test/sandbox'))
          .replace(sectionPattern, '\n')
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${heading}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Project Start Brief and Build Brief/);
      assert.match(result.stdout, new RegExp(heading));
      assert.match(result.stdout, /Add both required sections/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks incomplete v2 review packets with an actionable Test This Now result', () => {
  const fixtures = [
    ['missing section', '', /Outcome type/],
    ['empty outcome', completeReviewPacket('https://review.example.test/staging').replace('Reviewable fixture', ''), /Outcome type/],
    ['plain URL', completeReviewPacket('https://review.example.test/staging').replace('[Open the review surface](https://review.example.test/staging)', 'https://review.example.test/staging'), /Markdown direct link/],
  ];

  for (const [label, packet, expectedMissing] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-001.md'), approvedV2Handoff('staging candidate', packet));

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${label}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Review evidence/);
      assert.match(result.stdout, /Test This Now/);
      assert.match(result.stdout, expectedMissing);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks a v2 review packet whose exact steps field is empty even when another numbered line exists', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    const packet = completeReviewPacket('https://review.example.test/staging')
      .replace(
        '- **Exact steps and expectations:**\n  1. Open the direct link.\n  2. Confirm the review surface loads and shows the fixture result.',
        '- **Exact steps and expectations:**'
      )
      .replace(
        '- **Known limits:** This fixture has no external service coverage.',
        '- **Known limits:** This fixture has no external service coverage.\n1. Unrelated numbered note.'
      );
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', packet)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Review evidence/);
    assert.match(result.stdout, /Exact steps and expectations/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor blocks placeholder-only values in required v2 review fields', () => {
  const fixtures = [
    ['angle-bracket outcome', 'Reviewable fixture', '<what is ready to assess>', /Outcome type/],
    ['example direct links', '[Open the review surface](https://review.example.test/staging)', 'example', /Direct links/],
    ['TODO pass criteria', 'The fixture result is visible without an error.', 'TODO', /Pass criteria/],
    ['TBD known limits', 'This fixture has no external service coverage.', 'TBD', /Known limits/],
    ['placeholder failure format', 'What happened; what was expected; direct link or screenshot; environment.', 'placeholder', /Failure-report format/],
  ];

  for (const [label, currentValue, placeholderValue, expectedMissing] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      const packet = completeReviewPacket('https://review.example.test/staging')
        .replace(currentValue, placeholderValue);
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff('staging candidate', packet)
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${label}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Review evidence/);
      assert.match(result.stdout, expectedMissing);
      assert.match(result.stdout, /actionable/i);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks placeholder-only numbered steps in v2 review evidence', () => {
  for (const placeholderStep of ['1. TODO', '1. <action>']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      const packet = completeReviewPacket('https://review.example.test/staging')
        .replace(
          '  1. Open the direct link.\n  2. Confirm the review surface loads and shows the fixture result.',
          `  ${placeholderStep}`
        );
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff('staging candidate', packet)
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${placeholderStep}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Review evidence/);
      assert.match(result.stdout, /actionable numbered exact steps/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks v2 review packets whose local Markdown direct link does not resolve', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('completed build', completeReviewPacket('review/missing-build.html'))
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Local Markdown direct link\(s\) do not resolve/);
    assert.match(result.stdout, /review\/missing-build\.html/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor treats missing v2 review access as the explicit blocked environment state', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', `
## Test This Now

Blocked — no review environment yet
Next Product/BFM action: create the staging review environment and add its direct link.
`)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Blocked — no review environment yet/);
    assert.match(result.stdout, /Next Product\/BFM action/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor requires an actionable Product/BFM next action for blocked v2 review access', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', `
## Test This Now

Blocked — no review environment yet
Next Product/BFM action:
`)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Test This Now is incomplete/);
    assert.match(result.stdout, /Next Product\/BFM action/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor rejects a placeholder-only Product/BFM next action for blocked v2 review access', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', `
## Test This Now

Blocked — no review environment yet
Next Product/BFM action: TBD
`)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Test This Now is incomplete/);
    assert.match(result.stdout, /Next Product\/BFM action/);
    assert.match(result.stdout, /actionable/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor keeps planning-only v2 and historical handoffs exempt from review evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-001.md'), `---
fb_harness: v2
Review state: not reviewable
---

# Planning-only v2 handoff
`);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-LEGACY.md'), '# Historical handoff\n');

    const result = runDoctor(root);
    assert.strictEqual(result.status, 0, result.stdout || result.stderr);
    assert.doesNotMatch(result.stdout, /❌ Review evidence/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor rejects v2 review states outside the four visible values', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-001.md'), approvedV2Handoff('waiting on QA'));

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Review state/);
    assert.match(result.stdout, /not reviewable.*runnable sandbox.*staging candidate.*completed build/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log(`\n✅ ${passed} checks passed.`);
