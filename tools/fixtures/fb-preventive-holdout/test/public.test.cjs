'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCandidate } = require('../src/release-candidate.cjs');

test('returns a candidate object', () => {
  const result = buildCandidate({ items: [], reviewLinks: [] });
  assert.equal(typeof result, 'object');
  assert(Array.isArray(result.selected));
  assert(Array.isArray(result.blocked));
});

test('does not select completed work', () => {
  const result = buildCandidate({
    items: [{ id: 'done', status: 'done', scope: 'search' }],
    reviewLinks: [],
  });
  assert.deepEqual(result.selected, []);
});
