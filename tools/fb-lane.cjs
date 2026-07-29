#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const readline = require('readline');
const {
  runSessionCommand,
  assertSubmitReady,
  withSubmitLifecycleTransaction,
  collectSessionDoctorChecks,
  sessionUsage,
  listSessions,
  computedState,
  submitVerificationReuse,
  recordAutomatedVerification,
} = require('./fb-session.cjs');
const { assertFullBfmChangelog } = require('./fb-changelog-closeout.cjs');
const { collectEvalDoctorChecks } = require('./fb-eval.cjs');
const {
  REQUIRED_EVENT_FIELDS,
  routeArtifact,
  validateStageEvent,
  appendStageEvent,
  collectControlLoopDoctorChecks,
} = require('./fb-control-loop.cjs');
const { validateNormalizedRepository } = require('./fb-records.cjs');
const { projectContextPacket } = require('./fb-project-graph.cjs');
const {
  classifyExecutionMode,
  renderQuickRecord,
  parseQuickRecord,
  findQuickRecord,
  classifyChangedSurface,
  selectAutomatedChecks,
  runAutomatedCheck,
  runQuickSubmissionChecks,
  automatedVerificationDecision,
} = require('./fb-efficiency.cjs');

const FB_MODEL_LINE = ['FB 0.2.0-beta:', 'AI', 'Loop', 'Engineering', 'for', 'Everyday', 'People'].join(' ');
const CONTROL_EVENT_VALUE_SCHEMA = {
  oneOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'null' },
    { type: 'array', items: { type: 'string' } },
  ],
};
const CONTROL_EVENT_PROPERTIES = Object.fromEntries(REQUIRED_EVENT_FIELDS.map(field => [field, CONTROL_EVENT_VALUE_SCHEMA]));
Object.assign(CONTROL_EVENT_PROPERTIES, {
  schemaVersion: { const: 'fb-stage-event-v1' },
  eventId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' },
  runId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' },
  timestamp: { type: 'string', format: 'date-time' },
  attempt: { type: 'integer', minimum: 0 },
  criteriaIds: { type: 'array', items: { type: 'string', minLength: 1 } },
  evidenceRefs: { type: 'array', items: { type: 'string', minLength: 1 } },
  durationMs: { oneOf: [{ type: 'number', minimum: 0 }, { const: 'unavailable' }] },
  inputTokens: { oneOf: [{ type: 'number', minimum: 0 }, { const: 'unavailable' }] },
  outputTokens: { oneOf: [{ type: 'number', minimum: 0 }, { const: 'unavailable' }] },
  cost: { oneOf: [{ type: 'number', minimum: 0 }, { const: 'unavailable' }] },
});
const CONTROL_EVENT_OUTPUT_SCHEMA = {
  type: 'object',
  description: 'Validated flat fb-stage-event-v1 record.',
  properties: CONTROL_EVENT_PROPERTIES,
  required: REQUIRED_EVENT_FIELDS,
  additionalProperties: false,
};
const CONTROL_EVENT_MCP_SCHEMA = {
  type: 'object',
  description: 'Flat fb-stage-event-v1 record. Nested objects, transcripts, raw prompts, complete outputs, private reasoning, and secrets are rejected.',
  properties: { ...CONTROL_EVENT_PROPERTIES, workspacePath: { type: 'string' } },
  required: REQUIRED_EVENT_FIELDS,
  additionalProperties: false,
};

function validateMcpStageEvent(event) {
  for (const key of Object.keys(event)) {
    if (!REQUIRED_EVENT_FIELDS.includes(key)) throw new Error(`MCP control event does not allow additional property ${key}.`);
  }
  return validateStageEvent(event);
}

function expandHome(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return filePath;
  }
  if (filePath === '~') {
    return process.env.HOME || filePath;
  }
  if (filePath.startsWith('~/')) {
    return path.join(process.env.HOME || '', filePath.slice(2));
  }
  return filePath;
}

function resolveWorkspaceStart(options = {}) {
  const candidate =
    options.workspacePath ||
    process.env.FB_LANE_WORKSPACE ||
    process.env.CODEX_WORKSPACE_ROOT ||
    process.env.CODEX_PROJECT_ROOT ||
    process.env.WORKSPACE_ROOT ||
    process.env.INIT_CWD ||
    process.cwd();
  return path.resolve(expandHome(candidate));
}

