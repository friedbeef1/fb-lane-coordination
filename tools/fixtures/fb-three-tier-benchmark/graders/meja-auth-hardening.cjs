'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {grade} = require('./_shared.cjs');

function authenticationAndRateLimitGatePrecedePaidWork(root) {
  const functionPath = path.join(root, 'supabase/functions/meja-ai/index.ts');
  if (!fs.existsSync(functionPath)) return false;
  const source = fs.readFileSync(functionPath, 'utf8');
  const handlerStart = source.indexOf('Deno.serve');
  const handlerEnd = source.indexOf('\nasync function authenticateRequest');
  const handler = source.slice(handlerStart, handlerEnd);
  const authentication = handler.indexOf('const auth = await authenticateRequest(req)');
  const authenticationRejection = handler.indexOf('if (!auth)');
  const rateLimit = handler.indexOf('const rate = await checkRateLimit(auth.user.id, action)');
  const rateLimitRejection = handler.indexOf('if (!rate.allowed)');
  const paidDispatches = [
    handler.indexOf('await topicPair('),
    handler.indexOf('await coachingTip('),
    handler.indexOf('await curation('),
  ];

  return handlerStart >= 0 && handlerEnd > handlerStart &&
    authentication >= 0 && authenticationRejection > authentication &&
    rateLimit > authenticationRejection && rateLimitRejection > rateLimit &&
    paidDispatches.every(dispatch => dispatch > rateLimitRejection) &&
    source.includes('auth.getUser(token)') &&
    source.includes('topic_pair: 30') && source.includes('curation: 15') && source.includes('coaching_tip: 30') &&
    source.includes(".from('meja_ai_rate_limits')");
}

exports.grade = root => {
  const baseline = grade(root, {criteria: [
  {id: 'user-scoped-deletes', path: '^index\\.html$', every: ["from\\('meja_topic_sets'\\)\\.delete\\(\\)\\.eq\\('user_id', state\\.user\\.id\\)", "from\\('meja_sessions'\\)\\.delete\\(\\)\\.eq\\('user_id', state\\.user\\.id\\)"]},
  {id: 'credential-free-source-test', path: '^scripts/test-meja-ai-hardening\\.mjs$', every: ['readFile', 'authenticateRequest', 'checkRateLimit']},
  ]});
  const gatesPrecedePaidWork = authenticationAndRateLimitGatePrecedePaidWork(root);
  const criterion = {
    id: 'auth-and-rate-limit-before-paid-ai',
    pass: gatesPrecedePaidWork,
    evidence: gatesPrecedePaidWork
      ? ['supabase/functions/meja-ai/index.ts']
      : [],
  };
  const criteria = [criterion, ...baseline.criteria];
  const passed = criteria.filter(candidate => candidate.pass).length;
  return {criteria, passed, total: criteria.length, readiness: passed / criteria.length, pass: passed === criteria.length};
};
