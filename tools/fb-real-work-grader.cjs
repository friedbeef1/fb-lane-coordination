const path = require('node:path');
const {FIXTURE_DIR} = require('./fb-real-work-benchmark-lib.cjs');

function gradeCandidate(taskId, candidateDir) {
  if (!/^[a-z0-9-]+$/.test(taskId)) throw new Error(`Unsafe grader id: ${taskId}`);
  const grader = require(path.join(FIXTURE_DIR, 'graders', `${taskId}.cjs`));
  return grader.grade(candidateDir);
}

module.exports = {gradeCandidate};
