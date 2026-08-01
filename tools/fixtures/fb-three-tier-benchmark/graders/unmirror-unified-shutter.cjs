'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'android-gesture-state', path: '^android-native/app/src/main/java/.*/MainActivity\\.kt$', every: ['UnifiedCaptureGestureCoordinator', 'UnifiedCaptureVisualState', 'Tap for photo · Hold for video']},
  {id: 'android-threshold-tests', path: '^android-native/app/src/test/java/.*/MainActivityTest\\.kt$', every: ['250L', 'StartSilentActualClip', 'Tap for photo · Hold for video']},
  {id: 'ios-gesture-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', every: ['NativeShutterGesturePolicy', 'PendingRecordingStopPolicy', 'maxRecordedDuration']},
  {id: 'ios-gesture-tests', path: '^ios-native/UnmirrorTests/AppStateTests\\.swift$', every: ['NativeShutterGesturePolicy', 'PendingRecordingStopPolicy', '0.25']},
]});