// Find PROJECT_BOARD.md by searching upward
function findBoardPath(startDir = process.cwd()) {
  let dir = startDir;
  while (true) {
    const filePath = path.join(dir, 'PROJECT_BOARD.md');
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

// Log error to stderr in MCP mode to prevent JSON-RPC corruption
function logError(...args) {
  console.error(...args);
}

// Run a git command WITHOUT a shell. `args` may be an array of arguments
// (preferred for any command that interpolates task IDs, lane names, branch
// names, commit messages, or other caller-supplied data) or a string of
// literal, trusted arguments. Passing values through execFileSync('git', argv)
// means git receives each token verbatim, so shell metacharacters in
// untrusted input (`;`, `$()`, backticks, `&&`, quotes, …) can never be
// interpreted by a shell. This closes the command-injection hole that existed
// when commands were built as `git ${args}` and handed to execSync.
function runGit(args) {
  const argv = Array.isArray(args)
    ? args.map(String)
    : String(args).trim().split(/\s+/).filter(Boolean);
  try {
    return execFileSync('git', argv, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : '';
    throw new Error(stderr || err.message);
  }
}

// Allowlists for the few values that get woven into branch names and git
// refs. Even though runGit no longer uses a shell, validating here keeps
// branch names well-formed and prevents a leading "-" from being mistaken
// for a git option (argument injection). Task IDs and lanes come from the
// CLI argv and from MCP tool arguments, so both entry points validate.
const TASK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const LANE_PATTERN = /^[A-Za-z][A-Za-z-]*$/;
function assertSafeTaskId(taskId) {
  if (typeof taskId !== 'string' || !TASK_ID_PATTERN.test(taskId)) {
    throw new Error(
      `Invalid task ID ${JSON.stringify(taskId)}: expected letters, digits, '.', '_' or '-' (not starting with '-').`
    );
  }
  return taskId;
}

function assertSafeLane(lane) {
  if (typeof lane !== 'string' || !LANE_PATTERN.test(lane)) {
    throw new Error(
      `Invalid lane ${JSON.stringify(lane)}: expected a name like "Tech", "Design", "Product", "Business", "Discovery" or "Bugs".`
    );
  }
  return lane;
}

function classifyBfmClass(task = {}, options = {}) {
  const classified = classifyExecutionMode({
    ...task,
    successCriteria: task.successCriteria || 'The focused correction contract passes.',
  }, options);
  return classified.mode === 'Quick BFM' ? 'Quick BFM Patch' : 'Full BFM';
}

function parseWorktreePorcelain(markdown = '') {
  return String(markdown).trim().split(/\r?\n\r?\n/).filter(Boolean).map(block => {
    const lines = block.split(/\r?\n/);
    const worktree = lines.find(line => line.startsWith('worktree '));
    const branch = lines.find(line => line.startsWith('branch refs/heads/'));
    return {
      path: worktree ? path.resolve(worktree.slice('worktree '.length)) : '',
      branch: branch ? branch.slice('branch refs/heads/'.length) : '',
    };
  }).filter(record => record.path);
}

function resolveWorktreePlan(records, branchName) {
  if (!records.length) throw new Error('Git did not report a primary checkout for worktree placement.');
  const primary = records[0].path;
  const existing = records.find(record => record.branch === branchName);
  if (existing) return { path: existing.path, reuse: true, primary };
  const directory = branchName.replace(/[^A-Za-z0-9._-]+/g, '-');
  return { path: path.join(primary, '.worktrees', directory), reuse: false, primary };
}

function ensureWorktreeContainerIgnored(primary) {
  try {
    runGit(['-C', primary, 'check-ignore', '-q', '.worktrees']);
    return;
  } catch (err) {
    const exclude = runGit(['-C', primary, 'rev-parse', '--git-path', 'info/exclude']);
    const excludePath = path.resolve(primary, exclude);
    const current = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf8') : '';
    if (!/^\.worktrees\/$/m.test(current)) {
      fs.mkdirSync(path.dirname(excludePath), { recursive: true });
      fs.appendFileSync(excludePath, `${current && !current.endsWith('\n') ? '\n' : ''}.worktrees/\n`);
    }
  }
}

function renderQueueSummary(tasks = [], currentId = '') {
  const current = tasks.find(task => task.id === currentId)
    || tasks.find(task => /^in progress$/i.test(task.status));
  const next = tasks.find(task => /^ready$/i.test(task.status) && (!current || task.id !== current.id));
  const blocked = tasks.filter(task => /^blocked\b/i.test(task.status));
  const blockerText = blocked.map(task => {
    const reason = task.details && task.details.blockers ? task.details.blockers : task.scope;
    return `${task.id} — ${reason}`;
  });
  return [
    `Current: ${current ? `${current.id} — ${current.scope}` : 'None'}`,
    `Next ready: ${next ? `${next.id} — ${next.scope}` : 'None'}`,
    `External blocks: ${blockerText.length ? blockerText.join('; ') : 'None'}`,
  ].join('\n');
}

// A branch name is safe to hand to git as a positional ref when it is
// non-empty and does not begin with "-" (which git would treat as a flag).
function assertSafeBranchName(branchName) {
  if (typeof branchName !== 'string' || branchName === '' || branchName.startsWith('-')) {
    throw new Error(`Refusing to run git on unsafe branch name ${JSON.stringify(branchName)}.`);
  }
  return branchName;
}

function copyToClipboard(text) {
  // Pick clipboard commands by platform. `spawn('pbcopy')` emits an async 'error' event that a
  // try/catch can't catch, so a missing binary (e.g. on Linux/CI) used to crash the whole process.
  // execSync with `input` runs synchronously and throws catchably when the command is absent.
  const platform = process.platform;
  const candidates = platform === 'darwin'
    ? ['pbcopy']
    : platform === 'win32'
      ? ['clip']
      : ['wl-copy', 'xclip -selection clipboard', 'xsel --clipboard --input'];

  for (const cmd of candidates) {
    try {
      execSync(cmd, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } catch (err) {
      // Command not installed or failed — try the next candidate.
    }
  }
  return false;
}

function runHook(hookName, boardPath) {
  if (!boardPath) return;
  const configPath = path.join(path.dirname(boardPath), '.fb-lane.json');
  if (!fs.existsSync(configPath)) return;
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse .fb-lane.json: ${err.message}`);
  }
  if (config.hooks && config.hooks[hookName]) {
    const command = config.hooks[hookName];
    console.log(`🏃 Running hook: ${hookName} ("${command}")...`);
    try {
      execSync(command, { stdio: 'inherit', cwd: path.dirname(boardPath) });
      console.log(`✅ Hook ${hookName} completed successfully.`);
    } catch (err) {
      throw new Error(`Hook ${hookName} failed: ${err.message}`);
    }
  }
}

function parseBootstrapOptions(args = []) {
  let platform = 'codex';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--platform') {
      platform = args[i + 1] || platform;
      i++;
    } else if (arg.startsWith('--platform=')) {
      platform = arg.slice('--platform='.length);
    } else if (arg === '--codex-only') {
      platform = 'codex';
    }
  }

  platform = platform.toLowerCase();
  if (platform !== 'codex') {
    throw new Error(`Invalid platform "${platform}". Use codex. Other integrations are paused; collaborators welcome—see docs/paused-integrations.md.`);
  }

  return {
    platform: 'codex',
    includeCodex: true
  };
}

function hasField(markdown, field) {
  return new RegExp(`(?:\\*\\*${field}\\*\\*|${field}):`, 'i').test(markdown);
}

function hasApprovedGoalAlignmentSession(markdown) {
  if (!/(?:\*\*Goal Alignment Session\*\*|##\s+Goal Alignment Session\b)/i.test(markdown)) {
    return false;
  }
  for (const field of ['Objective', 'Key Results', 'Definition of Done', 'Gate / Review Point', 'Approval', 'Justification']) {
    if (!hasField(markdown, field)) {
      return false;
    }
  }
  return /(?:\*\*Approval\*\*|Approval):\s*approved\b/i.test(markdown);
}

function handoffImpliesOkrChange(markdown) {
  return /\b(?:new|change|changed|changing)\s+(?:product\s+|workstream\s+|lane\s+)?(?:OKR|goal)s?\b|Goal changed from|OKR changed from/i.test(markdown);
}

function boardRecordsApprovedOkrChange(markdown) {
  if (/\b(?:OKR|goal)\s+change\s+approved\b/i.test(markdown)) {
    return true;
  }
  const recordsChange = /(?:\*\*(?:OKR|Goal) (?:Update|Change)(?: Approval)?\*\*|(?:OKR|Goal) (?:Update|Change)(?: Approval)?):|(?:Goal|OKR) changed from .* to .* because/i.test(markdown);
  return recordsChange && /(?:\*\*Approval\*\*|Approval):\s*approved\b/i.test(markdown);
}

function handoffIndexTemplate() {
  return `---
type: fb-lane-handoff-index
status: active
purpose: Read this before opening detailed handoffs.
---

# Handoff Index

Use this file as the first read for handoff discovery. \`PROJECT_BOARD.md\` remains the source of truth for task status, ownership, sequencing, gates, and file locks. This index is routing only; detailed handoffs hold plans, rationale, logs, full QA, copy variants, and implementation detail.

## Active / Decision-Relevant

| Task / Topic | Lane | Status | Depends / Blocks / Gate | Checks / Evidence | Detail |
|---|---|---|---|---|---|
| TASK-001 - Project setup | FB-Product | Ready | Product bootstrap gate | Doctor after bootstrap | See \`PROJECT_BOARD.md\` |

## Historical Evidence

Open historical handoffs only when investigating the named area or reconciling old Product decisions.

## Index Limits

Keep this index compact. Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail here. Put those in the detailed handoff and link it from the Detail column.

## Lightweight Handoff Metadata

For new handoffs, add a short frontmatter block when useful:

\`\`\`md
---
type: fb-lane-handoff
task: TASK-...
lane: fb-product | fb-tech | fb-design | fb-business | fb-discovery | fb-bugs
status: ready | actioned | implemented | blocked | deferred | done
okr_fit: aligned | suggest approach change | blocked by OKR ambiguity
---
\`\`\`

Do not retrofit old handoffs unless Product/BFM is already touching them.
`;
}

const WORKSTREAM_STATUS_CARDS = [
  ['fb-product.md', 'FB-Product'],
  ['fb-tech.md', 'FB-Tech'],
  ['fb-design.md', 'FB-Design'],
  ['fb-business.md', 'FB-Business'],
  ['fb-discovery.md', 'FB-Discovery'],
  ['fb-bugs.md', 'FB-Bugs']
];

const BFM_WORKSTREAMS = ['product', 'business', 'design', 'tech', 'discovery', 'bugs'];

function handoffFrontmatter(markdown) {
  const match = String(markdown).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(.*?)\s*$/i);
    if (field) metadata[field[1].toLowerCase()] = field[2];
  }
  return metadata;
}

function readyLikeHandoffStatus(markdown) {
  const metadata = handoffFrontmatter(markdown);
  if (metadata?.status && /^ready(?:\b|\s|—|-|:)/i.test(metadata.status.trim())) {
    return metadata.status.trim();
  }
  const matches = [
    ...String(markdown).matchAll(
      /^\s*(?:[-*+]\s+)?(?:\*\*)?Status(?::(?:\*\*)?|\*\*:)\s*(.+?)\s*$/gim
    ),
  ];
  const status = matches.at(-1)?.[1]?.replace(/\*\*$/u, '').trim() || '';
  return /^ready(?:\b|\s|—|-|:)/i.test(status) ? status : '';
}

function handoffAuditRoots(rootDir) {
  let linked = [rootDir];
  let gitDirectory = path.join(rootDir, '.git');
  try {
    linked = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split(/\r?\n/)
      .filter(line => line.startsWith('worktree '))
      .map(line => line.slice('worktree '.length));
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    gitDirectory = path.resolve(rootDir, common);
  } catch {
    // Temporary fixtures and pre-bootstrap projects may not be Git repositories.
  }
  const config = path.join(gitDirectory, 'fb-handoff-audit-roots');
  const configured = fs.existsSync(config)
    ? fs
        .readFileSync(config, 'utf8')
        .split(/\r?\n/)
        .map(line => line.replace(/#.*$/u, '').trim())
        .filter(Boolean)
    : [];
  const environment = String(process.env.FB_HANDOFF_AUDIT_ROOTS || '')
    .split(path.delimiter)
    .map(value => value.trim())
    .filter(Boolean);
  return [...new Set([...linked, ...configured, ...environment].map(value =>
    path.resolve(rootDir, value)
  ))];
}

function assertNoOrphanReadyHandoffs(rootDir, selected) {
  if (selected.length > 0) return;
  const primary = path.resolve(rootDir);
  const canonical = new Set();
  const ready = [];
  const errors = [];
  for (const root of handoffAuditRoots(rootDir)) {
    const directory = path.join(root, 'docs', 'handoffs');
    if (!fs.existsSync(directory)) continue;
    for (const file of fs
      .readdirSync(directory)
      .filter(name => name.endsWith('.md') && name !== 'index.md')
      .sort()
      .reverse()) {
      const relative = `docs/handoffs/${file}`;
      if (root === primary) canonical.add(relative);
      try {
        const status = readyLikeHandoffStatus(
          fs.readFileSync(path.join(directory, file), 'utf8')
        );
        if (status) ready.push({ root, relative, status });
      } catch (error) {
        errors.push(`${root}/${relative} (${error.code || 'READ_ERROR'})`);
      }
    }
  }
  const relevant = ready.filter(record =>
    record.root === primary || !canonical.has(record.relative)
  );
  if (relevant.length > 0) {
    const detail = relevant
      .map(record => `${record.root}/${record.relative} :: ${record.status}`)
      .join('; ');
    throw new Error(
      `READINESS_FALSE_NEGATIVE: scanner selected none, but Ready-like orphan or off-home handoffs exist: ${detail}`
    );
  }
  if (errors.length > 0) {
    throw new Error(
      `READINESS_AUDIT_INCOMPLETE: handoff sources were unreadable: ${errors.join('; ')}`
    );
  }
}

function scanWorkstreamHandoffs(rootDir) {
  const handoffsDir = path.join(rootDir, 'docs', 'handoffs');
  const workstreams = Object.fromEntries(BFM_WORKSTREAMS.map(workstream => [workstream, { ready: [], blocked: [] }]));
  const selectedByTask = new Map();
  const files = fs.existsSync(handoffsDir)
    ? fs.readdirSync(handoffsDir).filter(file => file.endsWith('.md') && file !== 'index.md').sort()
    : [];
  for (const file of files) {
    const relative = `docs/handoffs/${file}`;
    const metadata = handoffFrontmatter(fs.readFileSync(path.join(handoffsDir, file), 'utf8'));
    if (!metadata || metadata.type !== 'fb-lane-handoff') continue;
    const workstream = String(metadata.lane || '').replace(/^fb-/, '').toLowerCase();
    if (!BFM_WORKSTREAMS.includes(workstream)) continue;
    const status = String(metadata.status || '').toLowerCase();
    if (status === 'blocked') workstreams[workstream].blocked.push(relative);
    if (status !== 'ready') continue;
    const task = String(metadata.task || '').trim();
    if (!task) throw new Error(`Ready handoff ${relative} requires task metadata.`);
    if (selectedByTask.has(task)) {
      throw new Error(`Duplicate or contradictory ready handoffs for ${task}: ${selectedByTask.get(task)} and ${relative}.`);
    }
    selectedByTask.set(task, relative);
    workstreams[workstream].ready.push(relative);
  }
  for (const workstream of BFM_WORKSTREAMS) {
    const result = workstreams[workstream];
    if (result.ready.length === 0 && result.blocked.length === 0) result.summary = 'None relevant';
  }
  const selected = BFM_WORKSTREAMS.flatMap(workstream => workstreams[workstream].ready);
  assertNoOrphanReadyHandoffs(rootDir, selected);
  return { workstreams, selected };
}

function workstreamStatusCardTemplate(laneName) {
  return `# ${laneName} Workstream Status

Last Updated: Not yet updated
Lane: ${laneName}

## Current Summary
No lane-specific execution summary has been recorded yet.

## Already Executed By Product/BFM
- None recorded.

## Still Pending / Blocked
- None recorded.

## Evidence Links
- PROJECT_BOARD.md
- docs/handoffs/index.md

This card is a revisit summary only. PROJECT_BOARD.md remains the source of truth for status, owner, locks, approved goals, and sequencing. docs/handoffs/index.md remains the routing layer. Do not add full OKRs, QA logs, plans, rationale, or implementation details here.
`;
}

function agentBehaviorScorecardTemplate() {
  const bundled = path.join(__dirname, '..', 'docs', 'evals', 'agent-behavior-scorecard-template.md');
  if (fs.existsSync(bundled)) return fs.readFileSync(bundled, 'utf8');
  return `# FB Agent Behavior Scorecard

> Approved primary tagline/current model line.

Use this only when \`Loop Learning\` shows a repeated agent-behavior failure or Product/BFM wants a non-quick closeout check. Do not use it for routine quick tasks.

Do not add an eval runner, dashboard, numeric score, CI eval job, larger \`doctor\`, or per-task OKRs from this scorecard. If the same failure repeats after the scorecard, Product/BFM proposes one heavier guardrail with pros, cons, affected files/rules, and explicit approval needed.

Result: \`healthy\` | \`watch\` | \`needs Product review\` | \`blocked\`

Task / run:
Observed repeated pattern:
Product approval for heavier tooling: \`not requested\` | \`pending\` | \`approved\`

## Non-Product Execution Gate

- [ ] Source/runtime files stayed untouched unless Product/BFM explicitly approved a one-off exception.
- [ ] The lane created or updated a Product/BFM handoff MD instead.
- [ ] \`PROJECT_BOARD.md\` points to the handoff with the next owner/gate.
- [ ] Any exception is named plainly with the approving Product decision.

## BFM Closeout Accounting

- [ ] Every handoff is marked \`implemented\`, \`already done\`, \`blocked\`, \`out of scope\`, or \`explicitly deferred\`.
- [ ] \`PROJECT_BOARD.md\`, \`docs/handoffs/index.md\`, workstream cards, and repo state agree.
- [ ] Staging/live status is explicit.
- [ ] Remaining gates are named instead of hidden.

## Evidence Honesty

- [ ] Checks run are named with current results, or the missing check is recorded as a gate.
- [ ] Visual changes have screenshot/viewport evidence, or visual QA is explicitly pending.
- [ ] Repo state is classified as \`clean\`, \`intentionally dirty\`, or \`blocked\`.
- [ ] Dirty state names files, owner, reason, next gate, and session-boundary action.

## Verification Handoff

- [ ] The handoff has a \`## Verification Handoff\` section containing the candidate branch or commit, a Test plan: link, exact commands, environments, and current results.
- [ ] It links to each runnable staging, APK, mockup, screenshot, or other manual-check surface and gives concise pass criteria.
- [ ] A blocked check names the exact failure, affected environment, and recovery attempted; it never merely asks for a "healthy environment."
- [ ] Product/BFM records the Next Product/BFM recovery action and performs safe recovery before involving the user. Only an approval or external manual, device, or account gate reaches the user.
- [ ] A missing or stalled check is a pending or blocked gate, never passing evidence.

## Goal And Scope Fit

- [ ] Work maps to the approved goal or a plain-language Product decision.
- [ ] Scope changes stop for Product/user approval before implementation.
- [ ] Mini-loops produce evidence against the existing goal; they do not invent new OKRs.
- [ ] Quick tasks stay lightweight unless the same failure is repeating.
`;
}

function evalRecordTemplate() {
  return fs.readFileSync(path.join(__dirname, '..', 'docs', 'evals', 'eval-record-template.md'), 'utf8');
}

function sidechatParentThreadRoutingTemplate() {
  return `# Sidechat Parent-Thread Routing

## Routing Rule

A sidechat has exactly one eligible destination: the originating main thread
from which it was opened (its parent). It must not choose a destination by
matching a thread's role, project, name, recency, or Product/BFM status.

## Missing Parent Context

If the parent thread cannot be identified or reached, the sidechat returns the
existing paste-ready handoff to the user and clearly states that the parent
could not be identified. It must not send, redirect, or imply a handoff to any
other main thread. The user must place that handoff in the intended
conversation.

## Receiving Main Threads

A main thread accepts a sidechat handoff only when it is identified as that
sidechat's parent. Any other main thread treats the material as ordinary
user-provided context, not an owned continuation or instruction.

## Durable Decision Record

This rule governs routing only. The existing Product/BFM rule remains: an
accepted decision becomes source of truth only after Product/BFM records it in
\`PROJECT_BOARD.md\`, a handoff, or other durable documentation.
`;
}

function collectHandoffIndexWarning(handoffsDir) {
  if (!fs.existsSync(handoffsDir)) {
    return null;
  }
  const entries = fs.readdirSync(handoffsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md');
  const nonQuickEntries = entries.filter(entry => !/^TASK-Q-/i.test(entry.name));
  const indexPath = path.join(handoffsDir, 'index.md');
  if (nonQuickEntries.length > 0 && !fs.existsSync(indexPath)) {
    return {
      type: 'missing',
      handoffCount: nonQuickEntries.length
    };
  }
  if (fs.existsSync(indexPath) && nonQuickEntries.length > 0) {
    const markdown = fs.readFileSync(indexPath, 'utf8');
    const hasDependencyGateColumn = /\|\s*Depends\s*\/\s*Blocks\s*\/\s*Gate\s*\|/i.test(markdown);
    const hasEvidenceColumn = /\|\s*Checks\s*\/\s*Evidence\s*\|/i.test(markdown);
    if (!hasDependencyGateColumn || !hasEvidenceColumn) {
      return {
        type: 'old-style',
        handoffCount: nonQuickEntries.length
      };
    }
  }
  return null;
}

function collectGoalAlignmentSessionWarnings(handoffsDir, tasks = []) {
  if (!fs.existsSync(handoffsDir)) {
    return {
      missingSession: [],
      missingOkrFit: [],
      missingMiniLoopEvidence: [],
      missingProductOkrEvidence: [],
      missingBoardOkrs: [],
      unapprovedBoardOkrs: [],
      unapprovedOkrChange: []
    };
  }

  const entries = fs.readdirSync(handoffsDir, { withFileTypes: true });
  const warnings = {
    missingSession: [],
    missingOkrFit: [],
    missingMiniLoopEvidence: [],
    missingProductOkrEvidence: [],
    missingBoardOkrs: [],
    unapprovedBoardOkrs: [],
    unapprovedOkrChange: []
  };

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/^TASK-(?!Q-)[A-Za-z0-9-]+\.md$/.test(entry.name)) continue;

    const taskId = entry.name.replace(/\.md$/, '');
    const handoffPath = path.join(handoffsDir, entry.name);
    const markdown = fs.readFileSync(handoffPath, 'utf8');
    if (!/^##\s+Goal Alignment Session\b/m.test(markdown)) {
      warnings.missingSession.push(entry.name);
    }
    if (!/^Lane OKR Fit:\s*(aligned|suggest approach change|blocked by OKR ambiguity)\b/im.test(markdown)) {
      warnings.missingOkrFit.push(entry.name);
    }
    if (!/^Mini-loop Evidence:\s*\S/im.test(markdown)) {
      warnings.missingMiniLoopEvidence.push(entry.name);
    }
    if (!/^Evidence Against Product OKR:\s*\S/im.test(markdown)) {
      warnings.missingProductOkrEvidence.push(entry.name);
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.details || !/(?:\*\*Goal Alignment Session\*\*|##\s+Goal Alignment Session\b)/i.test(task.details.raw)) {
      warnings.missingBoardOkrs.push(taskId);
    } else if (!hasApprovedGoalAlignmentSession(task.details.raw)) {
      warnings.unapprovedBoardOkrs.push(taskId);
    }
    if (handoffImpliesOkrChange(markdown) && (!task || !task.details || !boardRecordsApprovedOkrChange(task.details.raw))) {
      warnings.unapprovedOkrChange.push(entry.name);
    }
  }

  return warnings;
}

const REVIEW_STATES = ['not reviewable', 'runnable sandbox', 'staging candidate', 'completed build'];
const REVIEW_PACKET_FIELDS = [
  'Outcome type',
  'Direct links',
  'Exact steps and expectations',
  'Pass criteria',
  'Known limits',
  'Failure-report format',
  'Next Product/BFM action'
];

function markdownSection(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^##\\s+${escapedHeading}\\s*$`, 'im').exec(markdown);
  if (!match) return '';
  const remaining = markdown.slice(match.index + match[0].length);
  const nextHeading = remaining.search(/^##\s+/m);
  return nextHeading === -1 ? remaining : remaining.slice(0, nextHeading);
}

function reviewFieldValue(section, field) {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escapedField}(?:\\*\\*)?\\s*:\\s*([^\\n]*)`,
    'i'
  ).exec(section);
  return match ? match[1].trim().replace(/^\*\*\s*/, '') : '';
}

function isActionableReviewValue(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || /^<[^<>\n]+>$/.test(normalized)) return false;

  const unwrapped = normalized
    .replace(/^[`*_~\[\](){}`'".,;:!?\s]+/, '')
    .replace(/[`*_~\[\](){}`'".,;:!?\s]+$/, '')
    .trim();
  return !/^(?:todo|tbd|placeholder|example)(?:\s+(?:only|text|token|value))?$/i.test(unwrapped);
}

function reviewFieldContent(section, field) {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escapedField}(?:\\*\\*)?\\s*:\\s*(?:\\*\\*)?`,
    'i'
  ).exec(section);
  if (!match) return '';

  const remaining = section.slice(match.index + match[0].length);
  const boundaryFields = REVIEW_PACKET_FIELDS
    .filter(candidate => candidate !== field)
    .map(candidate => candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const boundary = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${boundaryFields})(?:\\*\\*)?\\s*:\\s*(?:\\*\\*)?`,
    'i'
  ).exec(remaining);
  return (boundary ? remaining.slice(0, boundary.index) : remaining).trim();
}

function reviewLinks(section) {
  return [...section.matchAll(/\[[^\]\n]+\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+['"][^)]*['"])?\s*\)/g)]
    .map(match => match[1] || match[2])
    .filter(Boolean);
}

function collectReviewEvidenceWarnings(handoffsDir) {
  const warnings = {
    invalidStates: [],
    missingBriefs: [],
    incompletePackets: [],
    blockedAccess: [],
    missingLocalLinks: []
  };
  if (!fs.existsSync(handoffsDir)) return warnings;

  for (const entry of fs.readdirSync(handoffsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'index.md') continue;
    const handoffPath = path.join(handoffsDir, entry.name);
    const markdown = fs.readFileSync(handoffPath, 'utf8');
    if (!/^fb_harness:\s*v2\s*$/im.test(markdown)) continue;

    const stateMatch = markdown.match(/^Review state:\s*(.*?)\s*$/im);
    const reviewState = stateMatch ? stateMatch[1] : '';
    if (!REVIEW_STATES.includes(reviewState)) {
      warnings.invalidStates.push(entry.name);
      continue;
    }

    if (hasApprovedGoalAlignmentSession(markdown)) {
      const missingBriefs = ['Project Start Brief', 'Build Brief']
        .filter(heading => !new RegExp(`^##\\s+${heading}\\b`, 'im').test(markdown));
      if (missingBriefs.length > 0) {
        warnings.missingBriefs.push(`${entry.name} (${missingBriefs.join(', ')})`);
      }
    }

    if (reviewState === 'not reviewable') continue;

    const reviewSection = markdownSection(markdown, 'Test This Now');
    if (/Blocked — no review environment yet/.test(reviewSection)) {
      if (!isActionableReviewValue(reviewFieldValue(reviewSection, 'Next Product/BFM action'))) {
        warnings.incompletePackets.push(`${entry.name} (Next Product/BFM action)`);
      } else {
        warnings.blockedAccess.push(entry.name);
      }
      continue;
    }

    const requiredValueFields = [
      'Outcome type',
      'Direct links',
      'Pass criteria',
      'Known limits',
      'Failure-report format'
    ];
    const missing = requiredValueFields
      .filter(field => !isActionableReviewValue(reviewFieldValue(reviewSection, field)));
    const exactSteps = reviewFieldContent(reviewSection, 'Exact steps and expectations');
    if (!exactSteps) {
      missing.push('Exact steps and expectations');
    } else {
      const numberedSteps = [...exactSteps.matchAll(/(?:^|\n)\s*\d+\.\s+([^\n]*)/g)]
        .map(match => match[1].trim());
      if (numberedSteps.length === 0) {
        missing.push('numbered exact steps');
      } else if (numberedSteps.some(step => !isActionableReviewValue(step))) {
        missing.push('actionable numbered exact steps');
      }
    }
    const links = reviewLinks(reviewFieldValue(reviewSection, 'Direct links'));
    if (links.length === 0) missing.push('Markdown direct link');
    if (missing.length > 0) {
      warnings.incompletePackets.push(`${entry.name} (${missing.join(', ')})`);
      continue;
    }

    const missingLocalLinks = links.filter(link => {
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(link)) return false;
      const localPath = link.split(/[?#]/, 1)[0];
      return !localPath || !fs.existsSync(path.resolve(path.dirname(handoffPath), localPath));
    });
    if (missingLocalLinks.length > 0) {
      warnings.missingLocalLinks.push(`${entry.name} (${missingLocalLinks.join(', ')})`);
    }
  }

  return warnings;
}

function collectGitLockWarnings(rootDir) {
  const gitDir = path.join(rootDir, '.git');
  if (!fs.existsSync(gitDir)) {
    return [];
  }

  const warnings = [];
  function scan(dir, depth = 0) {
    if (depth > 4 || !fs.existsSync(dir)) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'objects') continue;
        scan(fullPath, depth + 1);
      } else if (entry.name.endsWith('.lock')) {
        warnings.push(path.relative(rootDir, fullPath));
      }
    }
  }

  scan(gitDir);
  return warnings;
}

