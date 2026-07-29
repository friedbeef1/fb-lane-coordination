'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'sync-alert', path: '^index\\.html$', subchecks: [
    {id: 'sync-error-source', any: ['state\\.syncError', 'visibleSyncError\\(', 'visibleSyncWarning\\('], weight: 15},
    {id: 'dedicated-warning-render', any: ['renderSyncWarning', 'sync-warning(?:-banner)?'], weight: 15},
    {id: 'accessible-alert', any: ["role=[\"']alert[\"']"], weight: 10},
    {id: 'local-play-remains-available', any: ['Local play', 'Play on this device still works', 'local session backup'], weight: 10},
  ]},
  {id: 'dismiss-action', path: '^index\\.html$', subchecks: [
    {id: 'dismiss-control', any: ["data-action=[\"']dismissSyncWarning[\"']", "onclick=[\"'][^\"']*syncError\\s*=\\s*[\"'][\"']", "aria-label=[\"']Dismiss (?:sync )?warning[\"']"], weight: 15},
    {id: 'dismiss-handler', any: ['function dismissSyncWarning', 'const dismissSyncWarning', "onclick=[\"'][^\"']*syncError\\s*=\\s*[\"'][\"']"], weight: 15},
    {id: 'dismiss-state', any: ['syncErrorDismissed', 'dismissedSyncError', "syncError\\s*=\\s*[\"'][\"']"], weight: 10},
  ]},
  {id: 'warning-style', path: '^src/index\\.css$', subchecks: [
    {id: 'warning-banner-style', any: ['\\.sync-warning(?:-banner)?\\s*\\{'], weight: 5},
    {id: 'dismiss-control-style', any: ['\\.sync-warning-dismiss', '\\.warning-banner-dismiss', '\\.sync-warning-banner\\s+\\.warning-dismiss'], weight: 5},
  ]},
]});
