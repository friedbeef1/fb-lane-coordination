#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const readline = require('readline');

const FB_MODEL_LINE = ['FB 0.2.0-beta:', 'AI', 'Loop', 'Engineering', 'for', 'Everyday', 'People'].join(' ');

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
      `Invalid lane ${JSON.stringify(lane)}: expected a name like "Tech", "Design", "Product" or "Business".`
    );
  }
  return lane;
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
lane: fb-product | fb-tech | fb-design | fb-business
status: ready | implemented | blocked | deferred | done
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
  ['fb-business.md', 'FB-Business']
];

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

  return {
    raw: detailStr,
    status: statusMatch ? statusMatch[1].trim() : '',
    owner: ownerMatch ? ownerMatch[1].trim() : '',
    area: areaMatch ? areaMatch[1].trim() : '',
    scope: scopeMatch ? scopeMatch[1].trim() : '',
    lockedFiles: lockedFilesMatch ? lockedFilesMatch[1].trim() : '',
    screens: screensMatch ? screensMatch[1].trim() : ''
  };
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
function handleStatus() {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found in this workspace.');
    process.exit(1);
  }
  const { tasks } = parseBoard(boardPath);
  console.log('\n📋 Active Workstreams:');
  console.log('='.repeat(80));
  tasks.forEach(t => {
    console.log(`[${t.id}] - ${t.status.padEnd(12)} | ${t.owner.padEnd(12)} | Area: ${t.area.padEnd(8)} | Scope: ${t.scope}`);
    if (t.locks && t.locks !== '(None)' && t.locks !== '') {
      console.log(`       🔒 Locks: ${t.locks}`);
    }
  });
  console.log('='.repeat(80) + '\n');
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
  if (options.worktree) {
    // Worktree mode: leave the primary checkout (FB-Product) where it is so the board stays
    // authoritative here, and give this execution worker its own directory on its own branch off main.
    const repoRoot = runGit('rev-parse --show-toplevel');
    const repoBase = path.basename(repoRoot);
    worktreePath = path.resolve(repoRoot, '..', `${repoBase}-${lane.toLowerCase()}-${taskId}`);
    let baseRef = 'main';
    try {
      runGit('fetch origin main');
      runGit('rev-parse --verify origin/main');
      baseRef = 'origin/main';
    } catch (err) {
      console.warn('⚠️  Could not fetch origin/main; basing the worktree on local main.');
    }
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

  // Commit board separately
  commitBoard(`docs: claim ${taskId} and lock files`);

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
function handleQuick(lane, lockedFiles, scopeDescription = 'Quick Edit') {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
    process.exit(1);
  }

  try {
    runHook('pre-claim', boardPath);
  } catch (err) {
    console.error(`❌ Hook pre-claim failed: ${err.message}`);
    process.exit(1);
  }

  if (!lane || !lockedFiles) {
    console.error('❌ Error: Usage: node tools/fb-lane.cjs quick <lane> <locked_files> [scope_description]');
    process.exit(1);
  }

  const normLane = lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase();
  if (!['Tech', 'Design', 'Business', 'Product'].includes(normLane)) {
    console.error('❌ Error: Invalid lane. Must be Tech, Design, Business, or Product.');
    process.exit(1);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
  const taskId = `TASK-Q-${timestamp}`;
  const owner = `FB-${normLane}`;
  const area = 'Quick-Fix';

  // Format branch name
  const slug = scopeDescription.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const branchName = `quick/${taskId}-${slug}`;

  // Run git checkout
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

  // Resolve Git remote URL
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
    }
  } catch (err) {}

  // Format locks
  const formattedLocks = lockedFiles.split(',').map(f => `\`${f.trim()}\``).join(', ');

  // Add to board
  const taskRecord = {
    id: taskId,
    status: 'In Progress',
    owner: owner,
    area: area,
    scope: scopeDescription,
    locks: formattedLocks,
    lockedFiles: formattedLocks,
    links: `[Branch](${repoUrl}/tree/${branchName})`,
    repoUrl: repoUrl,
    branchName: branchName
  };

  addTaskToBoard(boardPath, taskRecord);

  // Commit board separately
  commitBoard(`docs: quick-claim ${taskId} and lock files`);

  // Write local Codex context file
  const codexDir = path.join(path.dirname(boardPath), '.codex');
  if (!fs.existsSync(codexDir)) {
    fs.mkdirSync(codexDir);
  }
  const contextContent = `# Active Task Context
* **Current Task**: ${taskId}
* **Lane**: ${owner}
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
  console.log(`   - Board updated & committed separately.`);
  console.log(`   - Codex Desktop context written to .codex/current_task.md`);
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

function handleSubmit(taskId, stagingUrl = '') {
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

  const noTests = process.argv.includes('--no-tests');

  if (!noTests) {
    try {
      runTests(boardPath);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      console.error(`👉 Use --no-tests flag if you need to bypass tests temporarily.\n`);
      process.exit(1);
    }
  } else {
    console.log('⚠️  Bypassing local test run (--no-tests flag detected)...');
  }

  try {
    runHook('pre-submit', boardPath);
  } catch (err) {
    console.error(`❌ Hook pre-submit failed: ${err.message}`);
    process.exit(1);
  }

  let currentBranch;
  try {
    currentBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  } catch (err) {
    currentBranch = runGit(['branch', '--show-current']);
  }
  console.log(`Submitting task ${taskId} from branch ${currentBranch}...`);

  // Update board
  const updates = { status: 'Staging QA' };
  if (stagingUrl) {
    updates.stagingUrl = `[Staging Link](${stagingUrl})`;
  }
  updateBoardTask(boardPath, taskId, updates);

  // Commit board separately
  commitBoard(`docs: submit ${taskId} for staging qa`);

  // Push branch
  console.log('Pushing feature branch to origin...');
  runGit('push origin HEAD');

  console.log(`\n✅ Task ${taskId} submitted for Staging QA!`);
  console.log(`   - Board updated and committed.`);
  console.log(`   - Branch pushed to remote.`);
  console.log(`\n👉 Request FB-Product to review the build and merge. Review instructions copied to clipboard!`);

  const reviewPrompt = `${taskId} is ready for review on Staging.