function parseElapsedSeconds(etime) {
  const daySplit = etime.trim().split('-');
  let days = 0;
  let timePart = daySplit[0];
  if (daySplit.length === 2) {
    days = Number(daySplit[0]) || 0;
    timePart = daySplit[1];
  }

  const parts = timePart.split(':').map(p => Number(p) || 0);
  if (parts.length === 2) {
    return days * 86400 + parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return days * 86400 + parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return days * 86400;
}

function processCwd(pid) {
  try {
    const output = execFileSync('lsof', ['-a', '-p', String(Number(pid)), '-d', 'cwd', '-Fn'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const cwdLine = output.split(/\r?\n/).find(line => line.startsWith('n'));
    return cwdLine ? cwdLine.slice(1) : '';
  } catch (err) {
    return '';
  }
}

function collectLongRunningLaneProcesses(rootDir, thresholdSeconds = 60) {
  if (process.platform === 'win32') {
    return [];
  }

  let output = '';
  try {
    output = execSync('ps -axo pid=,etime=,command=', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (err) {
    return [];
  }

  const interesting = /\b(npm test|vitest|npm run build|tsc -b|playwright test|git add|git commit)\b/;
  const rootWithSep = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;
  const rows = [];

  for (const line of output.split(/\r?\n/)) {
    const match = line.trim().match(/^(\d+)\s+(\S+)\s+(.+)$/);
    if (!match) continue;
    const [, pid, elapsed, command] = match;
    if (!interesting.test(command)) continue;
    if (command.includes('fb-lane.cjs doctor') || command.includes('ps -axo')) continue;
    if (parseElapsedSeconds(elapsed) < thresholdSeconds) continue;

    const cwd = processCwd(pid);
    const inWorkspace = cwd === rootDir || cwd.startsWith(rootWithSep) || command.includes(rootDir);
    if (!inWorkspace) continue;
    rows.push(`${pid} ${elapsed} ${command}`);
  }

  return rows;
}

// Parse PROJECT_BOARD.md tasks and details
function parseBoard(boardPath) {
  const content = fs.readFileSync(boardPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const tasks = [];
  let currentTask = null;
  let inDetailBlock = false;
  let detailLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Parse table row
    const tableMatch = line.match(/^\|\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-\d+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|/);
    if (tableMatch) {
      const id = tableMatch[1].trim();
      if (id !== 'ID' && !id.startsWith('---')) {
        tasks.push({
          id,
          status: tableMatch[2].trim(),
          owner: tableMatch[3].trim(),
          area: tableMatch[4].trim(),
          scope: tableMatch[5].trim(),
          locks: tableMatch[6].trim(),
          links: tableMatch[7].trim(),
          details: null
        });
      }
    }
  }

  // Parse detail blocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^###\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-\d+)\s*-\s*(.*)/);
    if (headerMatch) {
      if (currentTask) {
        currentTask.details = parseDetailLines(detailLines);
      }
      const id = headerMatch[1].trim();
      currentTask = tasks.find(t => t.id === id);
      detailLines = [];
      inDetailBlock = true;
    } else if (inDetailBlock) {
      if (line.startsWith('---') || line.startsWith('### ')) {
        if (currentTask) {
          currentTask.details = parseDetailLines(detailLines);
          currentTask = null;
        }
        inDetailBlock = false;
      } else {
        detailLines.push(line);
      }
    }
  }
  if (currentTask) {
    currentTask.details = parseDetailLines(detailLines);
  }

  return { content, tasks };
}

function parseDetailLines(lines) {
  const detailStr = lines.join('\n');
  const statusMatch = detailStr.match(/\*\s+\*\*Status\*\*:\s*(.*)/i);
  const ownerMatch = detailStr.match(/\*\s+\*\*Owner\s*\/\s*Thread\*\*:\s*(.*)/i);
  const areaMatch = detailStr.match(/\*\s+\*\*Area\*\*:\s*(.*)/i);
  const scopeMatch = detailStr.match(/\*\s+\*\*Scope\*\*:\s*(.*)/i);
  const lockedFilesMatch = detailStr.match(/\*\s+\*\*Locked\s+Files\*\*:\s*(.*)/i);
  const screensMatch = detailStr.match(/\*\s+\*\*Screens\*\*:\s*(.*)/i);
  const objectiveMatch = detailStr.match(/\*\s+\*\*Objective\*\*:\s*(.*)/i);
  const approvalMatch = detailStr.match(/\*\s+\*\*Approval\*\*:\s*(.*)/i);
  const completedWorkMatch = detailStr.match(/\*\s+\*\*(?:Completed Work|Completed|Updates?)\*\*:\s*(.*)/i);
  const latestUpdateHeading = detailStr.match(/^\*\s+\*\*Latest Update\*\*:\s*$/im);
  const latestUpdateTail = latestUpdateHeading
    ? detailStr.slice(latestUpdateHeading.index + latestUpdateHeading[0].length)
    : '';
  const latestUpdateEnd = latestUpdateTail.search(/^\*\s+\*\*/m);
  const latestUpdateBody = latestUpdateEnd === -1 ? latestUpdateTail : latestUpdateTail.slice(0, latestUpdateEnd);
  const latestUpdateMatch = latestUpdateBody
    ? latestUpdateBody.match(/^\s*\*\s+(?:\*[^*\n]+\*:\s*)?(.+?)\s*$/m)
    : null;
  const blockersMatch = detailStr.match(/\*\s+\*\*(?:Blockers?|Pause Reason)\*\*:\s*(.*)/i);
  const nextActionMatch = detailStr.match(/\*\s+\*\*(?:Next Owner\s*\/\s*Action|Next Action\s*\/\s*Owner|Next Action)\*\*:\s*(.*)/i);
  const reviewLinkMatches = [...detailStr.matchAll(/^\s*\*\s+\*\*(?:Test\s*\/\s*Review Link|Test Link|Review Link|Staging URL)\*\*:\s*(.*)$/gim)];

  return {
    raw: detailStr,
    status: statusMatch ? statusMatch[1].trim() : '',
    owner: ownerMatch ? ownerMatch[1].trim() : '',
    area: areaMatch ? areaMatch[1].trim() : '',
    scope: scopeMatch ? scopeMatch[1].trim() : '',
    lockedFiles: lockedFilesMatch ? lockedFilesMatch[1].trim() : '',
    screens: screensMatch ? screensMatch[1].trim() : '',
    objective: objectiveMatch ? objectiveMatch[1].trim() : '',
    approval: approvalMatch ? approvalMatch[1].trim() : '',
    completedWork: concreteStatusValue(completedWorkMatch ? completedWorkMatch[1] : '')
      || concreteStatusValue(latestUpdateMatch ? latestUpdateMatch[1] : ''),
    blockers: blockersMatch ? blockersMatch[1].trim() : '',
    nextAction: nextActionMatch ? nextActionMatch[1].trim() : '',
    reviewLink: reviewLinkMatches
      .map(match => explicitReviewLink(match[1]))
      .find(Boolean) || ''
  };
}

function concreteStatusValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized || /^(?:\(none\)|none|nothing completed yet\.?|todo|tbd)$/i.test(normalized) || /^<[^>]+>$/.test(normalized)) return '';
  return normalized;
}

function explicitReviewLink(value) {
  const normalized = concreteStatusValue(value);
  if (!normalized) return '';
  const markdownTargets = [...normalized.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(match => match[1].trim());
  const plainTargets = normalized.match(/https?:\/\/[^\s)>]+/gi) || [];
  const targets = [...new Set([...markdownTargets, ...plainTargets])];
  if (!targets.length) return '';
  const labelText = targets.reduce((text, target) => text.split(target).join(''), normalized);
  if (/(?:^|[^a-z0-9])(?:TODO|TBD)(?:$|[^a-z0-9])/i.test(labelText)) return '';
  if (targets.some(placeholderReviewTarget)) return '';
  return normalized;
}

function placeholderReviewTarget(target) {
  if (/<[^>\n]+>/.test(target)) return true;

  let parsed;
  try {
    parsed = new URL(target, 'https://fb-lane.invalid');
  } catch (err) {
    return true;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (['example.com', 'example.org', 'example.net'].some(host => hostname === host || hostname.endsWith(`.${host}`))) {
    return true;
  }

  let route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  try {
    route = decodeURIComponent(route);
  } catch (err) {
    // Keep the original route when percent encoding is malformed.
  }
  return /(?:^|[/?#&=])(?:TODO|TBD)(?=$|[/?#&=])/i.test(route);
}

function markdownLinks(value) {
  return [...String(value || '').matchAll(/\[[^\]\n]+\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+['"][^)]*['"])?\s*\)/g)]
    .map(match => ({ markdown: match[0], target: match[1] || match[2] }))
    .filter(link => link.target);
}

function safeExistingLocalPath(rootDir, baseDir, target) {
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return '';
  let localTarget = target.split(/[?#]/, 1)[0];
  try {
    localTarget = decodeURIComponent(localTarget);
  } catch (err) {
    return '';
  }
  if (!localTarget || path.isAbsolute(localTarget) || localTarget.includes('\0')) return '';

  const resolved = path.resolve(baseDir, localTarget);
  const rootWithSep = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;
  if (resolved !== rootDir && !resolved.startsWith(rootWithSep)) return '';
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return '';
  try {
    const realRoot = fs.realpathSync(rootDir);
    const realResolved = fs.realpathSync(resolved);
    const realRootWithSep = realRoot.endsWith(path.sep) ? realRoot : `${realRoot}${path.sep}`;
    return realResolved === realRoot || realResolved.startsWith(realRootWithSep) ? resolved : '';
  } catch (err) {
    return '';
  }
}

function linkedHandoffReviewLink(rootDir, task) {
  const expectedHandoff = path.join(rootDir, 'docs', 'handoffs', `${task.id}.md`);
  const handoff = markdownLinks(task.links)
    .map(link => safeExistingLocalPath(rootDir, rootDir, link.target))
    .find(candidate => candidate === expectedHandoff);
  if (!handoff) return '';

  const reviewSection = markdownSection(fs.readFileSync(handoff, 'utf8'), 'Test This Now');
  const directLinks = reviewFieldValue(reviewSection, 'Direct links');
  for (const link of markdownLinks(directLinks)) {
    const actionable = explicitReviewLink(link.markdown);
    if (!actionable) continue;
    if (/^https?:\/\//i.test(link.target)) return actionable;
    if (safeExistingLocalPath(rootDir, path.dirname(handoff), link.target)) return actionable;
  }
  return '';
}

function normalizedStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const recognized = [
    'staging qa', 'in progress', 'verification', 'approved', 'waiting', 'ready',
    'staged', 'local', 'blocked', 'closed', 'completed', 'complete', 'done'
  ];
  return recognized.find(status => normalized === status || new RegExp(`^${status}\\s*(?:—|–|-|:)\\s+`).test(normalized))
    || normalized;
}

function isCompleteStatus(value) {
  return ['done', 'complete', 'completed', 'closed'].includes(normalizedStatus(value));
}

function visibleStageFor(context = {}) {
  const status = normalizedStatus(context.status);
  const phase = normalizedStatus(context.phase);
  const mode = normalizedStatus(context.mode);
  const state = normalizedStatus(context.state);
  const environment = normalizedStatus(context.environment);
  const blockers = String(context.blockers || '').trim();

  const reviewLink = explicitReviewLink(context.reviewLink);

  if (state === 'blocked' || status === 'blocked' || phase === 'blocked' || (context.genuineInability && blockers)) return 'Blocked';
  if (state === 'closed' || isCompleteStatus(status) || phase === 'closed') return 'Complete';
  if (state === 'reviewing' || mode === 'review') return reviewLink ? 'Ready for review' : 'Checking';
  if (mode === 'planning') return 'Understanding';
  if (mode === 'execution') return 'Building';
  if (['staging qa', 'staged'].includes(status)) return reviewLink ? 'Ready for review' : 'Checking';
  if (phase === 'verification' || ['verification', 'local'].includes(status) || ['local', 'sandbox', 'staging', 'staged', 'completed build', 'completed-build'].includes(environment)) return 'Checking';
  if (phase === 'execution' || status === 'in progress') return 'Building';
  if (['ready', 'approved', 'waiting'].includes(status) || ['approved', 'waiting'].includes(phase)) return 'Ready for your approval';
  return 'Understanding';
}

function parseCurrentTask(markdown = '') {
  const taskMatch = String(markdown).match(/\*\*Current Task\*\*:\s*([^\n]+)/i);
  const statusMatch = String(markdown).match(/\*\*Status\*\*:\s*([^\n]+)/i);
  if (!taskMatch) return null;
  const value = taskMatch[1].replace(/`/g, '').trim();
  const idMatch = value.match(/^([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-\d+)\b/);
  if (!idMatch) return null;
  return {
    id: idMatch[1],
    objective: value.slice(idMatch[0].length).trim(),
    status: statusMatch ? statusMatch[1].trim() : ''
  };
}

function selectStatusTarget({ tasks = [], sessions = [], currentTask = null } = {}) {
  const activeSession = sessions
    .filter(session => session && session.state !== 'closed')
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))[0];
  if (activeSession) {
    return {
      source: 'session',
      session: activeSession,
      currentTask: null,
      task: tasks.find(task => task.id === activeSession.taskId) || { id: activeSession.taskId, status: '', scope: activeSession.taskId, links: '', details: null }
    };
  }

  if (currentTask) {
    const task = tasks.find(candidate => candidate.id === currentTask.id);
    if (task) return { source: 'current-task', session: null, currentTask, task };
  }

  const task = tasks.find(candidate => !isCompleteStatus(candidate.status)) || tasks[0] || null;
  return task ? { source: 'board', session: null, currentTask: null, task } : null;
}

function sessionBelongsToWorkspace(rootDir, session) {
  if (!session || !session.worktree) return false;
  try {
    return fs.realpathSync(rootDir) === fs.realpathSync(session.worktree);
  } catch (err) {
    return false;
  }
}

function statusInputs(rootDir, tasks) {
  let sessions = [];
  let sessionWarning = '';
  try {
    sessions = listSessions(rootDir).filter(session =>
      !['closed', 'stale'].includes(computedState(session))
      && sessionBelongsToWorkspace(rootDir, session)
    );
  } catch (err) {
    sessions = [];
    sessionWarning = `Session registry could not be read: ${err.message}`;
  }

  const currentTaskPath = path.join(rootDir, '.codex', 'current_task.md');
  const currentTask = fs.existsSync(currentTaskPath)
    ? parseCurrentTask(fs.readFileSync(currentTaskPath, 'utf8'))
    : null;
  const selected = selectStatusTarget({ tasks, sessions, currentTask });
  const tasksWithReviewEvidence = tasks.map(task => {
    if (!selected || task.id !== selected.task.id) return task;
    if (task.details && task.details.reviewLink) return task;
    const reviewLink = linkedHandoffReviewLink(rootDir, task);
    return reviewLink
      ? { ...task, details: { ...(task.details || {}), reviewLink } }
      : task;
  });
  return { tasks: tasksWithReviewEvidence, sessions, currentTask, sessionWarning };
}

function workingModeFor(target, stage) {
  if (target.session && target.session.mode) {
    return target.session.mode.charAt(0).toUpperCase() + target.session.mode.slice(1);
  }
  return {
    Understanding: 'Planning',
    'Ready for your approval': 'Waiting for approval',
    Building: 'Execution',
    Checking: 'Verification',
    'Ready for review': 'Review',
    Complete: 'Complete',
    Blocked: 'Paused'
  }[stage] || 'Planning';
}

function renderBeginnerStatus(inputs = {}) {
  const target = selectStatusTarget(inputs);
  if (!target) {
    return [
      'FB status',
      renderQueueSummary(inputs.tasks || [], ''),
      'Current objective: No active objective found.',
      'Working mode: Planning',
      'Stage: Understanding',
      'Completed work: Nothing recorded yet.',
      'Pause reason: None — no work is active.',
      'Your input: Describe the next objective.',
      'Next action / owner: Product / choose the next objective.',
      'Test / review link: Not available yet.'
    ].join('\n');
  }

  const { task, session, currentTask } = target;
  const details = task.details || {};
  const objective = (currentTask && currentTask.objective) || details.objective || task.scope || task.id;
  const reviewLink = explicitReviewLink(details.reviewLink);
  const selectedStatus = session
    ? ''
    : (currentTask && normalizedStatus(task.status) === 'in progress'
      ? (currentTask.status || task.status)
      : task.status);
  const stage = visibleStageFor({
    status: selectedStatus,
    mode: session && session.mode,
    state: session && session.state,
    blockers: details.blockers,
    reviewLink
  });
  const blocked = stage === 'Blocked';
  const userInput = {
    Understanding: 'Confirm the goal or answer any open questions.',
    'Ready for your approval': 'Approve or revise the proposed plan.',
    Building: 'None right now.',
    Checking: 'None right now.',
    'Ready for review': 'Review the candidate using the link below.',
    Complete: 'None.',
    Blocked: 'Help resolve the pause reason above.'
  }[stage];
  const defaultNextAction = {
    Understanding: 'Product / finish understanding the objective.',
    'Ready for your approval': 'You / approve or revise the plan.',
    Building: `${task.owner || 'Build For Me'} / continue the approved build.`,
    Checking: `${task.owner || 'Build For Me'} / finish the focused checks.`,
    'Ready for review': 'You / review the candidate.',
    Complete: 'Product / choose the next objective.',
    Blocked: `${task.owner || 'Product'} / resolve the recorded pause reason.`
  }[stage];

  const lines = [
    'FB status',
    renderQueueSummary(inputs.tasks || [], task.id),
    `Current objective: ${objective}`,
    `Working mode: ${workingModeFor(target, stage)}`,
    `Stage: ${stage}`,
    `Completed work: ${details.completedWork || 'Nothing completed yet.'}`,
    `Pause reason: ${blocked ? (details.blockers || 'Work cannot continue with the current information or access.') : 'None — work is moving.'}`,
    `Your input: ${userInput}`,
    `Next action / owner: ${details.nextAction || defaultNextAction}`,
    `Test / review link: ${reviewLink || 'Not available yet.'}`
  ];
  if (inputs.sessionWarning) lines.push(`Status warning: ${inputs.sessionWarning}`);
  return lines.join('\n');
}

function renderTechnicalStatus(tasks, options = {}) {
  if (options.format === 'mcp') {
    const workspace = options.workspaceRoot ? `Workspace: ${options.workspaceRoot}\n` : '';
    return `${workspace}Active Workstreams:\n` + tasks.map(task =>
      `[${task.id}] Status: ${task.status} | Owner: ${task.owner} | Locks: ${task.locks || 'None'} | Scope: ${task.scope}`
    ).join('\n');
  }

  const lines = ['📋 Active Workstreams:', '='.repeat(80)];
  for (const task of tasks) {
    lines.push(`[${task.id}] - ${task.status.padEnd(12)} | ${task.owner.padEnd(12)} | Area: ${task.area.padEnd(8)} | Scope: ${task.scope}`);
    if (task.locks && task.locks !== '(None)') lines.push(`       🔒 Locks: ${task.locks}`);
  }
  lines.push('='.repeat(80));
  return lines.join('\n');
}

// Safely update a task in PROJECT_BOARD.md
function updateBoardTask(boardPath, taskId, updates) {
  const { content, tasks } = parseBoard(boardPath);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found on the project board.`);
  }

  const lines = content.split(/\r?\n/);
  let updatedLines = [...lines];

  // 1. Update the table row
  for (let i = 0; i < updatedLines.length; i++) {
    const line = updatedLines[i];
    const tableMatch = line.match(/^\|\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-\d+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|/);
    if (tableMatch && tableMatch[1].trim() === taskId) {
      const newStatus = updates.status !== undefined ? updates.status : task.status;
      const newOwner = updates.owner !== undefined ? updates.owner : task.owner;
      const newLocks = updates.locks !== undefined ? updates.locks : task.locks;
      const newLinks = updates.links !== undefined ? updates.links : task.links;

      updatedLines[i] = `| ${taskId} | ${newStatus} | ${newOwner} | ${task.area} | ${task.scope} | ${newLocks} | ${newLinks} |`;
      break;
    }
  }

  // 2. Update the details block
  let inDetailBlock = false;
  let blockStartIndex = -1;
  let blockEndIndex = -1;

  for (let i = 0; i < updatedLines.length; i++) {
    const line = updatedLines[i];
    const headerMatch = line.match(/^###\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-\d+)\s*-\s*(.*)/);
    if (headerMatch && headerMatch[1].trim() === taskId) {
      inDetailBlock = true;
      blockStartIndex = i;
    } else if (inDetailBlock) {
      if (line.startsWith('---') || line.startsWith('### ')) {
        blockEndIndex = i;
        break;
      }
    }
  }
  if (inDetailBlock && blockEndIndex === -1) {
    blockEndIndex = updatedLines.length;
  }

  if (blockStartIndex !== -1) {
    let blockLines = updatedLines.slice(blockStartIndex, blockEndIndex);

    if (updates.status !== undefined) {
      blockLines = blockLines.map(line =>
        line.match(/\*\s+\*\*Status\*\*:/i) ? `*   **Status**: ${updates.status}` : line
      );
    }
    if (updates.owner !== undefined) {
      blockLines = blockLines.map(line =>
        line.match(/\*\s+\*\*Owner\s*\/\s*Thread\*\*:/i) ? `*   **Owner / Thread**: ${updates.owner}` : line
      );
    }
    if (updates.lockedFiles !== undefined) {
      blockLines = blockLines.map(line =>
        line.match(/\*\s+\*\*Locked\s+Files\*\*:/i) ? `    *   **Locked Files**: ${updates.lockedFiles}` : line
      );
    }
    if (updates.screens !== undefined) {
      blockLines = blockLines.map(line =>
        line.match(/\*\s+\*\*Screens\*\*:/i) ? `    *   **Screens**: ${updates.screens}` : line
      );
    }
    if (updates.stagingUrl !== undefined) {
      blockLines = blockLines.map(line =>
        line.match(/\*\s+\*\*Staging\s+URL\*\*:/i) ? `    *   **Staging URL**: ${updates.stagingUrl}` : line
      );
    }

    updatedLines.splice(blockStartIndex, blockEndIndex - blockStartIndex, ...blockLines);
  }

  fs.writeFileSync(boardPath, updatedLines.join('\n'), 'utf8');
}

// Generate the start instructions context
function generateStartupPrompt(task, lane, branchName, lockedFiles) {
  const roleName = `FB-${lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase()}`;
  return `You are an AI assistant adopting the **${roleName}** lane for this chat thread.
We are working on branch: **${branchName}**

### Task Details:
* **Task ID**: ${task.id}
* **Area**: ${task.area}
* **Scope**: ${task.scope}
* **Locked Files**: ${lockedFiles || '(None)'}

### Rules & Boundaries for ${roleName}:
${getRoleInstructions(lane)}

Let's begin! Please read the codebase files, verify git branch/status, and implement the task.`;
}

function getRoleInstructions(lane) {
  const l = lane.toLowerCase();
  if (l === 'tech') {
    return `- Only modify backend code, API endpoints, serverless functions, database schemas, and migration files. Do not touch stylesheets, UI layouts, or page style classes.
- Compile and test your changes locally. Ensure functional tests pass before pushing.`;
  } else if (l === 'design') {
    return `- Only modify styling files (CSS), layout geometry, design tokens, and static UI assets. Do not modify backend logic, API routes, or databases.
- Run visual verification across mobile/desktop viewports (check for clipping and spacing integrity).`;
  } else if (l === 'business') {
    return `- Read-only code access. You can write recommendations in markdown files but cannot modify application code files.
- Draft copy recommendations and let Design or Tech integrate them.`;
  } else {
    return `- Product direction only. Scope the work, set the goal, assign lanes, review markdown handoffs, sequence BFM execution, and run merge/release gates.
- Do not edit application/source code from Product chat. Source changes happen only inside a Product-launched BFM execution run.`;
  }
}

// CLI Command implementations
function handleStatus(options = {}) {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found in this workspace.');
    process.exit(1);
  }
  const { tasks } = parseBoard(boardPath);
  const rootDir = path.dirname(boardPath);
  const currentTaskPath = path.join(rootDir, '.codex', 'current_task.md');
  const current = fs.existsSync(currentTaskPath) ? parseCurrentTask(fs.readFileSync(currentTaskPath, 'utf8')) : null;
  const quickPath = current && current.id.startsWith('TASK-Q-') ? findQuickRecord(rootDir, current.id) : null;
  if (quickPath && !options.details) {
    const quick = parseQuickRecord(fs.readFileSync(quickPath, 'utf8'));
    console.log([
      'FB status',
      `Current objective: ${quick.scope || quick.taskId}`,
      'Working mode: Quick BFM',
      `Stage: ${quick.status === 'complete' ? 'Complete' : 'Building'}`,
      `Completed work: ${quick.status === 'complete' ? 'Quick correction closed.' : 'Quick Record created.'}`,
      'Pause reason: None.',
      'Your input: None required.',
      `Next action / owner: ${quick.owner || 'Product'} / ${quick.status === 'complete' ? 'review the result' : 'run the focused verification plan'}.`,
      `Test / review link: docs/handoffs/${quick.taskId}.md`,
    ].join('\n'));
    return;
  }
  console.log(options.details
    ? `\n${renderTechnicalStatus(tasks)}\n`
    : renderBeginnerStatus(statusInputs(rootDir, tasks)));
}

function handleDoctor() {
  const boardPath = findBoardPath();
  const rootDir = boardPath ? path.dirname(boardPath) : process.cwd();
  const previousCwd = process.cwd();
  const checks = [];
  let parsedTasks = [];

  function add(level, label, detail, fix = '') {
    checks.push({ level, label, detail, fix });
  }

  function exists(relPath) {
    return fs.existsSync(path.join(rootDir, relPath));
  }

  try {
    process.chdir(rootDir);

    if (!boardPath) {
      add('fail', 'PROJECT_BOARD.md', 'Not found from this directory or its parents.', 'Run: node tools/fb-lane.cjs bootstrap --platform codex');
    } else {
      try {
        const { tasks } = parseBoard(boardPath);
        parsedTasks = tasks;
        if (tasks.length === 0) {
          add('fail', 'PROJECT_BOARD.md', 'Found, but no task rows could be parsed.', 'Check the Active Workstreams table format.');
        } else {
          const inProgress = tasks.filter(t => t.status === 'In Progress');
          add('ok', 'PROJECT_BOARD.md', `Parsed ${tasks.length} task(s); ${inProgress.length} in progress.`);

          const activeLocks = new Map();
          const duplicateLocks = [];
          for (const task of inProgress) {
            if (!task.locks || task.locks === '(None)') continue;
            const locks = task.locks.split(',').map(f => f.trim().replace(/`/g, '')).filter(Boolean);
            for (const lock of locks) {
              if (activeLocks.has(lock)) {
                duplicateLocks.push(`${lock} (${activeLocks.get(lock)} and ${task.id})`);
              } else {
                activeLocks.set(lock, task.id);
              }
            }
          }
          if (duplicateLocks.length > 0) {
            add('fail', 'Active file locks', `Duplicate active locks: ${duplicateLocks.join(', ')}`, 'Ask FB-Product to split, serialize, or release one claim.');
          } else {
            add('ok', 'Active file locks', `${activeLocks.size} active file lock(s), no duplicate active claims.`);
          }
        }
      } catch (err) {
        add('fail', 'PROJECT_BOARD.md', `Could not parse board: ${err.message}`, 'Fix the board format or restore from git.');
      }
    }

    if (exists('AGENTS.md')) {
      add('ok', 'AGENTS.md', 'Repo instruction file exists.');
    } else {
      add('warn', 'AGENTS.md', 'Missing repo instruction file.', 'Run: node tools/fb-lane.cjs bootstrap --platform codex');
    }

    if (exists('tools/fb-lane.cjs')) {
      add('ok', 'tools/fb-lane.cjs', 'Local lane CLI exists.');
    } else {
      add('fail', 'tools/fb-lane.cjs', 'Local lane CLI is missing.', 'Install or copy the FB-Lane CLI into tools/fb-lane.cjs.');
    }

    if (exists('docs/handoffs')) {
      add('ok', 'docs/handoffs', 'Lane handoff directory exists.');
      const handoffIndexWarning = collectHandoffIndexWarning(path.join(rootDir, 'docs', 'handoffs'));
      if (handoffIndexWarning && handoffIndexWarning.type === 'missing') {
        add(
          'warn',
          'Handoff index',
          `Missing docs/handoffs/index.md with ${handoffIndexWarning.handoffCount} non-quick handoff file(s).`,
          'Run bootstrap to create the index, or have Product/BFM add a compact lookup before sequencing handoffs.'
        );
      } else if (handoffIndexWarning && handoffIndexWarning.type === 'old-style') {
        add(
          'warn',
          'Handoff index',
          'docs/handoffs/index.md is old-style and lacks dependency/gate or evidence columns.',
          'Have Product/BFM refresh the lookup with Task / Topic, Lane, Status, Depends / Blocks / Gate, Checks / Evidence, and Detail columns.'
        );
      } else {
        add('ok', 'Handoff index', 'Handoff lookup is present or not needed yet.');
      }
      const goalAlignmentSessionWarnings = collectGoalAlignmentSessionWarnings(path.join(rootDir, 'docs', 'handoffs'), parsedTasks);
      if (goalAlignmentSessionWarnings.missingSession.length > 0) {
        add(
          'warn',
          'Goal Alignment Session handoffs',
          `Missing Goal Alignment Session section in: ${goalAlignmentSessionWarnings.missingSession.join(', ')}`,
          'Add a "## Goal Alignment Session" section to each non-quick handoff.'
        );
      } else {
        add('ok', 'Goal Alignment Session handoffs', 'All non-quick handoffs include a Goal Alignment Session section.');
      }
      if (goalAlignmentSessionWarnings.missingOkrFit.length > 0) {
        add(
          'warn',
          'Lane OKR Fit handoffs',
          `Missing Lane OKR Fit in: ${goalAlignmentSessionWarnings.missingOkrFit.join(', ')}`,
          'Add "Lane OKR Fit: aligned", "Lane OKR Fit: suggest approach change", or "Lane OKR Fit: blocked by OKR ambiguity".'
        );
      } else {
        add('ok', 'Lane OKR Fit handoffs', 'All non-quick handoffs include Lane OKR Fit.');
      }
      if (goalAlignmentSessionWarnings.missingMiniLoopEvidence.length > 0) {
        add(
          'warn',
          'Mini-loop Evidence handoffs',
          `Missing Mini-loop Evidence in: ${goalAlignmentSessionWarnings.missingMiniLoopEvidence.join(', ')}`,
          'Add "Mini-loop Evidence:" showing the task proof against the lane OKR.'
        );
      } else {
        add('ok', 'Mini-loop Evidence handoffs', 'All non-quick handoffs include Mini-loop Evidence.');
      }
      if (goalAlignmentSessionWarnings.missingProductOkrEvidence.length > 0) {
        add(
          'warn',
          'Evidence Against Product OKR handoffs',
          `Missing Evidence Against Product OKR in: ${goalAlignmentSessionWarnings.missingProductOkrEvidence.join(', ')}`,
          'Add "Evidence Against Product OKR:" showing whether the lane proof supports, weakens, or blocks the approved Product OKR.'
        );
      } else {
        add('ok', 'Evidence Against Product OKR handoffs', 'All non-quick handoffs include Evidence Against Product OKR.');
      }
      if (goalAlignmentSessionWarnings.missingBoardOkrs.length > 0) {
        add(
          'warn',
          'Goal Alignment Session OKRs',
          `Missing board OKRs for: ${goalAlignmentSessionWarnings.missingBoardOkrs.join(', ')}`,
          'Add an approved Product/workstream OKR, and lane OKRs where relevant, to each matching non-quick board target.'
        );
      }
      if (goalAlignmentSessionWarnings.unapprovedBoardOkrs.length > 0) {
        add(
          'warn',
          'Goal Alignment Session OKRs',
          `Missing approved OKRs for: ${goalAlignmentSessionWarnings.unapprovedBoardOkrs.join(', ')}`,
          'Set Approval to approved only after Product/BFM approval; keep pending work blocked before execution.'
        );
      }
      if (goalAlignmentSessionWarnings.missingBoardOkrs.length === 0 && goalAlignmentSessionWarnings.unapprovedBoardOkrs.length === 0) {
        add('ok', 'Goal Alignment Session OKRs', 'All non-quick handoff targets have approved board OKRs.');
      }
      if (goalAlignmentSessionWarnings.unapprovedOkrChange.length > 0) {
        add(
          'warn',
          'Unapproved OKR changes',
          `Handoffs imply new or changed goals without a board-approved OKR update: ${goalAlignmentSessionWarnings.unapprovedOkrChange.join(', ')}`,
          'Stop for Product/BFM discussion and explicit approval before adding or changing OKRs.'
        );
      } else {
        add('ok', 'Unapproved OKR changes', 'No non-quick handoff implies an unapproved OKR change.');
      }

      const reviewEvidenceWarnings = collectReviewEvidenceWarnings(path.join(rootDir, 'docs', 'handoffs'));
      if (reviewEvidenceWarnings.invalidStates.length > 0) {
        add(
          'fail',
          'V2 Review state',
          `Review state must be one of ${REVIEW_STATES.join(', ')}: ${reviewEvidenceWarnings.invalidStates.join(', ')}`,
          'Set the visible Review state to one exact supported value before asking for review.'
        );
      }
      if (reviewEvidenceWarnings.missingBriefs.length > 0) {
        add(
          'fail',
          'V2 initial handoff briefs',
          `Approved v2 initial handoffs require Project Start Brief and Build Brief: ${reviewEvidenceWarnings.missingBriefs.join(', ')}`,
          'Add both required sections before review evidence is requested.'
        );
      }
      if (reviewEvidenceWarnings.incompletePackets.length > 0) {
        add(
          'fail',
          'Review evidence',
          `Test This Now is incomplete: ${reviewEvidenceWarnings.incompletePackets.join(', ')}`,
          'Replace missing or placeholder-only values with concrete, actionable outcome type, Markdown direct links, numbered exact steps and expectations, pass criteria, known limits, failure-report format, or next Product/BFM action.'
        );
      }
      if (reviewEvidenceWarnings.blockedAccess.length > 0) {
        add(
          'fail',
          'Review evidence',
          `Blocked — no review environment yet: ${reviewEvidenceWarnings.blockedAccess.join(', ')}`,
          'Complete the stated Next Product/BFM action, then add the runnable review environment and direct link.'
        );
      }
      if (reviewEvidenceWarnings.missingLocalLinks.length > 0) {
        add(
          'fail',
          'Review evidence',
          `Local Markdown direct link(s) do not resolve: ${reviewEvidenceWarnings.missingLocalLinks.join(', ')}`,
          'Fix each local direct link or use a valid remote Markdown link.'
        );
      }
      if (
        reviewEvidenceWarnings.invalidStates.length === 0 &&
        reviewEvidenceWarnings.missingBriefs.length === 0 &&
        reviewEvidenceWarnings.incompletePackets.length === 0 &&
        reviewEvidenceWarnings.blockedAccess.length === 0 &&
        reviewEvidenceWarnings.missingLocalLinks.length === 0
      ) {
        add('ok', 'Review evidence', 'Harness-v2 reviewable handoffs have complete review evidence or are not reviewable.');
      }
    } else {
      add('warn', 'docs/handoffs', 'Lane handoff directory is missing.', 'Create docs/handoffs/ before non-trivial lane work.');
    }

    if (exists('.codex/rules.md')) {
      add('ok', '.codex/rules.md', 'Codex rules exist.');
    } else {
      add('warn', '.codex/rules.md', 'Codex rules are missing.', 'Run: node tools/fb-lane.cjs bootstrap --platform codex');
    }

    const gitLockFiles = collectGitLockWarnings(rootDir);
    if (gitLockFiles.length > 0) {
      add(
        'warn',
        'Git lock files',
        `Found possible stale lock file(s): ${gitLockFiles.join(', ')}`,
        'Confirm no git command is active, then remove stale lock files before Product claims, stages, or merges.'
      );
    } else {
      add('ok', 'Git lock files', 'No git lock files found.');
    }

    const longRunningProcesses = collectLongRunningLaneProcesses(rootDir);
    if (longRunningProcesses.length > 0) {
      add(
        'warn',
        'Local lane processes',
        `Long-running git/test/build process(es): ${longRunningProcesses.join('; ')}`,
        'Stop stale runners or move execution into the owning lane worktree; Product should record a blocked verification gate instead of spinning.'
      );
    } else {
      add('ok', 'Local lane processes', 'No long-running lane git/test/build processes detected.');
    }

    try {
      runGit('rev-parse --is-inside-work-tree');
      const branch = runGit('rev-parse --abbrev-ref HEAD');
      const dirty = runGit('status --porcelain');
      if (dirty) {
        add('warn', 'Git workspace', `On ${branch} with uncommitted changes.`, 'Closeout is blocked until the worktree is clean or exact files are recorded on PROJECT_BOARD.md as intentionally dirty with owner, reason, next gate, and session-boundary action.');
      } else {
        add('ok', 'Git workspace', `On ${branch}; working tree clean.`);
      }
    } catch (err) {
      add('warn', 'Git workspace', 'Not inside a git repository.', 'FB-Lane works best in a version-controlled repo.');
    }

    for (const check of collectSessionDoctorChecks(rootDir)) {
      add(check.level, check.label, check.detail, check.fix);
    }
    for (const check of collectEvalDoctorChecks(rootDir)) {
      add(check.level, check.label, check.detail, check.fix);
    }
    for (const check of collectControlLoopDoctorChecks(rootDir)) {
      add(check.level, check.label, check.detail, check.fix);
    }
    const normalizedRecordFindings = validateNormalizedRepository(rootDir);
    if (normalizedRecordFindings.length > 0) {
      for (const finding of normalizedRecordFindings) {
        add(
          'fail',
          'Normalized records',
          `${finding.code}: ${finding.file} — ${finding.message}`,
          'Repair the authoritative record or replace copied detail with a direct link before closeout.'
        );
      }
    } else {
      add('ok', 'Normalized records', 'Prospective normalized records have consistent ownership and links.');
    }
  } finally {
    process.chdir(previousCwd);
  }

  const failCount = checks.filter(c => c.level === 'fail').length;
  const warnCount = checks.filter(c => c.level === 'warn').length;
  const status = failCount > 0 ? 'Blocked' : warnCount > 0 ? 'Needs attention' : 'Ready';

  console.log(`\n🩺 FB-Lane doctor: ${status}`);
  console.log('='.repeat(80));
  for (const check of checks) {
    const marker = check.level === 'ok' ? '✅' : check.level === 'warn' ? '⚠️ ' : '❌';
    console.log(`${marker} ${check.label}: ${check.detail}`);
    if (check.fix) {
      console.log(`   Fix: ${check.fix}`);
    }
  }
  console.log('='.repeat(80) + '\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

function handleClaim(taskId, lane, lockedFiles = '(None)', options = {}) {
  try {
    assertSafeTaskId(taskId);
    assertSafeLane(lane);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
    process.exit(1);
  }

  try {
    runHook('preflight', boardPath);
  } catch (err) {
    console.error(`❌ Project preflight failed: ${err.message}`);
    process.exit(1);
  }
  try {
    runHook('pre-claim', boardPath);
  } catch (err) {
    console.error(`❌ Hook pre-claim failed: ${err.message}`);
    process.exit(1);
  }

  // Check git status
  const gitStatus = runGit('status --porcelain');
  if (gitStatus !== '') {
    console.warn('⚠️  Warning: You have uncommitted local changes in your workspace.');
  }

  const { tasks } = parseBoard(boardPath);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`❌ Error: Task ${taskId} not found.`);
    process.exit(1);
  }

  if (task.status === 'In Progress') {
    console.error(`❌ Error: Task ${taskId} is already In Progress.`);
    process.exit(1);
  }

  // Verify file locking conflicts
  if (lockedFiles !== '(None)' && lockedFiles !== '') {
    const requestedLocks = lockedFiles.split(',').map(f => f.trim());
    tasks.forEach(t => {
      if (t.status === 'In Progress' && t.locks && t.locks !== '(None)') {
        const activeLocks = t.locks.split(',').map(f => f.trim().replace(/`/g, ''));
        requestedLocks.forEach(rl => {
          if (activeLocks.includes(rl)) {
            console.error(`❌ Error: File "${rl}" is currently locked by active task ${t.id}.`);
            process.exit(1);
          }
        });
      }
    });
  }

  // Format branch name
  const slug = task.scope.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const branchName = `${lane.toLowerCase()}/${taskId}-${slug}`;

  // Run git checkout (in-place) or create an isolated worktree for parallel BFM execution workers.
  let worktreePath = null;
  let worktreeReused = false;
  if (options.worktree) {
    // Worktree mode: leave the primary checkout (FB-Product) where it is so the board stays
    // authoritative here, and give this execution worker its own directory on its own branch off main.
    const records = parseWorktreePorcelain(runGit(['worktree', 'list', '--porcelain']));
    const plan = resolveWorktreePlan(records, branchName);
    worktreePath = plan.path;
    worktreeReused = plan.reuse;
    if (worktreeReused) {
      if (runGit(['-C', worktreePath, 'status', '--porcelain'])) {
        console.error(`❌ Error: Matching worktree ${worktreePath} is not clean; resolve its owner state before reuse.`);
        process.exit(1);
      }
      console.log(`Reusing matching worktree at ${worktreePath} for ${branchName}...`);
    } else {
      let baseRef = 'main';
      try {
        runGit('fetch origin main');
        runGit('rev-parse --verify origin/main');
        baseRef = 'origin/main';
      } catch (err) {
        console.warn('⚠️  Could not fetch origin/main; basing the worktree on local main.');
      }
      ensureWorktreeContainerIgnored(plan.primary);
      fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
      try {
        console.log(`Creating worktree at ${worktreePath} on new branch ${branchName}...`);
        runGit(['worktree', 'add', '-b', branchName, worktreePath, baseRef]);
      } catch (err) {
        console.log(`Branch might exist. Attaching a worktree to: ${branchName}...`);
        try {
          runGit(['worktree', 'add', worktreePath, branchName]);
        } catch (err2) {
          console.error(`❌ Error creating worktree: ${err2.message}`);
          process.exit(1);
        }
      }
    }
  } else {
    console.log('Switching to main and pulling latest changes...');
    try {
      runGit('checkout main');
      runGit('pull origin main');
    } catch (err) {
      console.error(`❌ Error: Could not pull main branch safely: ${err.message}`);
      console.error(`👉 Please stash, commit, or discard your uncommitted changes first.`);
      process.exit(1);
    }
    try {
      console.log(`Checking out branch: ${branchName}...`);
      runGit(["checkout", "-b", assertSafeBranchName(branchName)]);
    } catch (err) {
      console.log(`Branch might exist. Attempting to switch to: ${branchName}...`);
      try {
        runGit(["checkout", assertSafeBranchName(branchName)]);
      } catch (err2) {
        console.error(`❌ Error switching branch: ${err2.message}`);
        process.exit(1);
      }
    }
  }

  // Format locks
  const formattedLocks = lockedFiles === '(None)' ? '(None)' : lockedFiles.split(',').map(f => `\`${f.trim()}\``).join(', ');

  // Update board
  updateBoardTask(boardPath, taskId, {
    status: 'In Progress',
    owner: `FB-${lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase()}`,
    locks: formattedLocks,
    lockedFiles: formattedLocks
  });

  // Commit board separately. In worktree mode, carry the authoritative claim
  // commit into the execution branch so promotion sees the same board state.
  const boardCommitted = commitBoard(`docs: claim ${taskId} and lock files`);
  if (worktreePath && boardCommitted && fs.realpathSync(worktreePath) !== fs.realpathSync(path.dirname(boardPath))) {
    const boardCommit = runGit('rev-parse HEAD');
    execFileSync('git', ['-C', worktreePath, 'cherry-pick', boardCommit], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  }

  // Write local Codex context file to reduce search pain. In worktree mode it goes into the
  // lane's worktree so the session running there reads its own task context.
  const codexBase = worktreePath || path.dirname(boardPath);
  const codexDir = path.join(codexBase, '.codex');
  if (!fs.existsSync(codexDir)) {
    fs.mkdirSync(codexDir, { recursive: true });
  }
  const contextContent = `# Active Task Context
* **Current Task**: ${taskId}
* **Lane**: FB-${lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase()}
* **BFM Class**: ${classifyBfmClass(task)}
* **Feature Branch**: ${branchName}
* **Locked Files**: ${formattedLocks}

## Task Scope:
${task.scope}
`;
  fs.writeFileSync(path.join(codexDir, 'current_task.md'), contextContent, 'utf8');

  // Generate startup prompt
  const prompt = generateStartupPrompt(task, lane, branchName, formattedLocks);
  const copied = copyToClipboard(prompt);

  console.log(`\n✅ Task ${taskId} successfully claimed!`);
  console.log(`   - Branch: ${branchName}`);
  console.log(`   - Locked: ${formattedLocks}`);
  console.log(`   - BFM class: ${classifyBfmClass(task)}`);
  console.log(`   - Board updated & committed separately.`);
  if (worktreePath) {
    console.log(`   - Worktree: ${worktreePath} (board stays authoritative in this checkout)`);
    console.log(`   - Codex context written to ${path.join(worktreePath, '.codex', 'current_task.md')}`);
    console.log(`\n👉 Open this worktree in Codex, then start a new thread:`);
    console.log(`     ${worktreePath}`);
    console.log(`   When done: node tools/fb-lane.cjs submit ${taskId}, then (from here) merge — the merge releases the worktree's branch.`);
  } else {
    console.log(`   - Codex Desktop context written to .codex/current_task.md`);
  }
  if (copied) {
    console.log('\n🚀 STARTUP PROMPT COPIED TO CLIPBOARD!');
    console.log('   Simply open a fresh Codex thread and paste (Cmd+V) to begin.\n');
  } else {
    console.log('\n👉 Copy-paste this startup prompt into a fresh Codex thread:');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60) + '\n');
  }

  try {
    runHook('post-claim', boardPath);
  } catch (err) {
    console.error(`❌ Hook post-claim failed: ${err.message}`);
    process.exit(1);
  }
}

// Add a new task to PROJECT_BOARD.md programmatically
function addTaskToBoard(boardPath, task) {
  const content = fs.readFileSync(boardPath, 'utf8');
  const lines = content.split(/\r?\n/);

  let tableHeaderIndex = -1;
  let tableDividerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('## Active Workstreams')) {
      tableHeaderIndex = i;
    }
    if (tableHeaderIndex !== -1 && lines[i].startsWith('|---|')) {
      tableDividerIndex = i;
      break;
    }
  }

  if (tableDividerIndex === -1) {
    throw new Error('Could not find active workstreams table in PROJECT_BOARD.md');
  }

  // Insert table row right after the table divider
  const tableRow = `| ${task.id} | ${task.status} | ${task.owner} | ${task.area} | ${task.scope} | ${task.locks} | ${task.links} |`;
  lines.splice(tableDividerIndex + 1, 0, tableRow);

  // Insert detail block at the bottom of the file
  const detailsBlock = `
### ${task.id} - ${task.scope}
*   **Status**: ${task.status}
*   **Owner / Thread**: ${task.owner}
*   **Area**: ${task.area}
*   **Scope**: ${task.scope}
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: ${task.lockedFiles || '(None)'}
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](${task.repoUrl}/tree/${task.branchName})
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [ ] Changes compile without error.
    *   [ ] Modified files are verified and checked.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *${new Date().toISOString().split('T')[0]}*: Initialized quick edit task.
`;

  lines.push(detailsBlock);
  fs.writeFileSync(boardPath, lines.join('\n'), 'utf8');
}

// Handle quick-edit task creation and branch checkout
function handleQuick(lane, lockedFiles, scopeDescription = '', options = {}) {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
    process.exit(1);
  }

  if (!lane || !lockedFiles) {
    console.error('❌ Error: Usage: node tools/fb-lane.cjs quick <lane> <locked_files> <scope_description> --approval-ref <reference>');
    process.exit(1);
  }

  const approvalReference = String(options.approvalReference || '').trim();
  if (!approvalReference || /^(?:pending|unverified|none|n\/a)$/i.test(approvalReference)) {
    console.error('❌ Error: Quick BFM requires a concrete --approval-ref <reference> before any write.');
    process.exit(1);
  }

  const normLane = lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase();
  if (!['Tech', 'Design', 'Business', 'Product', 'Discovery', 'Bugs'].includes(normLane)) {
    console.error('❌ Error: Invalid lane. Must be Tech, Design, Business, Product, Discovery, or Bugs.');
    process.exit(1);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
  const taskId = `TASK-Q-${timestamp}`;
  const owner = `FB-${normLane}`;
  const area = 'Quick-Fix';

  const { tasks } = parseBoard(boardPath);
  const requestedLocks = lockedFiles.split(',').map(value => value.trim().replace(/`/g, '')).filter(Boolean);
  const lockConflict = tasks.some(task => /^In Progress$/i.test(task.status || '')
    && String(task.locks || '').split(',').map(value => value.trim().replace(/`/g, '')).some(active =>
      requestedLocks.some(requested => active === requested || active.startsWith(`${requested}/`) || requested.startsWith(`${active}/`))
    ));
  const policy = classifyExecutionMode({
    area,
    owner,
    scope: scopeDescription,
    locks: lockedFiles,
    successCriteria: `The focused contract for ${lockedFiles} passes.`,
    details: { approval: `approved; Reference: ${approvalReference}` },
  }, { lockConflict });
  if (policy.mode !== 'Quick BFM') {
    console.error(`❌ Error: This request cannot use quick; ${policy.reason}. Route it through Full BFM.`);
    process.exit(1);
  }

  try {
    runHook('preflight', boardPath);
  } catch (err) {
    console.error(`❌ Project preflight failed: ${err.message}`);
    process.exit(1);
  }
  try {
    runHook('pre-claim', boardPath);
  } catch (err) {
    console.error(`❌ Hook pre-claim failed: ${err.message}`);
    process.exit(1);
  }

  // Format branch name
  const slug = scopeDescription.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const branchName = `quick/${taskId}-${slug}`;

  // Worktrees are the safe default; --no-worktree keeps the legacy path.
  let worktreePath = null;
  if (options.worktree) {
    const records = parseWorktreePorcelain(runGit(['worktree', 'list', '--porcelain']));
    const plan = resolveWorktreePlan(records, branchName);
    worktreePath = plan.path;
    let baseRef = 'main';
    ensureWorktreeContainerIgnored(plan.primary);
    fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
    try {
      runGit('fetch origin main');
      runGit('rev-parse --verify origin/main');
      baseRef = 'origin/main';
    } catch (err) {
      console.warn('⚠️  Could not fetch origin/main; basing the quick worktree on local main.');
    }
    try {
      runGit(['worktree', 'add', '-b', branchName, worktreePath, baseRef]);
    } catch (err) {
      try {
        runGit(['worktree', 'add', worktreePath, branchName]);
      } catch (err2) {
        console.error(`❌ Error creating quick worktree: ${err2.message}`);
        process.exit(1);
      }
    }
  } else {
    console.log('Switching to main and pulling latest changes...');
    try {
      runGit('checkout main');
      runGit('pull origin main');
    } catch (err) {
      console.error(`❌ Error: Could not pull main branch safely: ${err.message}`);
      console.error(`👉 Please stash, commit, or discard your uncommitted changes first.`);
      process.exit(1);
    }
    try {
      console.log(`Checking out quick branch: ${branchName}...`);
      runGit(["checkout", "-b", assertSafeBranchName(branchName)]);
    } catch (err) {
      console.log(`Branch might exist. Attempting to switch to: ${branchName}...`);
      try {
        runGit(["checkout", assertSafeBranchName(branchName)]);
      } catch (err2) {
        console.error(`❌ Error switching branch: ${err2.message}`);
        process.exit(1);
      }
    }
  }

  // Format locks
  const formattedLocks = lockedFiles.split(',').map(f => `\`${f.trim()}\``).join(', ');

  const quickRoot = worktreePath || path.dirname(boardPath);
  const relativeRecord = path.join('docs', 'handoffs', `${taskId}.md`);
  const quickRecordPath = path.join(quickRoot, relativeRecord);
  fs.mkdirSync(path.dirname(quickRecordPath), { recursive: true });
  fs.writeFileSync(quickRecordPath, renderQuickRecord({
    id: taskId,
    approvedCorrection: scopeDescription,
    scope: scopeDescription,
    owner,
    locks: formattedLocks,
    successCriteria: `The focused contract for ${lockedFiles} passes.`,
    verificationPlan: `Run only the focused checks for ${lockedFiles}.`,
    branch: branchName,
    worktree: worktreePath || quickRoot,
    approvalReference,
    brief: 'Current approved Quick correction.',
    candidate: branchName,
    feedback: scopeDescription,
    requiredEvidence: `Focused evidence for ${lockedFiles}.`,
  }));
  if (worktreePath) {
    execFileSync('git', ['-C', worktreePath, 'add', relativeRecord], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    execFileSync('git', ['-C', worktreePath, 'commit', '-m', `docs: create ${taskId} Quick Record`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } else {
    runGit(['add', relativeRecord]);
    runGit(['commit', '-m', `docs: create ${taskId} Quick Record`]);
  }

  // Write local Codex context file
  const codexDir = path.join(worktreePath || path.dirname(boardPath), '.codex');
  if (!fs.existsSync(codexDir)) {
    fs.mkdirSync(codexDir);
  }
  const contextContent = `# Active Task Context
* **Current Task**: ${taskId}
* **Lane**: ${owner}
* **BFM Class**: Quick BFM
* **Feature Branch**: ${branchName}
* **Locked Files**: ${formattedLocks}

## Task Scope:
${scopeDescription} (Quick Edit)
`;
  fs.writeFileSync(path.join(codexDir, 'current_task.md'), contextContent, 'utf8');

  // Generate startup prompt
  const taskObjForPrompt = { id: taskId, area: area, scope: scopeDescription };
  const prompt = generateStartupPrompt(taskObjForPrompt, normLane, branchName, formattedLocks);
  const copied = copyToClipboard(prompt);

  console.log(`\n✅ Quick edit task ${taskId} successfully claimed!`);
  console.log(`   - Branch: ${branchName}`);
  console.log(`   - Locked: ${formattedLocks}`);
  console.log(`   - BFM class: Quick BFM`);
  console.log(`   - Quick Record: ${relativeRecord}`);
  if (worktreePath) {
    console.log(`   - Worktree: ${worktreePath}`);
    console.log(`   - Codex context written inside the linked worktree.`);
  } else {
    console.log(`   - Codex Desktop context written to .codex/current_task.md`);
  }
  if (copied) {
    console.log('\n🚀 STARTUP PROMPT COPIED TO CLIPBOARD!');
    console.log('   Simply open a fresh Codex thread and paste (Cmd+V) to begin.\n');
  } else {
    console.log('\n👉 Copy-paste this startup prompt into a fresh Codex thread:');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60) + '\n');
  }

  try {
    runHook('post-claim', boardPath);
  } catch (err) {
    console.error(`❌ Hook post-claim failed: ${err.message}`);
    process.exit(1);
  }
}

// Run local test suite if package.json has a valid test script
function runTests(boardPath) {
  let testCmd = null;
  const pkgPath = path.join(path.dirname(boardPath), 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts && pkg.scripts.test && !pkg.scripts.test.includes('no test specified')) {
        testCmd = 'npm test';
      }
    } catch (err) {}
  }

  if (testCmd) {
    console.log(`\n🔍 Running local test suite: "${testCmd}"...`);
    try {
      execSync(testCmd, { stdio: 'inherit', cwd: path.dirname(boardPath) });
      console.log('✅ Local tests passed successfully!\n');
      return true;
    } catch (err) {
      throw new Error(`Local tests failed. Please fix errors before submitting.`);
    }
  }
  return true;
}

// Stage and commit the project board only if there are staged modifications
function commitBoard(message) {
  runGit('add PROJECT_BOARD.md');
  try {
    const staged = runGit('diff --cached --name-only PROJECT_BOARD.md');
    if (staged.trim() !== '') {
      runGit(['commit', '-m', message]);
      return true;
    }
  } catch (err) {}
  console.log('ℹ️  Project board already up to date. No commit needed.');
  return false;
}

const NO_TESTS_SUBMIT_ERROR = 'Automated checks are required before Ready to ship; --no-tests cannot submit.';
const PUSH_LIVE_PROMPT = 'Automated checks passed. Optional review links are available above.\nSay **Push Live** to deploy.';

function workspaceGit(workspaceRoot, args) {
  return execFileSync('git', args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function formatAutomatedSubmission(result) {
  const checkLines = result.checks.map(check => `- Automated checks: ${check.id}: ${check.result}`);
  const command = result.checkManifest[0]
    ? [result.checkManifest[0].command, ...result.checkManifest[0].args].join(' ')
    : 'selected checks';
  const linkLines = result.optionalLinks.length
    ? result.optionalLinks.map(link => `- ${link}`)
    : ['- none'];
  return [
    'System verification: passed',
    ...checkLines,
    `- Evidence: candidate ${result.candidateCommit} passed ${command}`,
    '',
    'Optional review links:',
    ...linkLines,
    '',
    result.status,
    result.prompt,
  ].join('\n');
}

function resolveSubmissionSafetyGate({ candidateCommit, changedPaths, session }) {
  if (classifyChangedSurface(changedPaths) !== 'sensitive') {
    return { result: 'not-applicable', approvalRef: '' };
  }
  const evidence = session && session.automatedVerification;
  const samePaths = evidence && Array.isArray(evidence.changedPaths)
    && [...evidence.changedPaths].sort().join('\n') === [...changedPaths].sort().join('\n');
  if (evidence && evidence.candidateCommit === candidateCommit && samePaths
      && evidence.safetyGate && evidence.safetyGate.result === 'passed'
      && String(evidence.safetyGate.approvalRef || '').trim()) {
    return { result: 'passed', approvalRef: evidence.safetyGate.approvalRef };
  }
  return { result: 'unresolved', approvalRef: '' };
}

function performAutomatedSubmission({ workspaceRoot, taskId, optionalReviewUrl = '', bypassRequested = false, transport = 'cli' }) {
  void transport;
  assertSafeTaskId(taskId);
  if (bypassRequested) throw new Error(NO_TESTS_SUBMIT_ERROR);
  const boardPath = path.join(workspaceRoot, 'PROJECT_BOARD.md');
  if (!fs.existsSync(boardPath)) throw new Error('PROJECT_BOARD.md not found.');
  assertSubmitReady(workspaceRoot, taskId);

  const sessions = listSessions(workspaceRoot).filter(session => session.taskId === taskId && session.mode === 'execution' && session.state !== 'closed');
  if (sessions.length !== 1) throw new Error(`Automated verification requires one active execution session for ${taskId}.`);
  const promotion = [...(sessions[0].milestones || [])].reverse().find(milestone => milestone.reason === 'promotion' && /^[0-9a-f]{40}$/i.test(milestone.commit || ''));
  if (!promotion) throw new Error('Blocked: the authoritative session promotion commit is unavailable.');
  const candidateCommit = workspaceGit(workspaceRoot, ['rev-parse', 'HEAD']);
  const changedPaths = workspaceGit(workspaceRoot, ['diff', '--name-only', `${promotion.commit}..${candidateCommit}`]).split(/\r?\n/).filter(Boolean).sort();
  const handoffSource = sessions[0].handoff && fs.existsSync(path.join(workspaceRoot, sessions[0].handoff))
    ? fs.readFileSync(path.join(workspaceRoot, sessions[0].handoff), 'utf8') : '';
  const changelogVerification = /^fb_harness:\s*v3\s*$/im.test(handoffSource)
    ? assertFullBfmChangelog({ repoRoot: workspaceRoot, handoffPath: sessions[0].handoff, baseCommit: promotion.commit, candidateCommit, executionMode: 'full' })
    : { decision: 'historical-exempt' };
  const checkManifest = selectAutomatedChecks(changedPaths, workspaceRoot);
  const safetyGate = resolveSubmissionSafetyGate({ candidateCommit, changedPaths, session: sessions[0] });
  if (safetyGate.result === 'unresolved') {
    throw new Error('Blocked: Sensitive changes require a passed safety gate.');
  }

  const checks = [];
  for (const check of checkManifest) {
    try {
      runAutomatedCheck(check, workspaceRoot);
      checks.push({ id: check.id, result: 'passed' });
    } catch (err) {
      throw err;
    }
  }
  const optionalLinks = optionalReviewUrl ? [optionalReviewUrl] : [];
  const decision = automatedVerificationDecision({
    candidateCommit,
    checkedCommit: candidateCommit,
    changedPaths,
    checkResults: checks,
    safetyGate,
    optionalLinks,
    changelogVerification: { result: 'passed', candidateCommit, decision: changelogVerification.decision },
  });
  if (decision.status !== 'Ready to ship') throw new Error(`${decision.status}: ${decision.reason}`);
  recordAutomatedVerification(workspaceRoot, taskId, {
    status: 'passed',
    baseCommit: promotion.commit,
    candidateCommit,
    checkedAt: new Date().toISOString(),
    checks,
    changedPaths,
    checkManifest,
    safetyGate,
    optionalLinks,
    changelogVerification: /^fb_harness:\s*v3\s*$/im.test(handoffSource)
      ? { result: 'passed', candidateCommit, decision: changelogVerification.decision }
      : undefined,
  });

  runHook('pre-submit', boardPath);
  withSubmitLifecycleTransaction(workspaceRoot, taskId, () => {
    assertSubmitReady(workspaceRoot, taskId);
    const updates = { status: 'Staging QA' };
    if (optionalReviewUrl) updates.stagingUrl = `[Optional Review Link](${optionalReviewUrl})`;
    updateBoardTask(boardPath, taskId, updates);
    commitBoard(`docs: submit ${taskId} for staging qa`);
    runGit(['push', 'origin', 'HEAD']);
  });
  runHook('post-submit', boardPath);
  return { status: decision.status, candidateCommit, checks, checkManifest, optionalLinks, prompt: PUSH_LIVE_PROMPT };
}

function handleSubmit(taskId, stagingUrl = '', options = {}) {
  try {
    assertSafeTaskId(taskId);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
    process.exit(1);
  }

  const workspaceRoot = path.dirname(boardPath);
  const quickPath = taskId.startsWith('TASK-Q-') ? findQuickRecord(workspaceRoot, taskId) : null;
  if (quickPath) {
    const markdown = fs.readFileSync(quickPath, 'utf8');
    let changedPaths;
    try {
      const relative = path.relative(workspaceRoot, quickPath);
      const creationCommits = workspaceGit(workspaceRoot, ['log', '--diff-filter=A', '--format=%H', '--', relative])
        .split(/\r?\n/).filter(Boolean);
      if (creationCommits.length === 0) throw new Error('Quick BFM submit cannot identify the Quick Record creation commit.');
      const baseCommit = workspaceGit(workspaceRoot, ['rev-parse', `${creationCommits[creationCommits.length - 1]}^`]);
      changedPaths = [...new Set([
        ...workspaceGit(workspaceRoot, ['diff', '--name-only', `${baseCommit}..HEAD`]).split(/\r?\n/),
        ...workspaceGit(workspaceRoot, ['diff', '--name-only', 'HEAD']).split(/\r?\n/),
        ...workspaceGit(workspaceRoot, ['diff', '--cached', '--name-only']).split(/\r?\n/),
        ...workspaceGit(workspaceRoot, ['ls-files', '--others', '--exclude-standard']).split(/\r?\n/),
      ].filter(Boolean))].sort();
      runQuickSubmissionChecks(markdown, changedPaths, workspaceRoot);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
    try { runHook('pre-submit', boardPath); } catch (err) {
      console.error(`❌ Hook pre-submit failed: ${err.message}`);
      process.exit(1);
    }
    fs.writeFileSync(quickPath, markdown.replace(/^Status:\s*in-progress$/mi, 'Status: complete'));
    const relative = path.relative(workspaceRoot, quickPath);
    runGit(['add', relative]);
    if (runGit(['diff', '--cached', '--name-only', '--', relative])) {
      runGit(['commit', '-m', `docs: close ${taskId} Quick Record`]);
    }
    try { runHook('post-submit', boardPath); } catch (err) {
      console.error(`❌ Hook post-submit failed: ${err.message}`);
      process.exit(1);
    }
    console.log(`✅ Quick BFM ${taskId} closed from its single Quick Record.`);
    return;
  }

  try {
    const result = performAutomatedSubmission({ workspaceRoot, taskId, optionalReviewUrl: stagingUrl, bypassRequested: options.bypassRequested, transport: 'cli' });
    console.log(formatAutomatedSubmission(result));
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

function handleMerge(taskId) {
  try {
    assertSafeTaskId(taskId);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
    process.exit(1);
  }

  try {
    runHook('pre-merge', boardPath);
  } catch (err) {
    console.error(`❌ Hook pre-merge failed: ${err.message}`);
    process.exit(1);
  }

  const { tasks } = parseBoard(boardPath);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`❌ Error: Task ${taskId} not found.`);
    process.exit(1);
  }

  const gitStatus = runGit('status --porcelain');
  if (gitStatus !== '') {
    console.error('❌ Error: You have uncommitted changes in your workspace.');
    console.error('👉 Please commit, stash, or discard them before merging.');
    process.exit(1);
  }

  // Determine the feature branch name from task scope slug
  const slug = task.scope.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  // Try to find the branch name matching the task ID
  let targetBranch = '';
  try {
    const branches = runGit('branch --list').split('\n').map(b => b.replace('*', '').trim());
    targetBranch = branches.find(b => b.includes(taskId)) || '';
  } catch (err) {}

  if (!targetBranch) {
    // Guess name if not found in local branch list
    const ownerLane = task.owner.replace('FB-', '').toLowerCase();
    targetBranch = `${ownerLane}/${taskId}-${slug}`;
  }

  console.log(`Merging ${targetBranch} into main...`);
  try {
    runGit('checkout main');
    runGit('pull origin main');
    runGit(["merge", assertSafeBranchName(targetBranch)]);
  } catch (err) {
    console.error(`\n❌ Error: Merge conflict or checkout failure detected while merging ${targetBranch} into main.`);
    console.error(`⚠️  Aborting merge safely to protect your workspace...`);
    try {
      runGit('merge --abort');
    } catch (abortErr) {}
    console.error(`👉 Please run the merge manually to resolve conflicts:\n   git checkout main && git merge ${targetBranch}\n`);
    process.exit(1);
  }

  // Update board
  updateBoardTask(boardPath, taskId, {
    status: 'Done',
    locks: '(None)',
    lockedFiles: '(None)'
  });

  // Commit board
  commitBoard(`docs: complete ${taskId} and release locks`);

  // Push main
  runGit('push origin main');

  // Delete branch
  try {
    runGit(["branch", "-d", assertSafeBranchName(targetBranch)]);
  } catch (err) {
    console.warn(`⚠️  Could not delete local branch ${targetBranch}: ${err.message}`);
  }

  // Delete Codex context if matches
  const contextPath = path.join(path.dirname(boardPath), '.codex', 'current_task.md');
  if (fs.existsSync(contextPath)) {
    try { fs.unlinkSync(contextPath); } catch(e) {}
  }

  console.log(`\n✅ Task ${taskId} is merged and completed!`);
  console.log(`   - Feature branch ${targetBranch} merged to main & deleted.`);
  console.log(`   - Board updated to Done. Locks released.\n`);

  try {
    runHook('post-merge', boardPath);
  } catch (err) {
    console.error(`❌ Hook post-merge failed: ${err.message}`);
    process.exit(1);
  }
}

// MCP Lightweight JSON-RPC Server
function runMcpServer() {
  // Redirect standard console.log to console.error to avoid stdin/stdout protocol corruption
  const originalLog = console.log;
  console.log = function(...args) {
    console.error('[STDOUT-REDIRECTED]', ...args);
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    try {
      const request = JSON.parse(line);
      handleMcpRequest(request);
    } catch (err) {
      // Ignore parsing errors or invalid lines
    }
  });

  // Tell client we are listening
  console.error('FB-Lane MCP Server running...');
}

function sendMcpResponse(id, result, error = null) {
  const response = {
    jsonrpc: '2.0',
    id
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  process.stdout.write(JSON.stringify(response) + '\n');
}

function handleMcpRequest(request) {
  const { method, id, params } = request;

  if (method === 'initialize') {
    return sendMcpResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'fb-lane-mcp',
        version: '1.0.0'
      }
    });
  }

  if (method === 'tools/list') {
    return sendMcpResponse(id, {
      tools: [
        {
          name: 'fb_lane_status',
          description: 'Get the beginner project status card, with optional raw technical details.',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: { type: 'string', description: 'Optional workspace/repo path to search for PROJECT_BOARD.md from.' },
              details: { type: 'boolean', description: 'Show the raw technical workstream table.' }
            }
          }
        },
        {
          name: 'fb_project_context',
          description: 'Return a compact, source-cited context packet for one task question. Uses the project graph for targeted reading and falls back to the authoritative board/index route when needed.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The current task ID, e.g. TASK-048' },
              question: { type: 'string', description: 'The concrete project-context question to answer.' },
              workspacePath: { type: 'string', description: 'Optional workspace/repo path to search for PROJECT_BOARD.md from.' }
            },
            required: ['taskId', 'question']
          }
        },
        {
          name: 'fb_control_event_validate',
          description: 'Validate one privacy-safe, flat stage event without recording it. This does not evaluate product semantics or authorize a release.',
          inputSchema: CONTROL_EVENT_MCP_SCHEMA,
          outputSchema: CONTROL_EVENT_OUTPUT_SCHEMA
        },
        {
          name: 'fb_control_event_record',
          description: 'Validate and append one privacy-safe, flat stage event to the repository clone-local JSONL registry. It does not copy event JSONL into Markdown or authorize a release.',
          inputSchema: CONTROL_EVENT_MCP_SCHEMA,
          outputSchema: CONTROL_EVENT_OUTPUT_SCHEMA
        },
        {
          name: 'fb_control_route',
          description: 'Evaluate deterministic control-loop route rules. Safety and ambiguity return judgment_required; this tool never invokes an LLM or transformation.',
          inputSchema: {
            type: 'object',
            properties: {
              artifactRef: { type: 'string' },
              description: { type: 'string' },
              metadataRef: { type: 'string' },
              criteriaIds: { type: 'array', items: { type: 'string' } },
              costRisk: { type: 'string' },
              degradationRisk: { type: 'string' },
              safetyTriggers: { type: 'array', items: { type: 'string' } },
              routeRules: { type: 'array' },
              workspacePath: { type: 'string' }
            },
            required: ['artifactRef'],
            additionalProperties: false
          }
        },
        {
          name: 'fb_lane_claim',
          description: 'Claim a task from the board, checkout a feature branch, lock files, and commit the board update.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The task ID, e.g. TASK-001' },
              lane: { type: 'string', enum: ['Tech', 'Design', 'Business', 'Product', 'Discovery', 'Bugs'], description: 'The lane claiming the task' },
              lockedFiles: { type: 'string', description: 'Comma-separated list of files to lock' },
              workspacePath: { type: 'string', description: 'Optional workspace/repo path to search for PROJECT_BOARD.md from.' }
            },
            required: ['taskId', 'lane']
          }
        },
        {
          name: 'fb_lane_submit',
          description: 'Submit a task for staging QA, updating the board status, committing, and pushing the branch.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The task ID, e.g. TASK-001' },
              stagingUrl: { type: 'string', description: 'Optional URL to the staging deployment' },
              workspacePath: { type: 'string', description: 'Optional workspace/repo path to search for PROJECT_BOARD.md from.' }
            },
            required: ['taskId']
          }
        },
        {
          name: 'fb_lane_merge',
          description: "Merge a task's branch, mark it Done, release locks, and delete the branch.",
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The task ID, e.g. TASK-001' },
              workspacePath: { type: 'string', description: 'Optional workspace/repo path to search for PROJECT_BOARD.md from.' }
            },
            required: ['taskId']
          }
        }
      ]
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: toolArgs = {} } = params;
    try {
      let message = '';
      let structuredContent;
      const boardPath = findBoardPath(resolveWorkspaceStart(toolArgs));
      if (!boardPath) {
        throw new Error('PROJECT_BOARD.md not found.');
      }
      const workspaceRoot = path.dirname(boardPath);
      const previousCwd = process.cwd();
      process.chdir(workspaceRoot);

      try {
        if (name === 'fb_control_event_validate') {
          const { workspacePath, ...event } = toolArgs;
          structuredContent = validateMcpStageEvent(event);
          message = JSON.stringify(structuredContent);
        } else if (name === 'fb_control_event_record') {
          const { workspacePath, ...event } = toolArgs;
          structuredContent = appendStageEvent(workspaceRoot, validateMcpStageEvent(event));
          message = JSON.stringify(structuredContent);
        } else if (name === 'fb_control_route') {
          const { workspacePath, ...input } = toolArgs;
          message = JSON.stringify(routeArtifact(input));
        } else if (name === 'fb_lane_status') {
          const { tasks } = parseBoard(boardPath);
          message = toolArgs.details
            ? renderTechnicalStatus(tasks, { format: 'mcp', workspaceRoot })
            : renderBeginnerStatus(statusInputs(workspaceRoot, tasks));
        } else if (name === 'fb_project_context') {
          const { taskId, question } = toolArgs;
          assertSafeTaskId(taskId);
          if (typeof question !== 'string' || question.trim().length < 8 || question.length > 500) {
            throw new Error('A concrete context question between 8 and 500 characters is required.');
          }
          message = JSON.stringify(projectContextPacket(workspaceRoot, {
            taskId,
            question: question.trim(),
          }), null, 2);
        } else if (name === 'fb_lane_claim') {
          const { taskId, lane, lockedFiles } = toolArgs;
          assertSafeTaskId(taskId);
          assertSafeLane(lane);
          const output = execFileSync(process.execPath, [__filename, 'claim', taskId, lane, lockedFiles || '(None)'], {
            cwd: workspaceRoot,
            env: process.env,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          });
          const branch = (output.match(/^\s*- Branch:\s*(.+)$/mi) || [])[1];
          const worktreeLine = (output.match(/^\s*- Worktree:\s*(.+)$/mi) || [])[1];
          const worktree = worktreeLine ? worktreeLine.replace(/\s+\(board stays authoritative.*$/, '').trim() : '';
          if (!branch || !worktree) throw new Error('Linked-worktree claim completed without branch/worktree details.');
          const formattedLocks = !lockedFiles ? '(None)' : lockedFiles.split(',').map(file => `\`${file.trim()}\``).join(', ');
          message = `Successfully claimed ${taskId}.\nBranch: ${branch.trim()}\nWorktree: ${worktree}\nLocks: ${formattedLocks}`;
        } else if (name === 'fb_lane_submit') {
          const { taskId, stagingUrl } = toolArgs;
          const result = performAutomatedSubmission({ workspaceRoot, taskId, optionalReviewUrl: stagingUrl, bypassRequested: false, transport: 'mcp' });
          message = formatAutomatedSubmission(result);
        } else if (name === 'fb_lane_merge') {
          const { taskId } = toolArgs;
          assertSafeTaskId(taskId);

          runHook('pre-merge', boardPath);

          const { tasks } = parseBoard(boardPath);
          const task = tasks.find(t => t.id === taskId);
          if (!task) throw new Error(`Task ${taskId} not found.`);

          const slug = task.scope.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          let targetBranch = '';
          try {
            const branches = runGit('branch --list').split('\n').map(b => b.replace('*', '').trim());
            targetBranch = branches.find(b => b.includes(taskId)) || '';
          } catch (err) {}
          if (!targetBranch) {
            const ownerLane = task.owner.replace('FB-', '').toLowerCase();
            targetBranch = `${ownerLane}/${taskId}-${slug}`;
          }

          runGit('checkout main');
          runGit('pull origin main');
          runGit(["merge", assertSafeBranchName(targetBranch)]);

          updateBoardTask(boardPath, taskId, {
            status: 'Done',
            locks: '(None)',
            lockedFiles: '(None)'
          });

          commitBoard(`docs: complete ${taskId} and release locks`);
          runGit('push origin main');

          try { runGit(["branch", "-d", assertSafeBranchName(targetBranch)]); } catch (e) {}
          const contextPath = path.join(path.dirname(boardPath), '.codex', 'current_task.md');
          if (fs.existsSync(contextPath)) {
            try { fs.unlinkSync(contextPath); } catch(e) {}
          }

          runHook('post-merge', boardPath);

          message = `Successfully merged ${targetBranch} and completed ${taskId}. Locks released.`;
        } else {
          throw new Error(`Unknown tool name: ${name}`);
        }
      } finally {
        process.chdir(previousCwd);
      }

      const response = {
        content: [
          {
            type: 'text',
            text: message
          }
        ]
      };
      if (structuredContent) response.structuredContent = structuredContent;
      return sendMcpResponse(id, response);
    } catch (err) {
      return sendMcpResponse(id, null, {
        code: -32603,
        message: err.message
      });
    }
  }

  // Ignore other JSON-RPC methods (like notifications)
}

