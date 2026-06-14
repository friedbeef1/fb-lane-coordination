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
function generateStartupPrompt(task, lane, branchName) {
  const roleName = `FB-${lane.charAt(0).toUpperCase() + lane.slice(1).toLowerCase()}`;
  return `You are an AI assistant adopting the **${roleName}** lane for this chat thread.
We are working on branch: **${branchName}**

### Task Details:
* **Task ID**: ${task.id}
* **Area**: ${task.area}
* **Scope**: ${task.scope}
* **Locked Files**: ${task.locks || '(None)'}

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
  runGit('add PROJECT_BOARD.md');
  runGit(`commit -m "docs: claim ${taskId} and lock files"`);

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
  const prompt = generateStartupPrompt(task, lane, branchName);
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

function handleSubmit(taskId, stagingUrl = '') {
  const boardPath = findBoardPath();
  if (!boardPath) {
    console.error('❌ Error: PROJECT_BOARD.md not found.');
    process.exit(1);
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
  runGit('add PROJECT_BOARD.md');
  runGit(`commit -m "docs: submit ${taskId} for staging qa"`);

  // Push branch
  console.log('Pushing feature branch to origin...');
  runGit('push origin HEAD');

  console.log(`\n✅ Task ${taskId} submitted for Staging QA!`);
  console.log(`   - Board updated and committed.`);
  console.log(`   - Branch pushed to remote.`);
  console.log(`\n👉 Request FB-Product to review the build and merge. Review instructions copied to clipboard!`);
  
  const reviewPrompt = `TASK-${taskId} is ready for review on Staging. 
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
  runGit('add PROJECT_BOARD.md');
  runGit(`commit -m "docs: complete ${taskId} and release locks"`);

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

        runGit('add PROJECT_BOARD.md');
        runGit(`commit -m "docs: claim ${taskId} and lock files"`);

        // Write Codex context
        const codexDir = path.join(path.dirname(boardPath), '.codex');
        if (!fs.existsSync(codexDir)) fs.mkdirSync(codexDir);
        fs.writeFileSync(path.join(codexDir, 'current_task.md'), `# Context\nTask: ${taskId}\nBranch: ${branchName}`, 'utf8');

        message = `Successfully claimed ${taskId} on branch ${branchName}. Locks: ${formattedLocks}.`;
      } else if (name === 'fb_lane_submit') {
        const { taskId, stagingUrl } = args;
        const updates = { status: 'Staging QA' };
        if (stagingUrl) updates.stagingUrl = `[Staging Link](${stagingUrl})`;
        
        updateBoardTask(boardPath, taskId, updates);
        runGit('add PROJECT_BOARD.md');
        runGit(`commit -m "docs: submit ${taskId} for staging qa"`);
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

        runGit('add PROJECT_BOARD.md');
        runGit(`commit -m "docs: complete ${taskId} and release locks"`);
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
function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : '';

  if (command === 'mcp') {
    runMcpServer();
  } else if (command === 'status') {
    handleStatus();
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
    const stagingUrl = args[2];
    if (!taskId) {
      console.error('❌ Error: Usage: node tools/fb-lane.js submit <task-id> [staging_url]');
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
  node tools/fb-lane.js status                  - Print active tasks & locks
  node tools/fb-lane.js claim <id> <lane> [lks] - Claim task, checkout branch, copy prompt to clipboard
  node tools/fb-lane.js submit <id> [url]       - Submit task, update board, push branch
  node tools/fb-lane.js merge <id>              - Merge branch to main, release locks, delete branch
  node tools/fb-lane.js mcp                     - Run local Model Context Protocol (MCP) server
`);
  }
}

main();
