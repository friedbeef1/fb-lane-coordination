#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SENSITIVE = /\b(?:feature|lanes?|multi[- ]?lane|auth(?:entication|orization)?|privacy|private|analytics|payments?|secrets?|destructive|delete production|provider(?: state)?|release|live[- ]?release|deploy(?:ment)?|publication|publish externally|launch|OKR|production migration|external approval|architecture|core (?:product )?flow|multiple (?:owners?|repositories)|conflicting locks?|unresolved decision)\b/i;
const QUICK = /\b(?:fix|patch|correct|repair|typo|copy|documentation|docs-only|regression)\b/i;

function classifyExecutionMode(task = {}, options = {}) {
  const details = task.details || {};
  const declaredSlices = Array.isArray(task.executionSlices) ? task.executionSlices : (Array.isArray(task.slices) ? task.slices : null);
  const executionPlan = declaredSlices ? planExecutionSlices(declaredSlices) : null;
  const result = (mode, reason) => executionPlan ? { mode, reason, executionPlan } : { mode, reason };
  if (executionPlan && (executionPlan.slices.length > 1 || executionPlan.slices.some(slice => slice.mode === 'Full BFM'))) {
    return result('Full BFM', 'Full BFM coordinates multiple execution slices or any slice requiring safety gates');
  }
  const text = [task.area, task.owner, task.scope, task.locks].filter(Boolean).join(' ');
  const approved = /^approved\b/i.test(String(details.approval || task.approval || ''));
  const owners = String(task.owner || '').split(/\s*(?:\+|,|\band\b)\s*/i).filter(Boolean);
  const ambiguous = options.ambiguous || !String(task.scope || '').trim();
  if (options.lockConflict || ambiguous || owners.length > 1 || SENSITIVE.test(text)) {
    return result('Full BFM', 'material risk, ambiguity, multiple ownership, or lock conflict requires Full BFM');
  }
  const bounded = /quick[- ]?fix/i.test(String(task.area || '')) || QUICK.test(String(task.scope || ''));
  if (approved && bounded && task.owner && task.locks && task.successCriteria) {
    return result('Quick BFM', 'approved bounded correction with one owner and explicit evidence');
  }
  if (options.requiresRecord || options.productApprovalRequired || approved) {
    return result('Full BFM', 'durable coordination is required but the Quick contract is incomplete');
  }
  return result('Normal Codex', 'clear isolated low-risk work needs no durable FB record');
}

function field(markdown, name) {
  return (String(markdown).match(new RegExp(`^${name}:\\s*(.*)$`, 'mi')) || [])[1]?.trim() || '';
}