const FB_HARNESS_PAGES = ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md', 'evals.md', 'records.md', 'graph.md', 'control-loop.md'];
const FB_HARNESS_ROUTE_START = '<!-- fb-harness-route-start -->';
const FB_HARNESS_ROUTE_END = '<!-- fb-harness-route-end -->';

function fbHarnessRoute() {
  return `${FB_HARNESS_ROUTE_START}
## FB coordination route

Read [the FB harness](docs/fb/README.md) after \`PROJECT_BOARD.md\`,
\`docs/handoffs/index.md\`, and the linked handoff. Use the focused page that
matches the task:

Start in whichever workstream matches the question whenever planning or
evidence is useful. Product/User is only for user and product questions, not
universal intake. Relevant workstreams create handoffs for ready scope, and
approval attaches to that scope before \`$bfm\`. After the user says \`$bfm\`,
Product reconciles all six and records the consolidated Project Start Brief and
Build Brief without a routine second approval; BFM then executes approved scope.

For returning-project health, use \`$fb-lane status\` for the beginner card.
For operational lock inspection, use CLI \`node tools/fb-lane.cjs status --details\`
or MCP \`fb_lane_status({details:true})\`.

- First project, plan, lanes, or approval: [start.md](docs/fb/start.md)
- Ownership, BFM execution, and closeout: [workflow.md](docs/fb/workflow.md)
- Test This Now and Verification Handoff: [evidence.md](docs/fb/evidence.md)
- Sidechat-parent routing and recovery: [guardrails.md](docs/fb/guardrails.md)
  plus [the project sidechat rule](docs/sidechat-parent-thread-routing.md)
- Session intake, promotion, checkpoints, recall, review, and closeout:
  [sessions.md](docs/fb/sessions.md)
- Eval selection, authority, Quality Gaps, and revision loops:
  [evals.md](docs/fb/evals.md)
- Authoritative records, verification reuse, and compact closeout:
  [records.md](docs/fb/records.md)
- Graph-directed targeted reading and safe fallback:
  [graph.md](docs/fb/graph.md)
- Rules-first routing, pairwise QA, layered gates, and bounded configuration
  evolution: [control-loop.md](docs/fb/control-loop.md)

Project-specific instructions and stricter safety rules win.
${FB_HARNESS_ROUTE_END}`;
}

