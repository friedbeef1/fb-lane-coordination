const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {ALLOWED_REPOS, FIXTURE_DIR} = require('./fb-real-work-benchmark-lib.cjs');

const policy = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'forbidden-paths.json'), 'utf8'),
);
const forbiddenPaths = policy.pathPatterns.map(pattern => new RegExp(pattern));
const secretPatterns = policy.secretPatterns.map(pattern => new RegExp(pattern, 'i'));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {encoding: 'utf8', ...options});
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout.trim();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function listFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        const resolved = fs.realpathSync(absolute);
        if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
          throw new Error(`Symlink escapes fixture: ${relative}`);
        }
      } else if (stat.isDirectory()) {
        visit(absolute);
      } else if (stat.isFile()) {
        files.push(relative);
      }
    }
  }
  visit(root);
  return files.sort();
}

function looksBinary(buffer) {
  return buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0);
}

function scanFixture(root) {
  const rejected = [];
  const files = listFiles(root);
  for (const relative of files) {
    if (forbiddenPaths.some(pattern => pattern.test(relative))) {
      rejected.push(`${relative}: forbidden path`);
      continue;
    }
    const absolute = path.join(root, relative);
    const buffer = fs.readFileSync(absolute);
    if (looksBinary(buffer) && buffer.length > policy.maximumBinaryBytes) {
      rejected.push(`${relative}: oversized binary`);
      continue;
    }
    if (!looksBinary(buffer)) {
      const content = buffer.toString('utf8');
      if (secretPatterns.some(pattern => pattern.test(content))) {
        rejected.push(`${relative}: secret marker`);
      }
    }
  }
  return {files, rejected};
}

function removeForbidden(root) {
  const removed = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (forbiddenPaths.some(pattern => pattern.test(relative))) {
        fs.rmSync(absolute, {recursive: true, force: true});
        removed.push(relative);
      } else if (entry.isDirectory()) {
        visit(absolute);
      }
    }
  }
  visit(root);
  return removed.sort();
}

function hashFiles(root, files) {
  const hash = crypto.createHash('sha256');
  for (const relative of files) {
    hash.update(relative);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(root, relative)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function exportFixture(task, target) {
  if (!ALLOWED_REPOS.has(task.sourceRepo)) {
    throw new Error(`Unapproved source repository: ${task.sourceRepo}`);
  }
  if (!/^[a-f0-9]{7,40}$/.test(task.startCommit)) {
    throw new Error(`Unsafe commit: ${task.startCommit}`);
  }
  const commit = run('git', ['-C', task.sourceRepo, 'rev-parse', `${task.startCommit}^{commit}`]);
  const treeHash = run('git', ['-C', task.sourceRepo, 'rev-parse', `${commit}^{tree}`]);
  fs.rmSync(target, {recursive: true, force: true});
  fs.mkdirSync(target, {recursive: true});
  const archive = path.join(os.tmpdir(), `fb-real-work-${process.pid}-${Date.now()}.tar`);
  try {
    run('git', ['-C', task.sourceRepo, 'archive', '--format=tar', `--output=${archive}`, commit]);
    run('tar', ['-xf', archive, '-C', target]);
  } finally {
    fs.rmSync(archive, {force: true});
  }
  const removedPaths = removeForbidden(target);
  const scan = scanFixture(target);
  if (scan.rejected.length) {
    fs.rmSync(target, {recursive: true, force: true});
    throw new Error(`Unsafe fixture:\n${scan.rejected.join('\n')}`);
  }
  return {
    taskId: task.id,
    startCommit: commit,
    treeHash,
    exportedFilesSha256: hashFiles(target, scan.files),
    fileCount: scan.files.length,
    removedPaths,
  };
}

module.exports = {exportFixture, scanFixture};
