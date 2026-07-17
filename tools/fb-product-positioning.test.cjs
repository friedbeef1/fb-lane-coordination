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
const rootReadme = read('README.md');
const harnessReadme = read('docs/fb/README.md');
const fullLoop = read('docs/fb/full-loop.md');
const packagedFullLoop = read('plugins/fb-lane-coordination/docs/fb/full-loop.md');
const agileTeams = read('docs/fb-for-agile-teams.md');
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

const codexProblemRows = [
  '| Important decisions remain scattered across chats | FB turns actionable decisions and evidence into repository-local handoff MD files. |',
  '| Codex may start building before the goal and boundaries are clear | FB separates planning from implementation and requires an approved brief before `$bfm`. |',
  '| User evidence, decisions, and AI assumptions can become mixed together | Product/User records each category separately before implementation. |',
  '| Outputs from several Codex tasks must be combined manually | `$bfm` scans ready handoffs across all six workstreams, reconciles conflicts, and sequences the work. |',
  '| Failed checks can return responsibility to the user | FB runs automated checks and owns bounded diagnosis and repair. |',
  '| Progress and readiness can be difficult to interpret | FB reports Current, Next, Blocked, optional review links, and Ready to ship. |',
  '| Codex can perform a merge or deployment when instructed, but product approval may be unclear | FB reserves merge and deployment authority for the explicit phrase **Push Live**. |',
];

function assertNavigation(label, page, destinations) {
  const navigation = destinations
    .map(({ text, href }) => `[${text}](${href})`)
    .join(' · ');
  assert.ok(page.includes(navigation), `${label} must contain the compact four-destination navigation`);
  assert.strictEqual(page.split(navigation).length - 1, 1, `${label} must contain the compact navigation exactly once`);
}

