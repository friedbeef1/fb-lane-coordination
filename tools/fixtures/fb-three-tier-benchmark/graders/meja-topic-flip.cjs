'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'selected-topic-motion', path: '^index\\.html$', every: ['queuedDealMotionTarget', 'function topicCardMotionClass', "queueDealMotion\\('topic-flip'"]},
  {id: 'reveal-and-hide-classes', path: '^index\\.html$', every: ['motion-topic-flip-enter', 'motion-topic-flip-back-enter']},
  {id: 'targeted-flip-style', path: '^src/index\\.css$', every: ['\\.topic-card\\.motion-topic-flip-enter', '440ms']},
  {id: 'standalone-verifier', path: '^scripts/verify-standalone\\.mjs$', pattern: 'motion-topic-flip'},
]});
