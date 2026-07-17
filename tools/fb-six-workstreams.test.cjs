#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const cliPath = path.join(__dirname, 'fb-lane.cjs');
const { scanWorkstreamHandoffs } = require('./fb-lane.cjs');

function handoff(task, lane, status, body = '') {
  return `---\ntype: fb-lane-handoff\ntask: ${task}\nlane: ${lane}\nstatus: ${status}\nokr_fit: aligned\n---\n\n# ${task}\n\n${body}\n`;
}

assert.strictEqual(typeof scanWorkstreamHandoffs, 'function', 'runtime must export the deterministic BFM handoff scanner');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-six-workstreams-'));
try {
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  const records = [
    ['P-1.md', handoff('P-1', 'fb-product', 'ready')],
    ['D-1.md', handoff('D-1', 'fb-design', 'blocked', 'Blocked by a missing preview.')],
    ['T-1.md', handoff('T-1', 'fb-tech', 'actioned')],
    ['X-1.md', handoff('X-1', 'fb-discovery', 'deferred')],
    ['B-1.md', handoff('B-1', 'fb-bugs', 'done')],
  ];
  for (const [file, source] of records) fs.writeFileSync(path.join(root, 'docs', 'handoffs', file), source);

  assert.deepStrictEqual(scanWorkstreamHandoffs(root), {
    workstreams: {
      product: { ready: ['docs/handoffs/P-1.md'], blocked: [] },
      business: { ready: [], blocked: [], summary: 'None relevant' },
      design: { ready: [], blocked: ['docs/handoffs/D-1.md'] },
      tech: { ready: [], blocked: [], summary: 'None relevant' },
      discovery: { ready: [], blocked: [], summary: 'None relevant' },
      bugs: { ready: [], blocked: [], summary: 'None relevant' },
    },
    selected: ['docs/handoffs/P-1.md'],
  });

  fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'P-2.md'), handoff('P-1', 'fb-product', 'ready', 'Contradictory duplicate.'));
  assert.throws(() => scanWorkstreamHandoffs(root), /duplicate|contradict/i);

  const boot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-six-bootstrap-'));
  try {
    fs.mkdirSync(path.join(boot, 'docs', 'workstreams'), { recursive: true });
    fs.writeFileSync(path.join(boot, 'docs', 'workstreams', 'fb-product.md'), 'PROJECT OWNED\n');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: boot, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(boot, 'docs', 'workstreams', 'fb-product.md'), 'utf8'), 'PROJECT OWNED\n');
    for (const lane of ['product', 'business', 'design', 'tech', 'discovery', 'bugs']) {
      assert.ok(fs.existsSync(path.join(boot, 'docs', 'workstreams', `fb-${lane}.md`)), `bootstrap must provide ${lane} card`);
    }
  } finally {
    fs.rmSync(boot, { recursive: true, force: true });
  }

  const source = fs.readFileSync(cliPath, 'utf8');
  assert.match(source, /fb-product \| fb-tech \| fb-design \| fb-business \| fb-discovery \| fb-bugs/);
  assert.match(source, /enum: \['Tech', 'Design', 'Business', 'Product', 'Discovery', 'Bugs'\]/);
  const session = fs.readFileSync(path.join(__dirname, 'fb-session.cjs'), 'utf8');
  assert.match(session, /'product', 'tech', 'design', 'business', 'discovery', 'bugs', 'bfm', 'coordination'/);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('six-workstream runtime contract passed');