Staging URL: ${stagingUrl || 'Local / CI Build'}
Please review the changes and run the merge command:
node tools/fb-lane.cjs merge ${taskId}`;
  copyToClipboard(reviewPrompt);

  try {
    runHook('post-submit', boardPath);
  } catch (err) {
    console.error(`❌ Hook post-submit failed: ${err.message}`);
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
          description: 'Get the current status of the project board, active tasks, and file locks.',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: { type: 'string', description: 'Optional workspace/repo path to search for PROJECT_BOARD.md from.' }
            }
          }
        },
        {
          name: 'fb_lane_claim',
          description: 'Claim a task from the board, checkout a feature branch, lock files, and commit the board update.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The task ID, e.g. TASK-001' },
              lane: { type: 'string', enum: ['Tech', 'Design', 'Business', 'Product'], description: 'The lane claiming the task' },
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
      const boardPath = findBoardPath(resolveWorkspaceStart(toolArgs));
      if (!boardPath) {
        throw new Error('PROJECT_BOARD.md not found.');
      }
      const workspaceRoot = path.dirname(boardPath);
      const previousCwd = process.cwd();
      process.chdir(workspaceRoot);

      try {
        if (name === 'fb_lane_status') {
          const { tasks } = parseBoard(boardPath);
          message = `Workspace: ${workspaceRoot}\nActive Workstreams:\n` + tasks.map(t =>
            `[${t.id}] Status: ${t.status} | Owner: ${t.owner} | Locks: ${t.locks || 'None'} | Scope: ${t.scope}`
          ).join('\n');
        } else if (name === 'fb_lane_claim') {
          const { taskId, lane, lockedFiles } = toolArgs;
          assertSafeTaskId(taskId);
          assertSafeLane(lane);

          runHook('pre-claim', boardPath);

          // Run core claim logic
          const { tasks } = parseBoard(boardPath);
          const task = tasks.find(t => t.id === taskId);
          if (!task) throw new Error(`Task ${taskId} not found.`);

          const slug = task.scope.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const branchName = `${lane.toLowerCase()}/${taskId}-${slug}`;

          try {
            runGit(["checkout", "-b", assertSafeBranchName(branchName)]);
          } catch (e) {
            runGit(["checkout", assertSafeBranchName(branchName)]);
          }

          const formattedLocks = !lockedFiles ? '(None)' : lockedFiles.split(',').map(f => `\`${f.trim()}\``).join(', ');

          updateBoardTask(boardPath, taskId, {
            status: 'In Progress',
            owner: `FB-${lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase()}`,
            locks: formattedLocks,
            lockedFiles: formattedLocks
          });

          commitBoard(`docs: claim ${taskId} and lock files`);

          // Write Codex context
          const codexDir = path.join(path.dirname(boardPath), '.codex');
          if (!fs.existsSync(codexDir)) fs.mkdirSync(codexDir);
          fs.writeFileSync(path.join(codexDir, 'current_task.md'), `# Context\nTask: ${taskId}\nBranch: ${branchName}`, 'utf8');

          runHook('post-claim', boardPath);

          message = `Successfully claimed ${taskId} on branch ${branchName}. Locks: ${formattedLocks}.`;
        } else if (name === 'fb_lane_submit') {
          const { taskId, stagingUrl } = toolArgs;
          assertSafeTaskId(taskId);

          runHook('pre-submit', boardPath);

          // Run local tests first under MCP
          runTests(boardPath);

          const updates = { status: 'Staging QA' };
          if (stagingUrl) updates.stagingUrl = `[Staging Link](${stagingUrl})`;

          updateBoardTask(boardPath, taskId, updates);
          commitBoard(`docs: submit ${taskId} for staging qa`);
          runGit('push origin HEAD');

          runHook('post-submit', boardPath);

          message = `Successfully submitted ${taskId} for Staging QA. Branch pushed.`;
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

      return sendMcpResponse(id, {
        content: [
          {
            type: 'text',
            text: message
          }
        ]
      });
    } catch (err) {
      return sendMcpResponse(id, null, {
        code: -32603,
        message: err.message
      });
    }
  }

  // Ignore other JSON-RPC methods (like notifications)
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

  const firstProjectContract = `## Project Start Brief
For a first project or new non-trivial objective, Product starts with:
- **What you asked for:** <plain-language outcome>
- **Your decisions:** <choices already made>
- **Assumptions to confirm:** <only assumptions that could change the plan>
- **Success looks like:** <observable outcome and review evidence>
- **Progress:** Understanding your idea → Ready for your approval → Building → Checking → Complete
- **Blocked:** Blocked — <reason> / next action
- **What FB will plan:** <bounded planning work>
- **Out of scope:** <explicit exclusions>
- **Next action:** <one immediate Product action or user decision>

## How FB works
1. Lanes investigate and plan different parts.
2. Product combines findings into one build brief.
3. You approve the brief.
4. Only after explicit \`$bfm\`, BFM builds and checks it.

## Test This Now
For review, provide Outcome type, Direct links, Exact steps and expectations, Pass criteria, Known limits, and a Failure-report format (what happened, what was expected, link or screenshot, and environment). If review access is missing, say \`Status: blocked — review access is missing\`, not ready to test.`;

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
- \`Staging QA\`: Features deployed to staging, awaiting visual/functional verification.
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

### Mode Selection Trigger Rule
- Default to normal/simple coding unless the objective has a coordination trigger. Use FB light for handoffs, board/lane/BFM/Product/Design/Business mentions, coordination files, board locks, multiple threads/agents/workstreams, or durable context. Escalate to Product/BFM for build/sequence/defer/approve/merge/release decisions, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets/deploy/staging/live, camera/capture/save/export or another core product flow, or multiple lane outputs that must be reconciled before source changes.
- Keep quick tasks lightweight: read board/locks, claim or note only exact files needed, and skip extra ceremony unless another lane or Product must continue it.

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

  // 2. Create AGENTS.md if missing
  const agentsPath = path.join(rootDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    const agentsTemplate = `# Agent & Thread Coordination Rules — ${projectName}

