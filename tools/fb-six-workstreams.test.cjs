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

  const sparse = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-six-none-relevant-'));
  try {
    fs.mkdirSync(path.join(sparse, 'docs', 'handoffs'), { recursive: true });
    fs.writeFileSync(path.join(sparse, 'docs', 'handoffs', 'product.md'), handoff('PRODUCT-ONLY', 'fb-product', 'ready'));
    const sparseScan = scanWorkstreamHandoffs(sparse);
    assert.deepStrictEqual(sparseScan.selected, ['docs/handoffs/product.md']);
    for (const lane of ['business', 'design', 'tech', 'discovery', 'bugs']) {
      assert.deepStrictEqual(sparseScan.workstreams[lane], { ready: [], blocked: [], summary: 'None relevant' }, `${lane} must report an explicit None relevant disposition`);
    }
  } finally {
    fs.rmSync(sparse, { recursive: true, force: true });
  }

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

  const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const readme = read('README.md');
  assert.match(readme, /Product\/User[\s\S]*Business[\s\S]*Design[\s\S]*Tech[\s\S]*Discovery[\s\S]*Bugs/);
  assert.match(readme, /Create a handoff MD for Product\/BFM/);
  assert.match(readme, /\$bfm[\s\S]*Ready[\s\S]*to ship[\s\S]*Push Live/);
  assert.match(readme, /codex plugin marketplace add friedbeef1\/fb-lane-coordination/);

  if (fs.existsSync(path.join(root, 'FAQ.md'))) {
    assert.match(readme, /FB is a Codex plugin that connects six product workstreams in one continuous[\s\S]*delivery loop/);
    assert.match(readme, /Question → Investigate → Gather evidence → Recommend → Create handoff MD/);
    assert.match(readme, /Vanilla Codex[\s\S]*Git worktrees[\s\S]*Kurrent Capacitor[\s\S]*BMAD[\s\S]*\*\*FB\*\*/);
    assert.match(readme, /\| System \| Good because \| Gap FB addresses \|/);
    assert.match(readme, /\| \*\*FB\*\* \|[^\n]+\| — \|/);
    assert.doesNotMatch(readme, /GitHub Spec Kit|Better choice when/i);
    assert.match(readme, /Focus Bridge/);
    const faq = read('FAQ.md');
    assert.match(faq, /one process/i);
    assert.match(faq, /Feature Builder[\s\S]*Flow Booster[\s\S]*Fast Build[\s\S]*Fried Beef/);
  }

  const guardrails = read('docs/fb/guardrails.md');
  assert.match(guardrails, /Low-ceremony execution rule/);
  assert.match(guardrails, /one bounded candidate[\s\S]*complete candidate before review[\s\S]*(?:at most|exactly) one reviewer[\s\S]*one focused verification pass/i);
  assert.match(guardrails, /Report progress only when source, evidence, test state, blocker recovery, or an[\s\S]*approved decision materially changes/i);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('six-workstream runtime contract passed');
