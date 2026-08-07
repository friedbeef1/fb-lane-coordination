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
    candidates: [
      'docs/handoffs/06-product.md',
      'docs/handoffs/05-business.md',
      'docs/handoffs/04-design.md',
      'docs/handoffs/03-tech.md',
      'docs/handoffs/02-discovery.md',
      'docs/handoffs/01-bugs.md',
    ],
    blockedCandidates: [{
      relative: 'docs/handoffs/07-design-blocked.md',
      task: 'DESIGN-2',
      role: 'Design',
    }],
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

  const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-six-canonical-'));
  const orphan = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-six-orphan-'));
  try {
    fs.mkdirSync(path.join(canonical, '.git'), { recursive: true });
    fs.mkdirSync(path.join(canonical, 'docs', 'handoffs'), { recursive: true });
    fs.mkdirSync(path.join(orphan, 'docs', 'handoffs'), { recursive: true });
    fs.writeFileSync(
      path.join(canonical, '.git', 'fb-handoff-audit-roots'),
      `${orphan}\n`
    );
    fs.writeFileSync(
      path.join(orphan, 'docs', 'handoffs', 'orphan.md'),
      '# Orphan\n\n**Status:** Ready for Product/BFM sequencing\n'
    );
    assert.throws(
      () => scanWorkstreamHandoffs(canonical),
      /READINESS_FALSE_NEGATIVE[\s\S]*orphan\.md/i,
      'an empty canonical scan must fail when a configured orphan root contains a Ready-like handoff'
    );

    fs.writeFileSync(
      path.join(canonical, 'docs', 'handoffs', 'selected.md'),
      handoff('PRODUCT-SELECTED', 'fb-product', 'ready')
    );
    assert.throws(
      () => scanWorkstreamHandoffs(canonical),
      /READINESS_FALSE_NEGATIVE[\s\S]*orphan\.md/i,
      'one selected canonical handoff must not conceal another Ready-like off-home handoff'
    );
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(orphan, { recursive: true, force: true });
  }

  fs.writeFileSync(path.join(root, 'docs', 'handoffs', '12-cross-workstream-duplicate.md'), handoff('PRODUCT-1', 'fb-bugs', 'ready', 'Contradictory duplicate.'));
  assert.throws(() => scanWorkstreamHandoffs(root), /duplicate|contradict/i);

  const boot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-six-bootstrap-'));
  try {
    fs.mkdirSync(path.join(boot, 'docs', 'workstreams'), { recursive: true });
    fs.writeFileSync(path.join(boot, 'docs', 'workstreams', 'fb-product.md'), 'PROJECT OWNED\n');
    const bootstrapStdout = execFileSync('node', [cliPath, 'bootstrap'], { cwd: boot, encoding: 'utf8' });
    const productCard = fs.readFileSync(path.join(boot, 'docs', 'workstreams', 'fb-product.md'), 'utf8');
    const managedStart = '<!-- FB-LANE:WORKSTREAM-SUMMARY:START -->';
    const managedEnd = '<!-- FB-LANE:WORKSTREAM-SUMMARY:END -->';
    const managedStartIndex = productCard.indexOf(managedStart);
    const managedEndIndex = productCard.indexOf(managedEnd, managedStartIndex + managedStart.length);
    assert.strictEqual(productCard.slice(0, managedStartIndex), 'PROJECT OWNED\n', 'bootstrap must preserve project-owned card content byte-for-byte outside the managed block');
    assert.strictEqual(productCard.split(managedStart).length - 1, 1, 'bootstrap must add exactly one managed-summary start marker');
    assert.strictEqual(productCard.split(managedEnd).length - 1, 1, 'bootstrap must add exactly one managed-summary end marker');
    assert.ok(managedStartIndex >= 0 && managedEndIndex > managedStartIndex, 'bootstrap must add a complete managed summary block');
    const managedSummary = productCard.slice(managedStartIndex + managedStart.length, managedEndIndex);
    assert.match(managedSummary, /## Next/, 'managed summary must include the Next section');
    assert.match(managedSummary, /Product intake:/, 'managed summary must include the Product-intake state');
    for (const lane of ['product', 'business', 'design', 'tech', 'discovery', 'bugs']) {
      assert.ok(fs.existsSync(path.join(boot, 'docs', 'workstreams', `fb-${lane}.md`)), `bootstrap must provide ${lane} card`);
    }
    for (const relative of ['AGENTS.md', 'PROJECT_BOARD.md']) {
      const generated = fs.readFileSync(path.join(boot, relative), 'utf8');
      assert.match(generated, /ready\s+for Product\s+intake/i, `${relative} must keep ready as Product intake`);
      assert.match(generated, /disposition every candidate[\s\S]*before\s+source execution/i, `${relative} must require disposition before execution`);
      assert.doesNotMatch(generated, /approval attaches to (?:that )?ready scope before `\$bfm`/i, `${relative} must not attach approval before $bfm`);
    }
    assert.match(bootstrapStdout, /ready for Product intake/i, 'Quick Start must identify ready handoffs as Product intake candidates');
    assert.match(bootstrapStdout, /must disposition every candidate[\s\S]*before sequencing Include now work/i, 'Quick Start must require Product disposition before sequencing execution');
  } finally {
    fs.rmSync(boot, { recursive: true, force: true });
  }

  const source = fs.readFileSync(cliPath, 'utf8');
  assert.match(source, /fb-product \| fb-tech \| fb-design \| fb-business \| fb-discovery \| fb-bugs/);
  assert.match(source, /enum: \['Tech', 'Design', 'Business', 'Product', 'Discovery', 'Bugs', 'BFM'\]/);
  const session = fs.readFileSync(path.join(__dirname, 'fb-session.cjs'), 'utf8');
  assert.match(session, /'product', 'tech', 'design', 'business', 'discovery', 'bugs', 'bfm', 'coordination'/);

  const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const readme = read('README.md');
  assert.match(readme, /\bUser\b[\s\S]*\bBusiness\b[\s\S]*\bDesign\b[\s\S]*\bTech\b[\s\S]*\bDiscovery\b[\s\S]*\bBugs\b/);
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

  const intakeGuidance = [
    'docs/fb/start.md',
    'docs/fb/workflow.md',
    'docs/fb/full-loop.md',
    'skills/bfm/SKILL.md',
    'skills/fb-product/SKILL.md',
  ];
  const packageRoot = path.join(__dirname, '..', 'plugins', 'fb-lane-coordination');
  const guidancePaths = fs.existsSync(packageRoot)
    ? [...intakeGuidance, ...intakeGuidance.map(relative => `plugins/fb-lane-coordination/${relative}`)]
    : intakeGuidance;
  for (const relative of guidancePaths) {
    const guidance = read(relative);
    assert.match(guidance, /ready\s+for Product\s+intake/i, `${relative} must define ready as Product intake`);
    assert.doesNotMatch(guidance, /already-approved ready scope/i, `${relative} must not grant approval from ready status`);
    assert.match(guidance, /disposition every candidate[\s\S]*before\s+source execution/i, `${relative} must require Product disposition before execution`);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('six-workstream runtime contract passed');
