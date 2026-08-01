'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'bounded-route-stack', path: '^index\\.html$', subchecks: [
    {id: 'in-memory-route-stack', any: ['routeHistoryStack', 'routeStack', 'navigationStack'], weight: 15},
    {id: 'normalized-route-recording', any: ['normalizedAppRouteHash', 'normalizeRoute', 'normalizedRoute'], weight: 10},
    {id: 'transition-recording', any: ['rememberRouteTransition', 'recordRouteTransition', 'routeStack\\.push'], weight: 10},
    {id: 'bounded-growth', any: ['\\.splice\\(', '\\.shift\\(', '\\.slice\\(-', 'MAX_ROUTE_STACK'], weight: 10},
  ]},
  {id: 'safe-previous-route', path: '^index\\.html$', subchecks: [
    {id: 'previous-route-resolution', any: ['previousRouteFallback', 'previousRoute', 'safePreviousRoute'], weight: 10},
    {id: 'stack-pop-navigation', any: ['routeHistoryStack\\.pop\\(\\)', 'routeStack\\.pop\\(\\)', 'navigationStack\\.pop\\(\\)'], weight: 15},
    {id: 'no-raw-browser-back', none: ['history\\.(?:back|go)\\('], weight: 10},
  ]},
  {id: 'separate-back-labels', path: '^index\\.html$', subchecks: [
    {id: 'host-phase-label', pattern: 'Previous Step', weight: 5},
    {id: 'round-view-label', pattern: 'Round View', weight: 5},
  ]},
  {id: 'standalone-verifier', path: '^scripts/verify-standalone\\.mjs$', subchecks: [
    {id: 'controlled-navigation-proof', any: ['controlled route stack', 'immediate previous-screen', 'routeHistoryStack', 'routeStack'], weight: 10},
  ]},
]});
