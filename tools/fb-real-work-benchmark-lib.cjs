const fs = require('node:fs');
const path = require('node:path');

const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'fb-real-work-benchmark');
const ALLOWED_REPOS = new Set([
  '/Users/jamesyeang/Projects/mirrorcam',
  '/Users/jamesyeang/Documents/New project-recovered-20260723',
]);

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8'));
}

function loadTaskRegistry() {
  return readJson('tasks.json');
}

function loadRetrospectiveRegistry() {
  return readJson('retrospective.json');
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

function assertCommit(value) {
  if (!/^[a-f0-9]{7,40}$/.test(value)) throw new Error(`Unsafe commit: ${value}`);
}

function validateRegistry(tasks, retrospective) {
  if (tasks.length !== 6 || retrospective.length !== 18) {
    throw new Error('Frozen registry cardinality mismatch');
  }
  assertUnique(tasks.map(task => task.id), 'task id');
  assertUnique(retrospective.map(task => `${task.project}:${task.taskId}`), 'retrospective task');
  for (const task of tasks) {
    if (!ALLOWED_REPOS.has(task.sourceRepo)) {
      throw new Error(`Unapproved source repository: ${task.sourceRepo}`);
    }
    assertCommit(task.startCommit);
    task.acceptanceCommits.forEach(assertCommit);
    if (!task.publicRecords.length || !task.focusedProof || !task.hiddenGrader) {
      throw new Error(`Incomplete task definition: ${task.id}`);
    }
  }
  return true;
}

module.exports = {
  ALLOWED_REPOS,
  FIXTURE_DIR,
  loadTaskRegistry,
  loadRetrospectiveRegistry,
  validateRegistry,
};
