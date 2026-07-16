#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const LANES = new Set(['product', 'tech', 'design', 'business', 'bfm', 'coordination']);
const MODES = new Set(['planning', 'execution', 'review']);
const STATES = new Set(['active', 'blocked', 'reviewing', 'closed']);
const CHECKPOINT_REASONS = new Set(['scope', 'decision', 'blocked', 'verification']);
const CLOSE_OUTCOMES = new Set(['completed', 'blocked', 'deferred']);
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const LOCK_WAIT_MS = 5000;
const LOCK_POLL_MS = 20;
const HARNESS_PAGES = ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md'];

function git(cwd, args, options = {}) {
  const result = spawnSync('git', args.map(String), {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error((result.stderr || result.stdout || `git ${args[0]} failed`).trim());
  }
  return {
    status: result.status,
    stdout: (result.stdout || '').replace(/\r?\n$/, ''),
    stderr: (result.stderr || '').trim(),
  };
}

function gitRoot(cwd = process.cwd()) {
  return path.resolve(git(cwd, ['rev-parse', '--show-toplevel']).stdout);
}

function gitCommonDir(cwd = process.cwd()) {
  const value = git(cwd, ['rev-parse', '--git-common-dir']).stdout;
  return path.resolve(cwd, value);
}

function gitDir(cwd = process.cwd()) {
  const value = git(cwd, ['rev-parse', '--git-dir']).stdout;
  return path.resolve(cwd, value);
}

function currentBranch(cwd = process.cwd()) {
  return git(cwd, ['branch', '--show-current']).stdout;
}

function defaultBranch(cwd = process.cwd()) {
  const symbolic = git(cwd, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'], { allowFailure: true });
  if (symbolic.status === 0 && symbolic.stdout) return symbolic.stdout.replace(/^origin\//, '');
  for (const candidate of ['main', 'master']) {
    if (git(cwd, ['rev-parse', '--verify', `refs/heads/${candidate}`], { allowFailure: true }).status === 0) return candidate;
  }
  return 'main';
}

function isDefaultBranch(cwd = process.cwd()) {
  return currentBranch(cwd) === defaultBranch(cwd);
}

function isLinkedWorktree(cwd = process.cwd()) {
  if (gitDir(cwd) === gitCommonDir(cwd)) return false;
  const root = fs.realpathSync(gitRoot(cwd));
  const listed = git(cwd, ['worktree', 'list', '--porcelain']).stdout
    .split(/\r?\n/)
    .filter(line => line.startsWith('worktree '))
    .map(line => line.slice('worktree '.length))
    .filter(candidate => fs.existsSync(candidate))
    .map(candidate => fs.realpathSync(candidate));
  return listed.includes(root);
}

function sleep(milliseconds) {
  const view = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(view, 0, 0, milliseconds);
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === 'EPERM';
  }
}

function registryPaths(cwd = process.cwd()) {
  const common = gitCommonDir(cwd);
  return {
    common,
    registryDir: path.join(common, 'fb-sessions'),
    lockDir: path.join(common, 'fb-sessions.lock'),
  };
}

function recoverDeadLock(lockDir) {
  const ownerPath = path.join(lockDir, 'owner.json');
  let owner = null;
  try {
    owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
  } catch (err) {
    try {
      const age = Date.now() - fs.statSync(lockDir).mtimeMs;
      if (age < 1000) return false;
    } catch (statErr) {
      return true;
    }
  }
  if (owner && pidAlive(Number(owner.pid))) return false;
  try {
    fs.rmSync(lockDir, { recursive: true, force: true });
    return true;
  } catch (err) {
    return false;
  }
}

function withRegistryLock(cwd, fn) {
  const { registryDir, lockDir } = registryPaths(cwd);
  fs.mkdirSync(path.dirname(lockDir), { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      fs.writeFileSync(path.join(lockDir, 'owner.json'), `${JSON.stringify({
        pid: process.pid,
        startedAt: new Date().toISOString(),
      }, null, 2)}\n`, { flag: 'wx' });
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      if (!recoverDeadLock(lockDir)) {
        if (Date.now() >= deadline) throw new Error('Timed out waiting for the shared FB session mutation lock.');
        sleep(LOCK_POLL_MS);
      }
    }
  }

  try {
    fs.mkdirSync(registryDir, { recursive: true });
    return fn(registryDir);
  } finally {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

function atomicWrite(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(temp, contents, { mode: 0o600 });
  fs.renameSync(temp, filePath);
}

function assertSafeSessionId(value) {
  if (typeof value !== 'string' || !SESSION_ID_PATTERN.test(value) || value === '.' || value === '..') {
    throw new Error(`Invalid or unsafe session ID ${JSON.stringify(value)}. Use 1-128 letters, digits, '.', '_' or '-', beginning with a letter or digit.`);
  }
  return value;
}

function optionValue(args, name) {
  const directIndex = args.indexOf(name);
  if (directIndex !== -1) {
    if (!args[directIndex + 1] || args[directIndex + 1].startsWith('--')) throw new Error(`${name} requires a value.`);
    return args[directIndex + 1];
  }
  const prefix = `${name}=`;
  const joined = args.find(arg => arg.startsWith(prefix));
  return joined ? joined.slice(prefix.length) : '';
}

function resolveSessionId(args = [], env = process.env) {
  const value = optionValue(args, '--session-id') || env.CODEX_THREAD_ID || env.FB_SESSION_ID;
  if (!value) throw new Error('A session ID is required via --session-id, CODEX_THREAD_ID, or FB_SESSION_ID.');
  return assertSafeSessionId(value);
}

function sessionFile(cwd, sessionId) {
  return path.join(registryPaths(cwd).registryDir, `${assertSafeSessionId(sessionId)}.json`);
}

function readSession(cwd, sessionId) {
  const filePath = sessionFile(cwd, sessionId);
  if (!fs.existsSync(filePath)) throw new Error(`Session ${sessionId} was not found in this repository.`);
  let record;
  try {
    record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Session ${sessionId} registry JSON is invalid: ${err.message}`);
  }
  validateRecord(record, sessionId);
  return record;
}

function validateRecord(record, expectedId = '') {
  if (!record || typeof record !== 'object') throw new Error('Session registry record must be a JSON object.');
  assertSafeSessionId(record.sessionId);
  if (expectedId && record.sessionId !== expectedId) throw new Error(`Session registry identity mismatch for ${expectedId}.`);
  if (!STATES.has(record.state)) throw new Error(`Session ${record.sessionId} has unsupported state ${JSON.stringify(record.state)}.`);
  if (!MODES.has(record.mode)) throw new Error(`Session ${record.sessionId} has unsupported mode ${JSON.stringify(record.mode)}.`);
  if (!LANES.has(record.lane)) throw new Error(`Session ${record.sessionId} has unsupported lane ${JSON.stringify(record.lane)}.`);
  if (!Array.isArray(record.locks) || !Array.isArray(record.milestones)) throw new Error(`Session ${record.sessionId} has malformed locks or milestones.`);
  return record;
}

function listSessions(cwd) {
  const { registryDir } = registryPaths(cwd);
  if (!fs.existsSync(registryDir)) return [];
  return fs.readdirSync(registryDir)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => {
      const id = name.slice(0, -5);
      return readSession(cwd, id);
    });
}

function writeSession(cwd, record) {
  validateRecord(record, record.sessionId);
  atomicWrite(sessionFile(cwd, record.sessionId), `${JSON.stringify(record, null, 2)}\n`);
}

function mutateSession(cwd, sessionId, mutator) {
  return withRegistryLock(cwd, () => {
    const record = readSession(cwd, sessionId);
    const updated = mutator(record) || record;
    updated.updatedAt = new Date().toISOString();
    writeSession(cwd, updated);
    return updated;
  });
}

function normalizeLock(repoRoot, rawLock) {
  let value = String(rawLock || '').trim().replace(/`/g, '').replace(/\\/g, '/').replace(/^\.\//, '');
  value = value.replace(/\/+$/, '');
  if (!value || /^\(?none\)?$/i.test(value)) return '';
  if (path.posix.isAbsolute(value) || value.includes('\0') || /[*?\[\]]/.test(value)) {
    throw new Error(`Unsafe repository lock ${JSON.stringify(rawLock)}.`);
  }
  const segments = value.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error(`Unsafe repository lock ${JSON.stringify(rawLock)}.`);
  }
  const resolved = path.resolve(repoRoot, ...segments);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (resolved !== repoRoot && !resolved.startsWith(rootWithSep)) throw new Error(`Lock escapes the repository: ${rawLock}.`);
  return segments.join('/');
}

function locksOverlap(left, right) {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function splitBoardRow(line) {
  return line.split('|').slice(1, -1).map(cell => cell.trim());
}

function readBoardTask(repoRoot, taskId) {
  const boardPath = path.join(repoRoot, 'PROJECT_BOARD.md');
  if (!fs.existsSync(boardPath)) return null;
  const markdown = fs.readFileSync(boardPath, 'utf8');
  const rows = markdown.split(/\r?\n/).filter(line => line.startsWith('|'));
  const cells = rows.map(splitBoardRow).find(row => row[0] === taskId);
  if (!cells || cells.length < 7) return null;
  const heading = new RegExp(`^###\\s+${taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+-.*$`, 'm').exec(markdown);
  let details = '';
  if (heading) {
    const remainder = markdown.slice(heading.index + heading[0].length);
    const boundary = remainder.search(/^(?:---|###\s+)/m);
    details = boundary === -1 ? remainder : remainder.slice(0, boundary);
  }
  const locks = cells[5].split(',').map(value => normalizeLock(repoRoot, value)).filter(Boolean);
  const handoffMatch = cells[6].match(/\]\((docs\/handoffs\/[^)]+\.md)\)/i);
  const handoff = handoffMatch ? handoffMatch[1] : `docs/handoffs/${taskId}.md`;
  return {
    id: taskId,
    status: cells[1],
    owner: cells[2],
    scope: cells[4],
    locks,
    handoff,
    approved: /(?:\*\*)?Approval(?:\*\*)?:\s*approved\b/i.test(details),
    details,
  };
}

function recapMarkdown(record, task) {
  const handoffLink = record.handoff ? `../handoffs/${path.basename(record.handoff)}` : '';
  const scope = task && task.scope ? task.scope : `Coordinate ${record.taskId} within the selected ${record.mode} mode.`;
  return `---
type: fb-session-recap
session: ${record.sessionId}
task: ${record.taskId}
lane: ${record.lane}
mode: ${record.mode}
---

# Session Recap — ${record.sessionId}

Repository-local curated evidence only. Do not paste transcripts, private reasoning, secrets, credentials, tokens, or environment values into this record.

## Session Links

- Task: ${record.taskId}
- Linked handoff: ${handoffLink ? `[${record.taskId}](${handoffLink})` : 'No execution handoff is linked in this planning or review session.'}
- Branch: \`${record.branch}\`
- Worktree: \`${record.worktree}\`

## Objective

${scope}

## Scope

Mode: ${record.mode}. Declared execution locks: ${record.locks.length ? record.locks.map(lock => `\`${lock}\``).join(', ') : 'No execution locks are held by this planning or review session.'}

## Milestones

- ${record.createdAt}: promoted to ${record.mode} as ${record.lane}.

## Task Receipt

Approved brief and decisions: Not recorded yet; completed closeout remains blocked.
Confirmed assumptions and approved scope changes: Not recorded yet; completed closeout remains blocked.
Branch, source commits, and changed surfaces: Branch ${record.branch}; source evidence is not recorded yet.
Checks, failures, recovery, and results: Verification evidence is not recorded yet.
Review state, direct links, limits, and external gates: Review evidence is not recorded yet.
Repository state: Promotion created this curated recap; later milestones must record current repository state.
Remaining owner and action: Product or BFM must complete the receipt before reviewable closeout.

## Brief Validation

Status: blocked
Satisfied criteria and evidence: Promotion and branch identity are recorded.
Missing criteria: Completed receipt and verification evidence.
Reason: The session has only been promoted.
Owner: Product or BFM.
Next action: Author the missing evidence before completed closeout.
Approved scope-change references: None recorded.

## Failure Evidence

When a meaningful failure occurs, record Failure, Observed, Cause, Recovery attempted, Result, and Reusable lesson as concrete fields.

## Closeout

Reason: The session remains active.
Owner: ${record.lane}.
Next action: Record the next scoped milestone.
`;
}

function assertNonDefaultBranch(cwd, mode) {
  const branch = currentBranch(cwd);
  if (!branch || isDefaultBranch(cwd)) throw new Error(`${mode} sessions require a non-default session branch.`);
  return branch;
}

function isSidechat(env) {
  return [env.CODEX_THREAD_TYPE, env.FB_SESSION_KIND].some(value => String(value || '').toLowerCase() === 'sidechat');
}

function promoteSession(cwd, args, env) {
  const sessionId = resolveSessionId(args, env);
  const taskId = args[0];
  const lane = String(args[1] || '').toLowerCase();
  const mode = String(optionValue(args, '--mode') || '').toLowerCase();
  if (!taskId) throw new Error('session promote requires <task-id>.');
  if (!LANES.has(lane)) throw new Error(`Invalid lane ${JSON.stringify(args[1])}; use ${[...LANES].join(', ')}.`);
  if (!MODES.has(mode)) throw new Error('Invalid mode; use planning, execution, or review.');
  if (isSidechat(env)) throw new Error('Sidechats are observers and cannot promote; their parent records accepted durable work.');
  const repoRoot = gitRoot(cwd);
  const branch = assertNonDefaultBranch(cwd, mode);

  return withRegistryLock(cwd, () => {
    const existingPath = sessionFile(cwd, sessionId);
    if (fs.existsSync(existingPath)) {
      const existing = readSession(cwd, sessionId);
      if (existing.state === 'closed') {
        if (existing.taskId !== taskId) throw new Error(`Closed session ID ${sessionId} cannot be reused for another task.`);
        throw new Error(`Session ${sessionId} is closed and cannot be promoted again.`);
      }
      if (existing.taskId === taskId && existing.lane === lane && existing.mode === mode && existing.state === 'active') {
        return { record: existing, idempotent: true };
      }
      throw new Error(`Active session ID ${sessionId} is already assigned to ${existing.taskId}/${existing.lane}/${existing.mode}.`);
    }

    const task = readBoardTask(repoRoot, taskId);
    let locks = [];
    let handoff = task && fs.existsSync(path.join(repoRoot, task.handoff)) ? task.handoff : '';
    if (mode === 'execution') {
      if (!isLinkedWorktree(cwd)) throw new Error('Execution promotion requires a linked worktree registered with Git.');
      if (!task || task.status !== 'In Progress') throw new Error(`Execution requires ${taskId} to be approved and In Progress on PROJECT_BOARD.md.`);
      if (!task.approved) throw new Error(`Execution requires an approved Goal Alignment Session for ${taskId}.`);
      if (!handoff) throw new Error(`Execution requires a linked handoff for ${taskId}.`);
      if (task.locks.length === 0) throw new Error('Execution requires declared repository-relative locks.');
      locks = task.locks;
      for (const other of listSessions(cwd)) {
        if (other.state === 'closed' || other.mode !== 'execution') continue;
        for (const requested of locks) {
          const conflict = other.locks.find(active => locksOverlap(requested, active));
          if (conflict) throw new Error(`Execution lock overlap: ${requested} conflicts with ${conflict} held by ${other.sessionId}.`);
        }
      }
    }

    const now = new Date().toISOString();
    const recap = `docs/sessions/${sessionId}.md`;
    const record = {
      version: 1,
      sessionId,
      taskId,
      lane,
      mode,
      state: 'active',
      outcome: null,
      branch,
      worktree: repoRoot,
      handoff,
      recap,
      locks,
      createdAt: now,
      updatedAt: now,
      lastMilestoneAt: now,
      milestones: [{ reason: 'promotion', at: now, commit: git(cwd, ['rev-parse', 'HEAD']).stdout }],
    };
    atomicWrite(path.join(repoRoot, recap), recapMarkdown(record, task));
    writeSession(cwd, record);
    return { record, idempotent: false };
  });
}

function computedState(record, now = Date.now()) {
  if (record.state === 'closed') return 'closed';
  const milestone = Date.parse(record.lastMilestoneAt || record.updatedAt || record.createdAt);
  if (Number.isFinite(milestone) && now - milestone >= STALE_AFTER_MS) return 'stale';
  return record.state;
}

function statusSession(cwd, args, env) {
  const explicit = optionValue(args, '--session-id') || env.CODEX_THREAD_ID || env.FB_SESSION_ID;
  const includeAll = args.includes('--all');
  const records = explicit ? [readSession(cwd, assertSafeSessionId(explicit))] : listSessions(cwd)
    .filter(record => includeAll || record.state !== 'closed');
  if (records.length === 0) return 'No matching repository-local sessions.';
  return records.map(record => {
    const state = computedState(record);
    return `${record.sessionId} | ${record.taskId} | ${record.lane}/${record.mode} | ${state} | branch ${record.branch} | locks ${record.locks.join(', ') || 'none'}`;
  }).join('\n');
}

function markdownSections(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...markdown.matchAll(new RegExp(`^##\\s+${escaped}\\s*$`, 'gim'))];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const next = markdown.slice(start).search(/^##\s+/m);
    const end = next === -1 ? markdown.length : start + next;
    return markdown.slice(start, end).trim();
  });
}

function lastSection(markdown, heading) {
  const sections = markdownSections(markdown, heading);
  return sections.length ? sections[sections.length - 1] : '';
}

function fieldValue(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...markdown.matchAll(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:\\s*([^\\n]+)`, 'gi'))];
  return matches.length ? matches[matches.length - 1][1].trim() : '';
}

function actionable(value, options = {}) {
  const normalized = String(value || '').trim().replace(/^\*+|\*+$/g, '').trim();
  if (!normalized || /^<[^>]+>$/.test(normalized) || /^(?:todo|tbd|placeholder|example)$/i.test(normalized)) return false;
  if (!options.allowNone && /^(?:none|n\/a|not recorded(?: yet)?)[.!]?$/i.test(normalized)) return false;
  return true;
}

function assertCuratedPrivacy(markdown) {
  if (/^#{1,6}\s+(?:raw\s+)?transcript\b|^#{1,6}\s+(?:private reasoning|chain of thought)\b|(?:^|\n)\s*(?:[-*]\s*)?(?:private reasoning|chain of thought)\s*:/im.test(markdown)) {
    throw new Error('Curated session evidence rejects raw-transcript and private-reasoning sections.');
  }
  if (/\b(?:TODO|TBD)\b|<[^>\n]+>/i.test(markdown)) throw new Error('Curated session evidence rejects TODO, TBD, example, and angle-bracket placeholders.');
  const secretLine = /(?:^|\n)\s*(?:[-*]\s*)?(?:[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|PASSWORD|SECRET|CREDENTIAL)[A-Z0-9_]*|Authorization|Environment value)\s*[:=]\s*(?!none\b|not\b|redacted\b)\S+/i;
  if (secretLine.test(markdown)) throw new Error('Curated session evidence rejects obvious secrets, credentials, tokens, and environment values.');
}

function assertStructuredFailures(markdown) {
  const failures = [...markdown.matchAll(/(?:^|\n)\s*(?:[-*]\s*)?Failure\s*:\s*([^\n]+)/gi)]
    .map(match => match[1].trim())
    .filter(value => !/^(?:none|no\b)/i.test(value));
  if (failures.length === 0) return;
  for (const label of ['Observed', 'Cause', 'Recovery attempted', 'Result', 'Reusable lesson']) {
    if (!actionable(fieldValue(markdown, label), { allowNone: label === 'Recovery attempted' })) {
      throw new Error(`Meaningful failures require structured ${label} evidence.`);
    }
  }
}

function assertCheckpointEvidence(reason, recap, handoff, record) {
  const combined = `${recap}\n${handoff}`;
  assertCuratedPrivacy(combined);
  assertStructuredFailures(combined);
  if (reason === 'scope') {
    if (!actionable(lastSection(recap, 'Objective')) || !actionable(lastSection(recap, 'Scope')) || !record.handoff) {
      throw new Error('Scope checkpoint requires objective, scope, and linked handoff evidence.');
    }
  } else if (reason === 'decision') {
    if (!actionable(fieldValue(combined, 'Decision')) && !actionable(fieldValue(combined, 'Assumption'))) {
      throw new Error('Decision checkpoint requires a nonplaceholder Decision or Assumption.');
    }
  } else if (reason === 'blocked') {
    if (!actionable(fieldValue(combined, 'Blocker')) || !actionable(fieldValue(combined, 'Next action'))) {
      throw new Error('Blocked checkpoint requires a concrete Blocker and actionable Next action.');
    }
  } else if (reason === 'verification') {
    const hasCommit = /\b[0-9a-f]{7,40}\b/i.test(combined);
    const checks = fieldValue(combined, 'Commands and results') || fieldValue(combined, 'Checks, failures, recovery, and results');
    const limits = fieldValue(combined, 'Known limits');
    const recapLink = `../sessions/${record.sessionId}.md`;
    const handoffLink = `../handoffs/${path.basename(record.handoff || '')}`;
    if (!hasCommit || !actionable(checks) || !actionable(limits) || !lastSection(handoff, 'Verification Handoff') || !handoff.includes(recapLink) || !recap.includes(handoffLink)) {
      throw new Error('Verification checkpoint requires source commit refs, named checks/results, known limits, Verification Handoff, and reciprocal recap/handoff links.');
    }
  }
}

function changedPaths(cwd, args) {
  const result = git(cwd, args, { allowFailure: true });
  return result.stdout.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
}

function checkpointSession(cwd, args, env) {
  const sessionId = resolveSessionId(args, env);
  const reason = String(optionValue(args, '--reason') || '').toLowerCase();
  if (!CHECKPOINT_REASONS.has(reason)) throw new Error('Checkpoint reason must be scope, decision, blocked, or verification.');
  const record = readSession(cwd, sessionId);
  if (record.state === 'closed') throw new Error(`Session ${sessionId} is closed.`);
  const repoRoot = gitRoot(cwd);
  const branch = assertNonDefaultBranch(cwd, 'checkpoint');
  if (branch !== record.branch) throw new Error(`Checkpoint must run on the session branch ${record.branch}.`);
  if (!record.handoff) throw new Error('Checkpoint requires a linked handoff.');
  const allowed = [record.recap, record.handoff].map(value => value.replace(/\\/g, '/'));
  const recapPath = path.join(repoRoot, record.recap);
  const handoffPath = path.join(repoRoot, record.handoff);
  if (!fs.existsSync(recapPath) || !fs.existsSync(handoffPath)) throw new Error('Checkpoint requires the recap and linked handoff files.');
  const staged = changedPaths(cwd, ['diff', '--cached', '--name-only']);
  const unrelatedStaged = staged.filter(value => !allowed.includes(value));
  if (unrelatedStaged.length) throw new Error(`Checkpoint rejects unrelated staged files: ${unrelatedStaged.join(', ')}.`);
  for (const required of allowed) {
    const status = git(cwd, ['status', '--porcelain=v1', '--', required]).stdout;
    if (!status) throw new Error(`Checkpoint requires a current change to ${required}.`);
  }
  if (record.mode !== 'execution') {
    const statusLines = git(cwd, ['status', '--porcelain=v1', '-uall']).stdout.split(/\r?\n/).filter(Boolean);
    const dirt = statusLines.map(line => line.slice(3).replace(/^.* -> /, '')).filter(value => !allowed.includes(value));
    if (dirt.length) throw new Error(`${record.mode} checkpoint rejects source dirt: ${dirt.join(', ')}.`);
  }
  const recap = fs.readFileSync(recapPath, 'utf8');
  const handoff = fs.readFileSync(handoffPath, 'utf8');
  assertCheckpointEvidence(reason, recap, handoff, record);
  git(cwd, ['add', '--', ...allowed]);
  const stagedAfter = changedPaths(cwd, ['diff', '--cached', '--name-only']);
  if (stagedAfter.some(value => !allowed.includes(value))) throw new Error('Checkpoint staging escaped the recap and linked handoff boundary.');
  git(cwd, ['commit', '-m', `docs(session): ${sessionId} ${reason} checkpoint`]);
  const commit = git(cwd, ['rev-parse', 'HEAD']).stdout;
  const push = git(cwd, ['push', '-u', 'origin', 'HEAD'], { allowFailure: true });
  if (push.status !== 0) {
    mutateSession(cwd, sessionId, current => {
      current.state = 'blocked';
      current.lastFailure = {
        failure: 'Checkpoint push failed',
        observed: push.stderr || push.stdout,
        cause: 'The configured origin rejected or could not receive the push.',
        recoveryAttempted: 'No force push, rebase, rollback, or branch change was attempted.',
        result: `Commit ${commit} was preserved locally.`,
        reusableLesson: 'Repair origin access, then push the preserved commit normally.',
      };
      return current;
    });
    throw new Error(`Checkpoint commit ${commit} was preserved, but push failed; session is blocked. ${push.stderr || push.stdout}`);
  }
  const updated = mutateSession(cwd, sessionId, current => {
    const at = new Date().toISOString();
    current.state = reason === 'blocked' ? 'blocked' : 'active';
    current.lastMilestoneAt = at;
    current.milestones.push({ reason, at, commit, pushed: true });
    return current;
  });
  return { record: updated, commit };
}

const RECEIPT_FIELDS = [
  'Approved brief and decisions',
  'Confirmed assumptions and approved scope changes',
  'Branch, source commits, and changed surfaces',
  'Checks, failures, recovery, and results',
  'Review state, direct links, limits, and external gates',
  'Repository state',
  'Remaining owner and action',
];

function evidenceFiles(cwd, record) {
  const root = gitRoot(cwd);
  const recap = fs.readFileSync(path.join(root, record.recap), 'utf8');
  const handoff = record.handoff && fs.existsSync(path.join(root, record.handoff))
    ? fs.readFileSync(path.join(root, record.handoff), 'utf8')
    : '';
  return { recap, handoff, combined: `${recap}\n${handoff}` };
}

function assertCompletedEvidence(cwd, record) {
  const { recap, handoff, combined } = evidenceFiles(cwd, record);
  assertCuratedPrivacy(combined);
  assertStructuredFailures(combined);
  const receipt = lastSection(handoff, 'Task Receipt') || lastSection(recap, 'Task Receipt');
  const missingReceipt = RECEIPT_FIELDS.filter(label => !actionable(fieldValue(receipt, label), { allowNone: false }));
  if (missingReceipt.length) throw new Error(`Task Receipt is incomplete: ${missingReceipt.join(', ')}.`);
  const validation = lastSection(handoff, 'Brief Validation') || lastSection(recap, 'Brief Validation');
  if (!/^pass$/i.test(fieldValue(validation, 'Status'))) throw new Error('Completed reviewable work requires Brief Validation: pass.');
  for (const label of ['Satisfied criteria and evidence', 'Missing criteria', 'Reason', 'Owner', 'Next action', 'Approved scope-change references']) {
    if (!actionable(fieldValue(validation, label), { allowNone: true })) throw new Error(`Brief Validation is missing ${label}.`);
  }
  if (!record.milestones.some(item => item.reason === 'verification' && item.commit)) throw new Error('Completed reviewable work requires a verification checkpoint.');
  if (!lastSection(handoff, 'Verification Handoff')) throw new Error('Completed reviewable work requires Verification Handoff.');
  if (!lastSection(handoff, 'Test This Now')) throw new Error('Completed reviewable work requires Test This Now.');
  if (!handoff.includes(`../sessions/${record.sessionId}.md`) || !recap.includes(`../handoffs/${path.basename(record.handoff || '')}`)) {
    throw new Error('Completed reviewable work requires reciprocal recap and handoff links.');
  }
  return true;
}

function closeSession(cwd, args, env) {
  const sessionId = resolveSessionId(args, env);
  const outcome = String(optionValue(args, '--outcome') || '').toLowerCase();
  if (!CLOSE_OUTCOMES.has(outcome)) throw new Error('Close outcome must be completed, blocked, or deferred.');
  const record = readSession(cwd, sessionId);
  if (record.state === 'closed') throw new Error(`Session ${sessionId} is already closed.`);
  const { recap, handoff, combined } = evidenceFiles(cwd, record);
  assertCuratedPrivacy(combined);
  if (outcome === 'completed') {
    assertCompletedEvidence(cwd, record);
  } else {
    const validation = lastSection(handoff, 'Brief Validation') || lastSection(recap, 'Brief Validation');
    if (!/^blocked$/i.test(fieldValue(validation, 'Status'))) throw new Error(`${outcome} close cannot claim passing Brief Validation; record Status: blocked.`);
    const closeout = lastSection(recap, 'Closeout') || lastSection(handoff, 'Closeout');
    for (const label of ['Reason', 'Owner', 'Next action']) {
      if (!actionable(fieldValue(closeout, label))) throw new Error(`${outcome} close requires a concrete ${label}.`);
    }
  }
  return mutateSession(cwd, sessionId, current => {
    const at = new Date().toISOString();
    current.state = 'closed';
    current.outcome = outcome;
    current.closedAt = at;
    current.lastMilestoneAt = at;
    current.milestones.push({ reason: 'close', outcome, at, commit: git(cwd, ['rev-parse', 'HEAD']).stdout });
    return current;
  });
}

function assertSubmitReady(cwd, taskId) {
  const candidates = listSessions(cwd).filter(record => record.taskId === taskId && record.mode === 'execution' && record.state === 'active');
  if (candidates.length !== 1) throw new Error(`Submit requires one active execution session for ${taskId}.`);
  assertCompletedEvidence(cwd, candidates[0]);
  return candidates[0];
}

function recallSession(cwd, args) {
  const allRefs = args.includes('--all-refs');
  const query = args.filter(arg => arg !== '--all-refs').join(' ').trim();
  if (!query) throw new Error('session recall requires <query>.');
  const refs = ['HEAD'];
  if (allRefs) {
    const fetched = git(cwd, ['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes']).stdout
      .split(/\r?\n/).filter(Boolean).sort();
    refs.push(...fetched.filter(ref => !refs.includes(ref)));
  }
  const needle = query.toLowerCase();
  const matches = [];
  for (const ref of refs) {
    const commitResult = git(cwd, ['rev-parse', '--verify', `${ref}^{commit}`], { allowFailure: true });
    if (commitResult.status !== 0) continue;
    const commit = commitResult.stdout;
    const files = git(cwd, ['ls-tree', '-r', '--name-only', ref]).stdout.split(/\r?\n/)
      .filter(file => file.endsWith('.md') && !/(?:^|\/)(?:transcripts?|private-reasoning|chain-of-thought)(?:\/|$)/i.test(file))
      .sort();
    for (const file of files) {
      const shown = git(cwd, ['show', `${ref}:${file}`], { allowFailure: true });
      if (shown.status !== 0 || /^#{1,6}\s+(?:raw\s+)?transcript\b|^#{1,6}\s+(?:private reasoning|chain of thought)\b/im.test(shown.stdout)) continue;
      shown.stdout.split(/\r?\n/).forEach((line, index) => {
        if (line.toLowerCase().includes(needle)) matches.push({ ref, commit, file, line: index + 1, text: line.trim() });
      });
    }
  }
  matches.sort((a, b) => a.ref.localeCompare(b.ref) || a.file.localeCompare(b.file) || a.line - b.line || a.text.localeCompare(b.text));
  if (matches.length === 0) throw new Error(`No committed curated Markdown matches for ${JSON.stringify(query)}.`);
  return `# FB Session Recall\n\nQuery: ${query}\n\n${matches.map(match =>
    `- source: ${match.file}#L${match.line} | ref: ${match.ref} | commit: ${match.commit.slice(0, 12)} | ${match.text}`
  ).join('\n')}`;
}

function copyClipboard(text) {
  const candidates = process.platform === 'darwin' ? [['pbcopy']] : process.platform === 'win32' ? [['clip']] : [['wl-copy'], ['xclip', '-selection', 'clipboard'], ['xsel', '--clipboard', '--input']];
  for (const [command, ...args] of candidates) {
    try {
      execFileSync(command, args, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } catch (err) {}
  }
  return false;
}

function reviewSession(cwd, args, env, clipboard = copyClipboard) {
  const ref = args.find(arg => !arg.startsWith('--') && arg !== optionValue(args, '--session-id'));
  if (!ref) throw new Error('session review requires <branch|commit>.');
  const commit = git(cwd, ['rev-parse', '--verify', `${ref}^{commit}`]).stdout;
  const base = defaultBranch(cwd);
  let files = git(cwd, ['diff', '--name-only', `${base}...${commit}`], { allowFailure: true });
  if (files.status !== 0) files = git(cwd, ['diff', '--name-only', `${commit}^`, commit], { allowFailure: true });
  const changed = files.stdout.split(/\r?\n/).filter(Boolean).sort();
  const sessionValue = optionValue(args, '--session-id') || env.CODEX_THREAD_ID || env.FB_SESSION_ID;
  let record = null;
  if (sessionValue) {
    const sessionId = assertSafeSessionId(sessionValue);
    record = mutateSession(cwd, sessionId, current => {
      if (current.state === 'closed') throw new Error(`Session ${sessionId} is closed.`);
      current.state = 'reviewing';
      return current;
    });
  }
  const packet = `# FB Session Review

- Candidate: \`${ref}\`
- Commit: \`${commit}\`
- Base: \`${base}\`
- Session: ${record ? `\`${record.sessionId}\`` : 'not supplied'}
- Recap: ${record ? `\`${record.recap}\`` : 'not supplied'}

