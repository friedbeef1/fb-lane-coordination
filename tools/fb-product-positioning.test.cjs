#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const canonical = read('docs/why-fb.md');
const packaged = read('plugins/fb-lane-coordination/docs/why-fb.md');
const compact = canonical.replace(/\s+/g, ' ');

const deliveredPages = [
  {
    label: 'canonical positioning page',
    content: canonical,
    absolutePath: path.join(repoRoot, 'docs/why-fb.md'),
  },
  {
    label: 'packaged positioning page',
    content: packaged,
    absolutePath: path.join(repoRoot, 'plugins/fb-lane-coordination/docs/why-fb.md'),
  },
];

assert.strictEqual(packaged, canonical, 'packaged positioning page must match the canonical page');
assert.match(canonical, /> Codex executes software work\.\s+> Capacitor is a session-intelligence platform\.\s+> FB is a product-delivery harness that includes curated session intelligence\./);
assert.match(canonical, /\| Vanilla Codex \| Execute software work \|/);
assert.match(canonical, /\| Kurrent Capacitor \| Automatically capture, observe, recall, and evaluate agent sessions \|/);
assert.match(canonical, /\| FB \| Define, authorize, coordinate, verify, and explain a product outcome \|/);
assert.match(compact, /overlap substantially in session recall, evidence, and evaluation/i);
assert.match(compact, /may provide richer session telemetry/i);
assert.match(compact, /optional evidence provider to FB/i);
assert.match(compact, /would not replace FB's approved brief, board, handoff, or closeout authority/i);
assert.match(canonical, /Capacitor can show that three agents attempted a feature/i);
assert.strictEqual((canonical.match(/```mermaid/g) || []).length, 2, 'comparison page must contain two rendered Mermaid diagrams');

for (const evidence of ['TASK-020.md', 'TASK-022.md', 'TASK-024.md', 'TASK-023-walkthroughs.md', 'TASK-026.md']) {
  assert.match(canonical, new RegExp(evidence.replace('.', '\\.')), `pain-point map must cite ${evidence}`);
}

for (const page of deliveredPages) {
  const evidenceLink = page.content.match(/\[TASK-026 two-speed evidence\]\(([^)]+)\)/);
  assert.ok(evidenceLink, `${page.label} must link to the mirrored TASK-026 evidence artifact`);
  assert.strictEqual(
    evidenceLink[1],
    'evidence/TASK-026-two-speed.md',
    `${page.label} must use the distribution-safe evidence destination`,
  );
  const evidenceTarget = path.resolve(path.dirname(page.absolutePath), evidenceLink[1]);
  assert.ok(fs.existsSync(evidenceTarget), `${page.label} evidence target must resolve in its own filesystem context`);
}

assert.match(canonical, /(?<!!)\[[^\]]+\]\(https:\/\/openai\.com\/codex\/\)/, 'comparison page must use the official OpenAI Codex Markdown destination');
assert.match(canonical, /(?<!!)\[[^\]]+\]\(https:\/\/capacitor\.kurrent\.io\/docs\/getting-started\/what-is-capacitor\/\)/, 'comparison page must use the official Kurrent Capacitor Markdown destination');

const task026Rows = canonical
  .split('\n')
  .filter((line) => line.startsWith('|') && line.includes('TASK-026.md'))
  .map((line) => {
    const [pain, evidence, response, userVisibleEffect] = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    return { pain, evidence, response, userVisibleEffect };
  });

assert.strictEqual(task026Rows.length, 4, 'pain-point map must contain four TASK-026 rows');

const matchedTask026Rows = new Set();

for (const mapping of [
  {
    pain: /repeated runtime(?:\/| and )worktree rediscovery/i,
    responses: [/project[- ]preflight/i, /matching[- ]worktree[- ]reuse/i],
    userEffect: /optional project-owned preflight.*exact existing worker is resumed/i,
    description: 'repeated runtime/worktree discovery to project preflight and matching-worktree reuse',
  },
  {
    pain: /nested worktree placement/i,
    responses: [/primary[- ]checkout[- ]placement/i],
    userEffect: /new worker.*primary checkout.*never beneath another linked worktree/i,
    description: 'nested worktree placement to primary-checkout placement',
  },
  {
    pain: /unnecessary broad reruns after documentation[- ]only closeout/i,
    responses: [/proportional[- ]verification/i, /verification[- ]checkpoint[- ]reuse/i],
    userEffect: /current coordination-only path allowlist.*outside that allowlist.*source, runtime, configuration, or test paths.*broad gate again/i,
    description: 'unnecessary broad reruns to proportional verification and checkpoint reuse',
  },
  {
    pain: /obscured queue state/i,
    responses: [/compact[- ]queue[- ]status/i],
    userEffect: /Current, Next ready, and External blocks.*explicit empty states/i,
    description: 'obscured queue state to compact queue status',
  },
]) {
  const matchingRows = task026Rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => mapping.pain.test(row.pain)
      && mapping.responses.every((pattern) => pattern.test(row.response))
      && mapping.userEffect.test(row.userVisibleEffect));
  assert.strictEqual(
    matchingRows.length,
    1,
    `pain-point map must connect exactly one row for ${mapping.description}`,
  );
  matchedTask026Rows.add(matchingRows[0].index);
}

assert.strictEqual(matchedTask026Rows.size, 4, 'each TASK-026 pain point must map to a distinct row');

for (const row of task026Rows) {
  assert.match(
    row.evidence,
    /^Canonical source: `docs\/handoffs\/TASK-026\.md`; \[TASK-026 two-speed evidence\]\(evidence\/TASK-026-two-speed\.md\)$/,
  );
  assert.doesNotMatch(row.evidence, /github\.com\/friedbeef1\/fb-lane-coordination\/blob\/main/i);
  assert.ok(row.userVisibleEffect.length > 0, 'each TASK-026 row must describe a user-visible effect');
}

const mermaidBlocks = [...canonical.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map((match) => match[1]);
const deliveryLoop = mermaidBlocks[1] || '';

assert.match(deliveryLoop, /^(?!\s*%%)\s*P\s*-->\s*H\{"All changes match the coordination-only allowlist after a proven checkpoint\?"\}/m);
assert.match(deliveryLoop, /^(?!\s*%%)\s*H\s*--\s*"Yes"\s*-->\s*R\["Verification checkpoint reuse"\]/m);
assert.match(deliveryLoop, /^(?!\s*%%)\s*H\s*--\s*"Change outside the allowlist"\s*-->\s*S\s*$/m);
assert.match(deliveryLoop, /^(?!\s*%%)\s*S\s*-->\s*F\s*$/m);

for (const node of ['Quick BFM Patch', 'Full BFM', 'Verification checkpoint reuse', 'Safe fallback']) {
  const escapedNode = node.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nodeDeclaration = new RegExp(
    `^(?!\\s*%%).*?\\b[A-Za-z][A-Za-z0-9_-]*\\s*(?:\\[+|\\{+|\\(+)\\s*"${escapedNode}"\\s*(?:\\]+|\\}+|\\)+)`,
    'mi',
  );
  assert.match(deliveryLoop, nodeDeclaration, `delivery loop must declare a ${node} node`);
}

for (const example of [
  'Creator-commerce project',
  'Three failed agent attempts',
  'Functional but generic output',
]) {
  assert.match(canonical, new RegExp(`^### ${example}$`, 'm'), `comparison page must preserve the ${example} example`);
}
assert.match(canonical, /^### .*corrective patch/im, 'comparison page must add a corrective-patch example');

const correctiveHeading = canonical.search(/^### .*corrective patch.*$/im);
const correctiveBodyStart = canonical.indexOf('\n', correctiveHeading) + 1;
const nextExampleHeading = canonical.indexOf('\n### ', correctiveBodyStart);
const correctiveExample = canonical.slice(
  correctiveBodyStart,
  nextExampleHeading === -1 ? canonical.length : nextExampleHeading,
);
const compactCorrectiveExample = correctiveExample.replace(/\s+/g, ' ');
assert.match(compactCorrectiveExample, /all changed paths match the current coordination-only allowlist/i);
assert.match(compactCorrectiveExample, /change falls outside that allowlist, such as an ordinary source, runtime, configuration, or test path/i);
assert.match(compactCorrectiveExample, /\*\*Safe fallback\*\* returns the work to \*\*Full BFM\*\* and fresh broad verification/i);

for (const entrypoint of [
  'README.md',
  'FAQ.md',
  'plugins/fb-lane-coordination/README.md',
  'docs/fb/README.md',
  'plugins/fb-lane-coordination/docs/fb/README.md',
]) {
  assert.match(read(entrypoint), /why-fb\.md/, `${entrypoint} must link to the canonical comparison`);
}

for (const forbidden of [
  /Capacitor and FB (?:are|operate in) completely separate categories/i,
  /FB does not (?:recall|evaluate) agent work/i,
  /Capacitor replaces FB/i,
]) {
  assert.doesNotMatch(canonical, forbidden);
}

console.log('FB product-positioning contract passed.');
