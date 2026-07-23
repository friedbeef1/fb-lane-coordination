#!/usr/bin/env node
'use strict';

// TASK-023 focused behavior tests. These fixtures are intentionally written
// before the eval validator so the first run preserves a genuine missing-
// behavior RED.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  parseEvalRecords,
  validateEvalDocument,
  validateQualityGaps,
  validateSelectedEvalIntegration,
  assertEvalCloseout,
  assertSelectedEvalCloseout,
  collectEvalDoctorChecks,
} = require('./fb-eval.cjs');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;
const cliPath = path.join(__dirname, 'fb-lane.cjs');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

function record(overrides = {}) {
  const values = {
    id: 'EVAL-HARNESS-001',
    type: 'harness',
    authority: 'shadow',
    previous: 'none',
    approval: 'Product approval: not required; Reference: initial-shadow-record',
    recorder: 'Product/BFM',
    decision: 'Product/BFM recorded the initial shadow authority.',
    judgment: 'objective',
    trigger: 'A review packet is prepared.',
    scenario: 'The reviewer opens the candidate from Test This Now.',
    target: 'The reviewer reaches the candidate directly.',
    pass: 'A direct Markdown link resolves.',
    mustNot: 'Do not describe an unavailable link as runnable.',
    evidence: 'The checked direct link and local resolution result.',
    owner: 'Product/BFM',
    result: 'not run',
    classification: 'None',
    revision: 'None - no failure has occurred.',
    rerun: 'not run',
    disposition: 'open',
    recommendation: 'Keep shadow until repeated evidence supports a change.',
    explanation: 'None - no advisory failure exists.',
    rootCause: 'None - no failure has occurred.',
    regression: 'None - no failure has occurred.',
    fresh: 'None - no failure has occurred.',
    consistency: 'Eval, handoff, board, session, and Git are not yet claiming closure.',
    changedDecision: 'No user decision changed.',
    briefRevision: 'None - the approved brief is unchanged.',
    mechanicalOrigin: 'None - this is a judgment scenario.',
    good: '',
    bad: '',
    ...overrides,
  };
  if (!Object.hasOwn(overrides, 'judgment') && values.type === 'product') values.judgment = 'subjective';
  if (!Object.hasOwn(overrides, 'disposition')) {
    const rerun = String(values.rerun).split(/\s+-\s+/, 1)[0];
    values.disposition = rerun === 'deferred' ? 'deferred' : rerun === 'superseded' ? 'superseded' : values.result === 'pass' ? 'passed' : 'open';
  }
  return `## Eval Record

Eval ID: ${values.id}
Eval type: ${values.type}
Authority: ${values.authority}
Previous authority: ${values.previous}
Authority change approval: ${values.approval}
Authority change recorded by: ${values.recorder}
Authority decision: ${values.decision}
Judgment: ${values.judgment}
Trigger: ${values.trigger}
Scenario: ${values.scenario}
Quality target: ${values.target}
Must pass: ${values.pass}
Must not happen: ${values.mustNot}
Evidence required: ${values.evidence}
Owner: ${values.owner}
Latest result: ${values.result}
Failure classification: ${values.classification}
Revision: ${values.revision}
Rerun result: ${values.rerun}
Disposition: ${values.disposition}
Promotion or demotion recommendation: ${values.recommendation}
Advisory failure explanation: ${values.explanation}
Root cause: ${values.rootCause}
Regression case: ${values.regression}
Fresh evidence: ${values.fresh}
Record consistency: ${values.consistency}
Changed user decision approval: ${values.changedDecision}
Approved brief revision: ${values.briefRevision}
Mechanical origin and regression evidence: ${values.mechanicalOrigin}
${values.good ? `Good example: ${values.good}\n` : ''}${values.bad ? `Bad example: ${values.bad}\n` : ''}`;
}

function gapDocument(id, status) {
  const closed = status === 'closed';
  const evalRecord = record({
    id, type: 'product', result: closed ? 'pass' : 'fail', classification: 'Eval failure',
    revision: closed ? 'Grounded the candidate.' : 'Revise the candidate.',
    rerun: closed ? 'pass - original scenario passed.' : 'not run',
    rootCause: closed ? 'Context was omitted.' : 'None - the failure remains open.',
    regression: closed ? 'R1 preserves the comparison.' : 'None - the failure remains open.',
    fresh: closed ? 'Fresh candidate passed.' : 'None - the failure remains open.',
    consistency: closed ? 'Record and evidence agree.' : 'The open record and gap agree.',
    good: 'Specific grounded action.', bad: 'Generic advice.',
  });
  return `${evalRecord}\nProgress: ${closed ? 'Complete — product quality target met' : 'Checking — product quality target missed'}\n\n## Quality Gap\n\nEval ID: ${id}\nGap status: ${status}\nWhat is insufficient: ${closed ? 'Historical' : 'Current'} candidate is generic.\nFailed quality dimension: usefulness\nGood example: Specific grounded action.\nBad example: Generic advice.\nResponsible layer: Product\nNext scoped revision: Preserve a grounded candidate.\nEvidence required for the next candidate: Fresh comparison.${closed ? '\nClosed evidence: Fresh candidate passed the original comparison.' : ''}`;
}

function expectInvalid(markdown, pattern, options) {
  assert.throws(() => validateEvalDocument(markdown, options), pattern);
}

