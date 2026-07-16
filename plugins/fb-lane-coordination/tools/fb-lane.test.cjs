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
const { execFileSync } = require('child_process');

const {
  runGit,
  assertSafeTaskId,
  assertSafeLane,
  assertSafeBranchName,
} = require('./fb-lane.cjs');

let passed = 0;
const cliPath = path.join(__dirname, 'fb-lane.cjs');
function test(name, fn) {
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
    const indexPath = path.join(root, 'docs', 'handoffs', 'index.md');
    assert.ok(fs.existsSync(indexPath), 'expected bootstrap to create docs/handoffs/index.md');
    assert.match(fs.readFileSync(indexPath, 'utf8'), /type: fb-lane-handoff-index/);
    const evalTemplatePath = path.join(root, 'docs', 'evals', 'agent-behavior-scorecard-template.md');
    assert.ok(fs.existsSync(evalTemplatePath), 'expected bootstrap to create docs/evals/agent-behavior-scorecard-template.md');
    assert.ok(!fs.readFileSync(evalTemplatePath, 'utf8').includes(brandLine), 'generated scorecard must not repeat the current FB model line');
    assert.match(fs.readFileSync(evalTemplatePath, 'utf8'), /Non-Product Execution Gate/);
    assert.match(fs.readFileSync(evalTemplatePath, 'utf8'), /## Verification Handoff/);
    assert.match(fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8'), /Sidechat-to-Main Prompt Handoff/);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /Exact instruction for Product\/BFM/);
    const sidechatRoutingPath = path.join(root, 'docs', 'sidechat-parent-thread-routing.md');
    assert.ok(fs.existsSync(sidechatRoutingPath), 'expected bootstrap to create sidechat parent-routing guidance');
    assert.match(fs.readFileSync(sidechatRoutingPath, 'utf8'), /one eligible destination:\s*the originating main thread/i);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /sidechat-parent-thread-routing\.md/);
    const board = fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8');
    const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const codexRules = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    assert.ok(!board.includes(brandLine), 'generated project board must not repeat the current FB model line');
    for (const [label, source] of [['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.ok(source.includes(brandLine), `${label} must include the current FB model line exactly`);
      assert.doesNotMatch(source, /FB-Lane (?:Four-Lane|light|Coordination)/, `${label} must use the visible FB product name`);
    }
    for (const [label, source] of [['PROJECT_BOARD.md', board], ['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /sidechat-parent-thread-routing\.md/, `${label} must link to the canonical rule`);
      assert.doesNotMatch(source, /paste-ready prompt for the main Product\/BFM thread/i, `${label} must not choose a destination by Product/BFM role`);
    }
    for (const [label, source] of [['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /Verification Handoff/i, `${label} must explain the verification handoff`);
      assert.match(source, /next Product\/BFM recovery action/i, `${label} must require agent-owned recovery`);
    }
    for (const [label, source] of [['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /## Project Start Brief/, `${label} must explain how a new project starts`);
      assert.match(source, /Your decisions:/, `${label} must separate user decisions`);
      assert.match(source, /Assumptions to confirm:/, `${label} must separate assumptions to confirm`);
      assert.match(source, /Success looks like:/, `${label} must name the success outcome`);
      assert.match(source, /Progress:/, `${label} must name the current user-facing progress`);
      assert.match(source, /## How FB works/, `${label} must explain the FB loop in plain language`);
      assert.match(source, /Only after explicit `?\$bfm`?/, `${label} must state the BFM build boundary`);
      assert.match(source, /## Test This Now/, `${label} must provide the review contract`);
      assert.match(source, /Understanding your idea → Ready for your approval → Building → Checking → Complete/, `${label} must use the approved plain-language progress states`);
      assert.match(source, /Blocked — <reason> \/ next action/, `${label} must make blocked work actionable`);
    }
    assert.match(output, /Describe your new project normally/, 'bootstrap quick start must lead with normal project description');
    assert.match(output, /returning project health/, 'bootstrap quick start must reserve status for returning-project health');
    assert.match(codexRules, /A sidechat prompt is not source of truth/);
    assert.ok(!fs.existsSync(path.join(root, '.mcp.json')), 'expected bootstrap not to create project MCP config');
    assert.ok(!fs.existsSync(path.join(root, '.claude')), 'expected bootstrap not to create Claude Code files');
    assert.ok(!fs.existsSync(path.join(root, 'agents')), 'expected bootstrap not to create Antigravity files');
    assert.doesNotMatch(output, /Antigravity|Claude Code|MCP/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

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
    assert.match(source, /Verification Handoff/i, `${relativePath} must direct Product/BFM to the verification handoff`);
    assert.match(source, /next Product\/BFM recovery action/i, `${relativePath} must require agent-owned recovery`);
  }

  for (const relativePath of ['tools/fb-lane.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.cjs']) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /Verification Handoff/i, `${relativePath} must generate the verification handoff rule`);
    assert.match(source, /next Product\/BFM recovery action/i, `${relativePath} must generate agent-owned recovery`);
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

console.log(`\n✅ ${passed} checks passed.`);
