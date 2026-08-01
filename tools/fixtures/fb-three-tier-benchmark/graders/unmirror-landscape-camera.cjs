'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'orientation-layout', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', every: ['cameraComparisonLayoutForWindowOrientation', 'CameraComparisonLayout\\.SideBySide']},
  {id: 'physical-pane-order', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', every: ['cameraComparisonHorizontalOffsets', 'CameraComparisonHorizontalOffsets\\(mirror = 0, actual =']},
  {id: 'live-camera-orientation', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', every: ['SCREEN_ORIENTATION_FULL_USER', 'cameraTargetRotations']},
  {id: 'focused-orientation-tests', path: '^android-native/app/src/test/java/.*/MainActivityTest\\.kt$', every: ['cameraComparisonLayoutForWindowOrientation', 'CameraComparisonHorizontalOffsets', 'cameraTargetRotations']},
]});