test('record contract accepts every authority and rejects invalid or duplicate fields and IDs', () => {
  const shadow = record();
  const advisory = record({
    id: 'EVAL-HARNESS-002', authority: 'advisory', previous: 'shadow',
    approval: 'Product approval: not required; Reference: advisory-record-2026-07-17',
    decision: 'Product/BFM promoted this stable scenario to advisory.',
  });
  const blocking = record({
    id: 'EVAL-HARNESS-003', authority: 'blocking', previous: 'advisory',
    approval: 'Product approval: approved; Reference: APPROVED-PRODUCT-003',
    decision: 'Product recorded the approved promotion to blocking.',
  });
  const mechanical = record({
    id: 'EVAL-HARNESS-004', authority: 'mechanical', previous: 'advisory',
    approval: 'Product approval: approved; Reference: APPROVED-PRODUCT-004',
    decision: 'Product recorded the approved promotion to mechanical.',
    mechanicalOrigin: 'Existing deterministic direct-link validator; regression EVAL-HARNESS-004-R1.',
  });
  assert.strictEqual(parseEvalRecords([shadow, advisory, blocking, mechanical].join('\n')).length, 4);
  assert.doesNotThrow(() => validateEvalDocument([shadow, advisory, blocking, mechanical].join('\n')));
  expectInvalid(record({ id: 'bad id' }), /Eval ID/i);
  expectInvalid(record({ type: 'score' }), /Eval type/i);
  expectInvalid(record({ authority: 'automatic' }), /Authority/i);
  expectInvalid(record({ result: 'healthy' }), /Latest result/i);
  expectInvalid(`${shadow}\n${shadow}`, /unique|duplicate/i);
  expectInvalid(record().replace('Must pass: A direct Markdown link resolves.\n', ''), /Must pass/i);
});

