'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'root-scroll-contract', path: '^src/index\\.css$', every: ["Chromium's scrolling element", 'overflow-y: auto !important']},
  {id: 'real-wheel-verification', path: '^scripts/test-responsive-contract\\.mjs$', every: ['rootOverflowY', 'page\\.mouse\\.wheel', 'wheelScrollY']},
]});
