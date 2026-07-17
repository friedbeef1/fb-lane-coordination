const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readBytes(relativePath) {
  return fs.readFileSync(path.join(root, relativePath));
}

function assertWorkspaceRecoveryContract(source, label) {
  assert.match(source, /bounded workspace-health checks/i, `${label} must require bounded workspace-health checks`);
  assert.match(source, /documented free-space threshold/i, `${label} must require a documented free-space threshold`);
  assert.match(source, /15 GiB by\s+default/i, `${label} must define the portable capacity default`);
  assert.match(source, /File Provider\/synchronized-storage ancestry/i, `${label} must check synchronized-storage ancestry where relevant`);
  assert.match(source, /stable\s+double-read hashes/i, `${label} must require stable representative reads`);
  assert.match(source, /15-second bounded Git status\/diff probes/i, `${label} must define bounded Git probes and their timeout`);
  assert.match(source, /second\s+consecutive\s+failure/i, `${label} must define the repeated-failure trigger`);
  assert.match(source, /clean-clone recovery/i, `${label} must prefer clean-clone recovery`);
  assert.match(source, /do\s+not copy damaged Git\/index\/worktree metadata/i, `${label} must forbid damaged Git metadata migration`);
  assert.match(source, /unbounded temporary runner as passing evidence/i, `${label} must reject unbounded-runner evidence`);
}

function assertRoutesRecoveryToGuardrails(source, label) {
  const link = '[guardrails.md](docs/fb/guardrails.md)';
  const linkIndex = source.indexOf(link);
  assert.ok(linkIndex >= 0, `${label} must link to the canonical guardrails page`);
  const recoveryIndex = source.toLowerCase().lastIndexOf('recovery', linkIndex);
  assert.ok(recoveryIndex >= 0, `${label} must identify recovery as a routed concern`);
  assert.ok(recoveryIndex < linkIndex && linkIndex - recoveryIndex < 180, `${label} must route recovery directly to the canonical guardrails page`);
  assert.doesNotMatch(source, /15 GiB/i, `${label} must route to the contract instead of duplicating it`);
}

const canonicalGuardrails = readBytes('docs/fb/guardrails.md');
assertWorkspaceRecoveryContract(canonicalGuardrails.toString('utf8'), 'docs/fb/guardrails.md');
assertWorkspaceRecoveryContract(read('plugins/fb-lane-coordination/docs/fb/guardrails.md'), 'packaged guardrails');

for (const relativePath of ['AGENTS.md', 'templates/AGENTS.md']) {
  assertRoutesRecoveryToGuardrails(read(relativePath), relativePath);
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-workspace-recovery-'));
try {
  execFileSync('node', [path.join(root, 'tools', 'fb-lane.cjs'), 'bootstrap', '--platform', 'codex'], {
    cwd: fixture,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  assert.deepStrictEqual(
    fs.readFileSync(path.join(fixture, 'docs', 'fb', 'guardrails.md')),
    canonicalGuardrails,
    'fresh bootstrap must copy the canonical guardrails page byte-for-byte'
  );
  assertRoutesRecoveryToGuardrails(fs.readFileSync(path.join(fixture, 'AGENTS.md'), 'utf8'), 'generated AGENTS.md');
  assertRoutesRecoveryToGuardrails(fs.readFileSync(path.join(fixture, '.codex', 'rules.md'), 'utf8'), 'generated .codex/rules.md');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

console.log('workspace recovery contract: PASS');
