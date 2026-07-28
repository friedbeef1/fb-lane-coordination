#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RECORD_MODEL = 'normalized-v1';
const FULL_RISKS = new Set([
  'privacy', 'authentication', 'auth', 'payments', 'provider', 'migration',
  'destructive-data', 'release', 'unclear-scope', 'secrets', 'security',
]);
const HEALTH_EVENTS = new Set([
  'session-start', 'claim-start', 'branch-change', 'worktree-change',
  'integration', 'dependency-change', 'configuration-change', 'recovery',
  'merge', 'staging', 'release', 'closeout', 'workspace-anomaly',
]);
const SAFE_TASK_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)$/;

function frontmatter(markdown) {
  const match = String(markdown).match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (field) result[field[1]] = field[2];
  }
  return result;
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

function boardRows(markdown) {
  const rows = new Map();
  for (const line of String(markdown).split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 2) continue;
    const task = String(cells[0] || '').toUpperCase();
    if (!SAFE_TASK_ID.test(task)) continue;
    rows.set(task, { task, status: cells[1], cells, line });
  }
  return rows;
}

function normalizedStatus(status) {
  return String(status || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
}

function statusFamily(status) {
  const value = normalizedStatus(status);
  if (['done', 'complete', 'completed'].includes(value)) return 'done';
  if (['in progress', 'implemented', 'building', 'checking', 'staging qa'].includes(value)) return 'active';
  if (value === 'ready') return 'ready';
  if (value === 'blocked') return 'blocked';
  if (value === 'deferred') return 'deferred';
  return value;
}

function linkTarget(value) {
  return /\[[^\]]+\]\(([^)]+)\)/.test(String(value));
}

function completeHandoffGoalAlignment(markdown) {
  return /^##\s+Goal Alignment Session\b/m.test(markdown)
    && /^Product (?:OKR|Goal):\s*\S/im.test(markdown)
    && /^Lane OKR Fit:\s*(aligned|suggest approach change|blocked by OKR ambiguity)\b/im.test(markdown)
    && /^Mini-loop Evidence:\s*\S/im.test(markdown)
    && /^Evidence Against Product OKR:\s*\S/im.test(markdown);
}

function boardTaskSection(markdown, task) {
  const escaped = String(task).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = String(markdown);
  const heading = new RegExp(`^###\\s+${escaped}\\b.*$`, 'im').exec(source);
  if (!heading) return '';
  const afterHeading = heading.index + heading[0].length;
  const remainder = source.slice(afterHeading);
  const nextHeading = /^###\s+/m.exec(remainder);
  return source.slice(heading.index, nextHeading ? afterHeading + nextHeading.index : source.length);
}

