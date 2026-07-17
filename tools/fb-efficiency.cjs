#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SENSITIVE = /\b(?:feature|lanes?|multi[- ]?lane|auth(?:entication|orization)?|privacy|private|analytics|payments?|secrets?|destructive|delete production|provider(?: state)?|release|live[- ]?release|deploy(?:ment)?|publication|publish externally|launch|OKR|production migration|external approval|architecture|core (?:product )?flow|multiple (?:owners?|repositories)|conflicting locks?|unresolved decision)\b/i;
const QUICK = /\b(?:fix|patch|correct|repair|typo|copy|documentation|docs-only|regression)\b/i;

function classifyExecutionMode(task = {}, options = {}) {
  const details = task.details || {};
  const text = [task.area, task.owner, task.scope, task.locks].filter(Boolean).join(' ');
  const approved = /^approved\b/i.test(String(details.approval || task.approval || ''));
  const owners = String(task.owner || '').split(/\s*(?:\+|,|\band\b)\s*/i).filter(Boolean);
  const ambiguous = options.ambiguous || !String(task.scope || '').trim();
  if (options.lockConflict || ambiguous || owners.length > 1 || SENSITIVE.test(text)) {
    return { mode: 'Full BFM', reason: 'material risk, ambiguity, multiple ownership, or lock conflict requires Full BFM' };
  }
  const bounded = /quick[- ]?fix/i.test(String(task.area || '')) || QUICK.test(String(task.scope || ''));
  if (approved && bounded && task.owner && task.locks && task.successCriteria) {
    return { mode: 'Quick BFM', reason: 'approved bounded correction with one owner and explicit evidence' };
  }
  if (options.requiresRecord || options.productApprovalRequired || approved) {
    return { mode: 'Full BFM', reason: 'durable coordination is required but the Quick contract is incomplete' };
  }
  return { mode: 'Normal Codex', reason: 'clear isolated low-risk work needs no durable FB record' };
}

function field(markdown, name) {
  return (String(markdown).match(new RegExp(`^${name}:\\s*(.*)$`, 'mi')) || [])[1]?.trim() || '';
}

function renderQuickRecord(input = {}) {
  const context = minimalWorkerContext({ brief: input.brief, candidate: input.candidate, feedback: input.feedback, requiredEvidence: input.requiredEvidence });
  return `---
type: fb-quick-record
task: ${input.id}
mode: Quick BFM
Status: in-progress
---

# ${input.id} - ${input.approvedCorrection || input.scope}

## Approved Correction

Scope: ${input.scope}
Owner: ${input.owner}
Locked files: ${input.locks}
Success criteria: ${input.successCriteria}
Approval: approved
Branch: ${input.branch || 'pending'}
Worktree: ${input.worktree || 'current'}
Focused verification: ${input.verificationPlan}
Elapsed limit minutes: ${input.elapsedLimitMinutes || 30}

## Minimal Worker Context

Current brief: ${context.brief || 'unavailable'}
Current candidate: ${context.candidate || 'unavailable'}
Specific feedback: ${context.feedback || 'none'}
Required evidence: ${context.requiredEvidence || input.verificationPlan}

## Closeout

Result: pending
Reviewer: pending
Reviewer decision: pending
Focused evidence: pending

${renderEfficiencyReceipt({})}
`;
}

function parseQuickRecord(markdown) {
  return {
    taskId: field(markdown, 'task'), mode: field(markdown, 'mode'), status: field(markdown, 'status'),
    scope: field(markdown, 'Scope'), owner: field(markdown, 'Owner'), locks: field(markdown, 'Locked files'),
    verificationPlan: field(markdown, 'Focused verification'), reviewer: field(markdown, 'Reviewer'),
  };
}

function findQuickRecord(repoRoot, taskId) {
  if (!/^TASK-Q-[A-Za-z0-9._-]+$/.test(String(taskId))) return null;
  const candidate = path.join(path.resolve(repoRoot), 'docs', 'handoffs', `${taskId}.md`);
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null;
  return field(fs.readFileSync(candidate, 'utf8'), 'mode') === 'Quick BFM' ? candidate : null;
}