function renderQuickRecord(input = {}) {
  const context = minimalWorkerContext({ brief: input.brief, candidate: input.candidate, feedback: input.feedback, requiredEvidence: input.requiredEvidence });
  const changedPaths = Array.isArray(input.changedPaths)
    ? input.changedPaths.map(String)
    : String(input.locks || '').split(',').map(file => file.replace(/`/g, '').trim()).filter(Boolean);
  const policy = quickPolicyForPaths(changedPaths);
  const reviewRequired = policy.reviewers === 1;
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
Approval reference: ${input.approvalReference}
Branch: ${input.branch || 'pending'}
Worktree: ${input.worktree || 'current'}
Focused verification: ${input.verificationPlan}
Quick policy version: 2
Review required: ${reviewRequired ? 'yes' : 'no'}
Execution slice: 1 of 1
Slice elapsed limit minutes: ${policy.elapsedLimitMinutes}

## Run Budget

Slice started at epoch ms: ${input.startedAt ?? Date.now()}
Agent iterations: 1
Repair loops: 0
Broad validator runs: 0
Repeated checks: 0
No-progress cycles: 0
Material progress: initial execution
Token limit: ${input.tokenLimit ?? 'unavailable'}
Authoritative tokens: ${input.authoritativeTokens ?? 'unavailable'}
Cost limit: ${input.costLimit ?? 'unavailable'}
Authoritative cost: ${input.authoritativeCost ?? 'unavailable'}

## Minimal Worker Context

Current brief: ${context.brief || 'unavailable'}
Current candidate: ${context.candidate || 'unavailable'}
Specific feedback: ${context.feedback || 'none'}
Required evidence: ${context.requiredEvidence || input.verificationPlan}

## Closeout

Result: pending
Reviewer: ${reviewRequired ? 'pending' : 'not required'}
Reviewer decision: ${reviewRequired ? 'pending' : 'not required'}
Focused evidence: pending

${renderEfficiencyReceipt({})}
`;
}

function parseQuickRecord(markdown) {
  return {
    taskId: field(markdown, 'task'), mode: field(markdown, 'mode'), status: field(markdown, 'status'),
    scope: field(markdown, 'Scope'), owner: field(markdown, 'Owner'), locks: field(markdown, 'Locked files'),
    verificationPlan: field(markdown, 'Focused verification'), reviewer: field(markdown, 'Reviewer'),
    reviewRequired: quickRecordRequiresReview(markdown),
  };
}

function findQuickRecord(repoRoot, taskId) {
  if (!/^TASK-Q-[A-Za-z0-9._-]+$/.test(String(taskId))) return null;
  const candidate = path.join(path.resolve(repoRoot), 'docs', 'handoffs', `${taskId}.md`);
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null;
  return field(fs.readFileSync(candidate, 'utf8'), 'mode') === 'Quick BFM' ? candidate : null;
}

function closeQuickRecord(markdown, closeout = {}) {
  const reviewRequired = quickRecordRequiresReview(markdown);
  const reviewers = Array.isArray(closeout.reviewer) ? closeout.reviewer : [closeout.reviewer].filter(Boolean);
  if (reviewRequired && reviewers.length !== 1) throw new Error('Quick BFM runtime and test work requires exactly one reviewer.');
  if (!reviewRequired && reviewers.some(reviewer => !/^not required$/i.test(String(reviewer)))) throw new Error('Quick BFM documentation and coordination work requires zero reviewers.');
  if (!closeout.focusedEvidence) throw new Error('Quick BFM requires focused evidence.');
  const reviewer = reviewRequired ? reviewers[0] : 'not required';
  const reviewerDecision = reviewRequired ? (closeout.reviewerDecision || 'approved') : 'not required';
  let updated = String(markdown)
    .replace(/^status:\s*in-progress$/mi, 'Status: complete')
    .replace(/^Result:\s*pending$/m, `Result: ${closeout.result || 'completed'}`)
    .replace(/^Reviewer:\s*(?:pending|not required)$/m, `Reviewer: ${reviewer}`)
    .replace(/^Reviewer decision:\s*(?:pending|not required)$/m, `Reviewer decision: ${reviewerDecision}`)
    .replace(/^Focused evidence:\s*pending$/m, `Focused evidence: ${closeout.focusedEvidence}`);
  updated = updated.replace(/## Efficiency Receipt[\s\S]*$/, renderEfficiencyReceipt({ ...(closeout.metrics || {}), reviewers: reviewRequired ? 1 : 0 }));
  return updated.endsWith('\n') ? updated : `${updated}\n`;
}

function numericField(markdown, name, fallback = NaN) {
  const value = field(markdown, name);
  return /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : fallback;
}

function quickRecordRequiresReview(markdown) {
  const value = field(markdown, 'Review required');
  if (!value) return true;
  if (/^yes$/i.test(value)) return true;
  if (/^no$/i.test(value)) return false;
  throw new Error('Quick BFM Review required must be yes or no.');
}

function validateQuickRecordForSubmit(markdown, options = {}) {
  const approvalReference = field(markdown, 'Approval reference');
  const reviewer = field(markdown, 'Reviewer');
  const reviewerDecision = field(markdown, 'Reviewer decision');
  const focusedEvidence = field(markdown, 'Focused evidence');
  const reviewers = numericField(markdown, 'Reviewers');
  const reviewRequired = quickRecordRequiresReview(markdown);
  const policyVersion = field(markdown, 'Quick policy version');
  if (policyVersion && policyVersion !== '2') throw new Error('Unsupported Quick policy version.');
  const actualSurface = Array.isArray(options.changedPaths)
    ? classifyChangedSurface(options.changedPaths)
    : null;
  const policy = actualSurface ? quickPolicyForPaths(options.changedPaths) : null;
  if (actualSurface === 'sensitive') {
    throw new Error('Quick BFM cannot submit sensitive candidate changes; route them through Full BFM.');
  }
  if (actualSurface && !['coordination', 'documentation'].includes(actualSurface) && !reviewRequired) {
    throw new Error('The actual candidate changes require one reviewer; Review required cannot be waived in the record.');
  }
  const iterations = numericField(markdown, 'Agent iterations');
  const repairs = numericField(markdown, 'Repair loops');
  const broadRuns = numericField(markdown, 'Broad validator runs');
  const repeatedChecks = numericField(markdown, 'Repeated checks', 0);
  const noProgress = numericField(markdown, 'No-progress cycles');
  const progress = field(markdown, 'Material progress');
  const startedAt = numericField(markdown, 'Slice started at epoch ms', numericField(markdown, 'Started at epoch ms'));
  const elapsedLimit = numericField(markdown, 'Slice elapsed limit minutes', numericField(markdown, 'Elapsed limit minutes'));
  const now = options.now ?? Date.now();
  if (!approvalReference || /^(?:pending|unverified|none|n\/a)$/i.test(approvalReference)) throw new Error('Quick BFM submit requires a concrete approval reference.');
  if (reviewRequired && (!reviewer || /^pending$/i.test(reviewer) || reviewer.includes(',') || reviewers !== 1)) throw new Error('Quick BFM submit requires exactly one reviewer.');
  if (reviewRequired && !/^approved$/i.test(reviewerDecision)) throw new Error('Quick BFM submit requires Reviewer decision: approved.');
  if (!reviewRequired && (!/^not required$/i.test(reviewer) || !/^not required$/i.test(reviewerDecision) || reviewers !== 0)) throw new Error('Quick BFM documentation and coordination submit requires review fields to be not required and zero reviewers.');
  if (!focusedEvidence || /^pending$/i.test(focusedEvidence)) throw new Error('Quick BFM submit requires focused evidence.');
  if (!Number.isFinite(iterations) || iterations > 5) throw new Error('A sixth agent iteration is blocked.');
  if (!Number.isFinite(repairs) || repairs > 2) throw new Error('A third repair loop is blocked.');
  if (!Number.isFinite(broadRuns) || broadRuns > 1) throw new Error('A repeated broad gate is blocked.');
  if (!Number.isFinite(noProgress) || noProgress > 0) throw new Error('A no-progress cycle with no material progress is blocked.');
  if (!Number.isFinite(startedAt) || !Number.isFinite(elapsedLimit) || now - startedAt >= elapsedLimit * 60_000) throw new Error('The declared elapsed-time budget is exhausted.');
  if (policyVersion === '2' && policy && elapsedLimit > policy.elapsedLimitMinutes) throw new Error('The Quick elapsed-time budget exceeds its surface limit; route the work through Full BFM.');
  if (policyVersion === '2' && policy && iterations > policy.maxIterations) throw new Error('The Quick iteration budget is exhausted; route the work through Full BFM.');
  if (policyVersion === '2' && policy && repairs > policy.maxRepairs) throw new Error('The Quick repair budget is exhausted; route the work through Full BFM.');
  if ((iterations > 1 || repairs > 0 || repeatedChecks > 0) && (!progress || /^(?:none|no|pending|initial execution)$/i.test(progress))) throw new Error('Repeated Quick work requires a material progress delta.');
  const tokenLimit = numericField(markdown, 'Token limit');
  const tokens = numericField(markdown, 'Authoritative tokens');
  if (Number.isFinite(tokenLimit) && Number.isFinite(tokens) && tokens >= tokenLimit) throw new Error('The authoritative token budget is exhausted.');
  const costLimit = numericField(markdown, 'Cost limit');
  const cost = numericField(markdown, 'Authoritative cost');
  if (Number.isFinite(costLimit) && Number.isFinite(cost) && cost >= costLimit) throw new Error('The authoritative cost budget is exhausted.');
  if (/^yes$/i.test(field(markdown, 'Circuit breaker triggered'))) throw new Error('The Quick circuit breaker is already triggered.');
  return { reviewer, focusedEvidence, iterations, repairs, broadRuns };
}

function classifyChangedSurface(paths = []) {
  const values = paths.map(String);
  const coordination = /^(?:PROJECT_BOARD\.md|AGENTS\.md|CHANGELOG\.md|\.codex\/(?:rules|current_task)\.md|docs\/(?:handoffs|workstreams|sessions)\/)/;
  if (values.some(file => /(?:supabase\/migrations|secrets?|auth|payments?|release|deploy|\.github\/workflows)/i.test(file))) return 'sensitive';
  if (values.length === 0 || values.every(file => coordination.test(file))) return 'coordination';
  const nonCoordination = values.filter(file => !coordination.test(file));
  const isTest = file => /(?:\.test\.|\/tests?\/)/.test(file);
  const isDocumentation = file => /(?:^|\/)README\.md$|(?:^|\/)FAQ\.md$|\.md$/i.test(file);
  if (nonCoordination.some(file => !isTest(file) && !isDocumentation(file))) return 'runtime';
  if (nonCoordination.some(isTest)) return 'test';
  if (nonCoordination.every(isDocumentation)) return 'documentation';
  return 'runtime';
}

function quickPolicyForPaths(paths = []) {
  const surface = classifyChangedSurface(paths);
  if (surface === 'sensitive') {
    return { surface, mode: 'Full BFM', elapsedLimitMinutes: null, maxIterations: null, maxRepairs: null, reviewers: null, budgetScope: 'execution-slice' };
  }
  if (surface === 'coordination' || surface === 'documentation') {
    return { surface, mode: 'Quick BFM', elapsedLimitMinutes: 5, maxIterations: 2, maxRepairs: 1, reviewers: 0, budgetScope: 'execution-slice' };
  }
  return { surface, mode: 'Quick BFM', elapsedLimitMinutes: 15, maxIterations: 3, maxRepairs: 1, reviewers: 1, budgetScope: 'execution-slice' };
}

function planExecutionSlices(candidates = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) throw new Error('Execution planning requires at least one slice.');
  const ids = new Set();
  const slices = candidates.map((candidate, index) => {
    const id = String(candidate.id || '').trim();
    if (!id || ids.has(id)) throw new Error('Execution slice IDs must be present and unique.');
    ids.add(id);
    const declaredPaths = Array.isArray(candidate.paths)
      ? candidate.paths
      : String(candidate.locks || '').split(',');
    const paths = [...new Set(declaredPaths.map(String).map(value => value.trim()).filter(Boolean))];
    if (paths.length === 0) throw new Error(`Execution slice ${id} requires nonempty paths or locks.`);
    const outcome = String(candidate.outcome || '').trim();
    if (!outcome) throw new Error(`Execution slice ${id} requires an outcome.`);
    const completionCriteria = String(candidate.completionCriteria || '').trim();
    if (!completionCriteria) throw new Error(`Execution slice ${id} requires completion criteria.`);
    if (!Array.isArray(candidate.safetyTriggers)) throw new Error(`Execution slice ${id} requires a safety triggers array.`);
    const safetyTriggers = candidate.safetyTriggers.map(String).map(value => value.trim()).filter(Boolean);
    const focusedCheck = String(candidate.focusedCheck || '').trim();
    if (!focusedCheck) throw new Error(`Execution slice ${id} requires a focused check.`);
    const dependsOn = [...new Set((candidate.dependsOn || []).map(String).filter(Boolean))];
    const policy = quickPolicyForPaths(paths);
    const mode = safetyTriggers.length > 0 ? 'Full BFM' : policy.mode;
    return {
      id,
      order: index,
      outcome,
      paths,
      dependsOn,
      completionCriteria,
      safetyTriggers,
      focusedCheck,
      mode,
      elapsedLimitMinutes: mode === 'Full BFM' ? null : policy.elapsedLimitMinutes,
    };
  });
  const byId = new Map(slices.map(slice => [slice.id, slice]));
  for (const slice of slices) {
    for (const dependency of slice.dependsOn) {
      if (!byId.has(dependency)) throw new Error(`Execution slice ${slice.id} has unknown dependency ${dependency}.`);
      if (dependency === slice.id) throw new Error(`Execution slice ${slice.id} cannot depend on itself.`);
    }
  }
  const reaches = (fromId, targetId, seen = new Set()) => {
    if (fromId === targetId) return true;
    if (seen.has(fromId)) return false;
    seen.add(fromId);
    return byId.get(fromId).dependsOn.some(dependency => reaches(dependency, targetId, seen));
  };
  for (let left = 0; left < slices.length; left += 1) {
    for (let right = left + 1; right < slices.length; right += 1) {
      const first = slices[left];
      const second = slices[right];
      if (!first.paths.some(file => second.paths.includes(file))) continue;
      if (reaches(first.id, second.id) || reaches(second.id, first.id)) continue;
      second.dependsOn.push(first.id);
    }
  }
  const remaining = new Set(slices.map(slice => slice.id));
  const completed = new Set();
  const waves = [];
  while (remaining.size) {
    const ready = slices.filter(slice => remaining.has(slice.id) && slice.dependsOn.every(id => completed.has(id)));
    if (ready.length === 0) throw new Error('Execution slice dependency graph contains a cycle.');
    const sensitive = ready.find(slice => slice.mode === 'Full BFM');
    const wave = sensitive ? [sensitive] : ready;
    waves.push(wave);
    for (const slice of wave) {
      remaining.delete(slice.id);
      completed.add(slice.id);
    }
  }
  return { slices, waves };
}

function verificationBudget(paths, checkpoint = {}) {
  const surface = classifyChangedSurface(paths);
  if (surface === 'sensitive') return { level: 'immediate safety gate', focused: [], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'Sensitive work requires Full BFM safety and approval gates.' };
  if (surface === 'documentation') return { level: 'focused check', focused: ['documentation-contract'], runFullValidator: false, reuseCheckpoint: false, blockedReason: null };
  if (surface === 'test') return { level: 'focused check', focused: ['directly-affected-test'], runFullValidator: false, reuseCheckpoint: false, blockedReason: null };
  if (surface === 'coordination') return { level: 'focused check', focused: ['structure-and-links', 'whitespace'], runFullValidator: false, reuseCheckpoint: checkpoint.broadValidatorPassed === true, blockedReason: null };
  const release = checkpoint.releaseCheckpoint;
  if (checkpoint.releaseCheckpointRequested === true && !release) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'A release checkpoint requires a Product-owned handoff request.' };
  if (!release) return { level: 'focused check', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: null };
  const validOwner = release.requestedBy === 'Product';
  const validHandoff = /^docs\/handoffs\/[^/]+\.md$/.test(String(release.handoffPath || ''));
  if (!validOwner || !validHandoff) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'A release checkpoint requires a Product-owned handoff request.' };
  const repoRoot = path.resolve(checkpoint.repoRoot || process.cwd());
  const handoffPath = path.resolve(repoRoot, release.handoffPath);
  let handoff = '';
  if (handoffPath.startsWith(`${repoRoot}${path.sep}`) && fs.existsSync(handoffPath)) {
    handoff = fs.readFileSync(handoffPath, 'utf8');
  }
  if (!handoff) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'The authoritative release-checkpoint handoff is unavailable.' };
  if (/^fb_harness:\s*v3\s*$/im.test(handoff)) {
    const changelog = release.changelogVerification;
    if (!changelog || changelog.result !== 'passed' || changelog.candidateCommit !== release.candidateCommit) {
      return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'A v3 release checkpoint requires passing candidate-matched changelog verification.' };
    }
  }
  if (release.initialPass === 'pending' && checkpoint.finalRuntimeCheckpoint === true) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: true, reuseCheckpoint: false, blockedReason: null };
  if (release.initialPass === 'passed') return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'The initial release-checkpoint pass already passed.' };
  if (release.initialPass === 'failed' && release.consolidatedMaterialRepairBatch !== true) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'A failed initial pass requires a consolidated material repair batch before the final pass.' };
  if (release.initialPass === 'failed' && release.consolidatedMaterialRepairBatch === true && release.finalPass === 'pending' && checkpoint.finalRuntimeCheckpoint === true) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: true, reuseCheckpoint: false, blockedReason: null };
  if (release.initialPass === 'failed' && release.consolidatedMaterialRepairBatch === true && release.finalPass === 'failed') return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'Final pass failed; Product direction is required.' };
  if (release.initialPass === 'failed' && release.consolidatedMaterialRepairBatch === true) return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'The final pass already ran.' };
  return { level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: false, reuseCheckpoint: false, blockedReason: 'The release checkpoint request is incomplete.' };
}