## Changed Files

${changed.length ? changed.map(file => `- \`${file}\``).join('\n') : '- No changed files detected.'}

## Review Prompt

Compare this candidate against the approved Build Brief, Task Receipt, Brief Validation, Verification Handoff, Test This Now evidence, known limits, and repository state. Report findings by severity with exact file references.
`;
  clipboard(packet);
  return packet;
}

function validateHarnessParity(repoRoot) {
  const pluginRoot = path.join(repoRoot, 'plugins', 'fb-lane-coordination');
  const mismatches = [];
  for (const page of HARNESS_PAGES) {
    const canonical = path.join(repoRoot, 'docs', 'fb', page);
    const packaged = path.join(pluginRoot, 'docs', 'fb', page);
    if (!fs.existsSync(canonical) || !fs.existsSync(packaged) || fs.readFileSync(canonical, 'utf8') !== fs.readFileSync(packaged, 'utf8')) mismatches.push(`docs/fb/${page}`);
  }
  for (const file of ['fb-lane.cjs', 'fb-session.cjs', 'fb-lane.test.cjs', 'fb-session.test.cjs']) {
    const canonical = path.join(repoRoot, 'tools', file);
    const packaged = path.join(pluginRoot, 'tools', file);
    if (!fs.existsSync(canonical) || !fs.existsSync(packaged) || fs.readFileSync(canonical, 'utf8') !== fs.readFileSync(packaged, 'utf8')) mismatches.push(`tools/${file}`);
  }
  return mismatches;
}

function collectSessionDoctorChecks(repoRoot) {
  const checks = [];
  const add = (level, label, detail, fix = '') => checks.push({ level, label, detail, fix });
  let records = [];
  try {
    records = listSessions(repoRoot);
    add('ok', 'Session registry integrity', `${records.length} clone-local session record(s) parsed atomically.`);
  } catch (err) {
    if (/not a git repository/i.test(err.message)) {
      add('warn', 'Session registry integrity', 'No Git common directory is available; repository-local sessions are unavailable until Git is initialized.', 'Initialize Git before promoting a durable session.');
    } else {
      add('fail', 'Session registry integrity', err.message, 'Repair or remove only the malformed clone-local record after preserving useful curated evidence.');
    }
  }
  const linkProblems = [];
  const branchProblems = [];
  const stale = [];
  for (const record of records) {
    const worktree = record.worktree && fs.existsSync(record.worktree) ? record.worktree : repoRoot;
    if (!fs.existsSync(path.join(worktree, record.recap)) || (record.handoff && !fs.existsSync(path.join(worktree, record.handoff)))) linkProblems.push(record.sessionId);
    if (record.state !== 'closed' && (!record.branch || record.branch === defaultBranch(repoRoot))) branchProblems.push(`${record.sessionId} (branch)`);
    if (record.mode === 'execution' && record.state !== 'closed' && (!record.worktree || !fs.existsSync(record.worktree))) branchProblems.push(`${record.sessionId} (worktree)`);
    if (computedState(record) === 'stale') stale.push(record.sessionId);
  }
  add(linkProblems.length ? 'fail' : 'ok', 'Session recap/handoff links', linkProblems.length ? `Missing linked records: ${linkProblems.join(', ')}` : 'Live session records resolve their recap and handoff links.', 'Restore the linked curated Markdown or close the invalid session honestly.');
  add(branchProblems.length ? 'fail' : 'ok', 'Session branch/worktree requirements', branchProblems.length ? `Invalid active session location: ${branchProblems.join(', ')}` : 'Active sessions satisfy branch and execution-worktree requirements.', 'Move execution to a linked non-default worktree or close the invalid record.');
  add(stale.length ? 'warn' : 'ok', 'Stale active sessions', stale.length ? `No milestone for 24 hours: ${stale.join(', ')}. Locks remain held.` : 'No active session is stale.', 'Recall the session, checkpoint a real milestone, or close it with evidence; do not silently release locks.');
  const conflicts = [];
  const active = records.filter(record => record.state !== 'closed' && record.mode === 'execution');
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      for (const left of active[i].locks) for (const right of active[j].locks) if (locksOverlap(left, right)) conflicts.push(`${left}/${right} (${active[i].sessionId}, ${active[j].sessionId})`);
    }
  }
  add(conflicts.length ? 'fail' : 'ok', 'Session locks', conflicts.length ? `Unresolved overlaps: ${conflicts.join(', ')}` : 'No active session locks overlap.', 'Product/BFM must serialize, split, or close one execution claim.');
  const pluginRoot = path.join(repoRoot, 'plugins', 'fb-lane-coordination');
  if (fs.existsSync(pluginRoot)) {
    const mismatches = validateHarnessParity(repoRoot);
    add(mismatches.length ? 'fail' : 'ok', 'Session harness parity', mismatches.length ? `Root/package mismatch: ${mismatches.join(', ')}` : 'Root/package session modules, tests, and six harness pages match.', 'Restore the canonical/package mirrors before closeout.');
    const pluginServer = path.join(pluginRoot, 'tools', 'fb-session.cjs');
    add(fs.existsSync(pluginServer) ? 'ok' : 'fail', 'Plugin session server resolution', fs.existsSync(pluginServer) ? 'Packaged CLI can resolve fb-session.cjs.' : 'Packaged fb-session.cjs is missing.', 'Restore plugins/fb-lane-coordination/tools/fb-session.cjs.');
  } else {
    add('ok', 'Session harness parity', 'Consumer repository detected; installed package-source parity is not applicable here.');
    add('ok', 'Plugin session server resolution', `The active CLI resolved ${path.basename(__filename)}.`);
  }
  return checks;
}

function sessionUsage() {
  return `Session commands:
  session intake [--session-id <id>]
  session promote <task-id> <lane> --mode planning|execution|review [--session-id <id>]
  session status [--all] [--session-id <id>]
  session checkpoint --reason scope|decision|blocked|verification [--session-id <id>]
  session recall <query> [--all-refs]
  session review <branch|commit> [--session-id <id>]
  session close --outcome completed|blocked|deferred [--session-id <id>]`;
}

function runSessionCommand(args, options = {}) {
  const cwd = options.cwd || process.cwd();
  const env = options.env || process.env;
  const command = String(args[0] || '').toLowerCase();
  const rest = args.slice(1);
  if (command === 'intake') {
    const id = resolveSessionId(rest, env);
    console.log(`Session intake observer: ${id}. No registry, recap, branch, or worktree write was performed.`);
    return;
  }
  if (command === 'promote') {
    const result = promoteSession(cwd, rest, env);
    console.log(result.idempotent
      ? `Session ${result.record.sessionId} is already active with the same task/lane/mode; promotion is idempotent.`
      : `Promoted session ${result.record.sessionId} to ${result.record.lane}/${result.record.mode} on ${result.record.branch}.`);
    return;
  }
  if (command === 'status') {
    console.log(statusSession(cwd, rest, env));
    return;
  }
  if (command === 'checkpoint') {
    const result = checkpointSession(cwd, rest, env);
    console.log(`Checkpoint ${result.record.sessionId}/${optionValue(rest, '--reason')} committed and pushed at ${result.commit}.`);
    return;
  }
  if (command === 'recall') {
    console.log(recallSession(cwd, rest));
    return;
  }
  if (command === 'review') {
    console.log(reviewSession(cwd, rest, env, options.copyToClipboard || copyClipboard));
    return;
  }
  if (command === 'close') {
    const result = closeSession(cwd, rest, env);
    console.log(`Closed session ${result.sessionId} with outcome ${result.outcome}.`);
    return;
  }
  throw new Error(sessionUsage());
}

module.exports = {
  SESSION_ID_PATTERN,
  LANES,
  MODES,
  STATES,
  CHECKPOINT_REASONS,
  CLOSE_OUTCOMES,
  STALE_AFTER_MS,
  HARNESS_PAGES,
  resolveSessionId,
  assertSafeSessionId,
  normalizeLock,
  locksOverlap,
  readSession,
  listSessions,
  withRegistryLock,
  computedState,
  runSessionCommand,
  assertSubmitReady,
  collectSessionDoctorChecks,
  sessionUsage,
};