function closeQuickRecord(markdown, closeout = {}) {
  const reviewers = Array.isArray(closeout.reviewer) ? closeout.reviewer : [closeout.reviewer].filter(Boolean);
  if (reviewers.length !== 1) throw new Error('Quick BFM requires exactly one reviewer.');
  if (!closeout.focusedEvidence) throw new Error('Quick BFM requires focused evidence.');
  let updated = String(markdown)
    .replace(/^status:\s*in-progress$/mi, 'Status: complete')
    .replace(/^Result:\s*pending$/m, `Result: ${closeout.result || 'completed'}`)
    .replace(/^Reviewer:\s*pending$/m, `Reviewer: ${reviewers[0]}`)
    .replace(/^Reviewer decision:\s*pending$/m, `Reviewer decision: ${closeout.reviewerDecision || 'approved'}`)
    .replace(/^Focused evidence:\s*pending$/m, `Focused evidence: ${closeout.focusedEvidence}`);
  updated = updated.replace(/## Efficiency Receipt[\s\S]*$/, renderEfficiencyReceipt(closeout.metrics || {}));
  return updated.endsWith('\n') ? updated : `${updated}\n`;
}

function classifyChangedSurface(paths = []) {
  const values = paths.map(String);
  const coordination = /^(?:PROJECT_BOARD\.md|AGENTS\.md|CHANGELOG\.md|\.codex\/(?:rules|current_task)\.md|docs\/(?:handoffs|workstreams|sessions)\/)/;
  if (values.length === 0 || values.every(file => coordination.test(file))) return 'coordination';
  if (values.some(file => /(?:supabase\/migrations|secrets?|auth|payments?|release|deploy|\.github\/workflows)/i.test(file))) return 'sensitive';
  if (values.some(file => /(?:^|\/)(?:tools|src|lib)\/(?!.*\.test\.)|package\.json|fb-lane\.validate/.test(file))) return 'runtime';
  if (values.some(file => /(?:\.test\.|\/tests?\/)/.test(file))) return 'test';
  if (values.some(file => /^docs\/|^README\.md$|^FAQ\.md$/.test(file))) return 'documentation';
  return 'coordination';
}

function verificationBudget(paths, checkpoint = {}) {
  const surface = classifyChangedSurface(paths);
  if (surface === 'sensitive') return { focused: [], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'Sensitive work requires Full BFM safety and release gates.' };
  if (surface === 'documentation') return { focused: ['documentation-contract'], runFullValidator: false, reuseCheckpoint: false, blockedReason: null };
  if (surface === 'test') return { focused: ['directly-affected-test'], runFullValidator: false, reuseCheckpoint: false, blockedReason: null };
  if (surface === 'coordination') return { focused: ['structure', 'links', 'whitespace'], runFullValidator: false, reuseCheckpoint: checkpoint.broadValidatorPassed === true, blockedReason: null };
  if ((checkpoint.broadValidatorRuns || 0) >= 1) return { focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'The broad validator already ran; a repeated broad gate is blocked.' };
  return { focused: ['runtime-focused'], runFullValidator: checkpoint.finalRuntimeCheckpoint === true, reuseCheckpoint: false, blockedReason: null };
}

function hasMaterialProgress(previous = {}, current = {}) {
  return ['source', 'generated', 'evidence', 'testState', 'blockerRecovery', 'approvedDirection']
    .some(key => current[key] !== undefined && current[key] !== previous[key]);
}

function evaluateRunBudget(state = {}, event = {}) {
  const next = { iterations: 0, repairLoops: 0, broadValidatorRuns: 0, ...state };
  const fail = reason => ({ blocked: true, reason, materialProgressRequired: true, state: next });
  if (event.materialProgress === false) return fail('Stopped after one cycle with no material progress.');
  if ((event.now ?? Date.now()) - (next.startedAt ?? Date.now()) >= (next.elapsedLimitMinutes || 30) * 60_000) return fail('Declared elapsed-time budget is exhausted.');
  if (next.tokenLimit != null && event.authoritativeTokens != null && event.authoritativeTokens >= next.tokenLimit) return fail('Authoritative token budget is exhausted.');
  if (next.costLimit != null && event.authoritativeCost != null && event.authoritativeCost >= next.costLimit) return fail('Authoritative cost budget is exhausted.');
  if (event.type === 'repair' && next.repairLoops >= 2) return fail('A third repair loop is blocked.');
  if (event.type === 'broad-validator' && next.broadValidatorRuns >= 1) return fail('A repeated broad gate is blocked.');
  if (['worker', 'review', 'repair', 'broad-validator'].includes(event.type) && next.iterations >= 5) return fail('A sixth agent iteration is blocked.');
  next.iterations += ['worker', 'review', 'repair'].includes(event.type) ? 1 : 0;
  next.repairLoops += event.type === 'repair' ? 1 : 0;
  next.broadValidatorRuns += event.type === 'broad-validator' ? 1 : 0;
  return { blocked: false, reason: null, materialProgressRequired: true, state: next };
}

function minimalWorkerContext(input = {}) {
  const forbidden = Object.keys(input).find(key => /transcript|history|private.*reason/i.test(key));
  if (forbidden) throw new Error('Worker context must exclude transcripts, conversation history, and private reasoning.');
  return { brief: input.brief, candidate: input.candidate, feedback: input.feedback, requiredEvidence: input.requiredEvidence };
}

function renderEfficiencyReceipt(metrics = {}) {
  const forbidden = Object.keys(metrics).find(key => /transcript|history|reasoning|secret|tokenValue|environment/i.test(key));
  if (forbidden) throw new Error('Efficiency metrics must exclude private, transcript, secret, and environment inputs.');
  const focused = Array.isArray(metrics.focusedChecks) ? metrics.focusedChecks.join(', ') || 'none' : (metrics.focusedChecks || 'none');
  return `## Efficiency Receipt

Mode: Quick BFM
Elapsed user wait: ${metrics.elapsedUserWait ?? 'unavailable'}
Tool calls: ${metrics.toolCalls ?? 'unavailable'}
Focused checks: ${focused}
Broad validator runs: ${metrics.broadValidatorRuns ?? 0}
Repeated checks: ${metrics.repeatedChecks ?? 0}
Repair loops: ${metrics.repairLoops ?? 0}
Reviewers: ${metrics.reviewers ?? 0}
Approximate tokens: ${metrics.approximateTokens ?? 'unavailable'}
Circuit breaker triggered: ${metrics.circuitBreakerTriggered ? 'yes' : 'no'}
`;
}

module.exports = { classifyExecutionMode, renderQuickRecord, parseQuickRecord, findQuickRecord, closeQuickRecord, classifyChangedSurface, verificationBudget, evaluateRunBudget, hasMaterialProgress, minimalWorkerContext, renderEfficiencyReceipt };