function selectAutomatedChecks(paths = [], repoRoot = process.cwd()) {
  const surface = classifyChangedSurface(paths);
  const configPath = path.join(path.resolve(repoRoot), '.fb-lane.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      throw new Error(`Failed to parse .fb-lane.json: ${err.message}`);
    }
  }
  const focusedMinutes = config.timeouts?.focusedTestMinutes ?? 5;
  if (!Number.isFinite(focusedMinutes) || focusedMinutes <= 0 || focusedMinutes > 10) {
    throw new Error('Focused test timeout must be greater than zero and no more than 10 minutes for Quick BFM.');
  }
  const timeoutMs = focusedMinutes * 60_000;
  if (surface === 'coordination' || surface === 'documentation') {
    return [
      { id: 'structure-and-links', command: process.execPath, args: ['tools/fb-lane.cjs', 'doctor'], timeoutMs },
      { id: 'whitespace', command: 'git', args: ['diff', '--check'], timeoutMs },
    ];
  }
  const focusedTest = String(config.hooks?.focusedTest || '').trim();
  if (focusedTest) {
    return [{ id: 'project-test', command: focusedTest, args: [], shell: true, timeoutMs }];
  }
  const packagePath = path.join(path.resolve(repoRoot), 'package.json');
  let packageJson = null;
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (err) {
    throw new Error('Runtime changes require a project test script.');
  }
  if (!packageJson.scripts || typeof packageJson.scripts.test !== 'string' || !packageJson.scripts.test.trim()) {
    throw new Error('Runtime changes require a project test script.');
  }
  return [{ id: 'project-test', command: 'npm', args: ['test'], timeoutMs }];
}

