'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'web-immediate-local-preference', path: '^src/components/IntroScreen\\.tsx$', subchecks: [
    {id: 'web-device-local-key', any: ['unmirror\\.introExample\\.v1', 'INTRO_EXAMPLE_STORAGE_KEY'], weight: 10},
    {id: 'web-restores-selection', any: ['localStorage\\.getItem', 'resolveStoredIntroExample'], weight: 10},
    {id: 'web-writes-on-selection', every: ['localStorage\\.setItem'], any: ['persistSelectedExample', 'handleSelectExample', 'onClick'], weight: 10},
    {id: 'web-invalid-default', any: ['return savedExample ===', 'normalizeIntroExample', 'return \"female\"', "return 'female'"], weight: 5},
  ]},
  {id: 'android-normalized-preference', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', subchecks: [
    {id: 'android-local-preferences', every: ['SharedPreferences', 'getSharedPreferences'], weight: 10},
    {id: 'android-restores-selection', any: ['readIntroExamplePreference', 'readSelectedIntroExample', 'resolveStoredIntroExample'], weight: 10},
    {id: 'android-normalizes-invalid', any: ['normalizedIntroExampleLabel', 'normalizeIntroExampleSelection'], weight: 10},
    {id: 'android-persists-selection', every: ['putString', '\\.apply\\(\\)'], weight: 10},
  ]},
  {id: 'web-remount-test', path: '^src/App\\.test\\.tsx$', subchecks: [
    {id: 'web-immediate-behavior-proof', every: ['localStorage\\.getItem', 'fireEvent\\.click'], weight: 10},
    {id: 'web-restore-behavior-proof', any: ['unmount\\(\\)', 'remount', 'render\\(<App'], weight: 5},
  ]},
  {id: 'android-normalization-test', path: '^android-native/app/src/test/java/.*/MainActivityTest\\.kt$', subchecks: [
    {id: 'android-invalid-proof', any: ['invalid', 'Legacy', 'defaultsInvalid', 'restoresTheLastValidChoice', 'normalizedIntroExampleLabel'], weight: 5},
    {id: 'android-valid-proof', any: ['\"Male\"', '"male"'], weight: 5},
  ]},
]});
