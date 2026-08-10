#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateNormalizedRepository } = require('./fb-records.cjs');

const SAFE_TASK_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)$/;
const PHASES = new Set(['candidate', 'live']);
const RECEIPT_FIELDS = [
  'Approved brief and decisions',
  'Confirmed assumptions and approved scope changes',
  'Branch, source commits, and changed surfaces',
  'Checks, failures, recovery, and results',
  'Review state, direct links, limits, and external gates',
  'Repository state',
  'Remaining owner and action',
];
const CHANGELOG_FIELDS = ['What changed', 'Why it matters', 'Compatibility', 'Installation or upgrade'];
const PLACEHOLDER = /^(?:tbd|todo|unknown|n\/?a|none|not recorded|placeholder)(?:\b|\s|[.!-])*$/i;

function frontmatter(markdown) {
  const match = String(markdown || '').match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (field) result[field[1]] = field[2];
  }
  return result;
}

function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^##\\s+${escaped}\\s*$`, 'im').exec(String(markdown || ''));
  if (!match) return '';
  const start = match.index + match[0].length;
  const next = /^##\s+/gm;
  next.lastIndex = start;
  const end = next.exec(markdown)?.index ?? markdown.length;
  return markdown.slice(start, end);
}

function field(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:\\s*(.+)$`, 'mi')
    .exec(String(markdown || ''))?.[1]?.trim() || '';
}

function actionable(value) {
  const normalized = String(value || '').trim();
  return normalized.length >= 8 && !PLACEHOLDER.test(normalized) && !/\b(?:tbd|todo|placeholder|not recorded)\b/i.test(normalized);
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(candidate));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(candidate);
  }
  return files;
}

function boardRow(markdown, taskId) {
  for (const line of String(markdown || '').split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (String(cells[0] || '').toUpperCase() === taskId) return { status: cells[1] || '', line };
  }
  return null;
}

function boardTaskSection(markdown, taskId) {
  const escaped = taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = new RegExp(`^###\\s+${escaped}\\b.*$`, 'im').exec(String(markdown || ''));
  if (!heading) return '';
  const start = heading.index + heading[0].length;
  const next = /^###\s+/gm;
  next.lastIndex = start;
  const end = next.exec(markdown)?.index ?? markdown.length;
  return markdown.slice(heading.index, end);
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function normalizedAnchor(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('und')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s-]+/g, '-');
}

