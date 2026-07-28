const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadTaskRegistry,
  loadRetrospectiveRegistry,
  validateRegistry,
} = require('./fb-real-work-benchmark-lib.cjs');

test('freezes six paired tasks and an 18-task real-work mix', () => {
  const tasks = loadTaskRegistry();
  const retrospective = loadRetrospectiveRegistry();
  assert.equal(tasks.length, 6);
  assert.equal(retrospective.length, 18);
  assert.deepEqual(tasks.map(task => task.id), [
    'unmirror-intro',
    'unmirror-saved-capture',
    'unmirror-native-analytics',
    'meja-scroll',
    'meja-pairing',
    'meja-redesign',
  ]);
  assert.doesNotThrow(() => validateRegistry(tasks, retrospective));
});

test('rejects duplicate, unsafe, or unapproved registry rows', () => {
  const tasks = loadTaskRegistry();
  const retrospective = loadRetrospectiveRegistry();
  assert.throws(() => validateRegistry([...tasks, tasks[0]], retrospective), /cardinality/);
  assert.throws(
    () => validateRegistry(tasks.map((task, index) => index ? task : {...task, sourceRepo: '/tmp/other'}), retrospective),
    /Unapproved source/,
  );
  assert.throws(
    () => validateRegistry(tasks.map((task, index) => index ? task : {...task, startCommit: '../main'}), retrospective),
    /Unsafe commit/,
  );
});
