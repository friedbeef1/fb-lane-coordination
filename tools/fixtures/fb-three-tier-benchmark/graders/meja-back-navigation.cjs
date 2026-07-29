'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'bounded-route-stack', path: '^index\\.html$', every: ['let routeHistoryStack = \\[normalizedAppRouteHash\\(\\)\\]', 'function normalizedAppRouteHash', 'function rememberRouteTransition']},
  {id: 'safe-previous-route', path: '^index\\.html$', every: ['function previousRouteFallback', 'routeHistoryStack\\.pop\\(\\)']},
  {id: 'separate-back-labels', path: '^index\\.html$', every: ['Previous Step', 'Round View']},
  {id: 'standalone-verifier', path: '^scripts/verify-standalone\\.mjs$', every: ['Visible Back controls use immediate previous-screen route navigation', 'routeHistoryStack']},
]});