> ${FB_MODEL_LINE}

This project uses the standard **FB Four-Lane Coordination Model** to enable safe concurrent development.

${firstProjectContract}

### 0. Mode Selection Trigger Rule
- Default to normal/simple coding unless the objective has a coordination trigger. Use FB light for handoffs, board/lane/BFM/Product/Design/Business mentions, coordination files, board locks, multiple threads/agents/workstreams, or durable context. Escalate to Product/BFM for build/sequence/defer/approve/merge/release decisions, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets/deploy/staging/live, camera/capture/save/export or another core product flow, or multiple lane outputs that must be reconciled before source changes.
- Keep quick tasks lightweight: read board/locks, claim or note only exact files needed, and skip extra ceremony unless another lane or Product must continue it.

### 1. Lane Scopes & Boundaries
*   **FB-Product (PM / Integration User Value)**: Owns final product decisions, task prioritization, scoping, BFM launch, staging/live deployments, and release gates. Product owns the approved Product/workstream or BFM-target OKR plus relevant stable lane OKRs in \`PROJECT_BOARD.md\`. Product is read-only on application/source code and may write coordination markdown only. Source changes happen only inside a Product-launched BFM execution run.
*   **Completion Audit Rule**: Product reports delivered work, lane-specific verification, unresolved gates, and one loop health flag (\`healthy\`, \`watch\`, \`needs Product review\`, or \`blocked\`) as separate statuses for every lane. Do not call any workstream "done" or "executed" unless required evidence exists; otherwise mark the missing gate as pending or blocked.
*   **FB-Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, database security, configuration scripts, and unit/integration test suites. *Does not make styling, layout geometry, or UI changes.*
*   **FB-Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
*   **FB-Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only capacity.*
*   **Passive Closeout Notes**: Every lane leaves a final informational note in its thread when it stops work. The note records task ID, status, delivered work, evidence, remaining gates, and handoff path; Product/BFM closeouts also record one loop health flag. After Product/BFM executes, merges, rejects, or explicitly defers a handoff, update the detailed handoff with \`## Product/BFM Closeout\` including Status, Actioned By, Result, Evidence, Remaining, Closeout Note, and Loop Learning. Notes must avoid commands, @/$ invocations, or instructions to open, start, run, or ask another lane.
*   **Goal Alignment Session**: For non-trivial work, Product/BFM owns the approved OKR tree in the board detail block: a Product/workstream or BFM-target OKR plus stable lane OKRs where relevant. Worker lanes report \`Product Goal\`, \`Workstream Goal\`, \`Lane OKR Fit\`, \`User Approval Needed\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\` in handoffs instead of rewriting OKRs. \`/goal\` is a Product/BFM shortcut into the same session; workstreams do not own it. Do not generate a fresh OKR for every task. Good objective: \`Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.\` Bad objective: \`Objective: finish the feature.\` Skip this extra ceremony for \`TASK-Q-*\` quick tasks.
*   **Handoff Index**: \`PROJECT_BOARD.md\` is truth for status, sequencing, gates, ownership, and file locks. \`docs/handoffs/index.md\` is routing. Detailed handoffs are detail. Before non-quick Product/BFM sequencing, create or refresh the index if handoffs exist and the lookup is missing, stale, or too vague. Keep the index compact with \`Task / Topic\`, \`Lane\`, \`Status\`, \`Depends / Blocks / Gate\`, \`Checks / Evidence\`, and \`Detail\`; do not put full OKRs, QA checklists, plans, logs, rationale, copy variants, or implementation detail there.
*   **Workstream Status Cards**: \`docs/workstreams/<lane>.md\` is a compact revisit summary, not a second board. Product/BFM updates the detailed handoff with \`## Product/BFM Closeout\`, then updates the relevant card after executing or explicitly deferring a lane handoff. Returning lanes read \`PROJECT_BOARD.md\`, \`docs/handoffs/index.md\`, then their lane card before opening detailed handoffs. Cards show current summary, what Product/BFM already executed, what remains pending or blocked, and evidence links only.
*   **Awareness, Isolation, Integration**: \`PROJECT_BOARD.md\` and \`docs/handoffs/index.md\` create shared awareness like a standup; branches/worktrees isolate execution like separate desks; BFM integrates outcomes like Product/release review. Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.
*   **Sidechat-to-Main Prompt Handoff**: Sidechats are discussion and planning spaces by default. Use them to ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready handoff for their originating parent main thread. They do not own board updates, handoff files, source changes, commits, validation, or closeout; Product/BFM retains those execution and durable-record responsibilities. Read \`docs/sidechat-parent-thread-routing.md\`: a sidechat may hand off only to its originating parent main thread, never chooses another destination by role, project, name, recency, or Product/BFM status, and returns the paste-ready handoff to the user if the parent is unavailable. A non-parent main treats it as ordinary user-provided context. A sidechat prompt is not source of truth until Product/BFM records it in \`PROJECT_BOARD.md\`, the relevant handoff, or durable docs. Keep tiny questions lightweight: no command, dashboard, \`doctor\` expansion, source behavior, or required ceremony is needed for quick clarification. Sidechat output format: Decision summary, Scope, Out of scope, Recommended owner/lane, Files/docs likely affected, Acceptance criteria, Gates/risks, Exact instruction for Product/BFM.
*   **BFM OKR Gate**: BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree. If work conflicts with approved OKRs, BFM proposes aligned approaches, scope, or sequence and recommends one; it does not dynamically create or edit OKRs during execution.
*   **BFM Return Loop**: When Product/BFM processes all lane handoffs, every handoff must be marked \`implemented\`, \`already done\`, \`blocked\`, \`out of scope\`, or \`explicitly deferred\`. Return to board, handoffs, source/docs/tests, lane status, and git status before closeout. Name whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If checks touched external services, also name test mode, created records/resources, cleanup evidence, or the pending cleanup gate. Add one loop health flag: \`healthy\`, \`watch\`, \`needs Product review\`, or \`blocked\`; do not numeric-score the loop.
*   **Verification Handoff**: Before asking the user to test, add \`## Verification Handoff\` to the task handoff with the candidate branch or commit, a Test plan: link, exact commands, environment, results, runnable evidence links, manual pass criteria, and any recovery attempted. Record the Next Product/BFM recovery action and complete safe recovery before involving the user. A missing or stalled check remains pending or blocked; ask the user only for a real approval or external manual, device, or account gate.
*   **Workspace Recovery**: When Git, file reads, worktrees, or test runners repeatedly stall or return implausible data, run a bounded workspace-health preflight before further claims. Check available disk capacity against a documented project threshold; unless a stricter policy is documented, use a 15 GiB free-capacity threshold. Also check File Provider or synchronized-storage ancestry where relevant, stable double-read hashes for representative files, and bounded Git status/diff probes with a 15-second timeout per probe. On a second consecutive failure in the same checkout, stop using it and enter clean-clone recovery. Preserve commits and explicitly owned artifacts through normal Git operations; never copy damaged .git, index, or worktree metadata, and never treat manual object plumbing or an unbounded temporary runner as passing evidence.
*   **Proactive Loop Hardening**: When repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework appears, Product/BFM proposes one small guardrail with observed pattern, cost, benefit, affected files/rules, and approval needed before changing the process. Skip one-off or low-impact issues.

### 2. The Board Loop & Resource Locking
1. **Plan**: Product scopes the item; workstreams produce markdown plans or handoffs instead of editing source. For non-trivial work Product reads existing approved OKRs first, proposes only missing Product/workstream or lane OKRs needed for clarity, asks the user to approve them, and starts execution only after marking \`Approval: approved\`. Do not generate a fresh OKR for every task. \`TASK-Q-*\` quick tasks can skip this extra ceremony.
2. **Execute**: Product launches BFM. BFM execution workers confirm board/status/locks plus the relevant handoff index, claim task/files on the board, and work in named isolated branches or worktrees (\`bfm/[feature]\`, \`tech/[feature]\`, or \`design/[feature]\`).
3. **Audit**: When complete, the BFM execution worker pushes the branch, moves the board item to \`Staging QA\` using \`node tools/fb-lane.cjs submit\`, records delivered work, lane-specific verification, unresolved gates, task, branch/worktree, lane, locked files, branch/worktree state, plus a \`## Goal Alignment Session\` handoff section with \`Product Goal\`, \`Workstream Goal\`, \`Lane OKR Fit\`, \`User Approval Needed\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\`, and leaves a passive closeout note.
4. **Merge**: \`FB-Product\` runs verification/release gates, reconciles lane \`Workstream Goal\`, \`Lane OKR Fit\`, \`User Approval Needed\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\` before merge, verifies required evidence for every lane, merges the branch to main using \`node tools/fb-lane.cjs merge\`, and releases locks.
5. **Revisit Summary**: Product/BFM updates the detailed handoff with \`## Product/BFM Closeout\`, then refreshes the relevant \`docs/workstreams/<lane>.md\` card after execution or explicit deferral so returning lane threads can see what already happened without rereading every detailed handoff.
`;
    fs.writeFileSync(agentsPath, agentsTemplate, 'utf8');
    console.log('📝 Created AGENTS.md');
  } else {
    console.log('ℹ️  AGENTS.md already exists, skipping.');
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
    console.log('📁 Created docs/evals/ (optional agent-behavior scorecards)');
  } else {
    console.log('ℹ️  docs/evals/ already exists, skipping.');
  }
  const scorecardPath = path.join(evalsDir, 'agent-behavior-scorecard-template.md');
  if (!fs.existsSync(scorecardPath)) {
    fs.writeFileSync(scorecardPath, agentBehaviorScorecardTemplate(), 'utf8');
    console.log('📝 Created docs/evals/agent-behavior-scorecard-template.md');
  }

  // 4. Inject FB-Lane section into .codex/rules.md (non-destructive)
  if (options.includeCodex) {
    const codexDir = path.join(rootDir, '.codex');
    if (!fs.existsSync(codexDir)) {
      fs.mkdirSync(codexDir);
    }
    const codexRulesPath = path.join(codexDir, 'rules.md');
    const CODEX_FB_START = '<!-- fb-lane-start -->';
    const CODEX_FB_END = '<!-- fb-lane-end -->';
    const codexFbBlock = `${CODEX_FB_START}
## FB Coordination

> ${FB_MODEL_LINE}

This project uses the FB Four-Lane Coordination Model.

${firstProjectContract}

### Mode selection
Default to normal/simple coding unless the objective has a coordination trigger. Use FB light for handoffs, board/lane/BFM/Product/Design/Business mentions, coordination files, board locks, multiple threads/agents/workstreams, or durable context. Escalate to Product/BFM for build/sequence/defer/approve/merge/release decisions, pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets/deploy/staging/live, camera/capture/save/export or another core product flow, or multiple lane outputs that must be reconciled before source changes.

### On every session start
1. Read \`PROJECT_BOARD.md\` — check active tasks and file locks.
2. Read \`.codex/current_task.md\` if it exists — it contains your task ID, branch, and locked files. Follow it exactly.
3. Confirm your active branch matches the task. If not, stop and notify the user.
4. Never modify files that are locked by another active task.
5. For handoff discovery, read \`docs/handoffs/index.md\` first and open only the relevant detailed handoff files. If non-quick handoffs exist and the index is missing, stale, or too vague, Product/BFM should create or refresh the compact lookup before sequencing.
6. For lane revisit status, read \`docs/workstreams/<lane>.md\` after the board and handoff index. Treat it as a summary only, not truth.
7. Before source execution, confirm board/status/locks and the relevant handoff index.

### Lane boundaries
- **FB-Tech**: backend, APIs, schemas, tests only. Never touch CSS or layout.
- **FB-Design**: CSS, tokens, layout only. Never touch backend logic or schemas.
- **FB-Business**: read-only on source code. Write to markdown docs only.
- **FB-Product**: direction, sequencing, BFM launch, integration, merges, and deployments. Product is read-only on application/source code and may write coordination markdown only.
- **All workstreams**: plan-only by default. They may ask questions, investigate, and write markdown plans/handoffs. Source changes happen only inside a Product-launched BFM execution run.
- **Workstream status cards**: Product/BFM updates the detailed handoff with \`## Product/BFM Closeout\`, then refreshes \`docs/workstreams/<lane>.md\` after executing or explicitly deferring a lane handoff. Returning lanes use it to report already-executed work, pending or blocked work, and evidence links without reopening every detailed handoff.

### Awareness, isolation, integration
- \`PROJECT_BOARD.md\` and \`docs/handoffs/index.md\` create shared awareness like a standup.
- \`docs/workstreams/<lane>.md\` adds a compact revisit summary; it must not duplicate the board, OKRs, QA logs, plans, or implementation detail.
- Branches/worktrees isolate execution like separate desks.
- BFM integrates outcomes like Product/release review.
- Worktrees do not replace coordination: no private-worktree disappearance, no huge unannounced diff, no source edits without board/lock awareness, and no closeout without BFM reconciliation when multiple outputs exist.

${sidechatGuideMarkdown}

### Goal Alignment Session
- For non-trivial work, FB-Product/BFM owns the approved OKR tree in \`PROJECT_BOARD.md\`: a Product/workstream or BFM-target OKR plus stable lane OKRs where relevant.
- BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree.
- If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKR tree and recommends one; it does not dynamically create or edit OKRs during execution.
- Lane handoffs include \`## Goal Alignment Session\`, \`Product Goal\`, \`Workstream Goal\`, \`Lane OKR Fit\`, \`User Approval Needed\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\`.
- Reuse or clarify approved OKRs; do not generate one per task. Skip this ceremony for \`TASK-Q-*\` quick tasks.

### BFM return loop
- When processing all lane handoffs, Product/BFM must mark every handoff \`implemented\`, \`already done\`, \`blocked\`, \`out of scope\`, or \`explicitly deferred\`.
- Return to \`PROJECT_BOARD.md\` after reading handoffs, to each handoff after coding, to source/docs/board after tests, to lane status after board/doc updates, and to \`git status\` after commit/push.
- During isolated work, name the task, branch/worktree, lane, and locked files.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded. Report whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty. If intentionally dirty, record exact files, owner, reason, next gate, and session-boundary action on PROJECT_BOARD.md; at the next session boundary, Product/BFM must continue that task, commit it, revert it, archive it into a handoff, or mark it blocked/deferred before starting new source work. If checks touched external services, also report test mode, created records/resources, cleanup evidence, or the pending cleanup gate.
- Add one loop health flag at closeout: \`healthy\`, \`watch\`, \`needs Product review\`, or \`blocked\`. Do not numeric-score the loop.
- Add \`Loop Learning\` at closeout: feedback captured, repeated pattern (\`no|yes\`), tooling needed (\`none|propose guardrail|propose automation|propose eval\`), and Product approval needed (\`no|yes\`).

### Verification Handoff
- Before asking the user to test, add \`## Verification Handoff\` to the task handoff with the candidate branch or commit, a Test plan: link, exact commands, environment, results, runnable evidence links, manual pass criteria, and any recovery attempted.
- Record the Next Product/BFM recovery action and complete safe recovery before involving the user. A missing or stalled check remains pending or blocked; ask the user only for a real approval or external manual, device, or account gate.
- Workspace recovery: when Git, file reads, worktrees, or test runners repeatedly stall or return implausible data, run a bounded workspace-health preflight before further claims. Check available disk capacity against a documented project threshold; unless a stricter policy is documented, use a 15 GiB free-capacity threshold. Also check File Provider or synchronized-storage ancestry where relevant, stable double-read hashes for representative files, and bounded Git status/diff probes with a 15-second timeout per probe. On a second consecutive failure in the same checkout, stop using it and enter clean-clone recovery. Preserve commits and explicitly owned artifacts through normal Git operations; never copy damaged .git, index, or worktree metadata, and never treat manual object plumbing or an unbounded temporary runner as passing evidence.

### Proactive loop hardening
- Product/BFM should proactively propose one small guardrail when it sees repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework.
- Proposal format: observed pattern, recommended guardrail, cost, benefit, files/rules affected, and approval needed.
- Use \`Loop Learning\` as the escalation trigger: \`none\`, \`propose guardrail\`, \`propose automation\`, or \`propose eval\`.
- When \`Loop Learning\` chooses \`propose eval\`, use \`docs/evals/agent-behavior-scorecard-template.md\` as a small Markdown scorecard. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger \`doctor\` rules unless Product/BFM separately proposes that heavier option with pros/cons and the user explicitly approves it.
- Approval autonomy is phased. Start in Shadow Approval: ask the user, but record \`Would self-approve: yes/no\` and the reason. Product/BFM may recommend Phase 2 after one day or three matching decisions with no material miss, and Phase 3 after five safe self-approvals with no rollback, stale dirty state, or hidden gate; the user approves phase changes. Workstreams may mark \`safe to auto-accept\`, but Product/BFM owns actual self-approval. Never self-approve new scope, new OKRs, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.
- Once the user approves a safe Product/BFM task or problem, Product/BFM keeps going through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked. When the user says BFM, Product/BFM flags blockers, recommends how to address them, executes the recommended safe unblock path inside the approved scope, and keeps looping until every task is done, explicitly deferred, out of scope, or blocked by a real stop point. Report after closeout, not before every routine step. Stop for live deploy, secrets/credentials, payments, auth/privacy, destructive data or provider-state changes, new scope or OKR changes, unclear goals, active lock conflicts, failed evidence needing risk acceptance, physical-device/manual external actions, or an explicit pause.
- Do not silently mutate the process. Skip one-off or low-impact issues.

### CLI commands (run from project root)
- \`node tools/fb-lane.cjs status\` — view all tasks and locks
- \`node tools/fb-lane.cjs claim <id> <lane>\` — BFM execution worker claims task, checkout branch, lock files
- \`node tools/fb-lane.cjs submit <id>\` — run tests, push branch, mark Staging QA
- \`node tools/fb-lane.cjs merge <id>\` — merge to main, release locks (FB-Product only)

### Rules
- Never commit directly to \`main\`.
- Commit \`PROJECT_BOARD.md\` updates in a separate commit from code changes.
- Max 5 debug retries before marking task \`Blocked\` and notifying the user.
- If tests, builds, browser checks, \`git add\`, or \`.git/*.lock\` files stall Product, record \`pending-gate\` or \`blocked\` and return execution to BFM sequencing.
${CODEX_FB_END}`;

    if (!fs.existsSync(codexRulesPath)) {
      fs.writeFileSync(codexRulesPath, codexFbBlock + '\n', 'utf8');
      console.log('📝 Created .codex/rules.md with FB section.');
    } else {
      const existingCodex = fs.readFileSync(codexRulesPath, 'utf8');
      if (existingCodex.includes(CODEX_FB_START)) {
        // Update in-place — idempotent
        const updatedCodex = existingCodex.replace(
          new RegExp(`${CODEX_FB_START}[\\s\\S]*?${CODEX_FB_END}`),
          codexFbBlock
        );
        fs.writeFileSync(codexRulesPath, updatedCodex, 'utf8');
        console.log('🔄 Updated existing FB section in .codex/rules.md.');
      } else {
        // Append — never overwrite user's existing rules
        const appendedCodex = existingCodex.trimEnd() + '\n\n---\n\n' + codexFbBlock + '\n';
        fs.writeFileSync(codexRulesPath, appendedCodex, 'utf8');
        console.log('✅ Appended FB section to your existing .codex/rules.md.');
      }
    }
  } else {
    console.log('ℹ️  Skipping Codex rules for this platform.');
  }

  console.log('\n🎉 FB bootstrapped successfully!');
  console.log('======================================================================');
  console.log('🚀 QUICK START GUIDE: HOW TO USE FB RIGHT AWAY');
  console.log('======================================================================');
  console.log('1. Describe your new project normally. FB returns a Project Start Brief.');
  console.log('2. Lanes investigate and plan different parts; Product combines findings into one build brief.');
  console.log('3. You approve the brief. Only after explicit $bfm, BFM builds and checks it.');
  console.log('4. Use $fb-lane status for returning project health: active work, locks, and next coordination context.');
  console.log('======================================================================');
  console.log('👉 Codex: Start a new thread, describe a new project normally, or use `$fb-lane status` for returning-project health.');
  console.log('👉 For detailed rules, boundaries, and manual commands, check AGENTS.md.\n');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : '';

  if (command === 'mcp') {
    runMcpServer();
  } else if (command === 'status') {
    handleStatus();
  } else if (command === 'doctor') {
    handleDoctor();
  } else if (command === 'bootstrap') {
    handleBootstrap(args.slice(1));
  } else if (command === 'claim') {
    const rest = args.slice(1);
    const useWorktree = rest.some(a => a === '--worktree' || a === '-w');
    const positional = rest.filter(a => a !== '--worktree' && a !== '-w');
    const taskId = positional[0];
    const lane = positional[1];
    const locks = positional[2];
    if (!taskId || !lane) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs claim <task-id> <lane> [locked_files] [--worktree]');
      process.exit(1);
    }
    handleClaim(taskId, lane, locks, { worktree: useWorktree });
  } else if (command === 'submit') {
    const taskId = args[1];
    let stagingUrl = args[2] === '--no-tests' ? '' : args[2];
    if (!taskId) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs submit <task-id> [staging_url] [--no-tests]');
      process.exit(1);
    }
    handleSubmit(taskId, stagingUrl);
  } else if (command === 'quick') {
    const lane = args[1];
    const lockedFiles = args[2];
    const scope = args.slice(3).join(' ') || 'Quick Edit';
    if (!lane || !lockedFiles) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs quick <lane> <locked_files> [scope_description]');
      process.exit(1);
    }
    handleQuick(lane, lockedFiles, scope);
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
  node tools/fb-lane.cjs bootstrap [--platform codex]   - Bootstrap project board, rules, tools, and folders
  node tools/fb-lane.cjs doctor                         - Check FB-Lane setup health without writing files
  node tools/fb-lane.cjs status                         - Print active tasks & locks
  node tools/fb-lane.cjs claim <id> <lane> [locks] [-w] - Claim task, checkout branch (or --worktree for parallel BFM execution workers), copy prompt
  node tools/fb-lane.cjs claim ... --worktree           - Claim into an isolated git worktree for true parallel branches
  node tools/fb-lane.cjs quick <lane> <locks> [desc]    - Create & claim a fast-track quick task
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
  TASK_ID_PATTERN,
  LANE_PATTERN,
};
