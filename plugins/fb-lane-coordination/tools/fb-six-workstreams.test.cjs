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
    ['01-bugs.md', handoff('BUG-1', 'fb-bugs', 'ready')],
    ['02-discovery.md', handoff('DISCOVERY-1', 'fb-discovery', 'ready')],
    ['03-tech.md', handoff('TECH-1', 'fb-tech', 'ready')],
    ['04-design.md', handoff('DESIGN-1', 'fb-design', 'ready')],
    ['05-business.md', handoff('BUSINESS-1', 'fb-business', 'ready')],
    ['06-product.md', handoff('PRODUCT-1', 'fb-product', 'ready')],
    ['07-design-blocked.md', handoff('DESIGN-2', 'fb-design', 'blocked', 'Blocked by a missing preview.')],
    ['08-tech-actioned.md', handoff('TECH-2', 'fb-tech', 'actioned')],
    ['09-discovery-deferred.md', handoff('DISCOVERY-2', 'fb-discovery', 'deferred')],
    ['10-bugs-done.md', handoff('BUG-2', 'fb-bugs', 'done')],
    ['11-business-implemented.md', handoff('BUSINESS-2', 'fb-business', 'implemented')],
  ];
  for (const [file, source] of records) fs.writeFileSync(path.join(root, 'docs', 'handoffs', file), source);

  assert.deepStrictEqual(scanWorkstreamHandoffs(root), {
    workstreams: {
      product: { ready: ['docs/handoffs/06-product.md'], blocked: [] },
      business: { ready: ['docs/handoffs/05-business.md'], blocked: [] },
      design: { ready: ['docs/handoffs/04-design.md'], blocked: ['docs/handoffs/07-design-blocked.md'] },
      tech: { ready: ['docs/handoffs/03-tech.md'], blocked: [] },
      discovery: { ready: ['docs/handoffs/02-discovery.md'], blocked: [] },
      bugs: { ready: ['docs/handoffs/01-bugs.md'], blocked: [] },
    },
    selected: [
      'docs/handoffs/06-product.md',
      'docs/handoffs/05-business.md',
      'docs/handoffs/04-design.md',
      'docs/handoffs/03-tech.md',
      'docs/handoffs/02-discovery.md',
      'docs/handoffs/01-bugs.md',
    ],
  });

  fs.writeFileSync(path.join(root, 'docs', 'handoffs', '12-cross-workstream-duplicate.md'), handoff('PRODUCT-1', 'fb-bugs', 'ready', 'Contradictory duplicate.'));
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