function approvedBoardGoalAlignment(markdown) {
  if (!/(?:\*\*Goal Alignment Session\*\*|##\s+Goal Alignment Session\b)/i.test(markdown)) return false;
  for (const field of ['Objective', 'Key Results', 'Definition of Done', 'Gate / Review Point', 'Approval', 'Justification']) {
    if (!new RegExp(`(?:\\*\\*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*|${field}):`, 'i').test(markdown)) return false;
  }
  return /(?:\*\*Approval\*\*|Approval):\s*approved\b/i.test(markdown);
}

function validateNormalizedRepository(root) {
  const findings = [];
  const handoffDir = path.join(root, 'docs', 'handoffs');
  const handoffs = [];
  for (const file of markdownFiles(handoffDir)) {
    if (path.basename(file) === 'index.md') continue;
    const markdown = fs.readFileSync(file, 'utf8');
    const meta = frontmatter(markdown);
    if (meta.record_model !== RECORD_MODEL) continue;
    handoffs.push({ file, markdown, meta });
  }
  if (!handoffs.length) return findings;

  const boardPath = path.join(root, 'PROJECT_BOARD.md');
  const boardMarkdown = fs.existsSync(boardPath) ? fs.readFileSync(boardPath, 'utf8') : '';
  const board = boardRows(boardMarkdown);
  for (const handoff of handoffs) {
    const relative = path.relative(root, handoff.file);
    const task = handoff.meta.task;
    if (!SAFE_TASK_ID.test(String(task || '').toUpperCase())) {
      findings.push({ code: 'handoff-task-id', file: relative, message: 'Normalized handoff requires a safe task ID.' });
    }
    if (/^##\s+(Approved Decision|User Decision|Decision)\b/im.test(handoff.markdown)
      && !/^(approved|rejected|pending|blocked)$/i.test(handoff.meta.approval || '')) {
      findings.push({ code: 'handoff-approval', file: relative, message: 'Decision-bearing handoff requires an explicit approval state.' });
    }
    if (!/^TASK-Q-/i.test(String(task || '')) && !completeHandoffGoalAlignment(handoff.markdown)) {
      findings.push({ code: 'handoff-goal-alignment', file: relative, message: 'Non-quick normalized handoff requires the complete Goal Alignment Session contract.' });
    }
    if (!/^TASK-Q-/i.test(String(task || '')) && !approvedBoardGoalAlignment(boardTaskSection(boardMarkdown, task))) {
      findings.push({ code: 'board-goal-alignment', file: 'PROJECT_BOARD.md', message: `${task} requires an approved complete board Goal Alignment Session.` });
    }
    const row = board.get(task);
    if (row && statusFamily(row.status) !== statusFamily(handoff.meta.status)) {
      findings.push({ code: 'status-conflict', file: relative, message: `${task} status conflicts with PROJECT_BOARD.md.` });
    }
    if (row && statusFamily(row.status) === 'done') {
      if (!/\[[^\]]*handoff[^\]]*\]\([^)]+\)/i.test(row.line)) {
        findings.push({ code: 'board-handoff-link', file: 'PROJECT_BOARD.md', message: `${task} completion requires a handoff link.` });
      }
      if (!/\[[^\]]*(evidence|qa)[^\]]*\]\([^)]+\)/i.test(row.line)) {
        findings.push({ code: 'board-evidence-link', file: 'PROJECT_BOARD.md', message: `${task} completion requires an evidence link.` });
      }
    }
    for (const line of handoff.markdown.match(/^Supersedes:\s*.*$/gim) || []) {
      if (!linkTarget(line)) findings.push({ code: 'supersedes-link', file: relative, message: 'Supersedes must link to the replacement or replaced decision.' });
    }
  }

  for (const file of markdownFiles(path.join(root, 'docs', 'workstreams'))) {
    const markdown = fs.readFileSync(file, 'utf8');
    if (frontmatter(markdown).record_model !== RECORD_MODEL) continue;
    if (/^##\s+(Scope|Checks?|Decisions?|Acceptance Criteria|Test Results?)\s*$/im.test(markdown)) {
      findings.push({
        code: 'card-copied-detail',
        file: path.relative(root, file),
        message: 'Normalized workstream cards route to scope, decisions, and checks instead of copying them.',
      });
    }
  }
  return findings;
}

function concreteNoImpact(value) {
  const match = String(value || '').match(/^no impact detected\s+[—-]\s+(.+)$/i);
  if (!match) return false;
  const reason = match[1].trim();
  return reason.length >= 12 && !/^(none|n\/a|not applicable|no impact|unknown|tbd|todo)[.!]?$/i.test(reason);
}

