'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'exact-session-core', path: '^src/meja-core\\.js$', every: ['function pairingUrl', 'function exactSessionId', '#/remote/']},
  {id: 'exact-session-controls', path: '^index\\.html$', every: ['state\\.exactSessionLoaded', 'pairingUrl\\(location\\.href, state\\.sessionId\\)', 'remoteViewOnly']},
  {id: 'presence-controller-access', path: '^index\\.html$', every: ["\\.on\\('presence'", 'controllerAccess\\(controllers, liveSyncClientId\\)', 'postgres_changes']},
  {id: 'focused-reliability-test', path: '^scripts/test-session-reliability\\.mjs$', every: ['exactSessionId', 'controllerAccess', 'remoteViewOnly']},
]});
