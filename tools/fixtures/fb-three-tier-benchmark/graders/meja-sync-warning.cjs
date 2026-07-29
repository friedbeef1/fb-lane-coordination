'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'sync-alert', path: '^index\\.html$', every: ['state\\.syncError', 'sync-warning-banner', 'role="alert"']},
  {id: 'dismiss-action', path: '^index\\.html$', every: ['warning-dismiss', 'Dismiss warning']},
  {id: 'warning-style', path: '^src/index\\.css$', every: ['MEJA-100: Playful sync warning banner styling', '\\.sync-warning-banner']},
]});