function decideLaneReview(input = {}) {
  const risks = (input.risks || []).map(value => String(value).toLowerCase());
  const workClass = String(input.workClass || '').toLowerCase();
  const full = ['feature', 'multi-platform', 'release', 'contradictory-handoffs', 'unresolved-product-decision'].includes(workClass)
    || risks.some(risk => FULL_RISKS.has(risk));
  if (full) return { level: 'full-multi-lane', reason: 'Material or sensitive work requires a full multi-lane audit.' };
  const broader = (input.overlappingSurfaces || []).length > 0
    || (input.crossLaneDependencies || []).length > 0
    || input.handoffConflict === true
    || !concreteNoImpact(input.otherLanes);
  if (broader) return { level: 'product-review', reason: 'Cross-lane impact is present or the no-impact rationale is not concrete.' };
  return { level: 'light', reason: 'Bounded correction has a concrete no-impact rationale and no escalation trigger.' };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function fingerprintInputs(input) {
  return canonical({
    testedCommit: input.testedCommit || '',
    sourcePaths: [...(input.sourcePaths || [])].sort(),
    dependencyLockfiles: input.dependencyLockfiles || {},
    buildConfiguration: input.buildConfiguration || {},
    runtimeToolchain: input.runtimeToolchain || {},
    target: input.target || {},
    baseCommit: input.baseCommit || '',
    command: input.command || '',
    environment: input.environment || {},
  });
}

function createVerificationFingerprint(input) {
  const inputs = fingerprintInputs(input || {});
  const hash = crypto.createHash('sha256').update(JSON.stringify(inputs)).digest('hex');
  return { version: 1, hash, inputs };
}

function compareVerificationFingerprint(previous, current) {
  const keys = Object.keys(previous.inputs || {});
  const changed = keys.filter(key => JSON.stringify(previous.inputs[key]) !== JSON.stringify(current.inputs[key]));
  return { reusable: previous.version === current.version && previous.hash === current.hash && changed.length === 0, changed };
}

function shouldRunHealthCheck(event) {
  return HEALTH_EVENTS.has(String(event || '').toLowerCase());
}

function actionable(value) {
  return typeof value === 'string' && value.trim().length > 1 && !/^(tbd|todo|placeholder|unknown)$/i.test(value.trim());
}

function validateCloseout(kind, record = {}) {
  const required = kind === 'bfm'
    ? ['Status', 'Delivered', 'Commit/worktree', 'Checks', 'Evidence', 'Remaining gates', 'Next owner', 'Release boundary']
    : ['Outcome', 'Check', 'Commit/worktree', 'Next action'];
  const findings = required.filter(key => !actionable(record[key])).map(key => `Missing actionable ${key}.`);
  if (kind === 'bfm' && actionable(record.Evidence) && !linkTarget(record.Evidence)) findings.push('Evidence must contain a direct Markdown link.');
  return findings;
}

function validateEfficiencyMetrics(record = {}) {
  const findings = [];
  if (!SAFE_TASK_ID.test(String(record.taskId || '').toUpperCase())) findings.push('A safe taskId is required.');
  for (const field of ['coordinationTokenShare', 'totalTokens']) {
    const value = record[field];
    if (value !== 'unavailable' && !(typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
      findings.push(`${field} must be a non-negative authoritative number or unavailable.`);
    }
  }
  for (const field of ['toolCalls', 'repeatedChecks', 'repairLoops', 'userInterventions', 'staleEvidenceInvalidations', 'consistencyFindings', 'escapedRiskIncidents', 'timeToVerifiedCandidateMinutes']) {
    if (!(typeof record[field] === 'number' && Number.isFinite(record[field]) && record[field] >= 0)) findings.push(`${field} must be a non-negative number.`);
  }
  return findings;
}

function redactAndBoundLog(value, maxBytes = 8192) {
  let output = String(value || '')
    .replace(/\b(token|secret|password|api[_-]?key)\s*[=:]\s*[^\s]+/gi, '$1=[REDACTED]')
    .replace(/(Authorization:\s*Bearer\s+)\S+/gi, '$1[REDACTED]');
  if (Buffer.byteLength(output) <= maxBytes) return output;
  const marker = '\n[TRUNCATED]';
  const budget = Math.max(0, maxBytes - Buffer.byteLength(marker));
  output = Buffer.from(output).subarray(0, budget).toString('utf8').replace(/�+$/, '');
  return `${output}${marker}`;
}

module.exports = {
  RECORD_MODEL,
  validateNormalizedRepository,
  decideLaneReview,
  createVerificationFingerprint,
  compareVerificationFingerprint,
  shouldRunHealthCheck,
  validateCloseout,
  validateEfficiencyMetrics,
  redactAndBoundLog,
};