test('new records start shadow and authority transitions require Product records and explicit promotion approval', () => {
  expectInvalid(record({ authority: 'advisory', previous: 'none' }), /start shadow/i);
  expectInvalid(record({ authority: 'advisory', previous: 'shadow', recorder: 'the eval itself' }), /Product\/BFM/i);
  expectInvalid(record({ authority: 'blocking', previous: 'advisory', approval: 'Product discussed it.' }), /explicit Product approval/i);
  expectInvalid(record({ authority: 'blocking', previous: 'advisory', approval: 'Explicit Product approval was not APPROVED-123' }), /explicit Product approval/i);
  expectInvalid(record({ authority: 'blocking', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-123', decision: 'The eval automatically self-promoted' }), /self-promote|automatic/i);
  expectInvalid(record({ authority: 'mechanical', previous: 'shadow', approval: 'Product approval: approved; Reference: APPROVED-1', mechanicalOrigin: 'None' }), /mechanical origin/i);
  assert.doesNotThrow(() => validateEvalDocument(record({ authority: 'blocking', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-123', decision: 'Product approved and recorded blocking authority.' })));
  assert.doesNotThrow(() => validateEvalDocument(record({
    authority: 'advisory', previous: 'blocking',
    approval: 'Product approval: not required; Reference: demotion-record-2026-07-17',
    decision: 'Product demoted the noisy eval to advisory.',
    recommendation: 'Demote immediately because the scenario is ambiguous.',
  })));
  expectInvalid(record({
    authority: 'advisory', previous: 'blocking',
    approval: 'Product approval: not required; Reference: demotion-record-2026-07-17',
    decision: 'Product demoted the noisy eval to advisory.',
    recommendation: 'Keep current authority.',
  }), /demotion recommendation/i);
});

test('subjective product evals require concrete good and bad examples and preserve privacy boundaries', () => {
  const product = record({
    id: 'EVAL-PRODUCT-001', type: 'product',
    target: 'Recommendations are specific to the creator commerce inputs.',
    good: 'Recommend a 48-hour cart-recovery sequence for the named ceramics launch.',
    bad: 'Use social media and improve engagement.',
  });
  assert.doesNotThrow(() => validateEvalDocument(product));
  expectInvalid(record({ id: 'EVAL-PRODUCT-002', type: 'product' }), /Good example|Bad example/i);
  assert.doesNotThrow(() => validateEvalDocument(record({ id: 'EVAL-PRODUCT-003', type: 'product', judgment: 'objective' })));
  assert.doesNotThrow(() => validateEvalDocument(record({ id: 'EVAL-PRODUCT-004', type: 'product', judgment: 'objective', authority: 'mechanical', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-PRODUCT-004', mechanicalOrigin: 'Existing deterministic validator regression R4.' })));
  expectInvalid(record({ judgment: 'subjective', authority: 'mechanical', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-MECHANICAL-1', mechanicalOrigin: 'Existing deterministic validator regression R1.' }), /objective Judgment/i);
  expectInvalid(product.replace('Evidence required: The checked direct link and local resolution result.', 'Evidence required: Private reasoning: hidden chain of thought.'), /private|privacy/i);
  expectInvalid(product.replace('Evidence required: The checked direct link and local resolution result.', 'Evidence required: API_TOKEN=secret-value'), /secret|credential/i);
});

test('shadow is nonblocking, advisory needs fix or explanation, and blocking or mechanical failure blocks closeout', () => {
  const failed = { result: 'fail', classification: 'Eval failure', revision: 'None - candidate has not been revised.', rerun: 'not run' };
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...failed, authority: 'shadow' })));
  assert.throws(() => assertEvalCloseout(record({ ...failed, authority: 'advisory', previous: 'shadow', approval: 'Product/BFM authority record.', decision: 'Product recorded advisory authority.', explanation: 'None' })), /advisory.*fix or explanation/i);
  assert.throws(() => assertEvalCloseout(record({ ...failed, authority: 'advisory', previous: 'shadow', approval: 'Product/BFM authority record.', decision: 'Product recorded advisory authority.', revision: 'A fix is planned but has no passing rerun.', explanation: 'None' })), /advisory.*fix or explanation/i);
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...failed, authority: 'advisory', previous: 'shadow', approval: 'Product/BFM authority record.', decision: 'Product recorded advisory authority.', explanation: 'Explicitly explained in TASK-001 handoff: deferred because the review environment is unavailable.' })));
  for (const authority of ['blocking', 'mechanical']) {
    assert.throws(() => assertEvalCloseout(record({
      ...failed, authority, previous: 'advisory',
      approval: `Product approval: approved; Reference: APPROVED-${authority}`,
      decision: `Product recorded ${authority} authority.`,
      mechanicalOrigin: authority === 'mechanical' ? 'Existing deterministic validator regression R1.' : 'None - judgment boundary.',
    })), new RegExp(`${authority}.*Checking|${authority}.*closeout`, 'i'));
  }
});

test('failure closure requires classification, revision, rerun, fresh evidence, root cause, regression, consistency, and decision approval', () => {
  const closed = record({
    result: 'pass', classification: 'Eval failure',
    revision: 'Added the missing direct review link without weakening the target.',
    rerun: 'pass - original missing-link scenario now resolves at commit abc1234.',
    rootCause: 'The handoff writer omitted the direct-link field.',
    regression: 'EVAL-HARNESS-001-R1 repeats the original missing-link scenario.',
    fresh: 'Commit abc1234 and link-resolution check on 2026-07-17.',
    consistency: 'Board, handoff, eval record, session recap, and Git abc1234 agree.',
    changedDecision: 'No user decision changed.',
    recommendation: 'Recommend a mechanical direct-link guardrail; no authority change was applied.',
  });
  assert.doesNotThrow(() => assertEvalCloseout(closed));
  for (const [label, value, pattern] of [
    ['Failure classification', 'None', /classification/i],
    ['Revision', 'None', /revision/i],
    ['Rerun result', 'not run', /rerun/i],
    ['Root cause', 'None', /root cause/i],
    ['Regression case', 'None', /regression/i],
    ['Fresh evidence', 'None', /fresh evidence/i],
    ['Record consistency', 'None', /consistency/i],
    ['Changed user decision approval', 'Changed pricing without approval.', /approval/i],
  ]) assert.throws(() => assertEvalCloseout(closed.replace(new RegExp(`${label}: [^\n]+`), `${label}: ${value}`)), pattern);
  for (const classification of ['Build failure', 'Brief failure', 'Eval failure', 'Environment failure']) {
    assert.doesNotThrow(() => validateEvalDocument(closed.replace('Failure classification: Eval failure', `Failure classification: ${classification}`)));
  }
  expectInvalid(closed.replace('Failure classification: Eval failure', 'Failure classification: Quality failure'), /Failure classification/i);

  for (const rerun of ['deferred', 'superseded']) {
    const resolvedAtProductBoundary = record({
      authority: 'blocking', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-BLOCK-BOUNDARY',
      decision: 'Product recorded blocking authority.', result: 'blocked', classification: 'Eval failure',
      revision: rerun === 'deferred' ? 'Product deferred the original scenario at the documented boundary.' : 'Product approved a Build Brief that supersedes the original scenario.',
      rerun: `${rerun} - explicit Product boundary decision APPROVED-BOUNDARY-1.`,
      rootCause: 'The original candidate did not meet the selected scenario.', regression: 'Regression R1 preserves the original failure evidence.',
      fresh: 'Fresh Product boundary evidence at commit abc1234.', consistency: 'Board, handoff, eval, session, and Git abc1234 agree.',
      changedDecision: 'Product approval: approved; Reference: APPROVED-BOUNDARY-1',
      briefRevision: rerun === 'superseded' ? 'Product-approved Build Brief revision APPROVED-BOUNDARY-1 replaces the original scenario.' : 'None - the approved brief is unchanged.',
    });
    assert.doesNotThrow(() => assertEvalCloseout(resolvedAtProductBoundary));
    assert.throws(() => assertEvalCloseout(resolvedAtProductBoundary.replace('Changed user decision approval: Product approval: approved; Reference: APPROVED-BOUNDARY-1', 'Changed user decision approval: Product discussion only.')), /explicit Product approval|approval/i);
  }
});

test('blocking and mechanical closeout requires coherent latest result, rerun, disposition, and Product boundary evidence', () => {
  const base = {
    authority: 'blocking', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-CLOSEOUT-1',
    decision: 'Product approved and recorded blocking authority.', classification: 'Eval failure',
    revision: 'Repaired the original candidate without weakening the quality target.',
    rootCause: 'The original candidate omitted required evidence.', regression: 'Regression R1 repeats the original scenario.',
    fresh: 'Fresh evidence at commit abc1234.', consistency: 'Board, handoff, eval, session, and Git abc1234 agree.',
    changedDecision: 'No user decision changed.',
  };
  for (const latest of ['fail', 'blocked', 'not run']) {
    assert.throws(() => assertEvalCloseout(record({ ...base, result: latest, rerun: 'pass - repair passed.', disposition: 'passed' })), /Latest result|coherent|disposition/i);
  }
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...base, result: 'pass', rerun: 'pass - repair passed.', disposition: 'passed' })));
  assert.throws(() => assertEvalCloseout(record({ ...base, result: 'pass', rerun: 'blocked - environment unavailable.', disposition: 'passed' })), /rerun|disposition|coherent/i);
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...base, result: 'blocked', rerun: 'deferred - Product boundary APPROVED-DEFER-1.', disposition: 'deferred', changedDecision: 'Product approval: approved; Reference: APPROVED-DEFER-1' })));
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...base, result: 'blocked', rerun: 'superseded - Product boundary APPROVED-SUPERSEDE-1.', disposition: 'superseded', changedDecision: 'Product approval: approved; Reference: APPROVED-SUPERSEDE-1', briefRevision: 'Approved Build Brief revision APPROVED-SUPERSEDE-1 replaces the original scenario.' })));
  assert.throws(() => assertEvalCloseout(record({ ...base, result: 'blocked', rerun: 'superseded - Product boundary APPROVED-SUPERSEDE-1.', disposition: 'superseded', changedDecision: 'Product approval: approved; Reference: APPROVED-SUPERSEDE-1' })), /brief revision/i);
});

