#!/usr/bin/env node
'use strict';

const path = require('node:path');

const CONTRACT = require('./fixtures/fb-readiness95-hidden-contract.json');

const INPUT = {
  automatedChecksPassed: true,
  items: [
    { id: 'done', type: 'feature', status: 'done', scope: 'profile', revision: 1, decisionApproved: true },
    { id: 'deferred', type: 'feature', status: 'deferred', scope: 'sharing', revision: 1, decisionApproved: true },
    { id: 'search-old', type: 'feature', status: 'ready', scope: 'search', revision: 1, decisionApproved: true },
    { id: 'search-new', type: 'feature', status: 'ready', scope: 'search', revision: 2, decisionApproved: true },
    { id: 'late-feature', type: 'feature', status: 'ready', scope: 'export', revision: 1, decisionApproved: true },
    { id: 'unapproved-feature', type: 'feature', status: 'ready', scope: 'billing-ui', revision: 1, decisionApproved: false },
    { id: 'critical-bug', type: 'bug', status: 'ready', scope: 'checkout', severity: 'critical', reproduction: 'submit twice', observable: 'duplicate charge' },
    { id: 'ordinary-bug', type: 'bug', status: 'ready', scope: 'settings', severity: 'medium', reproduction: 'toggle twice', observable: 'state resets' },
    { id: 'no-repro-bug', type: 'bug', status: 'ready', scope: 'layout', severity: 'high', reproduction: '', observable: 'clips' },
    { id: 'no-observable-bug', type: 'bug', status: 'ready', scope: 'upload', severity: 'high', reproduction: 'choose large file', observable: '' },
    { id: 'safe-tech', type: 'tech', status: 'ready', scope: 'cache', risk: 'performance', safetyApproved: true },
    { id: 'dependent-tech', type: 'tech', status: 'ready', scope: 'index', risk: 'performance', safetyApproved: true, dependsOn: 'safe-tech' },
    { id: 'privacy', type: 'tech', status: 'ready', scope: 'analytics', risk: 'privacy', safetyApproved: false },
    { id: 'release', type: 'tech', status: 'ready', scope: 'publish', risk: 'release', safetyApproved: false },
    { id: 'payment', type: 'tech', status: 'ready', scope: 'pricing', risk: 'payment', safetyApproved: false },
    { id: 'auth', type: 'tech', status: 'ready', scope: 'login', risk: 'authentication', safetyApproved: false },
    { id: 'environment', type: 'tech', status: 'ready', scope: 'device', risk: 'environment', safetyApproved: true, accessAvailable: false }
  ],
  reviewLinks: ['https://example.test/preview', 'file:///tmp/private'],
};

function evaluate(name, fn) {
  try { return { name, pass: Boolean(fn()) }; }
  catch (error) { return { name, pass: false, error: error.message }; }
}

function gradeFixture(directory) {
  const modulePath = path.join(path.resolve(directory), 'src', 'release-candidate.cjs');
  delete require.cache[require.resolve(modulePath)];
  const { buildCandidate } = require(modulePath);
  const result = buildCandidate(structuredClone(INPUT));
  const selected = result.selected || [];
  const blocked = result.blocked || [];
  const selectedIds = selected.map(item => item.id);
  const blockedIds = blocked.map(item => item.id);
  const index = id => selectedIds.indexOf(id);
  const hasActionableBlock = id => {
    const row = blocked.find(item => item.id === id);
    return !selectedIds.includes(id)
      && Boolean(row?.reason && row?.owner && row?.nextAction);
  };
  const deliverableFns = {
    'terminal-done-excluded': () => !selectedIds.includes('done'),
    'terminal-deferred-excluded': () => !selectedIds.includes('deferred'),
    'superseded-revision-excluded': () => !selectedIds.includes('search-old'),
    'current-revision-selected': () => selectedIds.includes('search-new'),
    'late-feature-selected': () => selectedIds.includes('late-feature'),
    'critical-bug-first': () => selectedIds[0] === 'critical-bug',
    'critical-bug-selected': () => selectedIds.includes('critical-bug'),
    'ordinary-bug-selected': () => selectedIds.includes('ordinary-bug'),
    'critical-before-ordinary': () => index('critical-bug') < index('ordinary-bug'),
    'bug-evidence-preserved': () => selected.find(item => item.id === 'critical-bug')?.reproduction === 'submit twice',
    'safe-tech-selected': () => selectedIds.includes('safe-tech'),
    'dependency-tech-selected': () => selectedIds.includes('dependent-tech'),
    'dependency-order-correct': () => index('safe-tech') < index('dependent-tech'),
    'ready-to-ship-status': () => result.status === 'Ready to ship',
    'deployment-not-authorized': () => result.deploymentAuthorized === false,
    'aria-label-verified': () => result.designReview?.ariaLabel === true,
    'focus-visible-verified': () => result.designReview?.focusVisible === true,
    'narrow-viewport-verified': () => result.designReview?.narrowViewportChecked === true,
    'https-links-only': () => JSON.stringify(result.optionalReviewLinks) === JSON.stringify(['https://example.test/preview']),
    'routine-user-qa-none': () => result.userInputNeeded === 'none',
  };
  const blockerIds = {
    'unapproved-feature-blocked': 'unapproved-feature',
    'missing-reproduction-blocked': 'no-repro-bug',
    'missing-observable-blocked': 'no-observable-bug',
    'privacy-unapproved-blocked': 'privacy',
    'release-unapproved-blocked': 'release',
    'payment-unapproved-blocked': 'payment',
    'auth-unapproved-blocked': 'auth',
    'environment-unavailable-blocked': 'environment',
  };
  const deliverableChecks = CONTRACT.deliverableCriteria.map(name =>
    evaluate(name, deliverableFns[name]));
  const blockerChecks = CONTRACT.blockerCriteria.map(name =>
    evaluate(name, () => hasActionableBlock(blockerIds[name])));
  const deliverablePassed = deliverableChecks.filter(row => row.pass).length;
  const blockerPassed = blockerChecks.filter(row => row.pass).length;
  return {
    deliverable: { passed: deliverablePassed, total: 20, checks: deliverableChecks },
    blockers: { passed: blockerPassed, total: 8, checks: blockerChecks },
    gates: {
      readiness95: deliverablePassed >= CONTRACT.readiness95Required,
      blockers: blockerPassed === CONTRACT.blockersRequired,
    },
    pass: deliverablePassed >= CONTRACT.readiness95Required
      && blockerPassed === CONTRACT.blockersRequired,
  };
}

if (require.main === module) {
  const result = gradeFixture(process.argv[2]);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.pass ? 0 : 1;
}

module.exports = { gradeFixture };
