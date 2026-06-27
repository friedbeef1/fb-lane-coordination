#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const readline = require('readline');

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
    process.env.CLAUDE_PROJECT_DIR ||
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
  let platform = 'all';
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
  if (platform === 'claude') {
    platform = 'claude-code';
  }

  const validPlatforms = new Set(['all', 'codex', 'claude-code', 'antigravity']);
  if (!validPlatforms.has(platform)) {
    throw new Error(`Invalid platform "${platform}". Use all, codex, claude-code, or antigravity.`);
  }

  return {
    platform,
    includeAntigravity: platform === 'all' || platform === 'antigravity',
    includeClaude: platform === 'all' || platform === 'claude-code',
    includeCodex: platform === 'all' || platform === 'codex'
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

    const mcpPath = path.join(rootDir, '.mcp.json');
    if (fs.existsSync(mcpPath)) {
      try {
        const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
        if (mcpConfig.mcpServers && mcpConfig.mcpServers['fb-lane']) {
          add('ok', '.mcp.json', 'fb-lane MCP server is configured.');
        } else {
          add('warn', '.mcp.json', 'File exists but fb-lane MCP server is not configured.', 'Run: node tools/fb-lane.cjs bootstrap --platform codex');
        }
      } catch (err) {
        add('fail', '.mcp.json', `Invalid JSON: ${err.message}`, 'Fix .mcp.json before using MCP tools.');
      }
    } else {
      add('warn', '.mcp.json', 'Missing project MCP config.', 'Run: node tools/fb-lane.cjs bootstrap --platform codex');
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
        add('warn', 'Git workspace', `On ${branch} with uncommitted changes.`, 'Review git status before claiming or merging lane work.');
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
    console.log(`\n👉 Run this lane in its own session:`);
    console.log(`     cd "${worktreePath}" && claude`);
    console.log(`   When done: node tools/fb-lane.cjs submit ${taskId}, then (from here) merge — the merge releases the worktree's branch.`);
  } else {
    console.log(`   - Codex Desktop context written to .codex/current_task.md`);
  }
  if (copied) {
    console.log('\n🚀 STARTUP PROMPT COPIED TO CLIPBOARD!');
    console.log('   Simply open a fresh chat thread in Claude Code and paste (Cmd+V) to begin.\n');
  } else {
    console.log('\n👉 Copy-paste this startup prompt into your Claude Code thread:');
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
    console.log('   Simply open a fresh chat thread in Claude Code and paste (Cmd+V) to begin.\n');
  } else {
    console.log('\n👉 Copy-paste this startup prompt into your Claude Code thread:');
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

  console.log(`🚀 Bootstrapping FB-Lane Coordination Plugin (${options.platform})...\n`);
  const rootDir = process.cwd();

  // 0. Auto-detect project metadata from package.json and git remote URL
  let projectName = path.basename(rootDir);
  let projectDescription = 'A project using the FB-Lane coordination plugin.';
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

  // 1. Create PROJECT_BOARD.md if missing
  const boardPath = path.join(rootDir, 'PROJECT_BOARD.md');
  if (!fs.existsSync(boardPath)) {
    const boardTemplate = `# Project Board — ${projectName}
> ${projectDescription}

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
    *   **Objective**: Give Product one ready-to-run FB-Lane workspace bootstrap with approved OKRs, generated coordination files, basic commands, and clear next-step guidance.
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

This project uses the standard **FB-Lane Four-Lane Coordination Model** to enable safe concurrent development.

### 1. Lane Scopes & Boundaries
*   **FB-Product (PM / Integration User Value)**: Owns final product decisions, task prioritization, scoping, BFM launch, staging/live deployments, and release gates. Product owns the stable Product/workstream OKR plus relevant stable lane OKRs in \`PROJECT_BOARD.md\`. Product is read-only on application/source code and may write coordination markdown only. Source changes happen only inside a Product-launched BFM execution run.
*   **Completion Audit Rule**: Product reports delivered work, lane-specific verification, and unresolved gates as separate statuses for every lane. Do not call any workstream "done" or "executed" unless required evidence exists; otherwise mark the missing gate as pending or blocked.
*   **FB-Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, database security, configuration scripts, and unit/integration test suites. *Does not make styling, layout geometry, or UI changes.*
*   **FB-Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
*   **FB-Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only capacity.*
*   **Passive Closeout Notes**: Every lane leaves a final informational note in its thread when it stops work. The note records task ID, status, delivered work, evidence, remaining gates, and handoff path, without commands, @/$ invocations, or instructions to open, start, run, or ask another lane.
*   **Goal Alignment Session**: For non-trivial tasks, Product/BFM owns one approved OKR tree in the board detail block: a Product/workstream OKR plus stable lane OKRs where relevant. Worker lanes report \`Lane OKR Fit\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\` in handoffs instead of rewriting OKRs. Good objective: \`Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.\` Bad objective: \`Objective: finish the feature.\` Skip this extra ceremony for \`TASK-Q-*\` quick tasks.
*   **BFM OKR Gate**: BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree. If work conflicts with approved OKRs, BFM proposes aligned approaches, scope, or sequence and recommends one; it does not dynamically create or edit OKRs during execution.
*   **BFM Return Loop**: When Product/BFM processes all lane handoffs, every handoff must be marked \`implemented\`, \`already done\`, \`blocked\`, \`out of scope\`, or \`explicitly deferred\`. Return to board, handoffs, source/docs/tests, lane status, and git status before closeout.

### 2. The Board Loop & Resource Locking
1. **Plan**: Product scopes the item; workstreams produce markdown plans or handoffs instead of editing source. For non-trivial tasks Product reads existing approved OKRs first, proposes only missing Product/workstream or lane OKRs needed for clarity, asks the user to approve them, and starts execution only after marking \`Approval: approved\`. \`TASK-Q-*\` quick tasks can skip this extra ceremony.
2. **Execute**: Product launches BFM. BFM execution workers claim task/files on the board and work in isolated branches or worktrees (\`bfm/[feature]\`, \`tech/[feature]\`, or \`design/[feature]\`).
3. **Audit**: When complete, the BFM execution worker pushes the branch, moves the board item to \`Staging QA\` using \`node tools/fb-lane.cjs submit\`, records delivered work, lane-specific verification, unresolved gates, plus a \`## Goal Alignment Session\` handoff section with \`Lane OKR Fit\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\`, and leaves a passive closeout note.
4. **Merge**: \`FB-Product\` runs verification/release gates, reconciles lane \`Lane OKR Fit\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\` before merge, verifies required evidence for every lane, merges the branch to main using \`node tools/fb-lane.cjs merge\`, and releases locks.
`;
    fs.writeFileSync(agentsPath, agentsTemplate, 'utf8');
    console.log('📝 Created AGENTS.md');
  } else {
    console.log('ℹ️  AGENTS.md already exists, skipping.');
  }

  // 3. Create Antigravity agent config folders and files when requested.
  const agentConfigs = {
    'FB-Product': {
      name: "FB-Product",
      description: "Product Manager optimizing User Value. Directs planning, launches BFM execution, reviews handoff files, merges branches, and runs release gates.",
      config: {
        "customAgent": {
          "systemPromptSections": [
            {
              "title": "Agent System Instructions",
              "content": "You are FB-Product, the PM optimizing User Value.\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY read PROJECT_BOARD.md. Do not wait to be asked. Then:\n- If the user gave you a feature request: break it into scoped tasks, assign lanes, and for each non-trivial task discuss the Product/workstream OKR with the user, add any needed stable lane OKRs only when relevant, and record or change OKRs in PROJECT_BOARD.md only after explicit user approval.\n- If any tasks are in `Staging QA`: read the handoff file at `docs/handoffs/TASK-XXX.md`, review the branch diff, reconcile the lane `## Goal Alignment Session` sections, `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR`, verify scope compliance, then merge or reject.\n- Summarise the board state to the user and recommend next actions.\n\n### Role & Responsibilities:\n1. **Scoping**: Break user requests into tasks on PROJECT_BOARD.md. Assign to FB-Tech, FB-Design, or FB-Business. Set status `Ready`. For non-trivial tasks, Product owns the stable Product/workstream OKR plus relevant stable lane OKRs in the board Goal Alignment Session. `TASK-Q-*` quick tasks can skip this extra ceremony.\n2. **Direction, not execution**: Product gives direction, asks workstreams for markdown plans/handoffs, records assigned lanes and board status, and launches BFM when execution is approved. Product is read-only on application/source code and may write coordination markdown only. Source changes happen only inside a Product-launched BFM execution run.\n3. **Review & Merge**: For each `Staging QA` task, read `docs/handoffs/TASK-XXX.md` for full context (what was built, decisions, test results, risks). Reconcile every lane `## Goal Alignment Session` section, `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` before sequencing execution or merge. If approved OKRs conflict with delivered work, propose aligned approach, scope, or sequence changes and recommend one; do not dynamically create or edit OKRs during execution. Review the git branch diff. If approved, run `node tools/fb-lane.cjs merge <task-id>`. If rejected, set status to `Blocked` with notes in the handoff file.\n4. **Runner hang boundary**: If tests, builds, Git staging, or browser checks hang while Product/BFM is reviewing, run doctor where available, record `pending-gate` or `blocked` with exact evidence, and return execution to BFM sequencing instead of patching from Product chat.\n5. **Authority**: Only Product/BFM may launch source-changing execution, merge branches, and deploy to staging/production after the required gates pass.\n\n### Goal Alignment Session:\nUse a Goal Alignment Session for non-trivial tasks only. Product/workstream OKRs and stable lane OKRs are alignment anchors, not goals to recreate during execution. Good objective: `Objective: Let a signed-in user reach the camera preview, capture one mirrored photo, and save it locally without a full-page reload.` Bad objective: `Objective: finish the feature.` BFM blocks when approval is missing, OKRs are unclear, or handoffs conflict with approved OKRs; OKRs are added or changed only after discussion and explicit user approval.\n\n### Completion Audit Language:\nReport delivered work, lane-specific verification, and unresolved gates separately for every lane. Do not describe any lane as \"executed\" or \"done\" unless required evidence exists for that lane: Tech needs named tests/builds, Design needs viewport/screenshot evidence when UI changed, Business needs approval or integration status, and Product needs staging/release-gate evidence. If work is delivered but a gate is missing, say: \"delivered; <named checks> passed; <specific gate> remains pending.\"\n\n### BFM Return Loop:\nFor BFM or all-handoff processing, every handoff must be marked `implemented`, `already done`, `blocked`, `out of scope`, or `explicitly deferred`. Return to board, source, docs, tests, lane status, and git status before closeout.\n\n### Passive Closeout Note:\nWhen you finish scoping, reviewing, merging, or rejecting a workstream, leave one final informational note for future visitors. Format it as `Closeout note - <TASK-ID>: <status>. Delivered: ... Evidence: ... Remaining: ... Handoff: docs/handoffs/<TASK-ID>.md.` Do not include commands, @/$ invocations, or instructions to open, start, run, or ask another lane."
            }
          ],
          "toolNames": [
            "run_command",
            "write_to_file",
            "replace_file_content",
            "view_file",
            "list_dir",
            "grep_search",
            "multi_replace_file_content"
          ]
        }
      }
    },
    'FB-Tech': {
      name: "FB-Tech",
      description: "Technical planning lane. Auto-reads PROJECT_BOARD.md on session start, writes technical plans/handoffs, and only edits source when explicitly acting as a BFM execution worker.",
      config: {
        "customAgent": {
          "systemPromptSections": [
            {
              "title": "Agent System Instructions",
              "content": "You are FB-Tech, the technical planning lane.\n\n### State-Driven Writing Gate (CRITICAL):\nYou are strictly READ-ONLY on application/source files by default. In normal workstream chat, ask questions, investigate, and write markdown technical plans/handoffs only. You may edit source only when Product has launched BFM and you are explicitly acting as a BFM execution worker with `.codex/current_task.md` matching your lane. Once execution is active, modify only files listed under \"Locked Files\".\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY do the following without waiting for instructions:\n1. Read PROJECT_BOARD.md.\n2. Find tasks assigned to FB-Tech with status `Ready` or `In Progress`.\n3. If `Ready`: write or update the markdown technical plan/handoff; do not claim files from ordinary workstream chat.\n4. If Product has launched BFM and `.codex/current_task.md` matches your lane, confirm your branch with `git rev-parse --abbrev-ref HEAD`.\n5. Execute only when explicitly acting as the BFM execution worker.\n\n### Role & Responsibilities:\n1. **Technical Planning**: Backend code, APIs, schemas, migrations, serverless functions, integrations, tests to run, and risks.\n2. **Security**: Database permissions (RLS/policies), credentials, secret hygiene.\n3. **Verification**: Run tests and compilation checks before submitting.\n4. **Boundary**: Do NOT modify CSS, layouts, fonts, or UI styling. Those belong to FB-Design.\n\n### MANDATORY — On Completion (Handoff Protocol):\nFor normal workstream planning, create or update `docs/handoffs/TASK-XXX.md`. If explicitly acting inside a BFM execution run, before running `node tools/fb-lane.cjs submit <task-id>`:\n1. Create `docs/handoffs/TASK-XXX.md` with the following sections:\n   - **Task**: ID and scope (copy from board).\n   - **Goal Alignment Session section**: Start with `## Goal Alignment Session`, then include `Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity`, `Mini-loop Evidence: <lane evidence from its smallest real verification loop>`, and `Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified`.\n   - **Technical Plan / What Was Built**: Planned or implemented technical work.\n   - **Technical Decisions**: Any architecture choices, trade-offs, or deviations from scope.\n   - **Modified Files**: Full list with brief per-file explanations.\n   - **Delivery Status**: What technical work is present in the expected files.\n   - **Verification Evidence**: Named test/build/typecheck/security commands and results.\n   - **Remaining Gates**: Missing tests, unverified integrations, security review, deploy checks, or external decisions.\n   - **Product Status Recommendation**: `delivered`, `lane-verification-passed`, `pending-gate`, or `blocked`.\n   - **Return Check**: Confirm source/tests match the technical plan or mark `blocked`, `out of scope`, or `explicitly deferred`.\n   - **Known Risks / Caveats**: Anything Product should be aware of.\n   - **Blocked Dependencies**: Any work that requires another lane to follow up.\n2. Update the task detail block in PROJECT_BOARD.md with Modified Files, QA Checklist marks, and a one-line Latest Update. Do not edit the board's approved OKR tree; report `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` only in the handoff for Product/BFM to reconcile.\n3. Run `node tools/fb-lane.cjs submit <task-id>` only inside BFM execution; otherwise leave the markdown handoff for Product/BFM.\n4. Leave a passive closeout note for future visitors: `Closeout note - TASK-XXX: <status>. Delivered: ... Evidence: ... Remaining: ... Handoff: docs/handoffs/TASK-XXX.md.` Do not include commands, @/$ invocations, or instructions to open, start, run, or ask another lane."
            }
          ],
          "toolNames": [
            "run_command",
            "write_to_file",
            "replace_file_content",
            "view_file",
            "list_dir",
            "grep_search",
            "multi_replace_file_content"
          ]
        }
      }
    },
    'FB-Design': {
      name: "FB-Design",
      description: "UI/UX planning lane. Auto-reads PROJECT_BOARD.md on session start, writes design plans/handoffs, and only edits source when explicitly acting as a BFM execution worker.",
      config: {
        "customAgent": {
          "systemPromptSections": [
            {
              "title": "Agent System Instructions",
              "content": "You are FB-Design, the UI/UX planning lane.\n\n### State-Driven Writing Gate (CRITICAL):\nYou are strictly READ-ONLY on application/source files by default. In normal workstream chat, ask questions, investigate, and write markdown design plans/handoffs only. You may edit source only when Product has launched BFM and you are explicitly acting as a BFM execution worker with `.codex/current_task.md` matching your lane. Once execution is active, modify only files listed under \"Locked Files\".\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY do the following without waiting for instructions:\n1. Read PROJECT_BOARD.md.\n2. Find tasks assigned to FB-Design with status `Ready` or `In Progress`.\n3. If `Ready`: write or update the markdown design plan/handoff; do not claim files from ordinary workstream chat.\n4. If Product has launched BFM and `.codex/current_task.md` matches your lane, confirm your branch.\n5. Execute only when explicitly acting as the BFM execution worker.\n\n### Role & Responsibilities:\n1. **Frontend Planning**: CSS, HTML/JS style plans, responsive layouts, design tokens, theme systems, and visual QA approach.\n2. **Quality Gates**: Strict text containment (no spill/clip), typography integrity (correct font loading).\n3. **Visual QA**: Verify layouts across mobile and desktop viewports. Capture screenshots when possible.\n4. **Boundary**: Do NOT edit database schemas, API routes, serverless functions, or backend logic. Those belong to FB-Tech.\n\n### MANDATORY — On Completion (Handoff Protocol):\nFor normal workstream planning, create or update `docs/handoffs/TASK-XXX.md`. If explicitly acting inside a BFM execution run, before running `node tools/fb-lane.cjs submit <task-id>`:\n1. Create `docs/handoffs/TASK-XXX.md` with the following sections:\n   - **Task**: ID and scope.\n   - **Goal Alignment Session section**: Start with `## Goal Alignment Session`, then include `Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity`, `Mini-loop Evidence: <lane evidence from its smallest real verification loop>`, and `Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified`.\n   - **Design Plan / What Was Styled**: Planned or implemented visual work.\n   - **Design Decisions**: Color choices, spacing rationale, responsive breakpoints, any deviations.\n   - **Modified Files**: Full list with per-file explanations.\n   - **Implementation Status**: What visual work is implemented.\n   - **Automated Checks**: Commands run and results, if any.\n   - **Visual QA Status**: `passed` only when screenshot/viewport evidence is attached; otherwise `pending`.\n   - **Visual QA Evidence**: Tested viewport sizes plus screenshot paths, staging URLs, or browser-captured proof.\n   - **Remaining Visual Gates**: Untested viewports, browser-specific risks, interactions, text-containment checks, etc.\n   - **Return Check**: Confirm the current UI and screenshot/viewport evidence satisfy the design intent or mark `blocked`, `out of scope`, or `explicitly deferred`.\n   - **Known Risks / Caveats**: Untested viewports, browser-specific issues, etc.\n2. Update PROJECT_BOARD.md with Modified Files, QA Checklist marks, and a one-line Latest Update. Do not edit the board's approved OKR tree; report `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` only in the handoff for Product/BFM to reconcile.\n3. Run `node tools/fb-lane.cjs submit <task-id>` only inside BFM execution; otherwise leave the markdown handoff for Product/BFM.\n4. Leave a passive closeout note for future visitors: `Closeout note - TASK-XXX: <status>. Delivered: ... Evidence: ... Remaining: ... Handoff: docs/handoffs/TASK-XXX.md.` Do not include commands, @/$ invocations, or instructions to open, start, run, or ask another lane."
            }
          ],
          "toolNames": [
            "run_command",
            "write_to_file",
            "replace_file_content",
            "view_file",
            "list_dir",
            "grep_search",
            "call_mcp_tool"
          ]
        }
      }
    },
    'FB-Business': {
      name: "FB-Business",
      description: "Business copywriter and positioning strategist. Auto-reads PROJECT_BOARD.md on session start, drafts copy/docs, and records source changes as BFM integration targets.",
      config: {
        "customAgent": {
          "systemPromptSections": [
            {
              "title": "Agent System Instructions",
              "content": "You are FB-Business, the copywriter and positioning strategist.\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY do the following without waiting for instructions:\n1. Read PROJECT_BOARD.md.\n2. Find tasks assigned to FB-Business with status `Ready` or `In Progress`.\n3. If `Ready`: write or update the markdown copy/business plan; claim only documentation tasks Product/BFM explicitly assigns.\n4. If `In Progress`: confirm whether this is coordination markdown work or BFM execution support.\n5. Do not edit source, branch, commit, submit, merge, deploy, or change provider state from ordinary workstream chat.\n\n### Role & Responsibilities:\n1. **Positioning**: Target audience alignment, pricing cards, product benefits copy.\n2. **Copywriting**: Onboarding text, FAQs, documentation, marketing content, interface text.\n3. **Boundary (Read-Only Code)**: You may read source files but must NOT modify application code, CSS, branch, commit, submit, merge, deploy, or run provider commands. Write to markdown docs only. Record code-level copy changes as BFM integration targets.\n\n### MANDATORY — On Completion (Handoff Protocol):\nBefore running `node tools/fb-lane.cjs submit <task-id>`:\n1. Create `docs/handoffs/TASK-XXX.md` with:\n   - **Task**: ID and scope.\n   - **Goal Alignment Session section**: Start with `## Goal Alignment Session`, then include `Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity`, `Mini-loop Evidence: <lane evidence from its smallest real verification loop>`, and `Evidence Against Product OKR: <evidence that weakens or blocks the approved Product/workstream OKR> | None identified`.\n   - **What Was Written**: Summary of all copy/content produced.\n   - **Positioning Rationale**: Why this messaging, who it targets, tone decisions.\n   - **Modified Files**: Full list.\n   - **Delivery Status**: What copy, positioning, or business decision was produced.\n   - **Approval Evidence**: User/Product approval, stakeholder decision, or `proposal only`.\n   - **Integration Status**: Where the copy should be applied, whether it has been applied, and by which lane.\n   - **Remaining Gates**: Unapproved claims, pricing decisions, legal/privacy review, Design fit checks, or Tech integration.\n   - **Product Status Recommendation**: `delivered`, `lane-verification-passed`, `pending-gate`, or `blocked`.\n   - **Return Check**: Confirm the copy packet aligns with the approved Product/workstream OKR and current docs/source targets or mark `blocked`, `out of scope`, or `explicitly deferred`.\n2. Update PROJECT_BOARD.md with Modified Files and a one-line Latest Update. Do not edit the board's approved OKR tree; report `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR` only in the handoff for Product/BFM to reconcile.\n3. Run `node tools/fb-lane.cjs submit <task-id>` only for Product/BFM-assigned documentation work; otherwise leave the markdown handoff for Product/BFM.\n4. Leave a passive closeout note for future visitors: `Closeout note - TASK-XXX: <status>. Delivered: ... Evidence: ... Remaining: ... Handoff: docs/handoffs/TASK-XXX.md.` Do not include commands, @/$ invocations, or instructions to open, start, run, or ask another lane."
            }
          ],
          "toolNames": [
            "run_command",
            "write_to_file",
            "replace_file_content",
            "view_file",
            "list_dir",
            "grep_search",
            "search_web"
          ]
        }
      }
    }
  };

  if (options.includeAntigravity) {
    for (const [folderName, configObj] of Object.entries(agentConfigs)) {
      const dirPath = path.join(rootDir, 'agents', folderName);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const agentJsonPath = path.join(dirPath, 'agent.json');
      fs.writeFileSync(agentJsonPath, JSON.stringify(configObj, null, 2), 'utf8');
      console.log(`📁 Created agent config: agents/${folderName}/agent.json`);
    }
  } else {
    console.log('ℹ️  Skipping Antigravity agent configs for this platform.');
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
## FB-Lane Coordination

This project uses the FB-Lane Four-Lane Coordination Model.

### On every session start
1. Read \`PROJECT_BOARD.md\` — check active tasks and file locks.
2. Read \`.codex/current_task.md\` if it exists — it contains your task ID, branch, and locked files. Follow it exactly.
3. Confirm your active branch matches the task. If not, stop and notify the user.
4. Never modify files that are locked by another active task.

### Lane boundaries
- **FB-Tech**: backend, APIs, schemas, tests only. Never touch CSS or layout.
- **FB-Design**: CSS, tokens, layout only. Never touch backend logic or schemas.
- **FB-Business**: read-only on source code. Write to markdown docs only.
- **FB-Product**: direction, sequencing, BFM launch, integration, merges, and deployments. Product is read-only on application/source code and may write coordination markdown only.

### Goal Alignment Session
- For non-trivial tasks, FB-Product/BFM owns one approved OKR tree in \`PROJECT_BOARD.md\`: a Product/workstream OKR plus stable lane OKRs where relevant.
- BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree.
- If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKR tree and recommends one; it does not dynamically create or edit OKRs during execution.
- Lane handoffs include \`## Goal Alignment Session\`, \`Lane OKR Fit\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\`.
- Skip this ceremony for \`TASK-Q-*\` quick tasks.

### BFM return loop
- When processing all lane handoffs, Product/BFM must mark every handoff \`implemented\`, \`already done\`, \`blocked\`, \`out of scope\`, or \`explicitly deferred\`.
- Return to \`PROJECT_BOARD.md\` after reading handoffs, to each handoff after coding, to source/docs/board after tests, to lane status after board/doc updates, and to \`git status\` after commit/push.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded.

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
      console.log('📝 Created .codex/rules.md with FB-Lane section.');
    } else {
      const existingCodex = fs.readFileSync(codexRulesPath, 'utf8');
      if (existingCodex.includes(CODEX_FB_START)) {
        // Update in-place — idempotent
        const updatedCodex = existingCodex.replace(
          new RegExp(`${CODEX_FB_START}[\\s\\S]*?${CODEX_FB_END}`),
          codexFbBlock
        );
        fs.writeFileSync(codexRulesPath, updatedCodex, 'utf8');
        console.log('🔄 Updated existing FB-Lane section in .codex/rules.md.');
      } else {
        // Append — never overwrite user's existing rules
        const appendedCodex = existingCodex.trimEnd() + '\n\n---\n\n' + codexFbBlock + '\n';
        fs.writeFileSync(codexRulesPath, appendedCodex, 'utf8');
        console.log('✅ Appended FB-Lane section to your existing .codex/rules.md.');
      }
    }
  } else {
    console.log('ℹ️  Skipping Codex rules for this platform.');
  }

  // 5. Inject FB-Lane section into CLAUDE.md (non-destructive)
  if (options.includeClaude) {
    const claudeMdPath = path.join(rootDir, 'CLAUDE.md');
    const FB_LANE_START = '<!-- fb-lane-start -->';
    const FB_LANE_END = '<!-- fb-lane-end -->';
    const fbLaneBlock = `${FB_LANE_START}
## FB-Lane Coordination

This project uses the **FB-Lane Four-Lane Coordination Model**.
Source of truth for active tasks and file locks: \`PROJECT_BOARD.md\`.

### Lane Boundaries

| Lane | Owns | Never touches |
|------|------|--------------|
| **FB-Product** | Direction, backlog, merges, deployments, release gates | Feature code or lane-owned source changes |
| **FB-Tech** | APIs, DB schemas, serverless functions, tests | CSS, layout, copy |
| **FB-Design** | CSS, tokens, layout geometry, visual QA | Backend, schemas |
| **FB-Business** | Copy, docs, marketing text | Source code (read-only) |

### Goal Alignment Session
- For non-trivial tasks, FB-Product/BFM owns one approved OKR tree in \`PROJECT_BOARD.md\`: a Product/workstream OKR plus stable lane OKRs where relevant.
- BFM blocks before execution when approval is missing, OKRs are unclear, handoffs imply an unapproved OKR change, or handoffs conflict with the approved OKR tree.
- If work conflicts with approved OKRs, BFM proposes alternative approaches, scope, or sequence that align to the existing OKR tree and recommends one; it does not dynamically create or edit OKRs during execution.
- Lane handoffs include \`## Goal Alignment Session\`, \`Lane OKR Fit\`, \`Mini-loop Evidence\`, and \`Evidence Against Product OKR\`.
- Skip this ceremony for \`TASK-Q-*\` quick tasks.

### BFM Return Loop
- When processing all lane handoffs, Product/BFM must mark every handoff \`implemented\`, \`already done\`, \`blocked\`, \`out of scope\`, or \`explicitly deferred\`.
- Return to \`PROJECT_BOARD.md\` after reading handoffs, to each handoff after coding, to source/docs/board after tests, to lane status after board/doc updates, and to \`git status\` after commit/push.
- Close only when board, source, docs, and tests agree, or every disagreement is explicitly recorded.

### Starting a Session
1. Read \`PROJECT_BOARD.md\` — check active tasks and file locks.
2. Read \`.codex/current_task.md\` if it exists — it has your exact branch and locked files.
3. Confirm your branch: \`git rev-parse --abbrev-ref HEAD\`.
4. Never modify files locked by another active task.

### CLI Commands
\`\`\`bash
node tools/fb-lane.cjs status               # View all tasks and locks
node tools/fb-lane.cjs claim <id> <lane>    # BFM execution worker claims task, checkout branch, lock files
node tools/fb-lane.cjs submit <id>          # Submit for QA, push branch
node tools/fb-lane.cjs merge <id>           # Merge to main, release locks (FB-Product only)
\`\`\`

### Rules
- Never commit directly to \`main\` — always use a feature branch.
- Commit docs separately from code changes.
- Run tests before submitting — the \`submit\` command does this automatically.
- Product gives direction and integration; workstreams write markdown plans, and Product-launched BFM execution workers claim and edit source files.
- Max 5 debug retries — if still failing, mark task \`Blocked\` and notify the user.
- Do not revert others — merge \`main\` into your branch to resolve conflicts.
${FB_LANE_END}`;

    if (!fs.existsSync(claudeMdPath)) {
      fs.writeFileSync(claudeMdPath, fbLaneBlock + '\n', 'utf8');
      console.log('📝 Created CLAUDE.md with FB-Lane section.');
    } else {
      const existing = fs.readFileSync(claudeMdPath, 'utf8');
      if (existing.includes(FB_LANE_START)) {
        // Section already exists — update it in-place (idempotent)
        const updated = existing.replace(
          new RegExp(`${FB_LANE_START}[\\s\\S]*?${FB_LANE_END}`),
          fbLaneBlock
        );
        fs.writeFileSync(claudeMdPath, updated, 'utf8');
        console.log('🔄 Updated existing FB-Lane section in CLAUDE.md.');
      } else {
        // Existing CLAUDE.md without FB-Lane — append, never overwrite
        const appended = existing.trimEnd() + '\n\n---\n\n' + fbLaneBlock + '\n';
        fs.writeFileSync(claudeMdPath, appended, 'utf8');
        console.log('✅ Appended FB-Lane section to your existing CLAUDE.md.');
      }
    }
  } else {
    console.log('ℹ️  Skipping Claude Code files for this platform.');
  }

  // 6. Auto-configure project-scoped MCP server.
  const mcpJsonPath = path.join(rootDir, '.mcp.json');
  try {
    let mcpConfig = { mcpServers: {} };
    if (fs.existsSync(mcpJsonPath)) {
      try {
        mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
      } catch (err) {
        console.warn('⚠️  Could not parse existing .mcp.json. Merging into a clean template.');
      }
    }
    if (!mcpConfig.mcpServers) {
      mcpConfig.mcpServers = {};
    }
    mcpConfig.mcpServers['fb-lane'] = {
      command: 'node',
      args: ['tools/fb-lane.cjs', 'mcp']
    };
    fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2) + '\n', 'utf8');
    console.log('🔌 Configured fb-lane MCP server in .mcp.json');
  } catch (err) {
    console.warn(`⚠️  Failed to configure fb-lane MCP (.mcp.json): ${err.message}`);
  }

  // 7. Create Claude Code lane subagents (.claude/agents/*.md — non-destructive).
  // Derived from the canonical `agentConfigs` above so the lanes stay in sync. Antigravity
  // tool names are mapped to Claude Code tools; FB-Business stays read-only on code.
  if (options.includeClaude) {
    const claudeAgentsDir = path.join(rootDir, '.claude', 'agents');
    if (!fs.existsSync(claudeAgentsDir)) {
      fs.mkdirSync(claudeAgentsDir, { recursive: true });
    }
    const claudeLaneTools = {
      'FB-Product': 'Read, Edit, Write, Grep, Glob, Bash',
      'FB-Tech': 'Read, Edit, Write, Grep, Glob, Bash',
      'FB-Design': 'Read, Edit, Write, Grep, Glob, Bash',
      'FB-Business': 'Read, Grep, Glob, WebSearch, WebFetch'
    };
    for (const [folderName, configObj] of Object.entries(agentConfigs)) {
      const slug = folderName.toLowerCase();
      const agentMdPath = path.join(claudeAgentsDir, `${slug}.md`);
      if (fs.existsSync(agentMdPath)) {
        console.log(`ℹ️  .claude/agents/${slug}.md already exists, skipping.`);
        continue;
      }
      const body = configObj.config.customAgent.systemPromptSections
        .map((section) => section.content)
        .join('\n\n');
      const tools = claudeLaneTools[folderName] || 'Read, Grep, Glob';
      const frontmatter = `---\nname: ${slug}\ndescription: ${configObj.description}\ntools: ${tools}\n---\n\n`;
      fs.writeFileSync(agentMdPath, frontmatter + body + '\n', 'utf8');
      console.log(`🤖 Created Claude Code subagent: .claude/agents/${slug}.md`);
    }
  } else {
    console.log('ℹ️  Skipping Claude Code subagents for this platform.');
  }

  console.log('\n🎉 FB-Lane Plugin bootstrapped successfully!');
  console.log('======================================================================');
  console.log('🚀 QUICK START GUIDE: HOW TO USE FB-LANE RIGHT AWAY');
  console.log('======================================================================');
  if (options.platform === 'codex') {
    console.log('1. Open this workspace in Codex.');
    console.log('2. Start with: $fb-lane status');
    console.log('3. Describe the work normally. Workstreams plan in markdown; Product launches BFM for source-changing execution.');
    console.log('4. Run health checks any time with: node tools/fb-lane.cjs doctor');
  } else {
    console.log('1. Open this workspace in Antigravity, Claude Code, or Codex.');
    console.log('2. Start a chat with the Product agent (FB-Product) and ask it to build a feature:');
    console.log('   e.g., "Add a login page" or "Triage our next milestones"');
    console.log('3. Product will scope the work, create tasks in PROJECT_BOARD.md, assign lanes, and mark them as Ready.');
    console.log('4. Open the corresponding worker agent thread (FB-Tech or FB-Design) to start coding:');
    console.log('   The worker agent will automatically claim the task, checkout a branch, and implement code.');
    console.log('5. Once done, the worker agent submits the task for QA.');
    console.log('6. Open the Product agent again to review staging and merge the changes into main.');
  }
  console.log('======================================================================');
  if (options.includeAntigravity) {
    console.log('👉 Antigravity 2.0: The lane agents are now populated in your left sidebar!');
  }
  if (options.includeClaude) {
    console.log('👉 Claude Code: Reload the app to load the new lanes and run `/mcp` to approve fb-lane.');
  }
  if (options.includeCodex) {
    console.log('👉 Codex: Start a new thread and use `$fb-lane status` or select the FB-Lane plugin prompt.');
  }
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
