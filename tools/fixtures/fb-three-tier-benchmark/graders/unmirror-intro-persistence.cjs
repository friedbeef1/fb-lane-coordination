'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'web-immediate-local-preference', path: '^src/components/IntroScreen\\.tsx$', every: ['unmirror\\.introExample\\.v1', 'localStorage\\.setItem']},
  {id: 'android-normalized-preference', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', every: ['normalizedIntroExampleLabel', 'readIntroExamplePreference', 'writeIntroExamplePreference']},
  {id: 'web-remount-test', path: '^src/App\\.test\\.tsx$', every: ['unmirror\\.introExample\\.v1', 'remembers the selected intro example immediately']},
  {id: 'android-normalization-test', path: '^android-native/app/src/test/java/.*/MainActivityTest\\.kt$', every: ['androidIntroExample_restoresTheLastValidChoice', 'normalizedIntroExampleLabel']},
]});
