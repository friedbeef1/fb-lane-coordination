'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'exact-session-core', path: '^(src/meja-core\\.js|index\\.html)$', subchecks: [
    {id: 'exact-session-route-builder', any: ['function pairingUrl', 'function buildRemoteSessionRoute'], weight: 10},
    {id: 'session-id-encoded', any: ['encodeURIComponent\\(', 'searchParams\\.set\\([^\\n]*session'], weight: 10},
    {id: 'exact-session-route-parser', any: ['function exactSessionId', 'function parseRemoteSessionRoute', 'URLSearchParams'], weight: 10},
  ]},
  {id: 'exact-session-controls', path: '^index\\.html$', subchecks: [
    {id: 'exact-session-loaded-state', any: ['exactSessionLoaded', 'state\\.exactSessionLoaded'], weight: 10},
    {id: 'waits-for-exact-session', any: ['waitingForExactSession', 'until the exact session', 'exact session to load', '!state\\.exactSessionLoaded'], weight: 10},
    {id: 'controls-disabled-until-ready', every: ['disabled'], any: ['aria-disabled', 'remoteControlsDisabledAttrs', 'applyRemoteControlAccess'], weight: 10},
  ]},
  {id: 'presence-controller-access', path: '^index\\.html$', subchecks: [
    {id: 'presence-membership', any: ["\\.on\\('presence'", 'writeRemotePresence', 'upsertRemotePresence'], weight: 10},
    {id: 'one-controller-selection', any: ['controllerAccess\\(', 'remoteControlAccess\\(', 'resolveRemoteControllerAccess\\('], weight: 10},
    {id: 'second-controller-view-only', any: ['remoteViewOnly', 'isViewOnly', "'view-only'", '"view-only"'], weight: 10},
  ]},
  {id: 'focused-reliability-test', path: '^scripts/(?:test|verify)-session-reliability\\.mjs$|^scripts/verify-standalone\\.mjs$', subchecks: [
    {id: 'exact-session-proof', any: ['exactSessionId', 'exact-session', 'exact session'], weight: 5},
    {id: 'controller-access-proof', any: ['controllerAccess', 'remoteControlAccess', 'controller access'], weight: 5},
    {id: 'view-only-proof', any: ['remoteViewOnly', 'view-only', 'isViewOnly'], weight: 5},
  ]},
]});
