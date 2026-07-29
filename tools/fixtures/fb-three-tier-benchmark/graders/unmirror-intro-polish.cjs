'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'web-cta', path: '^src/components/IntroScreen\\.tsx$', pattern: 'See the Real You'},
  {id: 'android-cta', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', pattern: 'See the Real You'},
  {id: 'ios-cta-and-type', path: '^ios-native/Unmirror/ContentView\\.swift$', every: ['See the Real You', 'Fira Sans']},
  {id: 'ios-preview-bounds-test', path: '^ios-native/UnmirrorTests/', every: ['CameraPreviewLayout', 'previewBounds']},
  {id: 'ios-intro-presentation-test', path: '^ios-native/UnmirrorTests/ResponsiveLayoutTests\\.swift$', every: ['See the Real You', 'Fira Sans']},
]});