test('one structured positive Product approval contract governs changed decisions and Product-boundary dispositions', () => {
  const closed = {
    result: 'pass', classification: 'Eval failure', revision: 'Repaired the candidate.',
    rerun: 'pass - original scenario passed.', rootCause: 'Required evidence was omitted.',
    regression: 'R1 repeats the original scenario.', fresh: 'Fresh evidence at abc1234.',
    consistency: 'Eval, handoff, board, session, and Git agree.',
  };
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...closed, changedDecision: 'Product approval: approved; Reference: APPROVED-DECISION-1' })));
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...closed, changedDecision: 'No user decision changed.' })));
  for (const spoof of [
    'Explicit Product approval was not APPROVED-123',
    'Product approval: not approved; Reference: APPROVED-DECISION-1',
    'Product approval: approved; Reference: TBD',
    'Product approval: approved',
    'Self approval: approved; Reference: APPROVED-DECISION-1',
    'The eval self-approved; Reference: APPROVED-DECISION-1',
  ]) assert.throws(() => assertEvalCloseout(record({ ...closed, changedDecision: spoof })), /Product approval|approval/i, spoof);
  for (const contradiction of [
    'No user decision changed; pricing changed without Product approval.',
    'No user decision changed. Pricing changed without Product approval.',
    'No user decision changed; except the approved pricing decision changed.',
  ]) assert.throws(() => assertEvalCloseout(record({ ...closed, changedDecision: contradiction })), /Product approval|approval/i, contradiction);

  const boundary = {
    ...closed, authority: 'blocking', previous: 'advisory',
    approval: 'Product approval: approved; Reference: APPROVED-AUTHORITY-1',
    decision: 'Product approved and recorded blocking authority.', result: 'blocked',
    rerun: 'deferred - Product boundary decision.', disposition: 'deferred',
  };
  assert.doesNotThrow(() => assertEvalCloseout(record({ ...boundary, changedDecision: 'Product approval: approved; Reference: APPROVED-DEFER-1' })));
  assert.throws(() => assertEvalCloseout(record({ ...boundary, changedDecision: 'Explicit Product approval was not APPROVED-123' })), /Product approval|approval/i);
});