function runAutomatedCheck(check, repoRoot = process.cwd()) {
  try {
    execFileSync(check.command, check.args, {
      cwd: repoRoot,
      env: process.env,
      shell: check.shell === true,
      timeout: check.timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    if (err && (err.code === 'ETIMEDOUT' || err.killed === true || err.signal === 'SIGTERM')) {
      throw new Error(`Focused check ${check.id} timed out; this candidate exceeds Quick BFM and requires Full BFM.`);
    }
    throw new Error(`Checking: automated check ${check.id} failed.`);
  }
}

function runQuickSubmissionChecks(markdown, changedPaths, repoRoot = process.cwd()) {
  validateQuickRecordForSubmit(markdown, { changedPaths });
  const manifest = selectAutomatedChecks(changedPaths, repoRoot);
  for (const check of manifest) runAutomatedCheck(check, repoRoot);
  return manifest;
}

function automatedVerificationDecision(input = {}) {
  const changedPaths = Array.isArray(input.changedPaths) ? input.changedPaths.map(String) : [];
  const checks = Array.isArray(input.checkResults) ? input.checkResults.map(check => ({ id: check.id, result: check.result })) : [];
  const optionalLinks = Array.isArray(input.optionalLinks) ? [...input.optionalLinks] : [];
  const candidateCommit = String(input.candidateCommit || '');
  const sameCandidate = /^[0-9a-f]{40}$/i.test(candidateCommit) && candidateCommit === String(input.checkedCommit || '');
  const surface = classifyChangedSurface(changedPaths);
  const passed = id => checks.some(check => check.id === id && check.result === 'passed');
  const combinedDocumentationCheck = passed('structure-and-links') || (passed('structure') && passed('links'));
  const checksPassed = ['coordination', 'documentation'].includes(surface)
    ? combinedDocumentationCheck && passed('whitespace')
    : passed('project-test');
  const safetyRequired = surface === 'sensitive';
  const safetyPassed = input.safetyGate && (
    (input.safetyGate.result === 'passed' && typeof input.safetyGate.approvalRef === 'string' && input.safetyGate.approvalRef.trim())
    || (!safetyRequired && input.safetyGate.result === 'not-applicable')
  );
  let status = 'Checking';
  let reason = 'Required automated checks have not passed for the current candidate.';
  if (input.bypassRequested) {
    status = 'Blocked';
    reason = 'Verification bypass requests cannot produce Ready to ship.';
  } else if (!safetyPassed) {
    status = 'Blocked';
    reason = safetyRequired ? 'Sensitive changes require a passed safety gate.' : 'The safety gate is unresolved.';
  } else if (sameCandidate && checksPassed) {
    status = 'Ready to ship';
    reason = 'Required automated checks passed for the current candidate.';
  }
  const reusable = status === 'Ready to ship';
  return {
    status,
    reusable,
    reason,
    candidateCommit,
    checks,
    optionalLinks,
    prompt: reusable ? [
      'Automated checks passed. Optional review links are available above.',
      'Say **Push Live** to deploy.',
    ].join('\n') : '',
  };
}

function hasMaterialProgress(previous = {}, current = {}) {
  return ['source', 'generated', 'evidence', 'testState', 'blockerRecovery', 'approvedDirection']
    .some(key => current[key] !== undefined && current[key] !== previous[key]);
}

function evaluateRunBudget(state = {}, event = {}) {
  const next = { iterations: 0, repairLoops: 0, broadValidatorRuns: 0, ...state };
  const policy = Array.isArray(next.changedPaths) ? quickPolicyForPaths(next.changedPaths) : null;
  const fail = reason => ({ blocked: true, reason, materialProgressRequired: true, state: next });
  if (event.materialProgress === false) return fail('Stopped after one cycle with no material progress.');
  const elapsedLimitMinutes = policy?.elapsedLimitMinutes ?? next.elapsedLimitMinutes ?? 30;
  const sliceStartedAt = next.sliceStartedAt ?? next.startedAt ?? Date.now();
  if ((event.now ?? Date.now()) - sliceStartedAt >= elapsedLimitMinutes * 60_000) return fail('Quick execution-slice elapsed-time budget is exhausted; reslice remaining work or route it through Full BFM.');
  if (next.tokenLimit != null && event.authoritativeTokens != null && event.authoritativeTokens >= next.tokenLimit) return fail('Authoritative token budget is exhausted.');
  if (next.costLimit != null && event.authoritativeCost != null && event.authoritativeCost >= next.costLimit) return fail('Authoritative cost budget is exhausted.');
  if (event.type === 'repair' && next.repairLoops >= (policy?.maxRepairs ?? 2)) return fail('Quick repair budget is exhausted; route the work through Full BFM.');
  if (event.type === 'broad-validator' && next.broadValidatorRuns >= 1) return fail('A repeated broad gate is blocked.');
  if (['worker', 'review', 'repair', 'broad-validator'].includes(event.type) && next.iterations >= (policy?.maxIterations ?? 5)) return fail('Quick iteration budget is exhausted; route the work through Full BFM.');
  next.iterations += ['worker', 'review', 'repair'].includes(event.type) ? 1 : 0;
  next.repairLoops += event.type === 'repair' ? 1 : 0;
  next.broadValidatorRuns += event.type === 'broad-validator' ? 1 : 0;
  return { blocked: false, reason: null, materialProgressRequired: true, state: next };
}

const fullRepairBudgets = new WeakMap();

function createFullRepairBudget(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'deadlineAt') || !Number.isFinite(input.deadlineAt)) {
    throw new Error('Full repair budget requires one authoritative deadlineAt value.');
  }
  const token = Object.freeze({ policy: 'fb-full-repair-budget-v1' });
  fullRepairBudgets.set(token, { deadlineAt: input.deadlineAt, repairs: 0, consumed: false });
  return token;
}

