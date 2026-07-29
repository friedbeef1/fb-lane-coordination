'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'auth-before-ai', path: '^supabase/functions/meja-ai/index\\.ts$', every: ['const auth = await authenticateRequest\\(req\\)', 'if \\(!auth\\)', 'auth\\.getUser\\(token\\)']},
  {id: 'bounded-rate-limits', path: '^supabase/functions/meja-ai/index\\.ts$', every: ['topic_pair: 30', 'curation: 15', 'coaching_tip: 30', 'checkRateLimit\\(auth\\.user\\.id, action\\)', "\\.from\\('meja_ai_rate_limits'\\)"]},
  {id: 'user-scoped-deletes', path: '^index\\.html$', every: ["from\\('meja_topic_sets'\\)\\.delete\\(\\)\\.eq\\('user_id', state\\.user\\.id\\)", "from\\('meja_sessions'\\)\\.delete\\(\\)\\.eq\\('user_id', state\\.user\\.id\\)"]},
  {id: 'credential-free-source-test', path: '^scripts/test-meja-ai-hardening\\.mjs$', every: ['readFile', 'authenticateRequest', 'checkRateLimit']},
]});