function anchorExists(markdown, anchor) {
  const expected = normalizedAnchor(anchor);
  return [...String(markdown || '').matchAll(/^#{1,6}\s+(.+)$/gm)]
    .some(match => normalizedAnchor(match[1]) === expected);
}

function links(markdown) {
  return [...String(markdown || '').matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map(match => ({ label: match[1], href: match[2] }));
}

function resolveLocalLink(root, sourcePath, href) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
  const [rawTarget, anchor = ''] = href.split('#', 2);
  if (!rawTarget) return null;
  let decoded;
  try { decoded = decodeURIComponent(rawTarget); } catch { return null; }
  const target = path.resolve(path.dirname(sourcePath), decoded);
  if (!inside(root, target) || !fs.existsSync(target) || !fs.statSync(target).isFile()) return null;
  const markdown = fs.readFileSync(target, 'utf8');
  if (anchor && !anchorExists(markdown, anchor)) return null;
  return { target, anchor };
}

function defaultGit(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function scanRepositoryRecords(repoRoot) {
  return validateNormalizedRepository(path.resolve(repoRoot || '.'));
}

function validateReleasePreflight(input = {}) {
  const root = path.resolve(input.repoRoot || '.');
  const taskId = String(input.taskId || '').toUpperCase();
  const phase = String(input.phase || 'candidate').toLowerCase();
  const runGit = input.runGit || (args => defaultGit(root, args));
  const findings = [];
  const add = (code, file, message) => findings.push({ code, file, message });

  if (!SAFE_TASK_ID.test(taskId)) add('task-id', '', 'A safe selected task ID is required.');
  if (!PHASES.has(phase)) add('phase', '', 'Release phase must be candidate or live.');

  let candidateCommit = '';
  let headCommit = '';
  let baseCommit = '';
  let changed = [];
  try {
    const status = runGit(['status', '--porcelain', '--untracked-files=all']);
    if (status) add('candidate-dirty', '', 'The selected release worktree must be clean.');
  } catch (error) {
    add('candidate-git-state', '', `Unable to inspect candidate worktree state: ${error.message}`);
  }
  try {
    headCommit = runGit(['rev-parse', 'HEAD^{commit}']);
    candidateCommit = runGit(['rev-parse', `${input.candidateCommit || 'HEAD'}^{commit}`]);
    if (headCommit !== candidateCommit) {
      add('candidate-head-mismatch', '', 'The selected candidate commit must match the worktree HEAD.');
    }
  } catch (error) {
    add('candidate-commit', '', `The selected candidate commit is unavailable: ${error.message}`);
  }
  try {
    if (!input.baseCommit) throw new Error('baseCommit is required');
    baseCommit = runGit(['rev-parse', `${input.baseCommit}^{commit}`]);
    if (candidateCommit) {
      runGit(['merge-base', '--is-ancestor', baseCommit, candidateCommit]);
      changed = runGit(['diff', '--name-only', `${baseCommit}..${candidateCommit}`]).split(/\r?\n/).filter(Boolean);
    }
  } catch (error) {
    add('candidate-base', '', `The release base must be an ancestor of the selected candidate: ${error.message}`);
  }

  const handoffRelative = `docs/handoffs/${taskId}.md`;
  const handoffPath = path.join(root, handoffRelative);
  const handoff = fs.existsSync(handoffPath) ? fs.readFileSync(handoffPath, 'utf8') : '';
  if (!handoff) add('handoff-missing', handoffRelative, 'The selected task requires its canonical handoff.');
  const meta = frontmatter(handoff);
  if (handoff && String(meta.task || '').toUpperCase() !== taskId) {
    add('handoff-task-mismatch', handoffRelative, 'The canonical handoff task metadata must match the selected task.');
  }
  if (handoff && meta.record_model !== 'normalized-v1') {
    add('handoff-record-model', handoffRelative, 'Selected release handoff requires record_model: normalized-v1.');
  }
  if (handoff && !/^(approved)$/i.test(meta.approval || '')) {
    add('handoff-approval', handoffRelative, 'The selected release handoff requires explicit approved metadata.');
  }

  const handoffGoal = section(handoff, 'Goal Alignment Session');
  if (!handoffGoal) add('handoff-goal-alignment', handoffRelative, 'The selected handoff requires a Goal Alignment Session regardless of record_model.');
  else {
    for (const [code, pattern, label] of [
      ['handoff-goal-product', /^Product (?:OKR|Goal):\s*\S/im, 'Product Goal'],
      ['handoff-goal-fit', /^Lane OKR Fit:\s*(?:aligned|suggest approach change|blocked by OKR ambiguity)\b/im, 'Lane OKR Fit'],
      ['handoff-goal-evidence', /^Mini-loop Evidence:\s*\S/im, 'Mini-loop Evidence'],
      ['handoff-goal-counterevidence', /^Evidence Against Product OKR:\s*\S/im, 'Evidence Against Product OKR'],
    ]) if (!pattern.test(handoffGoal)) add(code, handoffRelative, `The selected handoff Goal Alignment Session requires ${label}.`);
  }

  const buildBrief = section(handoff, 'Build Brief');
  const taskReceipt = section(handoff, 'Task Receipt');
  if (!actionable(buildBrief)) add('handoff-build-brief', handoffRelative, 'The selected release handoff requires an actionable Build Brief.');
  if (!actionable(taskReceipt)) add('handoff-task-receipt', handoffRelative, 'The selected release handoff requires an actionable Task Receipt.');
  if (taskReceipt) {
    const missingReceipt = RECEIPT_FIELDS.filter(label => !actionable(field(taskReceipt, label)));
    if (missingReceipt.length) {
      add('handoff-task-receipt-fields', handoffRelative, `Task Receipt is incomplete: ${missingReceipt.join(', ')}.`);
    }
  }

  const boardSources = [path.join(root, 'PROJECT_BOARD.md'), ...markdownFiles(path.join(root, 'docs', 'board', 'archive'))]
    .filter(file => fs.existsSync(file))
    .map(file => ({ file, markdown: fs.readFileSync(file, 'utf8') }));
  const boardMatches = boardSources.map(source => ({ ...source, row: boardRow(source.markdown, taskId), detail: boardTaskSection(source.markdown, taskId) }))
    .filter(source => source.row || source.detail);
  const boardRecord = boardMatches.find(source => source.row && source.detail) || boardMatches[0];
  const boardFile = boardRecord ? path.relative(root, boardRecord.file) : 'PROJECT_BOARD.md';
  if (!boardRecord?.row) add('board-task-row', boardFile, `${taskId} requires a board row.`);
  if (!boardRecord?.detail) add('board-task-detail', boardFile, `${taskId} requires a detailed board task section.`);
  const boardDetail = boardRecord?.detail || '';
  if (boardDetail && !/(?:\*\*Goal Alignment Session\*\*|##\s+Goal Alignment Session\b)/i.test(boardDetail)) {
    add('board-goal-alignment', boardFile, `${taskId} requires a board Goal Alignment Session.`);
  }
  for (const [code, label] of [
    ['board-goal-objective', 'Objective'],
    ['board-goal-key-results', 'Key Results'],
    ['board-goal-definition', 'Definition of Done'],
    ['board-goal-gate', 'Gate / Review Point'],
    ['board-goal-approval', 'Approval'],
    ['board-goal-justification', 'Justification'],
  ]) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (boardDetail && !new RegExp(`(?:\\*\\*${escaped}\\*\\*|${escaped}):\\s*\\S`, 'i').test(boardDetail)) {
      add(code, boardFile, `${taskId} board Goal Alignment Session requires ${label}.`);
    }
  }
  if (boardDetail && !/(?:\*\*Approval\*\*|Approval):\s*approved\b/i.test(boardDetail)) {
    add('board-goal-approval-state', boardFile, `${taskId} board Goal Alignment approval must be approved.`);
  }

  const receiptLinks = links(taskReceipt);
  const qaLink = receiptLinks.find(link => /\b(?:qa|evidence|verification)\b/i.test(link.label));
  const changelogLink = receiptLinks.find(link => /changelog/i.test(link.label) || /CHANGELOG\.md/i.test(link.href));
  let qaResolved = null;
  let changelogResolved = null;
  if (!qaLink) add('qa-evidence-link', handoffRelative, 'Task Receipt requires a direct local QA evidence link.');
  else {
    qaResolved = resolveLocalLink(root, handoffPath, qaLink.href);
    if (!qaResolved) add('qa-link-unresolved', handoffRelative, `QA evidence link does not resolve: ${qaLink.href}`);
  }
  if (!changelogLink) add('changelog-evidence-link', handoffRelative, 'Task Receipt requires a direct local changelog entry link.');
  else {
    changelogResolved = resolveLocalLink(root, handoffPath, changelogLink.href);
    if (!changelogResolved || changelogResolved.target !== path.join(root, 'CHANGELOG.md') || !changelogResolved.anchor) {
      add('changelog-link-unresolved', handoffRelative, `Changelog evidence link does not resolve to an entry: ${changelogLink.href}`);
      changelogResolved = null;
    }
  }

  if (qaResolved) {
    const qaRelative = path.relative(root, qaResolved.target).split(path.sep).join('/');
    const qa = fs.readFileSync(qaResolved.target, 'utf8');
    const qaMeta = frontmatter(qa);
    if (String(qaMeta.task || '').toUpperCase() !== taskId) add('qa-task-mismatch', qaRelative, 'QA task metadata must match the selected task.');
    const qaStatus = String(qaMeta.status || '').toLowerCase();
    if (phase === 'candidate' && !new Set(['checking', 'passed']).has(qaStatus)) {
      add('qa-status', qaRelative, 'Candidate QA status must be checking or passed.');
    }
    if (phase === 'live' && qaStatus !== 'passed') {
      add('qa-status', qaRelative, 'Live QA status must be passed.');
    }
    for (const heading of ['Candidate', 'Focused verification']) {
      if (!actionable(section(qa, heading))) add('qa-incomplete', qaRelative, `QA evidence requires an actionable ${heading} section.`);
    }
    const releaseCheckpoint = section(qa, 'Release checkpoint');
    if (!actionable(releaseCheckpoint)) {
      add('qa-incomplete', qaRelative, 'QA evidence requires an actionable Release checkpoint section.');
    } else if (phase === 'candidate' && !/\b(?:requested|plan(?:ned)?)\b/i.test(releaseCheckpoint)) {
      add('release-checkpoint-plan', qaRelative, 'Candidate phase requires an actionable release-checkpoint request or plan before the broad checkpoint runs.');
    } else if (phase === 'live' && !/(?:^|\n)\s*(?:[-*]\s*)?(?:Result|Status|Release checkpoint):\s*pass(?:ed)?\b/im.test(releaseCheckpoint)) {
      add('release-checkpoint-not-passed', qaRelative, 'Live phase requires an explicitly passing release checkpoint.');
    }
    if (phase === 'candidate' && actionable(section(qa, 'Live release verification'))) {
      add('phase-status-conflict', qaRelative, 'Candidate-phase evidence must not claim live release completion.');
    }
    if (phase === 'live' && !actionable(section(qa, 'Live release verification'))) {
      add('live-evidence-missing', qaRelative, 'Live phase requires actionable live release verification.');
    }
  }

  if (changelogResolved) {
    const changelog = fs.readFileSync(changelogResolved.target, 'utf8');
    const headingMatch = [...changelog.matchAll(/^##\s+(.+)$/gm)]
      .find(match => normalizedAnchor(match[1]) === normalizedAnchor(changelogResolved.anchor));
    const entry = headingMatch ? section(changelog, headingMatch[1]) : '';
    const missing = CHANGELOG_FIELDS.filter(label => !actionable(field(entry, label)));
    if (missing.length) add('changelog-entry-incomplete', 'CHANGELOG.md', `Changelog entry is missing concrete fields: ${missing.join(', ')}.`);
    const expectation = field(buildBrief, 'Changelog expectation');
    const receiptDecision = field(taskReceipt, 'Changelog');
    if (!/^required\b/i.test(expectation) || !/^updated\s+[—-]\s+/i.test(receiptDecision)) {
      add('changelog-decision', handoffRelative, 'Build Brief and Task Receipt require matching required/updated changelog decisions.');
    }
  }

  const boardStatus = String(boardRecord?.row?.status || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  const handoffStatus = String(meta.status || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  const candidateBoard = new Set(['in progress', 'staging qa', 'ready']);
  const candidateHandoff = new Set(['in progress', 'implemented', 'ready']);
  if (phase === 'candidate' && (!candidateBoard.has(boardStatus) || !candidateHandoff.has(handoffStatus))) {
    add('phase-status-conflict', handoffRelative, 'Candidate phase requires active or ready board and handoff status, not live completion.');
  }
  if (phase === 'live' && (boardStatus !== 'done' || !new Set(['done', 'implemented']).has(handoffStatus))) {
    add('phase-status-conflict', handoffRelative, 'Live phase requires a Done board row and completed or implemented handoff status.');
  }

  if (candidateCommit) {
    const evidencePaths = [handoffRelative, boardFile];
    if (qaResolved) evidencePaths.push(path.relative(root, qaResolved.target).split(path.sep).join('/'));
    if (changelogResolved) evidencePaths.push('CHANGELOG.md');
    for (const relative of [...new Set(evidencePaths)]) {
      try { runGit(['cat-file', '-e', `${candidateCommit}:${relative}`]); }
      catch { add('candidate-evidence-uncommitted', relative, `Release evidence is not committed in ${candidateCommit}.`); }
      if (baseCommit && !changed.includes(relative)) {
        add('candidate-evidence-outside-range', relative, 'Release evidence must be part of the selected base-to-candidate range.');
      }
    }
  }

  return { ok: findings.length === 0, taskId, phase, candidateCommit, findings };
}

function parseArgs(argv) {
  const result = { repoRoot: '.', phase: 'candidate' };
  const names = new Map([
    ['--root', 'repoRoot'], ['--task', 'taskId'], ['--phase', 'phase'],
    ['--base', 'baseCommit'], ['--candidate', 'candidateCommit'],
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = names.get(argv[index]);
    if (!key || index + 1 >= argv.length) throw new Error('Usage: node tools/fb-release-preflight.cjs --task TASK-ID --phase candidate|live --base REF --candidate REF [--root PATH]');
    result[key] = argv[index + 1];
  }
  if (!result.taskId || !result.baseCommit || !result.candidateCommit) throw new Error('Usage: node tools/fb-release-preflight.cjs --task TASK-ID --phase candidate|live --base REF --candidate REF [--root PATH]');
  return result;
}

function main() {
  try {
    const result = validateReleasePreflight(parseArgs(process.argv.slice(2)));
    if (result.ok) {
      process.stdout.write(`Release preflight passed for ${result.taskId} (${result.phase}) at ${result.candidateCommit}.\n`);
      return;
    }
    for (const finding of result.findings) {
      process.stderr.write(`${finding.code}${finding.file ? ` [${finding.file}]` : ''}: ${finding.message}\n`);
    }
    process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = {
  scanRepositoryRecords,
  validateReleasePreflight,
};
