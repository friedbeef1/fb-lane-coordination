'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCandidate } = require('../src/release-candidate.cjs');

test('returns selected and blocked collections', () => {
  const value = buildCandidate({ items: [], reviewLinks: [] });
  assert(Array.isArray(value.selected));
  assert(Array.isArray(value.blocked));
});

test('terminal work is not selected', () => {
  const value = buildCandidate({
    items: [{ id: 'done', type: 'feature', status: 'done', scope: 'profile' }],
    reviewLinks: [],
  });
  assert.deepEqual(value.selected, []);
});