function assertLocalDestination(label, sourceRelativePath, href) {
  if (/^https?:\/\//.test(href)) return;
  const [relativePath, anchor] = href.split('#');
  const targetRelativePath = path.normalize(path.join(path.dirname(sourceRelativePath), relativePath));
  const targetPath = path.join(repoRoot, targetRelativePath);
  assert.ok(fs.existsSync(targetPath), `${label} local path must resolve: ${href}`);
  if (!anchor) return;
  const target = fs.readFileSync(targetPath, 'utf8');
  const anchors = [...target.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => heading
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-'));
  assert.ok(anchors.includes(anchor), `${label} anchor must resolve: ${href}`);
}

assertNavigation('README', rootReadme, [
  { text: 'Overview', href: 'README.md' },
  { text: 'Agile Teams', href: 'docs/fb-for-agile-teams.md' },
  { text: 'Why FB', href: 'docs/why-fb.md' },
  { text: 'Full Loop', href: 'docs/fb/full-loop.md' },
]);
assertNavigation('Agile Teams', agileTeams, [
  { text: 'Overview', href: '../README.md' },
  { text: 'Agile Teams', href: 'fb-for-agile-teams.md' },
  { text: 'Why FB', href: 'why-fb.md' },
  { text: 'Full Loop', href: 'fb/full-loop.md' },
]);
for (const page of deliveredPages) {
  assertNavigation(page.label, page.content, [
    { text: 'Overview', href: '../README.md' },
    { text: 'Agile Teams', href: 'https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/fb-for-agile-teams.md' },
    { text: 'Why FB', href: 'why-fb.md' },
    { text: 'Full Loop', href: 'fb/full-loop.md' },
  ]);
}
for (const [label, page] of [['canonical Full Loop', fullLoop], ['packaged Full Loop', packagedFullLoop]]) {
  assertNavigation(label, page, [
    { text: 'Overview', href: '../../README.md' },
    { text: 'Agile Teams', href: 'https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/fb-for-agile-teams.md' },
    { text: 'Why FB', href: '../why-fb.md' },
    { text: 'Full Loop', href: 'full-loop.md' },
  ]);
}

for (const [label, page] of [['README', rootReadme], ['Why FB', canonical], ['packaged Why FB', packaged]]) {
  assert.match(page, /\| Codex issue \| Codex problem solved by FB \|/i, `${label} must contain the exact Codex problem-map header`);
  for (const row of codexProblemRows) assert.ok(page.includes(row), `${label} must contain exact mapping: ${row}`);
}
assert.match(rootReadme, /not defects? in Codex/i, 'README must frame the map as coordination gaps rather than Codex defects');
assert.match(canonical, /not defects? in Codex/i, 'Why FB must frame the map as coordination gaps rather than Codex defects');
for (const evidence of ['TASK-020.md', 'TASK-022.md', 'TASK-024.md', 'TASK-023-walkthroughs.md']) {
  assert.match(canonical, new RegExp(evidence.replace('.', '\\.')), `Why FB Codex map must connect to ${evidence}`);
}

assert.match(rootReadme, /Problems FB solves[\s\S]*\[Why FB evidence\]\(docs\/why-fb\.md#pain-points-fb-is-designed-to-address\)/, 'README problem tables must route to Why FB evidence');
assert.match(rootReadme, /One big loop, six mini-loops[\s\S]*\[Agile Teams\]\(docs\/fb-for-agile-teams\.md\)[\s\S]*\[Full FB Loop Diagram\]\(docs\/fb\/full-loop\.md\)/, 'README loop must route to Agile Teams and Full Loop');
assert.match(agileTeams, /The short version[\s\S]*\[Full Loop\]\(fb\/full-loop\.md\)/, 'Agile diagram must route to Full Loop');
assert.match(agileTeams, /FB and familiar agile-team work[\s\S]*\[Why FB comparison\]\(why-fb\.md#honest-comparison\)/, 'Agile mapping must route to Why FB comparison');
assert.match(agileTeams, /What happens in a real example[\s\S]*\[Why FB examples\]\(why-fb\.md#concrete-examples\)/, 'Agile example must route to Why FB examples');
assert.match(agileTeams, /How `\$bfm` relates to Scrum and Kanban[\s\S]*\[workflow\]\(fb\/workflow\.md\)/, 'Agile $bfm section must route to workflow');
assert.match(agileTeams, /What FB deliberately does not do[\s\S]*\[guardrails\]\(fb\/guardrails\.md\)/, 'Agile boundaries must route to guardrails');
assert.match(canonical, /Honest comparison[\s\S]*\[Agile Teams\]\(https:\/\/github\.com\/friedbeef1\/fb-lane-coordination\/blob\/main\/docs\/fb-for-agile-teams\.md\)/, 'Why FB comparison must route to Agile Teams');
assert.match(fullLoop, /\[workflow\]\(workflow\.md\)/, 'Full Loop must route to workflow');
assert.strictEqual((agileTeams.match(/```mermaid/g) || []).length, 1, 'Agile Teams must contain exactly one Mermaid diagram');

for (const [label, source, hrefs] of [
  ['README', 'README.md', ['README.md', 'docs/fb-for-agile-teams.md', 'docs/why-fb.md', 'docs/fb/full-loop.md', 'docs/why-fb.md#pain-points-fb-is-designed-to-address']],
  ['Agile Teams', 'docs/fb-for-agile-teams.md', ['../README.md', 'fb-for-agile-teams.md', 'why-fb.md', 'fb/full-loop.md', 'why-fb.md#honest-comparison', 'why-fb.md#concrete-examples', 'fb/workflow.md', 'fb/guardrails.md']],
  ['Why FB', 'docs/why-fb.md', ['../README.md', 'why-fb.md', 'fb/full-loop.md']],
  ['Full Loop', 'docs/fb/full-loop.md', ['../../README.md', '../why-fb.md', 'full-loop.md', 'workflow.md']],
  ['packaged Why FB', 'plugins/fb-lane-coordination/docs/why-fb.md', ['../README.md', 'why-fb.md', 'fb/full-loop.md']],
  ['packaged Full Loop', 'plugins/fb-lane-coordination/docs/fb/full-loop.md', ['../../README.md', '../why-fb.md', 'full-loop.md', 'workflow.md']],
]) {
  for (const href of hrefs) assertLocalDestination(label, source, href);
}

assert.match(canonical, /> Codex executes software work\.\s+> Capacitor is a session-intelligence platform\.\s+> FB is a product-delivery harness that includes curated session intelligence\./);
const comparisonHeader = '| System | Good because | Gap | How FB addresses the gap |';
const oldComparisonHeader = '| System | Good because | Gap FB addresses |';
const comparisonRows = [
  ['Vanilla Codex', 'Directly executes clear software tasks.', 'Decisions, evidence, priorities, verification, and release authority can remain scattered across chats.', 'FB captures durable handoffs, reconciles six workstreams, verifies the result, and preserves explicit release approval.'],
  ['Git worktrees', 'Isolate branches and support parallel implementation.', 'Isolation does not determine what to build, resolve competing recommendations, or verify the product outcome.', 'FB connects worktree execution to approved priorities, coordinated implementation, and outcome verification.'],
  ['Kurrent Capacitor', 'Automatically captures, recalls, observes, and evaluates agent sessions.', 'Session intelligence alone does not define the approved product outcome or own delivery authority and closeout.', 'FB connects curated evidence to the brief, user decisions, execution authority, testing, and closeout.'],
  ['BMAD', 'Provides a broad role-based AI development methodology.', 'A broad methodology can require more process than a focused repository-local Codex delivery loop.', 'FB provides a smaller loop around ready handoffs, Codex implementation, automated verification, and explicit release approval.'],
  ['FB', 'Connects six product workstreams to Codex implementation, verification, and delivery.', '—', '—'],
];

const exceptionalFitRows = [
  ['The task is completely specified, mechanical, disposable, finishable in one session, and needs no durable decisions, coordination, follow-up, sensitive handling, or release governance.', 'Vanilla Codex', 'It executes immediately without creating records that will never be reused.'],
  ['A mature engineering organization already owns requirements, prioritization, CI, review, and release—and needs only native branch isolation.', 'Git worktrees', 'Worktrees provide isolation without introducing another coordination system.'],
  ['The primary requirement is comprehensive or forensic capture of large volumes of agent-session activity across teams.', 'Kurrent Capacitor', 'Capacitor provides richer automatic session telemetry and history than FB’s curated records.'],
  ['The organization explicitly wants a prescribed, role-heavy methodology with formal personas and lifecycle ceremonies.', 'BMAD', 'BMAD provides a broader formal methodology than FB’s repository-local delivery loop.'],
];

const stackRows = [
  ['Vanilla Codex', 'Reading, editing, running, testing, and explaining software work', 'Approved product context, coordinated handoffs, verification ownership, and release boundaries', 'FB is a Codex plugin; Codex remains the execution engine.'],
  ['Git worktrees', 'Native branch and filesystem isolation for parallel changes', 'Priorities, ownership, locks, sequencing, and outcome verification', 'FB may use ordinary Git worktrees; it does not replace Git.'],
  ['Kurrent Capacitor', 'Automatic session capture, recall, telemetry, and cross-agent history', 'Curated product truth tied to decisions, scope, acceptance, and closeout', 'Capacitor can be an optional evidence source. Important conclusions must enter FB handoffs; no automatic integration currently exists.'],
  ['BMAD', 'Formal discovery, planning, role-based analysis, PRDs, architecture, and UX artifacts', 'Repository-local delivery, reconciliation, Codex execution, automated checks, and explicit release approval', 'Approved BMAD artifacts can enter FB as evidence or ready handoffs. FB remains the delivery authority to avoid competing systems of record.'],
];

for (const [label, page] of [['README', rootReadme], ['Why FB', canonical], ['packaged Why FB', packaged]]) {
  assert.ok(page.includes('## When something else is genuinely a better fit'), `${label} must document exceptional alternatives`);
  assert.ok(page.includes('Most product work benefits from FB when decisions, implementation, verification, and release must remain connected. Another tool is a better fit only when one of these narrower conditions describes the primary goal.'), `${label} must introduce the narrow exceptional cases`);
  for (const row of exceptionalFitRows) assert.ok(page.includes(`| ${row.join(' | ')} |`), `${label} must contain exceptional fit row: ${row[1]}`);
  assert.ok(page.includes('If these conditions sound unusually specific, they probably are. Ordinary evolving product work still benefits from FB connecting decisions, implementation, verification, and release.'), `${label} must explain why the exceptions are narrow`);
  assert.ok(page.includes('Describe the outcome and use FB normally. FB decides how much coordination, evidence, and verification the situation requires.'), `${label} must state automatic FB routing`);
  assert.ok(page.includes('## How FB works with your existing stack'), `${label} must document stack augmentation`);
  assert.ok(page.includes('| Existing tool | Keep using it for | What FB adds | Integration boundary |'), `${label} must contain the exact stack table headers`);
  for (const row of stackRows) assert.ok(page.includes(`| ${row.join(' | ')} |`), `${label} must contain stack row: ${row[0]}`);
  assert.ok(page.includes('A team can use BMAD to produce a formal PRD, Capacitor to preserve detailed session history, Git worktrees to isolate parallel implementation, and Codex to write the software. FB connects the approved parts: it turns the PRD and relevant evidence into durable handoffs, sequences work across worktrees, verifies the delivered outcome, and waits for **Push Live**.'), `${label} must contain the combined stack example`);
  assert.ok(page.includes('FB is fully open source, repository-local, and requires no FB-hosted service.'), `${label} must contain the open-source deployment boundary`);
  assert.match(page, /documented workflows[^\n]*not built-in automatic adapters/i, `${label} must label stack use as documented workflows rather than automatic adapters`);
}

function assertComparisonTable(label, page) {
  assert.ok(page.includes(comparisonHeader), `${label} must contain the four ordered comparison columns`);
  assert.ok(!page.includes(oldComparisonHeader), `${label} must reject the old three-column comparison header`);
  for (const [system, good, gap, response] of comparisonRows) {
    const row = `| ${system} | ${good} | ${gap} | ${response} |`;
    assert.ok(page.includes(row), `${label} must contain exact comparison row: ${system}`);
    if (system !== 'FB') {
      assert.ok(gap.length > 0 && response.length > 0, `${label} ${system} must have non-empty Gap and FB-response cells`);
      assert.notStrictEqual(gap, response, `${label} ${system} must separate the gap from the FB response`);
    } else {
      assert.strictEqual(gap, '—', `${label} FB Gap must be an em dash`);
      assert.strictEqual(response, '—', `${label} FB response must be an em dash`);
    }
  }
}

assertComparisonTable('Why FB', canonical);
assert.match(compact, /overlap substantially in session recall, evidence, and evaluation/i);
assert.match(compact, /may provide richer session telemetry/i);
assert.match(compact, /optional evidence provider to FB/i);
assert.match(compact, /would not replace FB's approved brief, board, handoff, or closeout authority/i);
assert.match(canonical, /Capacitor can show that three agents attempted a feature/i);
assert.strictEqual((canonical.match(/```mermaid/g) || []).length, 1, 'comparison page must contain one FB-only Mermaid diagram');

for (const page of deliveredPages) {
  assertComparisonTable(page.label, page.content);
  assert.match(page.content, /\| Git worktrees \|/);
  assert.match(page.content, /\| FB \|[^\n]+\| — \|/);
  assert.strictEqual((page.content.match(/```mermaid/g) || []).length, 1, `${page.label} must contain one FB-only Mermaid diagram`);
  assert.doesNotMatch(page.content, /GitHub Spec Kit|Better choice when/i);
}

assertComparisonTable('README', rootReadme);
assert.match(rootReadme, /\| Git worktrees \|/);
assert.match(rootReadme, /\| (?:\*\*)?FB(?:\*\*)? \|[^\n]+\| — \|/);
assert.doesNotMatch(rootReadme, /GitHub Spec Kit|Better choice when/i);
assert.strictEqual((rootReadme.match(/```mermaid/g) || []).length, 1, 'README must contain one FB-only Mermaid diagram');
assert.match(rootReadme, /\[Full FB Loop Diagram\]\(docs\/fb\/full-loop\.md\)/, 'README must link directly to the full diagram');
assert.match(canonical, /\[Full FB Loop Diagram\]\(fb\/full-loop\.md\)/, 'Why FB must link directly to the full diagram');
assert.match(harnessReadme, /\[Full FB Loop Diagram\]\(full-loop\.md\)/, 'harness navigation must link directly to the full diagram');
assert.strictEqual((fullLoop.match(/```mermaid/g) || []).length, 1, 'full loop page must contain one rendered Mermaid diagram');
assert.strictEqual(fullLoop, packagedFullLoop, 'full loop page must be mechanically mirrored');

for (const term of [
  'Product/User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs',
  'ready', 'blocked', 'None relevant', 'Product reconciles', 'Quick BFM',
  'Full BFM', 'Codex implements', 'Automated checks', 'Scoped repair',
  'Optional review links', 'Ready to ship', 'Push Live', 'Results and feedback',
]) {
  assert.match(fullLoop, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `full loop page must show ${term}`);
}

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
assert.match(canonical, /https:\/\/git-scm\.com\/docs\/git-worktree/, 'comparison page must use the official Git worktree documentation');
assert.match(canonical, /https:\/\/github\.com\/bmad-code-org\/BMAD-METHOD/, 'comparison page must link to BMAD');

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

function assertFbLoopDiagram(label, page) {
  const diagram = [...page.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)][0]?.[1] || '';
  for (const [id, workstream] of [
    ['PU', 'Product/User'], ['BU', 'Business'], ['DE', 'Design'],
    ['TE', 'Tech'], ['DI', 'Discovery'], ['BG', 'Bugs'],
  ]) {
    assert.match(diagram, new RegExp(`${id}\\["${workstream}<br\\/>Question → Evidence<br\\/>→ Recommendation → Question"\\]`), `${label} must show the ${workstream} mini-loop`);
    assert.match(diagram, new RegExp(`${id}\\s*-->\\s*H`), `${label} must feed ${workstream} into ready handoffs`);
    assert.match(diagram, new RegExp(`N\\s*-->\\s*${id}`), `${label} must return new questions to ${workstream}`);
  }
  for (const step of ['Ready handoff MD files', '$bfm scans all six', 'Prioritize and sequence', 'Codex implements', 'Automated testing and repair', 'Ready to ship', 'Push Live', 'Results and feedback']) {
    assert.ok(diagram.includes(`"${step}"`), `${label} must contain ${step}`);
  }
  assert.match(diagram, /H\s*-->\s*B\s*-->\s*P\s*-->\s*C\s*-->\s*T\s*-->\s*S\s*-->\s*L\s*-->\s*D\s*-->\s*F/, `${label} must show one closed BFM delivery sequence`);
  assert.match(diagram, /F\s*-->\s*N/, `${label} must return delivery results to the mini-loops`);
  assert.doesNotMatch(diagram, /Capacitor|worktree|Quick BFM|Full BFM|Safe fallback/i);
}

assertFbLoopDiagram('Why FB', canonical);
assertFbLoopDiagram('README', rootReadme);

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