function upsertFbHarnessRoute(existing, route) {
  let searchFrom = 0;
  while (searchFrom < existing.length) {
    const start = existing.indexOf(FB_HARNESS_ROUTE_START, searchFrom);
    if (start === -1) break;
    const contentStart = start + FB_HARNESS_ROUTE_START.length;
    const nextStart = existing.indexOf(FB_HARNESS_ROUTE_START, contentStart);
    const end = existing.indexOf(FB_HARNESS_ROUTE_END, contentStart);
    if (end !== -1 && (nextStart === -1 || end < nextStart)) {
      return `${existing.slice(0, start)}${route}${existing.slice(end + FB_HARNESS_ROUTE_END.length)}`;
    }
    searchFrom = contentStart;
  }

  return `${existing}${existing.endsWith('\n') ? '\n' : '\n\n'}${route}\n`;
}

function installFbHarnessPack(rootDir) {
  const bundledPackDir = path.join(__dirname, '..', 'docs', 'fb');
  const projectPackDir = path.join(rootDir, 'docs', 'fb');
  fs.mkdirSync(projectPackDir, { recursive: true });
  for (const page of FB_HARNESS_PAGES) {
    fs.copyFileSync(path.join(bundledPackDir, page), path.join(projectPackDir, page));
  }
}

