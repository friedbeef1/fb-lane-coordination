'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const packaged = path.join(root, 'plugins', 'fb-lane-coordination');

function read(base, relative) {
  return fs.readFileSync(path.join(base, relative), 'utf8');
}

function assertVisibleBlueprint(source, label) {
  assert.match(source, /Goal[\s\S]{0,220}Split[\s\S]{0,260}relevant\s+workstreams[\s\S]{0,300}Verify[\s\S]{0,220}Merge\s+findings[\s\S]{0,300}Implement[\s\S]{0,260}Verify\s+candidate[\s\S]{0,220}One\s+clear\s+result/i, `${label} must expose the simple Graph Blueprint sequence`);
  assert.match(source, /only (?:the )?relevant workstreams/i, `${label} must not manufacture six-way participation`);
  assert.match(source, /Send\s+this\s+to\s+Product\.?/i, `${label} must expose the common workstream CTA`);
}

for (const [label, base] of [['root', root], ['package', packaged]]) {
  test(`${label} public workflow follows the simple Graph Blueprint`, () => {
    assertVisibleBlueprint(read(base, 'README.md'), `${label} README`);
    assertVisibleBlueprint(read(base, 'docs/fb/start.md'), `${label} start`);
    assertVisibleBlueprint(read(base, 'docs/fb/README.md'), `${label} harness overview`);
    assertVisibleBlueprint(read(base, 'skills/project-coordination-setup/SKILL.md'), `${label} setup skill`);
  });

  test(`${label} keeps the evidence graph separate from the execution graph`, () => {
    const graph = read(base, 'docs/fb/graph.md');
    const workflow = read(base, 'docs/fb/workflow.md');
    const fullLoop = read(base, 'docs/fb/full-loop.md');
    for (const [name, source] of [['graph', graph], ['workflow', workflow], ['full loop', fullLoop]]) {
      assert.match(source, /evidence graph/i, `${label} ${name} must name the evidence graph`);
      assert.match(source, /execution graph/i, `${label} ${name} must name the execution graph`);
    }
    assert.match(workflow, /focused proof per slice/i);
    assert.match(workflow, /one\s+(?:fresh-context|fresh context)\s+integrated\s+candidate\s+verification/i);
    assert.match(workflow, /not (?:the )?accumulated (?:chat |conversation )?(?:transcript|history)/i);
    assert.match(fullLoop, /merge findings/i);
    assert.match(fullLoop, /not (?:a )?Git merge/i);
  });

  test(`${label} keeps identity repair lifecycle-triggered and routine BFM bounded`, () => {
    const bfm = read(base, 'skills/bfm/SKILL.md');
    const product = read(base, 'skills/fb-product/SKILL.md');
    for (const [name, source] of [['BFM', bfm], ['Product', product]]) {
      assert.match(source, /setup,\s+install,\s+upgrade,\s+canonical-root change,\s+task drift,\s+or duplicate/i, `${label} ${name} must enumerate lifecycle triggers`);
      assert.match(source, /routine\s+`?\$bfm`?[\s\S]{0,280}(?:receipt|fingerprint)[\s\S]{0,220}(?:does not|without)[\s\S]{0,180}(?:enumerat|reconcil)/i, `${label} ${name} must keep routine BFM off full identity reconciliation`);
      assert.match(source, /board, receipts?, (?:identity )?hashes?, and internal route names[\s\S]{0,200}diagnostic/i, `${label} ${name} must keep internal machinery out of the ordinary user path`);
    }
  });

  test(`${label} workstreams share one Product handoff action`, () => {
    for (const skill of ['fb-user', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs']) {
      const source = read(base, `skills/${skill}/SKILL.md`);
      assert.match(source, /Send\s+this\s+to\s+Product\.?/i, `${label} ${skill} must use the common CTA`);
      assert.match(source, /ready for Product intake/i, `${label} ${skill} must retain the intake boundary`);
      assert.doesNotMatch(source, /ready (?:means|is) (?:approved|executable)/i, `${label} ${skill} must not imply execution authority`);
    }
  });

  test(`${label} Product/BFM verifies once after synthesis and preserves release authority`, () => {
    const coordination = read(base, 'skills/fb-lane-coordination/SKILL.md');
    const product = read(base, 'skills/fb-product/SKILL.md');
    const bfm = read(base, 'skills/bfm/SKILL.md');
    for (const [name, source] of [['coordination', coordination], ['Product', product], ['BFM', bfm]]) {
      assert.match(source, /Goal[\s\S]{0,220}Split[\s\S]{0,260}relevant\s+workstreams/i, `${label} ${name} must begin from the visible blueprint`);
      assert.match(source, /one\s+(?:fresh-context|fresh context)\s+integrated\s+candidate\s+verification/i, `${label} ${name} must retain the final independent proof`);
      assert.match(source, /Push Live/i, `${label} ${name} must preserve the release boundary`);
    }
  });
}

test('bootstrap and Codex entry points inherit the same visible workflow', () => {
  for (const [label, relative] of [
    ['generated harness route', 'tools/fb-lane.cjs'],
    ['generated AGENTS navigator', 'templates/AGENTS.md'],
    ['Codex guide', 'platforms/codex/README.md'],
  ]) assertVisibleBlueprint(read(root, relative), label);
  assert.strictEqual(read(root, 'tools/fb-lane.cjs'), read(packaged, 'tools/fb-lane.cjs'));
});

test('canonical and packaged Graph Blueprint surfaces are byte-identical', () => {
  for (const relative of [
    'docs/fb/start.md',
    'docs/fb/workflow.md',
    'docs/fb/graph.md',
    'docs/fb/full-loop.md',
    'skills/bfm/SKILL.md',
    'skills/fb-product/SKILL.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/fb-user/SKILL.md',
    'skills/fb-business/SKILL.md',
    'skills/fb-design/SKILL.md',
    'skills/fb-tech/SKILL.md',
    'skills/fb-discovery/SKILL.md',
    'skills/fb-bugs/SKILL.md',
  ]) {
    assert.strictEqual(read(root, relative), read(packaged, relative), relative);
  }
});