function consumeFullRepairBudget(token, event = {}) {
  const state = fullRepairBudgets.get(token);
  if (!state || state.consumed) throw new Error('Full repair budget token is invalid or already consumed.');
  if (!event || typeof event !== 'object' || Array.isArray(event) || Object.keys(event).some(key => !['now', 'materialProgress', 'userDecisionChanged'].includes(key)) || !Number.isFinite(event.now)) {
    throw new Error('Full repair budget requires authoritative now and optional material-progress or user-decision state.');
  }
  state.consumed = true;
  const fail = reason => ({ blocked: true, reason, nextBudget: null });
  if (event.userDecisionChanged === true) return fail('User decision changed; Product direction is required.');
  if (event.now >= state.deadlineAt) return fail('Full repair deadline is exhausted; choose the next execution slice.');
  if (event.materialProgress === false) return fail('Stopped after one cycle with no material progress.');
  if (state.repairs >= 2) return fail('Full BFM repair budget is exhausted.');
  const nextBudget = createFullRepairBudget({ deadlineAt: state.deadlineAt });
  fullRepairBudgets.get(nextBudget).repairs = state.repairs + 1;
  return { blocked: false, reason: null, nextBudget };
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

module.exports = { classifyExecutionMode, renderQuickRecord, parseQuickRecord, findQuickRecord, closeQuickRecord, validateQuickRecordForSubmit, classifyChangedSurface, quickPolicyForPaths, planExecutionSlices, verificationBudget, selectAutomatedChecks, runAutomatedCheck, runQuickSubmissionChecks, automatedVerificationDecision, evaluateRunBudget, createFullRepairBudget, consumeFullRepairBudget, hasMaterialProgress, minimalWorkerContext, renderEfficiencyReceipt };
