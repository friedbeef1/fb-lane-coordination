const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertWorkspaceRecoveryContract(source, label) {
  assert.match(source, /bounded workspace-health preflight/i, `${label} must require a bounded workspace-health preflight`);
  assert.match(source, /available disk capacity/i, `${label} must check available disk capacity`);
  assert.match(source, /15 GiB free-capacity\s+threshold/i, `${label} must define the portable capacity default`);
  assert.match(source, /File Provider/i, `${label} must check File Provider ancestry where relevant`);
  assert.match(source, /stable double-read/i, `${label} must require stable representative reads`);
  assert.match(source, /bounded Git\s+status\s*\/\s*diff/i, `${label} must require bounded Git status and diff probes`);
  assert.match(source, /15-second timeout/i, `${label} must define the portable Git-probe timeout`);
  assert.match(source, /second\s+consecutive\s+failure/i, `${label} must define the repeated-failure trigger`);
  assert.match(source, /clean-clone recovery/i, `${label} must prefer clean-clone recovery`);
  assert.match(source, /never copy[\s\S]{0,120}\.git[\s\S]{0,80}index[\s\S]{0,80}worktree metadata/i, `${label} must forbid damaged Git metadata migration`);
}

const detailedSurfaces = [
  'AGENTS.md',
  '.codex/rules.md',
  'templates/AGENTS.md',
  'skills/fb-lane-coordination/SKILL.md',
  'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
  'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
  'docs/loop-engineering.md',
  'docs/evals/agent-behavior-scorecard-template.md',
  'templates/docs/evals/agent-behavior-scorecard-template.md',
  'plugins/fb-lane-coordination/docs/evals/agent-behavior-scorecard-template.md',
  'tools/fb-lane.cjs',
  'plugins/fb-lane-coordination/tools/fb-lane.cjs'
];

for (const relativePath of detailedSurfaces) {
  assertWorkspaceRecoveryContract(read(relativePath), relativePath);
}

for (const relativePath of ['README.md', 'plugins/fb-lane-coordination/README.md']) {
  const source = read(relativePath);
  assert.match(source, /File Provider/i, `${relativePath} must name the relevant storage-path risk`);
  assert.match(source, /clean-clone recovery/i, `${relativePath} must describe the safe recovery direction`);
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-workspace-recovery-'));
try {
  execFileSync('node', [path.join(root, 'tools', 'fb-lane.cjs'), 'bootstrap', '--platform', 'codex'], {
    cwd: fixture,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  assertWorkspaceRecoveryContract(fs.readFileSync(path.join(fixture, 'AGENTS.md'), 'utf8'), 'generated AGENTS.md');
  assertWorkspaceRecoveryContract(fs.readFileSync(path.join(fixture, '.codex', 'rules.md'), 'utf8'), 'generated .codex/rules.md');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

console.log('workspace recovery contract: PASS');