test('Quality Gaps preserve history while open and closed states remain coherent with their eval record', () => {
  const openRecord = record({ id: 'EVAL-PRODUCT-001', type: 'product', result: 'fail', classification: 'Eval failure', revision: 'Revise the candidate.', good: 'Recommend the named cart-recovery flow.', bad: 'Improve marketing.' });
  assert.throws(() => validateQualityGaps(openRecord), /Checking.*Quality Gap|Quality Gap.*Checking/i);
  for (const control of [
    record({ id: 'EVAL-HARNESS-CONTROL-001', result: 'fail', classification: 'Eval failure', revision: 'Revise the harness.' }),
    record({ id: 'EVAL-PRODUCT-CONTROL-001', type: 'product', result: 'fail', classification: 'Build failure', revision: 'Repair the build.', good: 'Specific output.', bad: 'Generic output.' }),
    record({ id: 'EVAL-PRODUCT-CONTROL-002', type: 'product', judgment: 'objective', result: 'fail', classification: 'Eval failure', revision: 'Repair the deterministic output.' }),
  ]) assert.doesNotThrow(() => validateQualityGaps(control));
  const gap = `${openRecord}\nProgress: Checking — product quality target missed

## Quality Gap

Eval ID: EVAL-PRODUCT-001
Gap status: open
What is insufficient: Recommendations are generic despite functional output.
Failed quality dimension: output relevance and specificity
Good example: Recommend a cart-recovery flow tied to the named ceramics launch.
Bad example: Improve marketing and post more often.
Responsible layer: Product
Next scoped revision: Use product, audience, and channel inputs in each recommendation.
Evidence required for the next candidate: Fresh side-by-side output for the original scenario.`;
  assert.doesNotThrow(() => validateQualityGaps(gap));
  for (const field of ['What is insufficient', 'Failed quality dimension', 'Good example', 'Bad example', 'Responsible layer', 'Next scoped revision', 'Evidence required for the next candidate']) {
    const marker = gap.indexOf('## Quality Gap');
    const incomplete = `${gap.slice(0, marker)}${gap.slice(marker).replace(new RegExp(`${field}: [^\n]+`), `${field}: TODO`)}`;
    assert.throws(() => validateQualityGaps(incomplete), new RegExp(field, 'i'));
  }
  assert.throws(() => validateQualityGaps(gap.replace('Responsible layer: Product', 'Responsible layer: QA')), /Responsible layer/i);
  assert.throws(() => validateQualityGaps(gap.replace(/## Quality Gap[\s\S]*/, '')), /Quality Gap/i);
  assert.throws(() => validateQualityGaps(gap.replace('Progress: Checking — product quality target missed', 'Progress: Complete — product quality target met')), /Checking/i);
  const closedRecord = record({ id: 'EVAL-PRODUCT-001', type: 'product', result: 'pass', classification: 'Eval failure', revision: 'Grounded the candidate.', rerun: 'pass - original scenario passed.', rootCause: 'Context was omitted.', regression: 'R1 preserves the original comparison.', fresh: 'Fresh candidate abc1234.', consistency: 'Eval and handoff agree.', changedDecision: 'No user decision changed.', good: 'Recommend the named cart-recovery flow.', bad: 'Improve marketing.' });
  const closed = gap.replace(openRecord, closedRecord).replace('Progress: Checking — product quality target missed', 'Progress: Complete — product quality target met').replace('Gap status: open', 'Gap status: closed\nClosed evidence: Fresh candidate abc1234 passed the original comparison.');
  assert.doesNotThrow(() => validateQualityGaps(closed));
  assert.throws(() => validateQualityGaps(closed.replace('Progress: Complete — product quality target met', 'Progress: Checking — product quality target missed')), /closed|Checking/i);
  assert.throws(() => validateQualityGaps(closed.replace(/Closed evidence: [^\n]+\n/, '')), /Closed evidence/i);
  const gapMarker = gap.indexOf('## Quality Gap');
  const secretGap = `${gap.slice(0, gapMarker)}${gap.slice(gapMarker).replace('Evidence required for the next candidate: Fresh side-by-side output for the original scenario.', 'Evidence required for the next candidate: API_TOKEN=secret-value')}`;
  assert.throws(() => validateQualityGaps(secretGap), /secret|credential|token/i);
  const privateGap = `${gap.slice(0, gapMarker)}${gap.slice(gapMarker).replace('What is insufficient: Recommendations are generic despite functional output.', 'What is insufficient: Private reasoning: hidden chain of thought.')}`;
  assert.throws(() => validateQualityGaps(privateGap), /private|privacy|reasoning/i);
});

test('mixed open and closed Quality Gaps are scoped to their own record documents', () => {
  const closedRecord = record({ id: 'EVAL-PRODUCT-CLOSED-001', type: 'product', result: 'pass', classification: 'Eval failure', revision: 'Grounded the closed candidate.', rerun: 'pass - original scenario passed.', rootCause: 'Context was omitted.', regression: 'R1 preserves the comparison.', fresh: 'Fresh closed candidate.', consistency: 'Closed record and evidence agree.', changedDecision: 'No user decision changed.', good: 'Grounded action.', bad: 'Generic action.' });
  const closedDoc = `${closedRecord}\nProgress: Complete — product quality target met\n\n## Quality Gap\n\nEval ID: EVAL-PRODUCT-CLOSED-001\nGap status: closed\nWhat is insufficient: Historical candidate was generic.\nFailed quality dimension: output relevance and specificity\nGood example: Grounded action.\nBad example: Generic action.\nResponsible layer: Product\nNext scoped revision: Preserve the grounded candidate.\nEvidence required for the next candidate: Fresh comparison.\nClosed evidence: Fresh closed candidate passed.`;
  const openRecord = record({ id: 'EVAL-PRODUCT-OPEN-001', type: 'product', result: 'fail', classification: 'Eval failure', revision: 'Revise the open candidate.', good: 'Specific action.', bad: 'Generic advice.' });
  const openDoc = `${openRecord}\nProgress: Checking — product quality target missed\n\n## Quality Gap\n\nEval ID: EVAL-PRODUCT-OPEN-001\nGap status: open\nWhat is insufficient: Current candidate is generic.\nFailed quality dimension: usefulness\nGood example: Specific action.\nBad example: Generic advice.\nResponsible layer: Product\nNext scoped revision: Ground the candidate.\nEvidence required for the next candidate: Fresh comparison.`;
  assert.doesNotThrow(() => validateQualityGaps(`${closedDoc}\n\n${openDoc}`));
  assert.throws(() => validateQualityGaps(`${closedDoc.replace('Progress: Complete — product quality target met', 'Progress: Checking — product quality target missed')}\n\n${openDoc}`), /closed|Checking/i);
  assert.throws(() => validateQualityGaps(`${closedDoc}\n\n${openDoc.replace('Progress: Checking — product quality target missed', 'Progress: Complete — product quality target met')}`), /open|Checking/i);
});

test('selected evals integrate with briefs, handoff, Test This Now, receipt, and verification checkpoint', () => {
  const selected = 'Selected eval records: EVAL-PRODUCT-001 (shadow, pass, docs/evals/run.md#eval-product-001).';
  const integrated = `## Project Start Brief
Quality bar: Creator recommendations are actionable and specific.
Selected eval IDs and authority: EVAL-PRODUCT-001 (shadow).
${selected}
Mechanical versus judgment evidence: Link checks are mechanical; specificity is Product judgment.
Remaining user judgment: Confirm the recommendations fit the approved product promise.

## Build Brief
Quality bar: Preserve the approved specificity target.
Selected eval IDs and authority: EVAL-PRODUCT-001 (shadow); do not run unrelated catalog evals.
${selected}
Mechanical versus judgment evidence: Deterministic structure plus Product review.
Remaining user judgment: Approve any changed product direction.

## Verification Handoff
Selected eval results and evidence: EVAL-PRODUCT-001 passed with candidate abc1234 and fresh side-by-side evidence.
${selected}

## Task Receipt
Selected eval results and evidence: EVAL-PRODUCT-001 passed; no authority changed.
${selected}

## Test This Now
What was evaluated: Creator-commerce specificity against EVAL-PRODUCT-001.
${selected}
Direct link: [candidate](../candidate.md)
Exact scenarios and expected results: Original ceramics-launch scenario; recommendations name the launch, channel, and next action.
Known quality gaps: None remain for the selected scenario; broader catalog coverage was not run.
Required user judgment: Confirm fit against the approved product promise.

## Verification Checkpoint
Selected eval results and evidence: EVAL-PRODUCT-001 pass at abc1234; record and handoff agree.
${selected}`;
  assert.doesNotThrow(() => validateSelectedEvalIntegration(integrated, ['EVAL-PRODUCT-001']));
  for (const phrase of ['Quality bar:', 'Selected eval IDs and authority:', 'Mechanical versus judgment evidence:', 'Remaining user judgment:', 'Selected eval results and evidence:', 'What was evaluated:', 'Exact scenarios and expected results:', 'Known quality gaps:', 'Required user judgment:']) {
    assert.throws(() => validateSelectedEvalIntegration(integrated.replace(phrase, `Missing ${phrase}`), ['EVAL-PRODUCT-001']), /selected eval|quality|judgment|evaluated|scenario|gap/i, phrase);
  }
  assert.throws(() => validateSelectedEvalIntegration(integrated, ['EVAL-PRODUCT-999']), /EVAL-PRODUCT-999/i);
  assert.throws(() => validateSelectedEvalIntegration(integrated.replace(selected, 'Selected eval records: EVAL-PRODUCT-999 (shadow, pass, docs/evals/run.md#eval-product-999).'), ['EVAL-PRODUCT-001']), /consistent|selected eval records/i);
  assert.throws(() => validateSelectedEvalIntegration(integrated.replace(selected, 'Selected eval records: EVAL-PRODUCT-001 (shadow, fail, docs/evals/run.md#eval-product-001).'), ['EVAL-PRODUCT-001']), /consistent|result/i);
  assert.throws(() => validateSelectedEvalIntegration(integrated.replace(selected, 'Selected eval records: EVAL-PRODUCT-001 (shadow, pass, docs/evals/other.md#eval-product-001).'), ['EVAL-PRODUCT-001']), /consistent|evidence/i);
});

test('missing-link harness walkthrough fails, revises, reruns, records regression, and only recommends mechanical authority', () => {
  const failed = record({ result: 'fail', classification: 'Eval failure', revision: 'Add the omitted direct review link.', rerun: 'not run', recommendation: 'Recommend a mechanical guardrail after Product review; remain shadow.' });
  assert.doesNotThrow(() => validateEvalDocument(failed));
  assert.doesNotThrow(() => assertEvalCloseout(failed));
  const rerun = record({
    result: 'pass', classification: 'Eval failure', revision: 'Added [review candidate](../candidate.md) without changing the target.',
    rerun: 'pass - the original omitted-link scenario now resolves.', rootCause: 'The handoff omitted Direct links.',
    regression: 'EVAL-HARNESS-001-R1 removes Direct links and expects deterministic rejection.', fresh: 'Fresh link resolution at commit abc1234.',
    consistency: 'Board, handoff, eval, session, and Git abc1234 agree.', changedDecision: 'No user decision changed.',
    recommendation: 'Recommend mechanical direct-link guardrail; remain shadow pending explicit Product approval.',
  });
  assert.doesNotThrow(() => assertEvalCloseout(rerun));
  assert.match(rerun, /Authority: shadow/);
});

test('creator-commerce walkthrough stays Checking on generic output and closes only with fresh specific evidence', () => {
  const product = record({
    id: 'EVAL-PRODUCT-001', type: 'product', result: 'fail', classification: 'Eval failure',
    target: 'Recommendations use the creator product, audience, and channel.',
    good: 'For the ceramics launch, send a two-message cart recovery sequence to prior workshop buyers.',
    bad: 'Post more and improve engagement.', revision: 'Generate a new candidate grounded in the named product, audience, and channel.',
    recommendation: 'Keep shadow; collect more scenario evidence.',
  });
  const gap = `Progress: Checking — product quality target missed
## Quality Gap
Eval ID: EVAL-PRODUCT-001
Gap status: open
What is insufficient: The functional candidate gives generic recommendations.
Failed quality dimension: output relevance and specificity
Good example: Ground each action in the ceramics launch and workshop-buyer audience.
Bad example: Improve engagement on social media.
Responsible layer: Product
Next scoped revision: Bind each recommendation to product, audience, and channel inputs.
Evidence required for the next candidate: Fresh original-scenario output and Product comparison.`;
  assert.doesNotThrow(() => validateEvalDocument(product));
  assert.doesNotThrow(() => validateQualityGaps(`${product}\n${gap}`));
  const closed = record({
    id: 'EVAL-PRODUCT-001', type: 'product', result: 'pass', classification: 'Eval failure',
    target: 'Recommendations use the creator product, audience, and channel.',
    good: 'For the ceramics launch, send a two-message cart recovery sequence to prior workshop buyers.',
    bad: 'Post more and improve engagement.', revision: 'Grounded a new candidate without weakening the specificity target.',
    rerun: 'pass - original creator-commerce scenario passed Product review.', rootCause: 'The prompt omitted supplied commerce context.',
    regression: 'EVAL-PRODUCT-001-R1 preserves the original generic-output comparison.', fresh: 'Fresh candidate abc1234 and Product comparison.',
    consistency: 'Board, handoff, eval, session, and Git abc1234 agree.', changedDecision: 'No user decision changed.',
    recommendation: 'Keep shadow pending more evidence.',
  });
  assert.doesNotThrow(() => assertEvalCloseout(closed));
});

test('canonical catalog, categories, compatibility entry point, and root/package/template parity are complete', () => {
  const canonical = fs.readFileSync(path.join(repoRoot, 'docs', 'fb', 'evals.md'), 'utf8');
  const packagedCatalog = fs.readFileSync(path.join(repoRoot, 'plugins', 'fb-lane-coordination', 'docs', 'fb', 'evals.md'), 'utf8');
  for (const source of [canonical, packagedCatalog]) {
    for (const scenario of ['first-project clarity', 'plan-versus-build boundary', 'decisions versus assumptions', 'distinct lane contribution', 'parent-thread-only sidechat routing', 'Test This Now completeness', 'honest progress and blocked states', 'verification and recovery ownership']) assert.match(source, new RegExp(scenario, 'i'));
    for (const category of ['usefulness', 'workflow completeness', 'usability and clarity', 'visual polish', 'reliability', 'output relevance and specificity', 'trust and safety', 'fit against approved product promise']) assert.match(source, new RegExp(category, 'i'));
    assert.match(source, /do not run all catalog evals/i);
    assert.match(source, /no new eval becomes blocking during TASK-023/i);
  }
  for (const templatePath of ['docs/evals/eval-record-template.md', 'templates/docs/evals/eval-record-template.md', 'plugins/fb-lane-coordination/docs/evals/eval-record-template.md']) {
    const template = fs.readFileSync(path.join(repoRoot, templatePath), 'utf8');
    for (const field of ['Eval ID', 'Authority', 'Latest result', 'Evidence required']) assert.match(template, new RegExp(field, 'i'), `${templatePath} must retain ${field}`);
  }
  const compatibility = fs.readFileSync(path.join(repoRoot, 'docs', 'evals', 'agent-behavior-scorecard-template.md'), 'utf8');
  assert.match(compatibility, /eval-record-template\.md/);
  assert.match(compatibility, /docs\/fb\/evals\.md/);
  const validatorSource = fs.readFileSync(path.join(repoRoot, 'tools', 'fb-lane.validate.cjs'), 'utf8');
  assert.match(validatorSource, /fb-package-sync\.cjs/);
  assert.doesNotMatch(validatorSource, /sameFile\s*\(/);
});

test('bootstrap installs eight pages and both templates while preserving project-owned eval records and instructions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-eval-bootstrap-'));
  try {
    fs.mkdirSync(path.join(root, 'docs', 'evals'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'project-owned.md'), '# Keep this eval\n');
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'eval-record-template.md'), '# Project-owned eval template\n');
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Project instructions\n\nKeep this sentence.\n');
    execFileSync('node', [cliPath, 'bootstrap', '--platform', 'codex'], { cwd: root, stdio: 'ignore' });
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md', 'evals.md', 'records.md']) assert.ok(fs.existsSync(path.join(root, 'docs', 'fb', page)), page);
    assert.strictEqual(fs.readFileSync(path.join(root, 'docs', 'evals', 'project-owned.md'), 'utf8'), '# Keep this eval\n');
    assert.strictEqual(fs.readFileSync(path.join(root, 'docs', 'evals', 'eval-record-template.md'), 'utf8'), '# Project-owned eval template\n');
    assert.ok(fs.existsSync(path.join(root, 'docs', 'evals', 'agent-behavior-scorecard-template.md')));
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /Keep this sentence/);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /docs\/fb\/evals\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('documented fallback command sequence acquires every bootstrap runtime and canonical asset and runs exactly', () => {
  const setup = fs.readFileSync(path.join(repoRoot, 'docs', 'setup.md'), 'utf8');
  const match = setup.match(/## Manual CLI Bootstrap[\s\S]*?```bash\n([\s\S]*?)```/);
  assert.ok(match, 'manual fallback bash block must exist');
  const commands = match[1];
  assert.match(commands, /FB_LANE_ARCHIVE_URL/);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-eval-fallback-'));
  const archiveParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-eval-archive-'));
  try {
    const archiveRoot = path.join(archiveParent, 'fb-lane-coordination-main');
    fs.mkdirSync(path.join(archiveRoot, 'tools'), { recursive: true });
    fs.mkdirSync(path.join(archiveRoot, 'docs', 'fb'), { recursive: true });
    fs.mkdirSync(path.join(archiveRoot, 'docs', 'evals'), { recursive: true });
    for (const tool of ['fb-lane.cjs', 'fb-session.cjs', 'fb-eval.cjs', 'fb-efficiency.cjs', 'fb-changelog-closeout.cjs', 'fb-records.cjs']) fs.copyFileSync(path.join(repoRoot, 'tools', tool), path.join(archiveRoot, 'tools', tool));
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md', 'evals.md', 'records.md']) fs.copyFileSync(path.join(repoRoot, 'docs', 'fb', page), path.join(archiveRoot, 'docs', 'fb', page));
    for (const asset of ['eval-record-template.md', 'agent-behavior-scorecard-template.md']) fs.copyFileSync(path.join(repoRoot, 'docs', 'evals', asset), path.join(archiveRoot, 'docs', 'evals', asset));
    const archive = path.join(archiveParent, 'source.tar.gz');
    execFileSync('tar', ['-czf', archive, '-C', archiveParent, 'fb-lane-coordination-main']);
    const output = execFileSync('bash', ['-eu', '-o', 'pipefail', '-c', commands], { cwd: root, env: { ...process.env, FB_LANE_ARCHIVE_URL: `file://${archive}` }, encoding: 'utf8' });
    assert.match(output, /FB bootstrapped successfully/i);
    for (const tool of ['fb-lane.cjs', 'fb-session.cjs', 'fb-eval.cjs', 'fb-efficiency.cjs', 'fb-changelog-closeout.cjs', 'fb-records.cjs']) assert.strictEqual(fs.readFileSync(path.join(root, 'tools', tool), 'utf8'), fs.readFileSync(path.join(repoRoot, 'tools', tool), 'utf8'), tool);
    assert.doesNotThrow(() => execFileSync('node', ['-e', "require('./tools/fb-lane.cjs')"], { cwd: root, stdio: 'ignore' }));
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md', 'evals.md', 'records.md']) assert.strictEqual(fs.readFileSync(path.join(root, 'docs', 'fb', page), 'utf8'), fs.readFileSync(path.join(repoRoot, 'docs', 'fb', page), 'utf8'), page);
    for (const asset of ['eval-record-template.md', 'agent-behavior-scorecard-template.md']) assert.strictEqual(fs.readFileSync(path.join(root, 'docs', 'evals', asset), 'utf8'), fs.readFileSync(path.join(repoRoot, 'docs', 'evals', asset), 'utf8'), asset);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(archiveParent, { recursive: true, force: true });
  }
});

test('doctor reports deterministic eval record and parity failures without judging product semantics', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-eval-doctor-'));
  try {
    fs.mkdirSync(path.join(root, 'docs', 'evals'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'run.md'), record());
    let checks = collectEvalDoctorChecks(root);
    assert.ok(checks.some(check => check.level === 'ok' && /eval record/i.test(check.label)));
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'broken.md'), record({ id: 'EVAL-HARNESS-001' }));
    checks = collectEvalDoctorChecks(root);
    assert.ok(checks.some(check => check.level === 'fail' && /duplicate|unique/i.test(check.detail)));
    fs.rmSync(path.join(root, 'docs', 'evals', 'broken.md'));
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'run.md'), record({
      authority: 'blocking', previous: 'advisory',
      approval: 'Product approval: approved; Reference: APPROVED-BLOCK-DOCTOR', decision: 'Product recorded blocking authority.',
      result: 'fail', classification: 'Eval failure', revision: 'None - unresolved.', rerun: 'not run',
    }));
    checks = collectEvalDoctorChecks(root);
    assert.ok(checks.some(check => check.level === 'fail' && /blocking.*closeout|Checking/i.test(check.detail)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor accepts mixed historical closed and current open gaps across files and rejects either mismatched file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-eval-mixed-doctor-'));
  try {
    fs.mkdirSync(path.join(root, 'docs', 'evals'), { recursive: true });
    const closedPath = path.join(root, 'docs', 'evals', 'closed.md');
    const openPath = path.join(root, 'docs', 'evals', 'open.md');
    fs.writeFileSync(closedPath, gapDocument('EVAL-PRODUCT-CLOSED-001', 'closed'));
    fs.writeFileSync(openPath, gapDocument('EVAL-PRODUCT-OPEN-001', 'open'));
    let checks = collectEvalDoctorChecks(root);
    assert.ok(checks.some(check => check.level === 'ok' && /eval record/i.test(check.label)), checks.map(check => check.detail).join('\n'));
    fs.writeFileSync(closedPath, gapDocument('EVAL-PRODUCT-CLOSED-001', 'closed').replace('Progress: Complete — product quality target met', 'Progress: Checking — product quality target missed'));
    checks = collectEvalDoctorChecks(root);
    assert.ok(checks.some(check => check.level === 'fail' && /closed|Checking/i.test(check.detail)));
    fs.writeFileSync(closedPath, gapDocument('EVAL-PRODUCT-CLOSED-001', 'closed'));
    fs.writeFileSync(openPath, gapDocument('EVAL-PRODUCT-OPEN-001', 'open').replace('Progress: Checking — product quality target missed', 'Progress: Complete — product quality target met'));
    checks = collectEvalDoctorChecks(root);
    assert.ok(checks.some(check => check.level === 'fail' && /open|Checking/i.test(check.detail)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('selected-record closeout resolves repo records, rejects missing IDs, and applies authority semantics', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-eval-closeout-'));
  const selected = 'Selected eval records: EVAL-HARNESS-001 (shadow, fail, docs/evals/run.md#eval-harness-001).';
  const integration = `## Project Start Brief
Quality bar: Direct review access.
Selected eval IDs and authority: EVAL-HARNESS-001 (shadow).
${selected}
Mechanical versus judgment evidence: Link shape is mechanical; usability is judgment.
Remaining user judgment: Confirm the review flow is useful.
## Build Brief
Quality bar: Direct review access.
Selected eval IDs and authority: EVAL-HARNESS-001 (shadow).
${selected}
Mechanical versus judgment evidence: Link shape is mechanical; usability is judgment.
Remaining user judgment: Confirm the review flow is useful.
## Verification Handoff
Selected eval results and evidence: EVAL-HARNESS-001 failed in shadow and remains visible.
${selected}
## Task Receipt
Selected eval results and evidence: EVAL-HARNESS-001 failed in shadow and remains visible.
${selected}
## Test This Now
What was evaluated: EVAL-HARNESS-001 direct review access.
${selected}
Exact scenarios and expected results: Missing-link scenario fails; resolved link opens.
Known quality gaps: Direct link remains missing.
Required user judgment: None beyond the documented link check.
## Verification Checkpoint
Selected eval results and evidence: EVAL-HARNESS-001 shadow failure recorded.
${selected}`;
  try {
    fs.mkdirSync(path.join(root, 'docs', 'evals'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'run.md'), record({ result: 'fail', classification: 'Eval failure', revision: 'None - not yet revised.', rerun: 'not run' }));
    assert.throws(() => assertSelectedEvalCloseout(root, integration), /anchor|heading/i);
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'run.md'), `### EVAL-HARNESS-001\n\n${record({ result: 'fail', classification: 'Eval failure', revision: 'None - not yet revised.', rerun: 'not run' })}`);
    assert.doesNotThrow(() => assertSelectedEvalCloseout(root, integration));
    fs.appendFileSync(path.join(root, 'docs', 'evals', 'run.md'), '\n### EVAL-HARNESS-001\n');
    assert.throws(() => assertSelectedEvalCloseout(root, integration), /unique|duplicate|anchor|heading/i);
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'run.md'), `### EVAL-HARNESS-001\n\n${record({ result: 'fail', classification: 'Eval failure', revision: 'None - not yet revised.', rerun: 'not run' })}`);
    assert.throws(() => assertSelectedEvalCloseout(root, integration.replace(/EVAL-HARNESS-001/g, 'EVAL-HARNESS-999')), /EVAL-HARNESS-999/);
    assert.throws(() => assertSelectedEvalCloseout(root, integration.replace(selected, 'Selected eval records: EVAL-HARNESS-001 (shadow, pass, docs/evals/run.md#eval-harness-001).')), /consistent|result/i);
    assert.throws(() => assertSelectedEvalCloseout(root, integration.replace(/docs\/evals\/run\.md#eval-harness-001/g, 'docs/evals/missing.md#eval-harness-001')), /consistent|evidence|record/i);
    fs.writeFileSync(path.join(root, 'docs', 'evals', 'run.md'), `### EVAL-HARNESS-001\n\n${record({
      result: 'fail', classification: 'Eval failure', revision: 'None - not yet revised.', rerun: 'not run',
      authority: 'blocking', previous: 'advisory', approval: 'Product approval: approved; Reference: APPROVED-BLOCK-1', decision: 'Product recorded blocking authority.',
    })}`);
    assert.throws(() => assertSelectedEvalCloseout(root, integration.replaceAll('(shadow', '(blocking')), /blocking.*closeout|Checking/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
    console.log(`ok ${passed} - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err.stack || err.message);
    process.exitCode = 1;
    break;
  }
}

if (!process.exitCode) console.log(`TASK-023 eval tests passed (${passed}/${tests.length}).`);