function ensureGraphIgnore(rootDir) {
  const ignorePath = path.join(rootDir, '.gitignore');
  const rule = '.fb/graph/';
  const existing = fs.existsSync(ignorePath) ? fs.readFileSync(ignorePath, 'utf8') : '';
  if (existing.split(/\r?\n/).some(line => line.trim() === rule)) return false;
  const separator = existing && !existing.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(ignorePath, `${existing}${separator}${rule}\n`, 'utf8');
  return true;
}

// Main execution parsing
function handleBootstrap(args = []) {
  let options;
  try {
    options = parseBootstrapOptions(args);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  console.log(`🚀 Bootstrapping FB (${options.platform})...\n`);
  const rootDir = process.cwd();

  // 0. Auto-detect project metadata from package.json and git remote URL
  let projectName = path.basename(rootDir);
  let projectDescription = 'A project using FB coordination.';
  const pkgPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) projectName = pkg.name;
      if (pkg.description) projectDescription = pkg.description;
      console.log(`📦 Detected project: "${projectName}" — ${projectDescription}`);
    } catch (err) {
      console.warn('⚠️  Could not parse package.json. Using directory name as project name.');
    }
  } else {
    console.log(`📁 No package.json found. Using folder name: "${projectName}"`);
  }

  let repoUrl = 'https://github.com/example/repo';
  try {
    const gitRemote = runGit('config --get remote.origin.url');
    if (gitRemote) {
      let cleanUrl = gitRemote.trim();
      if (cleanUrl.endsWith('.git')) {
        cleanUrl = cleanUrl.slice(0, -4);
      }
      if (cleanUrl.startsWith('git@')) {
        cleanUrl = cleanUrl.replace(':', '/').replace('git@', 'https://');
      } else if (cleanUrl.startsWith('ssh://git@')) {
        cleanUrl = cleanUrl.replace('ssh://git@', 'https://');
      }
      repoUrl = cleanUrl;
      console.log(`📡 Detected Git Remote URL: ${repoUrl}`);
    }
  } catch (err) {
    // Git remote config not found, or not in a git repository
  }

  const sidechatGuideMarkdown = `### Sidechat-to-Main Prompt Handoff
Sidechats are discussion and planning spaces by default. Use them to ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready handoff for their originating parent main thread. They do not own board updates, handoff files, source changes, commits, validation, or closeout; Product/BFM retains those execution and durable-record responsibilities.

Parent-thread routing is mandatory: read \`docs/sidechat-parent-thread-routing.md\` from the project root. A sidechat may hand off only to its originating parent main thread; never infer another destination from role, project, name, recency, or Product/BFM status. If the parent cannot be identified or reached, return the paste-ready handoff to the user. A non-parent main thread treats it as ordinary user-provided context.

A sidechat prompt is not source of truth until Product/BFM records it in \`PROJECT_BOARD.md\`, the relevant handoff, or durable docs. Keep tiny questions lightweight: no new command, dashboard, \`doctor\` expansion, source behavior, or required ceremony is needed for a quick clarification.

When a sidechat prepares work for Product/BFM, use this output shape:

- Decision summary:
- Scope:
- Out of scope:
- Recommended owner/lane:
- Files/docs likely affected:
- Acceptance criteria:
- Gates/risks:
- Exact instruction for Product/BFM:`;

  // 1. Create PROJECT_BOARD.md if missing
  const boardPath = path.join(rootDir, 'PROJECT_BOARD.md');
  if (!fs.existsSync(boardPath)) {
    const boardTemplate = `# Project Board — ${projectName}
> ${projectDescription}
>
> Approved primary tagline/current model line.

## Statuses
- \`Inbox\`: Newly requested tasks requiring triage.
- \`Ready\`: Triaged tasks, fully scoped, ready to be claimed.
- \`In Progress\`: Tasks currently being worked on by an owner.
- \`Staging QA\`: Candidate awaiting verification. Record the actual local, sandbox, staging, or completed-build environment separately.
- \`Done\`: Checked, verified, and merged to production by FB-Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Ready | FB-Product | Setup | Bootstrap repository files | (None) | [Branch](${repoUrl}/tree/main) \\| [PR #1](${repoUrl}/pull/1) |

---

### TASK-001 - Project Setup & Bootstrap
*   **Status**: Ready
*   **Owner / Thread**: FB-Product
*   **Area**: Setup
*   **Scope**: Create initial files, initialize repository layout.
*   **Out of Scope**: Writing application business logic.
*   **Goal Alignment Session**:
    *   **Objective**: Give Product one ready-to-run FB workspace bootstrap with approved OKRs, generated coordination files, basic commands, and clear next-step guidance.
    *   **Key Results**:
        *   Board, rules, CLI, and handoff folder exist.
        *   \`doctor\` reports no blocking setup errors.
    *   **Definition of Done**: A new contributor can bootstrap the repo, find lane rules, and start the first scoped task without guessing the coordination flow.
    *   **Gate / Review Point**: Product confirms the generated files are coherent enough to move from setup into the first non-trivial task.
    *   **Approval**: approved
    *   **Justification**: Setup work needs a small approved Product/workstream OKR so future lanes can see the expected coordination baseline.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](${repoUrl}/tree/main)
    *   **Staging URL**: [Staging Link](https://staging.example.com)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [ ] Repository structure is clean and follows design guidelines.
    *   [ ] File names and paths are correct.
    *   [ ] Documentation has zero typos or placeholders.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *2026-06-15*: Scoped task and marked ready for execution.

### Workstream-first route
- Start in whichever workstream matches the question whenever planning or evidence is useful. Product/User is selected only for user needs, outcomes, requirements, feedback, acceptance criteria, or product priorities; it is not universal intake.
- Relevant workstreams investigate and create handoffs for ready scope. Approval attaches to that ready scope before \`$bfm\`.
- After the user says \`$bfm\`, Product scans all six, reconciles duplicates, conflicts, dependencies, and priorities, then records the consolidated Project Start Brief and Build Brief without a routine second approval.
- Pause only for a changed decision, disputed priority, sensitive boundary, conflict, or unclear scope. BFM executes and verifies approved scope, stops at Ready to ship, and reserves release for Push Live.

### Goal Alignment Session (non-trivial tasks only)
- Product/BFM owns the approved OKR tree in \`PROJECT_BOARD.md\`: a Product/workstream or BFM-target OKR with \`Objective\`, \`Key Results\`, \`Definition of Done\`, \`Gate / Review Point\`, \`Approval: pending|approved\`, and \`Justification\`, plus stable lane OKRs where relevant.
- Mini-loops produce evidence against existing lane OKRs; they do not create new OKRs.
- OKRs are added or changed only after discussion and explicit user approval. Do not generate a fresh OKR for every task.
- Good: \`Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.\`
- Bad: \`Objective: finish the feature.\`
- Lane handoffs stay compact and use a real heading:
  \`\`\`md
  ## Goal Alignment Session

  Product Goal: <existing approved Product/workstream goal, if known>
  Workstream Goal: <plain-language lane contribution for Product/user approval>
  Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
  User Approval Needed: yes | no
  Mini-loop Evidence: <lane evidence from its smallest real verification loop>
  Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified
  \`\`\`

${sidechatGuideMarkdown}

### Handoff Index
- \`PROJECT_BOARD.md\` stays the source of truth for current status, sequencing, gates, ownership, and file locks.
- \`docs/handoffs/index.md\` is the first-read routing table for handoff discovery.
- Use compact index columns: \`Task / Topic\`, \`Lane\`, \`Status\`, \`Depends / Blocks / Gate\`, \`Checks / Evidence\`, and \`Detail\`.
- Product/BFM should create or refresh the index before non-quick sequencing when handoffs exist and the lookup layer is missing, stale, or too vague.
- Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.
- Open detailed handoffs only when they are relevant to the active task or Product/BFM closeout.

### Proactive Loop Hardening
If Product/BFM sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework, it should propose one small guardrail with observed pattern, cost, benefit, affected files/rules, and approval needed before changing the process. Skip one-off or low-impact issues.

### Awareness, Isolation, Integration
- \`PROJECT_BOARD.md\` and \`docs/handoffs/index.md\` create shared awareness like a standup.
- Branches/worktrees isolate execution like separate desks.
- BFM integrates outcomes like Product/release review.
- Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.
- Before source execution, read board/status/locks and the relevant handoff index.
- During isolated work, name the task, branch/worktree, lane, and locked files.
- At closeout, report whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If checks touched external services, also report test mode, created records/resources, cleanup evidence, or the pending cleanup gate.
`;
    fs.writeFileSync(boardPath, boardTemplate, 'utf8');
    console.log('📝 Created PROJECT_BOARD.md');
  } else {
    console.log('ℹ️  PROJECT_BOARD.md already exists, skipping.');
  }

  // 2. Install the canonical harness and add only a managed route to project-owned instructions.
  const agentsPath = path.join(rootDir, 'AGENTS.md');

  installFbHarnessPack(rootDir);
  console.log('📝 Installed docs/fb/ harness pack.');
  if (ensureGraphIgnore(rootDir)) console.log('📝 Ignored derived .fb/graph/ artifacts.');
  const harnessRoute = fbHarnessRoute();
  if (!fs.existsSync(agentsPath)) {
    fs.writeFileSync(agentsPath, `# Agent & Thread Coordination Rules — ${projectName}\n\n${harnessRoute}\n`, 'utf8');
    console.log('📝 Created AGENTS.md route.');
  } else {
    const existingAgents = fs.readFileSync(agentsPath, 'utf8');
    const updatedAgents = upsertFbHarnessRoute(existingAgents, harnessRoute);
    if (updatedAgents !== existingAgents) fs.writeFileSync(agentsPath, updatedAgents, 'utf8');
    console.log('🔄 Updated managed FB route in AGENTS.md.');
  }

  // 3b. Create docs/handoffs/ directory for handoff files
  const handoffsDir = path.join(rootDir, 'docs', 'handoffs');
  if (!fs.existsSync(handoffsDir)) {
    fs.mkdirSync(handoffsDir, { recursive: true });
    // Write a .gitkeep so the directory is tracked even when empty
    fs.writeFileSync(path.join(handoffsDir, '.gitkeep'), '', 'utf8');
    console.log('📁 Created docs/handoffs/ (lane handoff files go here)');
  } else {
    console.log('ℹ️  docs/handoffs/ already exists, skipping.');
  }
  const handoffIndexPath = path.join(handoffsDir, 'index.md');
  if (!fs.existsSync(handoffIndexPath)) {
    fs.writeFileSync(handoffIndexPath, handoffIndexTemplate(), 'utf8');
    console.log('📝 Created docs/handoffs/index.md (handoff routing index)');
  } else {
    console.log('ℹ️  docs/handoffs/index.md already exists, skipping.');
  }

  const sidechatRoutingPath = path.join(rootDir, 'docs', 'sidechat-parent-thread-routing.md');
  if (!fs.existsSync(sidechatRoutingPath)) {
    fs.writeFileSync(sidechatRoutingPath, sidechatParentThreadRoutingTemplate(), 'utf8');
    console.log('📝 Created docs/sidechat-parent-thread-routing.md');
  } else {
    console.log('ℹ️  docs/sidechat-parent-thread-routing.md already exists, skipping.');
  }

  // 3c. Create per-lane workstream status cards for revisit context.
  const workstreamsDir = path.join(rootDir, 'docs', 'workstreams');
  if (!fs.existsSync(workstreamsDir)) {
    fs.mkdirSync(workstreamsDir, { recursive: true });
    console.log('📁 Created docs/workstreams/ (lane revisit status cards)');
  } else {
    console.log('ℹ️  docs/workstreams/ already exists, skipping.');
  }
  for (const [fileName, laneName] of WORKSTREAM_STATUS_CARDS) {
    const cardPath = path.join(workstreamsDir, fileName);
    if (!fs.existsSync(cardPath)) {
      fs.writeFileSync(cardPath, workstreamStatusCardTemplate(laneName), 'utf8');
      console.log(`📝 Created docs/workstreams/${fileName}`);
    }
  }

  // 3d. Create optional Markdown eval scorecard template for Loop Learning.
  const evalsDir = path.join(rootDir, 'docs', 'evals');
  if (!fs.existsSync(evalsDir)) {
    fs.mkdirSync(evalsDir, { recursive: true });
    console.log('📁 Created docs/evals/ (curated eval records and compatibility scorecards)');
  } else {
    console.log('ℹ️  docs/evals/ already exists, skipping.');
  }
  const scorecardPath = path.join(evalsDir, 'agent-behavior-scorecard-template.md');
  if (!fs.existsSync(scorecardPath)) {
    fs.writeFileSync(scorecardPath, agentBehaviorScorecardTemplate(), 'utf8');
    console.log('📝 Created docs/evals/agent-behavior-scorecard-template.md');
  }
  const evalRecordPath = path.join(evalsDir, 'eval-record-template.md');
  if (!fs.existsSync(evalRecordPath)) {
    fs.writeFileSync(evalRecordPath, evalRecordTemplate(), 'utf8');
    console.log('📝 Created docs/evals/eval-record-template.md');
  }

  // 4. Add or refresh only the managed FB route in Codex rules.
  if (options.includeCodex) {
    const codexDir = path.join(rootDir, '.codex');
    fs.mkdirSync(codexDir, { recursive: true });
    const codexRulesPath = path.join(codexDir, 'rules.md');
    if (!fs.existsSync(codexRulesPath)) {
      fs.writeFileSync(codexRulesPath, `# Codex project rules\n\n${harnessRoute}\n`, 'utf8');
      console.log('📝 Created .codex/rules.md route.');
    } else {
      const existingCodex = fs.readFileSync(codexRulesPath, 'utf8');
      const updatedCodex = upsertFbHarnessRoute(existingCodex, harnessRoute);
      if (updatedCodex !== existingCodex) fs.writeFileSync(codexRulesPath, updatedCodex, 'utf8');
      console.log('🔄 Updated managed FB route in .codex/rules.md.');
    }
  }

  console.log('\n🎉 FB bootstrapped successfully!');
  console.log('======================================================================');
  console.log('🚀 QUICK START GUIDE: HOW TO USE FB RIGHT AWAY');
  console.log('======================================================================');
  console.log('1. Describe your new project normally.');
  console.log('2. FB starts in whichever workstream matches the question; Product/User is only for user and product questions.');
  console.log('3. Relevant workstreams investigate and create ready handoffs.');
  console.log('4. When actionable handoffs are ready, say $bfm. Product scans all six, reconciles and prioritizes, then BFM executes approved scope.');
  console.log('5. BFM stops at Ready to ship. Only Push Live authorizes release.');
  console.log('======================================================================');
  console.log('👉 Codex: Start a new thread, describe a new project normally, or use `$fb-lane status` for returning-project health.');
  console.log('👉 For detailed rules, boundaries, and manual commands, check AGENTS.md.\n');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : '';

  if (command === 'session') {
    try {
      runSessionCommand(args.slice(1));
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  } else if (command === 'mcp') {
    runMcpServer();
  } else if (command === 'status') {
    handleStatus({ details: args.includes('--details') });
  } else if (command === 'doctor') {
    handleDoctor();
  } else if (command === 'bootstrap') {
    handleBootstrap(args.slice(1));
  } else if (command === 'claim') {
    const rest = args.slice(1);
    const noWorktree = rest.includes('--no-worktree');
    const positional = rest.filter(a => a !== '--worktree' && a !== '-w' && a !== '--no-worktree');
    const taskId = positional[0];
    const lane = positional[1];
    const locks = positional[2];
    if (!taskId || !lane) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs claim <task-id> <lane> [locked_files] [--no-worktree]');
      process.exit(1);
    }
    handleClaim(taskId, lane, locks, { worktree: !noWorktree });
  } else if (command === 'submit') {
    const taskId = args[1];
    const bypassRequested = args.includes('--no-tests');
    const stagingUrl = args.slice(2).find(arg => arg !== '--no-tests') || '';
    if (!taskId) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs submit <task-id> [staging_url] [--no-tests]');
      process.exit(1);
    }
    handleSubmit(taskId, stagingUrl, { bypassRequested });
  } else if (command === 'quick') {
    const quickArgs = args.slice(1);
    const noWorktree = quickArgs.includes('--no-worktree');
    const approvalIndex = quickArgs.indexOf('--approval-ref');
    const approvalReference = approvalIndex >= 0 && !String(quickArgs[approvalIndex + 1] || '').startsWith('--') ? quickArgs[approvalIndex + 1] : '';
    const positional = quickArgs.filter((arg, index) => arg !== '--worktree' && arg !== '-w' && arg !== '--no-worktree' && arg !== '--approval-ref' && (approvalIndex < 0 || index !== approvalIndex + 1));
    const lane = positional[0];
    const lockedFiles = positional[1];
    const scope = positional.slice(2).join(' ');
    if (!lane || !lockedFiles) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs quick <lane> <locked_files> <scope_description> --approval-ref <reference>');
      process.exit(1);
    }
    handleQuick(lane, lockedFiles, scope, { worktree: !noWorktree, approvalReference });
  } else if (command === 'merge') {
    const taskId = args[1];
    if (!taskId) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs merge <task-id>');
      process.exit(1);
    }
    handleMerge(taskId);
  } else {
    console.log(`
🤖 FB-Lane Automation Tool
==========================
Usage:
  ${sessionUsage()}
  node tools/fb-lane.cjs bootstrap [--platform codex]   - Bootstrap project board, rules, tools, and folders
  node tools/fb-lane.cjs doctor                         - Check FB-Lane setup health without writing files
  node tools/fb-lane.cjs status [--details]             - Print the beginner status card or raw technical table
  node tools/fb-lane.cjs claim <id> <lane> [locks]      - Claim task in a linked worktree by default
  node tools/fb-lane.cjs claim ... --no-worktree        - Use the legacy single-checkout compatibility path
  node tools/fb-lane.cjs quick <lane> <locks> <desc> --approval-ref <reference> - Create an approved quick task in a linked worktree
  node tools/fb-lane.cjs submit <id> [url] [--no-tests] - Run tests, submit task, update board, push branch
  node tools/fb-lane.cjs merge <id>                     - Merge branch to main, release locks, delete branch
  node tools/fb-lane.cjs mcp                            - Run local Model Context Protocol (MCP) server
`);
  }
}

// Only run the CLI when executed directly. When required as a module (e.g. by
// the regression tests) the hardened helpers are exported instead, so they can
// be exercised without spawning a shell or touching git.
if (require.main === module) {
  main();
}

module.exports = {
  runGit,
  assertSafeTaskId,
  assertSafeLane,
  assertSafeBranchName,
  visibleStageFor,
  performAutomatedSubmission,
  formatAutomatedSubmission,
  resolveSubmissionSafetyGate,
  selectStatusTarget,
  renderBeginnerStatus,
  renderTechnicalStatus,
  classifyBfmClass,
  parseWorktreePorcelain,
  resolveWorktreePlan,
  renderQueueSummary,
  TASK_ID_PATTERN,
  LANE_PATTERN,
  scanWorkstreamHandoffs,
};
