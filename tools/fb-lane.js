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
    const tableMatch = line.match(/^\|\s*(TASK-\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
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
    const headerMatch = line.match(/^###\s*(TASK-\w+)\s*-\s*(.*)/);
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
    const tableMatch = line.match(/^\|\s*(TASK-\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
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
    const headerMatch = line.match(/^###\s*(TASK-\w+)\s*-\s*(.*)/);
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
      execSync(testCmd, { stdio: 'inherit' });
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
node tools/fb-lane.js merge ${taskId}`;
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
  runGit('checkout main');
  runGit('pull origin main');
  runGit(`merge ${targetBranch}`);

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

  // 0. Auto-detect project metadata from package.json (if present)
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
| TASK-001 | Ready | FB-Product | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) \\| [PR #1](https://github.com/example/repo/pull/1) |

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
    *   **Git Branch / PR**: [Branch Link](https://github.com/example/repo/tree/main)
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
*   **FB-Product (PM / Integration Captain)**: Owns final product decisions, task prioritization, scoping, file merges, staging/live deployments, and release gates.
*   **FB-Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, database security, configuration scripts, and unit/integration test suites. *Does not make styling, layout geometry, or UI changes.*
*   **FB-Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
*   **FB-Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only capacity.*

### 2. The Board Loop & Resource Locking
1. **Claim**: A thread claims or creates an item on the board and changes its status to \`In Progress\` using \`node tools/fb-lane.js claim\`.
2. **Execute**: The thread works in an isolated branch (\`tech/[feature]\` or \`design/[feature]\`).
3. **Audit**: When complete, the thread pushes the branch, moves the board item to \`Staging QA\` using \`node tools/fb-lane.js submit\`.
4. **Merge**: \`FB-Product\` runs verification/release gates, merges the branch to main using \`node tools/fb-lane.js merge\`, and releases locks.
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
      description: 'Product Manager and Integration Captain. Central orchestrator of the workspace. Scopes tasks, spawns subagent threads, merges code, runs release gates, and manages deployments.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Product, the PM and Integration Captain.\n\n### Role & Responsibilities:\n1. **Orchestration**: Create/update scoped tasks in PROJECT_BOARD.md.\n2. **Spawning**: Spawn FB-Tech, FB-Design, or FB-Business subagents using `invoke_subagent` to execute prioritized tasks.\n3. **Integrations**: Review PRs, merge git branches, and run release gates.\n4. **Authority**: Only you are authorized to run staging/production deployment scripts.'
            }
          ],
          toolNames: ['send_message', 'invoke_subagent', 'define_subagent', 'manage_subagents', 'run_command', 'write_to_file', 'replace_file_content', 'view_file']
        }
      }
    },
    'FB-Tech': {
      name: 'FB-Tech',
      description: 'Tech Lead and Core Developer. Implements backend migrations, APIs, core app logic, and runs development tests.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Tech, the Tech Lead and Core Developer.\n\n### Role & Responsibilities:\n1. **Core Development**: Implement backend code, APIs, schemas, migrations, and third-party integrations.\n2. **Security**: Own database permissions (RLS/policies), credentials, and secret hygiene.\n3. **Verification**: Run tests (e.g. npm run test) and compilation checks.\n4. **Boundary**: Do not modify UI styling, CSS layouts, or frontend design classes.'
            }
          ],
          toolNames: ['send_message', 'run_command', 'write_to_file', 'replace_file_content', 'view_file', 'list_dir', 'grep_search']
        }
      }
    },
    'FB-Design': {
      name: 'FB-Design',
      description: 'UI/UX Designer and Layout Auditor. Edits frontend styles, handles page geometry layout, and performs visual audits on staging.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Design, the UI/UX Designer and Layout Auditor.\n\n### Role & Responsibilities:\n1. **Frontend Styling**: Modify CSS/HTML/JS styles for responsive, premium layouts.\n2. **Quality Gates**: Enforce strict text containment (no spill/clip) and typography integrity (correct font loading).\n3. **Visual QA**: Use browser tools to capture screenshots and verify layouts across mobile and desktop viewports.\n4. **Boundary**: Do not edit database schemas, API routes, or backend server logic.'
            }
          ],
          toolNames: ['send_message', 'run_command', 'write_to_file', 'replace_file_content', 'view_file', 'list_dir', 'call_mcp_tool']
        }
      }
    },
    'FB-Business': {
      name: 'FB-Business',
      description: 'Business copywriter and positioning strategist. Focuses on onboarding text, documentation, user-facing messaging, and pricing/marketing copy.',
      config: {
        customAgent: {
          systemPromptSections: [
            {
              title: 'Agent System Instructions',
              content: 'You are FB-Business, the copywriter and positioning strategist.\n\n### Role & Responsibilities:\n1. **Positioning**: Align copy with target audiences, write pricing cards and product benefits.\n2. **Copywriting**: Write onboarding copy, help center/FAQs, system documentation, and interface text.\n3. **Boundary (Read-Only)**: Propose copy updates to FB-Product or FB-Design; do not write code or run deployment commands.'
            }
          ],
          toolNames: ['send_message', 'view_file', 'list_dir', 'grep_search', 'search_web']
        }
      }
    }
  };

  for (const [folderName, configObj] of Object.entries(agentConfigs)) {
    const dirPath = path.join(rootDir, folderName);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    const agentJsonPath = path.join(dirPath, 'agent.json');
    fs.writeFileSync(agentJsonPath, JSON.stringify(configObj, null, 2), 'utf8');
    console.log(`📁 Created agent config: ${folderName}/agent.json`);
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
- \`node tools/fb-lane.js status\` — view all tasks and locks
- \`node tools/fb-lane.js claim <id> <lane>\` — claim task, checkout branch, lock files
- \`node tools/fb-lane.js submit <id>\` — run tests, push branch, mark Staging QA
- \`node tools/fb-lane.js merge <id>\` — merge to main, release locks (FB-Product only)

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
node tools/fb-lane.js status               # View all tasks and locks
node tools/fb-lane.js claim <id> <lane>    # Claim a task, checkout branch, lock files
node tools/fb-lane.js submit <id>          # Submit for QA, push branch
node tools/fb-lane.js merge <id>           # Merge to main, release locks (FB-Product only)
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

      const scriptPath = path.join(rootDir, 'tools', 'fb-lane.js');
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

  console.log('\n🎉 FB-Lane Framework bootstrapped successfully!');
  console.log('👉 Open this workspace folder in Antigravity 2.0 to see the agents in your left sidebar.\n');
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
      console.error('❌ Error: Usage: node tools/fb-lane.js claim <task-id> <lane> [locked_files]');
      process.exit(1);
    }
    handleClaim(taskId, lane, locks);
  } else if (command === 'submit') {
    const taskId = args[1];
    let stagingUrl = args[2] === '--no-tests' ? '' : args[2];
    if (!taskId) {
      console.error('❌ Error: Usage: node tools/fb-lane.js submit <task-id> [staging_url] [--no-tests]');
      process.exit(1);
    }
    handleSubmit(taskId, stagingUrl);
  } else if (command === 'merge') {
    const taskId = args[1];
    if (!taskId) {
      console.error('❌ Error: Usage: node tools/fb-lane.js merge <task-id>');
      process.exit(1);
    }
    handleMerge(taskId);
  } else {
    console.log(`
🤖 FB-Lane Automation Tool
==========================
Usage:
  node tools/fb-lane.js bootstrap             - Bootstrap project board, agents, and folders
  node tools/fb-lane.js status                  - Print active tasks & locks
  node tools/fb-lane.js claim <id> <lane> [lks] - Claim task, checkout branch, copy prompt to clipboard
  node tools/fb-lane.js submit <id> [url] [--no-tests] - Run tests, submit task, update board, push branch
  node tools/fb-lane.js merge <id>              - Merge branch to main, release locks, delete branch
  node tools/fb-lane.js mcp                     - Run local Model Context Protocol (MCP) server
`);
  }
}

main();
