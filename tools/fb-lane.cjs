#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

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

function runGit(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    throw new Error(err.stderr ? err.stderr.trim() : err.message);
  }
}

function copyToClipboard(text) {
  try {
    const proc = spawn('pbcopy');
    proc.stdin.write(text);
    proc.stdin.end();
    return true;
  } catch (err) {
    logError('⚠️  Could not copy to clipboard. Are you running on macOS?');
    return false;
  }
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
    const tableMatch = line.match(/^\|\s*([A-Za-z0-9]+-\d+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|/);
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
    const headerMatch = line.match(/^###\s*([A-Za-z0-9]+-\d+)\s*-\s*(.*)/);
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
    const tableMatch = line.match(/^\|\s*([A-Za-z0-9]+-\d+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|\s*((?:\\\||[^|])+)\s*\|/);
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
    const headerMatch = line.match(/^###\s*([A-Za-z0-9]+-\d+)\s*-\s*(.*)/);
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
    return `- Central orchestrator. Oversee file locks, coordinate task triages, review PRs, and run staging gate checks.`;
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

function handleClaim(taskId, lane, lockedFiles = '(None)') {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
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
    console.log(`Checking out branch: ${branchName}...`);
    runGit(`checkout -b ${branchName}`);
  } catch (err) {
    console.log(`Branch might exist. Attempting to switch to: ${branchName}...`);
    try {
      runGit(`checkout ${branchName}`);
    } catch (err2) {
      console.error(`❌ Error switching branch: ${err2.message}`);
      process.exit(1);
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

  // Write local Codex context file to reduce search pain
  const codexDir = path.join(path.dirname(boardPath), '.codex');
  if (!fs.existsSync(codexDir)) {
    fs.mkdirSync(codexDir);
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
  console.log(`   - Codex Desktop context written to .codex/current_task.md`);
  if (copied) {
    console.log('\n🚀 STARTUP PROMPT COPIED TO CLIPBOARD!');
    console.log('   Simply open a fresh chat thread in Claude/Cursor and paste (Cmd+V) to begin.\n');
  } else {
    console.log('\n👉 Copy-paste this startup prompt into your Claude/Cursor thread:');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60) + '\n');
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
    runGit(`checkout -b ${branchName}`);
  } catch (err) {
    console.log(`Branch might exist. Attempting to switch to: ${branchName}...`);
    try {
      runGit(`checkout ${branchName}`);
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
    console.log('   Simply open a fresh chat thread in Claude/Cursor and paste (Cmd+V) to begin.\n');
  } else {
    console.log('\n👉 Copy-paste this startup prompt into your Claude/Cursor thread:');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60) + '\n');
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
      runGit(`commit -m "${message}"`);
      return true;
    }
  } catch (err) {}
  console.log('ℹ️  Project board already up to date. No commit needed.');
  return false;
}

function handleSubmit(taskId, stagingUrl = '') {
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

  const currentBranch = runGit('rev-parse --abbrev-ref HEAD || git branch --show-current');
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
}

function handleMerge(taskId) {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
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
    runGit(`merge ${targetBranch}`);
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
    runGit(`branch -d ${targetBranch}`);
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
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'fb_lane_claim',
          description: 'Claim a task from the board, checkout a feature branch, lock files, and commit the board update.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The task ID, e.g. TASK-001' },
              lane: { type: 'string', enum: ['Tech', 'Design', 'Business', 'Product'], description: 'The lane claiming the task' },
              lockedFiles: { type: 'string', description: 'Comma-separated list of files to lock' }
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
              stagingUrl: { type: 'string', description: 'Optional URL to the staging deployment' }
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
              taskId: { type: 'string', description: 'The task ID, e.g. TASK-001' }
            },
            required: ['taskId']
          }
        }
      ]
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let message = '';
      const boardPath = findBoardPath();
      if (!boardPath) {
        throw new Error('PROJECT_BOARD.md not found.');
      }

      if (name === 'fb_lane_status') {
        const { tasks } = parseBoard(boardPath);
        message = 'Active Workstreams:\n' + tasks.map(t => 
          `[${t.id}] Status: ${t.status} | Owner: ${t.owner} | Locks: ${t.locks || 'None'} | Scope: ${t.scope}`
        ).join('\n');
      } else if (name === 'fb_lane_claim') {
        const { taskId, lane, lockedFiles } = args;
        // Run core claim logic
        const { tasks } = parseBoard(boardPath);
        const task = tasks.find(t => t.id === taskId);
        if (!task) throw new Error(`Task ${taskId} not found.`);

        const slug = task.scope.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const branchName = `${lane.toLowerCase()}/${taskId}-${slug}`;
        
        try {
          runGit(`checkout -b ${branchName}`);
        } catch (e) {
          runGit(`checkout ${branchName}`);
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

        message = `Successfully claimed ${taskId} on branch ${branchName}. Locks: ${formattedLocks}.`;
      } else if (name === 'fb_lane_submit') {
        const { taskId, stagingUrl } = args;
        
        // Run local tests first under MCP
        runTests(boardPath);

        const updates = { status: 'Staging QA' };
        if (stagingUrl) updates.stagingUrl = `[Staging Link](${stagingUrl})`;
        
        updateBoardTask(boardPath, taskId, updates);
        commitBoard(`docs: submit ${taskId} for staging qa`);
        runGit('push origin HEAD');
        message = `Successfully submitted ${taskId} for Staging QA. Branch pushed.`;
      } else if (name === 'fb_lane_merge') {
        const { taskId } = args;
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
        runGit(`merge ${targetBranch}`);

        updateBoardTask(boardPath, taskId, {
          status: 'Done',
          locks: '(None)',
          lockedFiles: '(None)'
        });

        commitBoard(`docs: complete ${taskId} and release locks`);
        runGit('push origin main');

        try { runGit(`branch -d ${targetBranch}`); } catch (e) {}
        const contextPath = path.join(path.dirname(boardPath), '.codex', 'current_task.md');
        if (fs.existsSync(contextPath)) {
          try { fs.unlinkSync(contextPath); } catch(e) {}
        }

        message = `Successfully merged ${targetBranch} and completed ${taskId}. Locks released.`;
      } else {
        throw new Error(`Unknown tool name: ${name}`);
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
function handleBootstrap() {
  console.log('🚀 Bootstrapping FB-Lane Coordination Framework...\n');
  const rootDir = process.cwd();

  // 0. Auto-detect project metadata from package.json and git remote URL
  let projectName = path.basename(rootDir);
  let projectDescription = 'A project using the FB-Lane coordination framework.';
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
*   **FB-Product (PM / Integration User Value)**: Owns final product decisions, task prioritization, scoping, file merges, staging/live deployments, and release gates.
*   **FB-Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, database security, configuration scripts, and unit/integration test suites. *Does not make styling, layout geometry, or UI changes.*
*   **FB-Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
*   **FB-Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only capacity.*

### 2. The Board Loop & Resource Locking
1. **Claim**: A thread claims or creates an item on the board and changes its status to \`In Progress\` using \`node tools/fb-lane.cjs claim\`.
2. **Execute**: The thread works in an isolated branch (\`tech/[feature]\` or \`design/[feature]\`).
3. **Audit**: When complete, the thread pushes the branch, moves the board item to \`Staging QA\` using \`node tools/fb-lane.cjs submit\`.
4. **Merge**: \`FB-Product\` runs verification/release gates, merges the branch to main using \`node tools/fb-lane.cjs merge\`, and releases locks.
`;
    fs.writeFileSync(agentsPath, agentsTemplate, 'utf8');
    console.log('📝 Created AGENTS.md');
  } else {
    console.log('ℹ️  AGENTS.md already exists, skipping.');
  }

  // 3. Create Agent config folders and files
  const agentConfigs = {
    'FB-Product': {
      name: 'FB-Product',
      description: 'Product Manager optimizing User Value. Scopes tasks, reviews handoff files, merges branches, and runs release gates.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Product, the PM optimizing User Value.\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY read PROJECT_BOARD.md. Do not wait to be asked. Then:\n- If the user gave you a feature request: break it into scoped tasks, assign lanes, set status to `Ready`.\n- If any tasks are in `Staging QA`: read the handoff file at `docs/handoffs/TASK-XXX.md`, review the branch diff, verify scope compliance, then merge or reject.\n- Summarise the board state to the user and recommend next actions.\n\n### Role & Responsibilities:\n1. **Scoping**: Break user requests into tasks on PROJECT_BOARD.md. Assign to FB-Tech, FB-Design, or FB-Business. Set status `Ready`.\n2. **DO NOT spawn subagents or execute work**: After scoping, tell the user which sidebar threads to open. The lanes will auto-start when opened.\n3. **Review & Merge**: For each `Staging QA` task, read `docs/handoffs/TASK-XXX.md` for full context (what was built, decisions, test results, risks). Review the git branch diff. If approved, run `node tools/fb-lane.cjs merge <task-id>`. If rejected, set status to `Blocked` with notes in the handoff file.\n4. **Authority**: Only you may merge branches and deploy to staging/production.'
            }
          ],
          toolNames: ['run_command', 'write_to_file', 'replace_file_content', 'view_file', 'list_dir', 'grep_search', 'multi_replace_file_content']
        }
      }
    },
    'FB-Tech': {
      name: 'FB-Tech',
      description: 'Tech Lead and Core Developer. Auto-reads PROJECT_BOARD.md on session start, implements backend code, and writes handoff files.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Tech, the Tech Lead and Core Developer.\n\n### State-Driven Writing Gate (CRITICAL):\nYou are strictly READ-ONLY on codebase files by default. You are only authorized to use file-editing tools (like write_to_file or edit_file) if you have actively claimed a task (indicated by the presence of `.codex/current_task.md` matching your lane). If no task is active, you must suggest code blocks/changes in the chat only.\nOnce a task is claimed, you are only authorized to modify files that are explicitly listed under "Locked Files" in `.codex/current_task.md`. Editing files outside this lock is a boundary violation.\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY do the following without waiting for instructions:\n1. Read PROJECT_BOARD.md.\n2. Find tasks assigned to FB-Tech with status `Ready` or `In Progress`.\n3. If `Ready`: claim it with `node tools/fb-lane.cjs claim <task-id> Tech <locked-files>`.\n4. If `In Progress`: read `.codex/current_task.md` and confirm your branch with `git rev-parse --abbrev-ref HEAD`.\n5. Begin work immediately.\n\n### Role & Responsibilities:\n1. **Core Development**: Backend code, APIs, schemas, migrations, serverless functions, integrations.\n2. **Security**: Database permissions (RLS/policies), credentials, secret hygiene.\n3. **Verification**: Run tests and compilation checks before submitting.\n4. **Boundary**: Do NOT modify CSS, layouts, fonts, or UI styling. Those belong to FB-Design.\n\n### MANDATORY — On Completion (Handoff Protocol):\nBefore running `node tools/fb-lane.cjs submit <task-id>`:\n1. Create `docs/handoffs/TASK-XXX.md` with the following sections:\n   - **Task**: ID and scope (copy from board).\n   - **What Was Built**: Detailed description of the implementation.\n   - **Technical Decisions**: Any architecture choices, trade-offs, or deviations from scope.\n   - **Modified Files**: Full list with brief per-file explanations.\n   - **Testing**: What was tested, how, and results (include command output if relevant).\n   - **Known Risks / Caveats**: Anything Product should be aware of.\n   - **Blocked Dependencies**: Any work that requires another lane to follow up.\n2. Update the task detail block in PROJECT_BOARD.md with: Modified Files list, QA Checklist marks, and a one-line Latest Update.\n3. Run `node tools/fb-lane.cjs submit <task-id>` to push and update status.\n4. Tell the user: "TASK-XXX is submitted. Open FB-Product to review."'
            }
          ],
          toolNames: ['run_command', 'write_to_file', 'replace_file_content', 'view_file', 'list_dir', 'grep_search', 'multi_replace_file_content']
        }
      }
    },
    'FB-Design': {
      name: 'FB-Design',
      description: 'UI/UX Designer and Layout Auditor. Auto-reads PROJECT_BOARD.md on session start, implements styling, and writes handoff files.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Design, the UI/UX Designer and Layout Auditor.\n\n### State-Driven Writing Gate (CRITICAL):\nYou are strictly READ-ONLY on codebase files by default. You are only authorized to use file-editing tools (like write_to_file or edit_file) if you have actively claimed a task (indicated by the presence of `.codex/current_task.md` matching your lane). If no task is active, you must suggest code blocks/changes in the chat only.\nOnce a task is claimed, you are only authorized to modify files that are explicitly listed under "Locked Files" in `.codex/current_task.md`. Editing files outside this lock is a boundary violation.\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY do the following without waiting for instructions:\n1. Read PROJECT_BOARD.md.\n2. Find tasks assigned to FB-Design with status `Ready` or `In Progress`.\n3. If `Ready`: claim it with `node tools/fb-lane.cjs claim <task-id> Design <locked-files>`.\n4. If `In Progress`: read `.codex/current_task.md` and confirm your branch.\n5. Begin work immediately.\n\n### Role & Responsibilities:\n1. **Frontend Styling**: CSS, HTML/JS styles, responsive layouts, design tokens, theme systems.\n2. **Quality Gates**: Strict text containment (no spill/clip), typography integrity (correct font loading).\n3. **Visual QA**: Verify layouts across mobile and desktop viewports. Capture screenshots when possible.\n4. **Boundary**: Do NOT edit database schemas, API routes, serverless functions, or backend logic. Those belong to FB-Tech.\n\n### MANDATORY — On Completion (Handoff Protocol):\nBefore running `node tools/fb-lane.cjs submit <task-id>`:\n1. Create `docs/handoffs/TASK-XXX.md` with the following sections:\n   - **Task**: ID and scope.\n   - **What Was Styled**: Detailed description of visual changes.\n   - **Design Decisions**: Color choices, spacing rationale, responsive breakpoints, any deviations.\n   - **Modified Files**: Full list with per-file explanations.\n   - **Visual QA Results**: Which viewports were tested, screenshot paths if captured.\n   - **Known Risks / Caveats**: Untested viewports, browser-specific issues, etc.\n2. Update PROJECT_BOARD.md with: Modified Files, QA Checklist marks, one-line Latest Update.\n3. Run `node tools/fb-lane.cjs submit <task-id>`.\n4. Tell the user: "TASK-XXX is submitted. Open FB-Product to review."'
            }
          ],
          toolNames: ['run_command', 'write_to_file', 'replace_file_content', 'view_file', 'list_dir', 'grep_search', 'call_mcp_tool']
        }
      }
    },
    'FB-Business': {
      name: 'FB-Business',
      description: 'Business copywriter and positioning strategist. Auto-reads PROJECT_BOARD.md on session start, drafts copy/docs, and writes handoff files.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Business, the copywriter and positioning strategist.\n\n### MANDATORY — On Every Session Start (SOP):\nIMMEDIATELY do the following without waiting for instructions:\n1. Read PROJECT_BOARD.md.\n2. Find tasks assigned to FB-Business with status `Ready` or `In Progress`.\n3. If `Ready`: claim it with `node tools/fb-lane.cjs claim <task-id> Business <locked-files>`.\n4. If `In Progress`: confirm your branch and resume.\n5. Begin work immediately.\n\n### Role & Responsibilities:\n1. **Positioning**: Target audience alignment, pricing cards, product benefits copy.\n2. **Copywriting**: Onboarding text, FAQs, documentation, marketing content, interface text.\n3. **Boundary (Read-Only Code)**: You may read source files but must NOT modify application code, CSS, or run deployment commands. Write to markdown docs only. Propose code-level copy changes for FB-Design or FB-Tech to integrate.\n\n### MANDATORY — On Completion (Handoff Protocol):\nBefore running `node tools/fb-lane.cjs submit <task-id>`:\n1. Create `docs/handoffs/TASK-XXX.md` with:\n   - **Task**: ID and scope.\n   - **What Was Written**: Summary of all copy/content produced.\n   - **Positioning Rationale**: Why this messaging, who it targets, tone decisions.\n   - **Modified Files**: Full list.\n   - **Integration Notes**: Specific instructions for Design/Tech on where to apply the copy in the UI.\n2. Update PROJECT_BOARD.md with: Modified Files, one-line Latest Update.\n3. Run `node tools/fb-lane.cjs submit <task-id>`.\n4. Tell the user: "TASK-XXX is submitted. Open FB-Product to review."'
            }
          ],
          toolNames: ['run_command', 'write_to_file', 'replace_file_content', 'view_file', 'list_dir', 'grep_search', 'search_web']
        }
      }
    }
  };

  for (const [folderName, configObj] of Object.entries(agentConfigs)) {
    const dirPath = path.join(rootDir, 'agents', folderName);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const agentJsonPath = path.join(dirPath, 'agent.json');
    fs.writeFileSync(agentJsonPath, JSON.stringify(configObj, null, 2), 'utf8');
    console.log(`📁 Created agent config: agents/${folderName}/agent.json`);
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
- **FB-Product**: orchestrates merges and deployments only.

### CLI commands (run from project root)
- \`node tools/fb-lane.cjs status\` — view all tasks and locks
- \`node tools/fb-lane.cjs claim <id> <lane>\` — claim task, checkout branch, lock files
- \`node tools/fb-lane.cjs submit <id>\` — run tests, push branch, mark Staging QA
- \`node tools/fb-lane.cjs merge <id>\` — merge to main, release locks (FB-Product only)

### Rules
- Never commit directly to \`main\`.
- Commit \`PROJECT_BOARD.md\` updates in a separate commit from code changes.
- Max 5 debug retries before marking task \`Blocked\` and notifying the user.
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

  // 5. Inject FB-Lane section into CLAUDE.md (non-destructive)
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
| **FB-Product** | Backlog, merges, deployments, release gates | Feature code |
| **FB-Tech** | APIs, DB schemas, serverless functions, tests | CSS, layout, copy |
| **FB-Design** | CSS, tokens, layout geometry, visual QA | Backend, schemas |
| **FB-Business** | Copy, docs, marketing text | Source code (read-only) |

### Starting a Session
1. Read \`PROJECT_BOARD.md\` — check active tasks and file locks.
2. Read \`.codex/current_task.md\` if it exists — it has your exact branch and locked files.
3. Confirm your branch: \`git rev-parse --abbrev-ref HEAD\`.
4. Never modify files locked by another active task.

### CLI Commands
\`\`\`bash
node tools/fb-lane.cjs status               # View all tasks and locks
node tools/fb-lane.cjs claim <id> <lane>    # Claim a task, checkout branch, lock files
node tools/fb-lane.cjs submit <id>          # Submit for QA, push branch
node tools/fb-lane.cjs merge <id>           # Merge to main, release locks (FB-Product only)
\`\`\`

### Rules
- Never commit directly to \`main\` — always use a feature branch.
- Commit docs separately from code changes.
- Run tests before submitting — the \`submit\` command does this automatically.
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

  // 6. Auto-configure Claude Desktop MCP
  const os = require('os');
  let claudeConfigPath = '';
  if (process.platform === 'darwin') {
    claudeConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'win32') {
    claudeConfigPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  }

  if (claudeConfigPath) {
    try {
      const configDir = path.dirname(claudeConfigPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let config = { mcpServers: {} };
      if (fs.existsSync(claudeConfigPath)) {
        try {
          config = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
        } catch (err) {
          console.warn('⚠️  Could not parse existing claude_desktop_config.json. Overwriting with clean template.');
        }
      }

      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      const scriptPath = path.join(rootDir, 'tools', 'fb-lane.cjs');
      config.mcpServers['fb-lane'] = {
        command: 'node',
        args: [scriptPath, 'mcp']
      };

      fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`🔌 Auto-configured Claude Desktop MCP server at: ${claudeConfigPath}`);
    } catch (err) {
      console.warn(`⚠️  Failed to automatically configure Claude Desktop MCP: ${err.message}`);
    }
  }

  // 7. Auto-configure Claude Code MCP server (project-scoped .mcp.json — all platforms)
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
    console.log('🔌 Configured Claude Code MCP server in .mcp.json');
  } catch (err) {
    console.warn(`⚠️  Failed to configure Claude Code MCP (.mcp.json): ${err.message}`);
  }

  // 8. Create Claude Code lane subagents (.claude/agents/*.md — non-destructive).
  // Derived from the canonical `agentConfigs` above so the lanes stay in sync. Antigravity
  // tool names are mapped to Claude Code tools; FB-Business stays read-only on code.
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

  // 9. Write per-AI interaction guides (docs/fb-lane/*.md — non-destructive).
  // One self-contained "how to drive the lanes" guide per AI, so the setup itself explains how to
  // interact. Canonical source for these strings: docs/fb-lane/ in the fb-lane-coordination repo.
  const fbLaneDocsDir = path.join(rootDir, 'docs', 'fb-lane');
  if (!fs.existsSync(fbLaneDocsDir)) {
    fs.mkdirSync(fbLaneDocsDir, { recursive: true });
  }
  const interactionGuides = {
    'README.md': `# FB-Lane — How to Interact (one guide per AI)

You've bootstrapped the **FB-Lane Four-Lane Coordination Model**. Four role-isolated lanes —
**FB-Product** (orchestrator / merges), **FB-Tech** (backend), **FB-Design** (UI/CSS), and
**FB-Business** (copy; read-only on code) — work concurrently on the same repo, coordinating
through \`PROJECT_BOARD.md\` (the single source of truth for tasks and file locks).

How you *drive* the lanes depends on which AI you use. Open the guide for yours:

| AI | Guide | How you invoke a lane |
|----|-------|-----------------------|
| **Claude Code** (CLI / web / IDE) | [claude-code.md](claude-code.md) | \`@fb-tech\` in chat, or the \`/agents\` picker; the main session is FB-Product |
| **Claude Desktop / Cursor / Projects** | [claude-desktop.md](claude-desktop.md) | one fresh chat per lane; paste the lane's prompt (or use the MCP tools) |
| **Antigravity 2.0** | [antigravity.md](antigravity.md) | lanes appear in the left sidebar; FB-Product spawns them via \`invoke_subagent\` |
| **Codex** | [codex.md](codex.md) | \`.codex/current_task.md\` context injection (or the MCP tools) |

## The task loop (every AI, same CLI)

Whatever the platform, work flows through one lifecycle on \`PROJECT_BOARD.md\`:

\`\`\`bash
node tools/fb-lane.cjs status                            # see tasks + active file locks
node tools/fb-lane.cjs claim  TASK-101 Tech "src/api.ts" # lock files, checkout tech/TASK-101
node tools/fb-lane.cjs submit TASK-101                   # run tests, push branch, -> Staging QA
node tools/fb-lane.cjs merge  TASK-101                   # FB-Product only: merge, unlock, -> Done
\`\`\`

- **Two ways to work:** talk only to **FB-Product** and let it scope / delegate / merge (hands-off),
  or invoke a lane **directly** to pair-program. Both keep the board and locks honest.
- **FB-Product is the gate:** it is the only lane that merges, and it cross-reads every submitted
  branch first to catch cross-lane drift (API/UI mismatches, copy referencing unbuilt features,
  shared-file conflicts) before integrating.
- **Full rules:** lane boundaries and the board/lock protocol live in [\`AGENTS.md\`](../../AGENTS.md).
`,
    'claude-code.md': `# How to Interact — Claude Code

Claude Code (CLI, web, and the desktop / IDE extensions) runs the FB-Lane lanes as **native
subagents**. The **main session you are typing in acts as FB-Product** (the orchestrator).

## What Claude Code reads

| Artifact | Role |
|----------|------|
| \`.claude/agents/*.md\` | the four lanes as selectable subagents: \`fb-product\`, \`fb-tech\`, \`fb-design\`, \`fb-business\` |
| \`.mcp.json\` | registers the \`fb-lane\` MCP server -> \`fb_lane_status\` / \`claim\` / \`submit\` / \`merge\` |
| \`CLAUDE.md\` | auto-loaded lane boundaries + board/lock protocol |

> These load at **session start**. After bootstrapping (or pulling new lanes), **reload / start a
> fresh session**, then run **\`/mcp\`** once to approve the \`fb-lane\` server. The lanes are not
> hot-loaded into an already-running session.

## Two ways to interact

**1. Autonomous (hands-off).** Stay in the main session — it is FB-Product. Describe a goal; it
scopes tasks on \`PROJECT_BOARD.md\`, delegates to a lane, reviews, and merges. You approve the plan
up front and smoke-test at the end.

**2. Direct lane (pair-programming).** Invoke a specific lane yourself:

- Type **\`@fb-tech\`** (or \`@fb-design\`, \`@fb-business\`, \`@fb-product\`) in the chat — the \`@\`
  autocomplete lists them — or open the **\`/agents\`** picker and pick one.
- The lanes are **not** separate sidebar items; they are modes you switch into within a chat.
- For real concurrency, open **separate conversations**, invoke a different lane in each (e.g. one
  \`@fb-tech\`, one \`@fb-design\`), and rename the conversations to match.

## The task loop

\`\`\`bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-101 Tech "src/api.ts"
node tools/fb-lane.cjs submit TASK-101
node tools/fb-lane.cjs merge  TASK-101                    # FB-Product only
\`\`\`

With the \`fb-lane\` MCP server approved you can drive this in plain language ("claim TASK-101 for
Tech locking src/api.ts") instead of running the CLI by hand.

## FB-Product catches cross-lane drift

The main session (FB-Product) is the **only** lane that merges. Before merging it cross-reads every
submitted branch to catch API/UI contract mismatches, copy referencing unbuilt features, and
shared-file conflicts, then sends the offending lane back. See the checklist in
\`.claude/agents/fb-product.md\`.

## Install options

- **This repo opened directly** -> the lanes and \`.mcp.json\` are already here; just reload.
- **As a plugin in any project** -> \`/plugin marketplace add friedbeef1/fb-lane-coordination\`
  then \`/plugin install fb-lane-coordination@fb-lane\`.

## Context hygiene

Start a fresh conversation per task to keep context clean. If a conversation looks stale, type
**\`status\`** or **\`SOP\`** — the lane re-reads \`PROJECT_BOARD.md\`, \`.codex/current_task.md\`, and the
git branch to recover its task, lane, and locked files.
`,
    'claude-desktop.md': `# How to Interact — Claude Desktop / Cursor / Projects

Claude Desktop, Cursor, and Claude Projects are single-threaded chat agents — they do not spawn
background subagents. You run the FB-Lane model by giving each lane **its own chat thread** and
acting as FB-Product (the coordinator) yourself.

## What this AI reads

| Artifact | Role |
|----------|------|
| \`CLAUDE.md\` (or the Project's Custom Instructions) | lane boundaries + board/lock protocol |
| \`AGENTS.md\` + \`PROJECT_BOARD.md\` | upload to Project Knowledge / add as \`@\` references in Cursor |
| \`.claude/agents/<lane>.md\` | the per-lane system prompt to paste into a fresh thread |
| \`claude_desktop_config.json\` | (Desktop only) registers the \`fb-lane\` MCP server |

## Two ways to interact

**1. Zero-friction via MCP (Claude Desktop).** Register the \`fb-lane\` MCP server (bootstrap does
this automatically on macOS / Windows). Claude then exposes \`fb_lane_status\` / \`claim\` / \`submit\` /
\`merge\`, so you just say *"Claim TASK-102 for Tech locking src/auth.ts"* and it manages the branch,
locks, and board for you.

**2. Low-friction via CLI + clipboard (Cursor / Web).** Run the claim command in your terminal — it
checks out the branch, locks files, and **copies a startup prompt to your clipboard**:

\`\`\`bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
\`\`\`

Open a **fresh chat thread** for that lane and paste (Cmd/Ctrl+V) to start it. (You can also paste
the lane's prompt straight from \`.claude/agents/<lane>.md\`.)

## The task loop

\`\`\`bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-102 Tech "src/auth.ts"          # copies a startup prompt to your clipboard
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge  TASK-102                             # as FB-Product
\`\`\`

*(With MCP enabled, ask Claude to run each step instead of typing the CLI.)*

## One thread per lane; FB-Product merges

Always start a **new, empty chat** for each lane/task — never mix backend logic (\`FB-Tech\`) and
styling (\`FB-Design\`) in one thread. All threads share the same git branch, \`PROJECT_BOARD.md\`, and
\`.codex/current_task.md\`, so they stay in sync. Acting as **FB-Product**, you review each lane's
submission and run \`merge\` — Product is the only role that merges, and the place cross-lane
inconsistencies (API/UI mismatches, copy referencing unbuilt features) get caught.

## Context hygiene

Clearing a thread (\`/clear\`) per task is encouraged. In a fresh thread, type **\`status\`** or
**\`SOP\`** — the agent inspects \`.codex/current_task.md\`, \`PROJECT_BOARD.md\`, and \`git branch
--show-current\` to recover its lane, task, and locked files instantly.
`,
    'antigravity.md': `# How to Interact — Antigravity 2.0

Antigravity is a multi-agent SDK: **FB-Product** is the main thread and spawns **FB-Tech**,
**FB-Design**, and **FB-Business** as sandboxed background subagents. The lanes appear in your
**left sidebar** automatically when you open the project.

## What Antigravity reads

| Artifact | Role |
|----------|------|
| \`agents/FB-*/agent.json\` | the four lane subagents (tools + system prompt per lane) |
| \`PROJECT_BOARD.md\` | single source of truth for tasks + file locks |
| \`AGENTS.md\` | lane boundaries + board/lock protocol |
| \`skills/\` | the \`project-coordination-setup\` + \`fb-lane-coordination\` skills |

> **Setup:** open the project folder in Antigravity 2.0 — the lane agents populate the left
> sidebar. If they do not appear, re-run \`node tools/fb-lane.cjs bootstrap\` to regenerate
> \`agents/FB-*/agent.json\`.

## Two ways to interact

**1. Autonomous background orchestration (main approach).** Talk only to the **FB-Product** thread.
Describe a feature; Product scopes tasks on the board, runs \`claim\`, then uses \`invoke_subagent\` to
spawn \`FB-Tech\` / \`FB-Design\` concurrently on isolated branches, and merges when verified. You
approve the plan and smoke-test staging.

**2. Direct lane threads (interactive).** Run a lane yourself in an interactive terminal loop with
the framework's runner:

\`\`\`bash
python tools/run_lane.py <lane> <task-id> [locked_files]
# e.g.  python tools/run_lane.py Tech   TASK-102 "src/api.ts"
#       python tools/run_lane.py Design TASK-103 "src/App.css"
\`\`\`

The runner auto-claims the task, checks out the branch, declares locks, and configures that lane's
sandbox before starting the \`User:\` / \`Agent:\` loop. (Requires \`GEMINI_API_KEY\` in your env.)

## The task loop

\`\`\`bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-102 Tech "src/api.ts"
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge  TASK-102                    # FB-Product only
\`\`\`

## FB-Product is the merge gate

Only FB-Product merges. It cross-reads the submitted branches first to catch cross-lane drift
(API/UI contract mismatches, copy referencing unbuilt features, shared-file conflicts) and sends
the offending lane back before integrating.

## Context hygiene

Start a fresh sidebar thread per lane/task; clearing context is encouraged. Type **\`status\`** or
**\`SOP\`** in a fresh thread to have the agent re-read \`.codex/current_task.md\`, \`PROJECT_BOARD.md\`,
and the git branch and resume instantly.
`,
    'codex.md': `# How to Interact — Codex

Codex is a local, filesystem-active developer agent. The FB-Lane model coordinates multiple Codex
runs through **git branch isolation** and the local \`PROJECT_BOARD.md\`. Each lane runs in its own
Codex session; **you act as FB-Product** to review and merge.

## What Codex reads

| Artifact | Role |
|----------|------|
| \`.codex/rules.md\` | lane boundaries + board/lock protocol (system rules) |
| \`.codex/current_task.md\` | the active task, branch, and locked files (written by \`claim\`) |
| \`PROJECT_BOARD.md\` | single source of truth for tasks + file locks |

## Two ways to interact

**1. Zero-friction via MCP.** Register \`tools/fb-lane.cjs mcp\` as an MCP server in Codex Desktop
(**Settings -> MCP Servers**). Codex then has \`fb_lane_status\` / \`claim\` / \`submit\` / \`merge\` and
manages its own branch, locks, and board — just say *"Claim TASK-102 for Tech locking src/auth.ts"*.

**2. Local context injection (CLI).** Run \`claim\` — it writes \`.codex/current_task.md\`:

\`\`\`bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
\`\`\`

\`.codex/rules.md\` already tells Codex to read that file on startup, so when you launch Codex Desktop
it picks up the branch, locks, and task and starts working — no prompt needed.

## The task loop

\`\`\`bash
node tools/fb-lane.cjs status
node tools/fb-lane.cjs claim  TASK-102 Tech "src/auth.ts"          # writes .codex/current_task.md
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge  TASK-102                             # as FB-Product
\`\`\`

*(With MCP enabled, ask Codex to run each step instead of typing the CLI.)*

## One session per lane; FB-Product merges

Run one Codex session per lane on its own \`tech/...\` or \`design/...\` branch, and commit board / doc
updates separately from code. As **FB-Product**, review each submission and \`merge\` — Product is the
only role that merges, and it cross-reads the submitted branches to catch cross-lane drift (API/UI
mismatches, copy referencing unbuilt features) before integrating.

## Context hygiene

Clearing the Codex session per task is encouraged. In a fresh session, type **\`status\`** or
**\`SOP\`** — Codex inspects \`.codex/current_task.md\`, \`PROJECT_BOARD.md\`, and \`git branch
--show-current\` to recover its lane, task, and locked files.
`
  };
  for (const [fileName, content] of Object.entries(interactionGuides)) {
    const guidePath = path.join(fbLaneDocsDir, fileName);
    if (fs.existsSync(guidePath)) {
      console.log(`ℹ️  docs/fb-lane/${fileName} already exists, skipping.`);
      continue;
    }
    fs.writeFileSync(guidePath, content, 'utf8');
    console.log(`📖 Created interaction guide: docs/fb-lane/${fileName}`);
  }

  console.log('\n🎉 FB-Lane Framework bootstrapped successfully!');
  console.log('📖 Per-AI interaction guides written to docs/fb-lane/ — open the one for your AI:');
  console.log('   • Claude Code           → docs/fb-lane/claude-code.md   (reload, /mcp, invoke lanes with @fb-tech)');
  console.log('   • Claude Desktop/Cursor → docs/fb-lane/claude-desktop.md');
  console.log('   • Antigravity 2.0       → docs/fb-lane/antigravity.md   (lanes appear in your left sidebar)');
  console.log('   • Codex                 → docs/fb-lane/codex.md\n');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : '';

  if (command === 'mcp') {
    runMcpServer();
  } else if (command === 'status') {
    handleStatus();
  } else if (command === 'bootstrap') {
    handleBootstrap();
  } else if (command === 'claim') {
    const taskId = args[1];
    const lane = args[2];
    const locks = args[3];
    if (!taskId || !lane) {
      console.error('❌ Error: Usage: node tools/fb-lane.cjs claim <task-id> <lane> [locked_files]');
      process.exit(1);
    }
    handleClaim(taskId, lane, locks);
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
  node tools/fb-lane.cjs bootstrap                      - Bootstrap project board, agents, and folders
  node tools/fb-lane.cjs status                         - Print active tasks & locks
  node tools/fb-lane.cjs claim <id> <lane> [locks]      - Claim task, checkout branch, copy prompt to clipboard
  node tools/fb-lane.cjs quick <lane> <locks> [desc]    - Create & claim a fast-track quick task
  node tools/fb-lane.cjs submit <id> [url] [--no-tests] - Run tests, submit task, update board, push branch
  node tools/fb-lane.cjs merge <id>                     - Merge branch to main, release locks, delete branch
  node tools/fb-lane.cjs mcp                            - Run local Model Context Protocol (MCP) server
`);
  }
}

main();
