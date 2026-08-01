'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'selected-topic-motion', path: '^index\\.html$', subchecks: [
    {id: 'per-difficulty-reveal-state', any: ['revealedTopics', 'selectedTopicDifficulty'], weight: 15},
    {id: 'selected-difficulty-target', every: ['difficulty'], any: ['activeMotion\\.difficulty', 'topicFlip\\.difficulty', 'selectedTopicDifficulty', 'queuedDealMotionTarget'], weight: 15},
    {id: 'separate-topic-motion', any: ['topic-flip', 'topicFlipMotion', 'topicCardMotionClass'], weight: 10},
    {id: 'topic-motion-dispatch', any: ['queueDealMotion\\([^\\n]*topic-flip', "type:\\s*['\"]topic-flip"], weight: 10},
  ]},
  {id: 'reveal-and-hide-classes', path: '^(index\\.html|src/index\\.css)$', subchecks: [
    {id: 'reveal-motion', any: ['topic-flip-(?:reveal|enter)', 'motion-topic-flip-enter'], weight: 10},
    {id: 'hide-motion', any: ['topic-flip-(?:hide|back)', 'motion-topic-flip-back-enter'], weight: 10},
  ]},
  {id: 'targeted-flip-style', path: '^src/index\\.css$', subchecks: [
    {id: 'topic-card-scoped-style', every: ['\\.topic-card'], any: ['motion-topic-flip', 'topic-card-selected-difficulty'], weight: 10},
    {id: 'real-flip-transform', any: ['rotateY\\(', 'perspective\\('], weight: 10},
    {id: 'distinct-motion-duration', any: ['--motion-topic-flip\\s*:\\s*\\d+ms', 'motion-topic-flip[^\\n]*\\d+ms'], weight: 10},
  ]},
  {id: 'standalone-verifier', path: '^scripts/verify-standalone\\.mjs$', subchecks: [
    {id: 'topic-motion-verifier', any: ['topic-flip', 'selected topic', 'selected-card'], weight: 10},
  ]},
]});
