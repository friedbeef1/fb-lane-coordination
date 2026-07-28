const {grade} = require('./_shared.cjs');
exports.grade = root => grade(root, {criteria: [
  {id:'web-choice', path:'^src/', every:['(Saved capture view|savedCaptureView)','(Actual|actual)','(Mirror|mirror)']},
  {id:'android-choice', path:'^android-native/.*\\.(kt|java)$', every:['(Saved capture view|savedCaptureView|CaptureView)','(Actual|actual)','(Mirror|mirror)']},
  {id:'ios-choice', path:'^ios-native/.*\\.swift$', every:['(Saved capture view|savedCaptureView|CaptureView)','(Actual|actual)','(Mirror|mirror)']},
  {id:'photo-and-clip', path:'^(src|android-native|ios-native)/', every:['(photo|Photo)','(clip|Clip|video|Video)','(captureView|savedCaptureView|CaptureView)']},
  {id:'tests', path:'(test|Test|spec)', every:['(Actual|actual)','(Mirror|mirror)','(captureView|savedCaptureView|CaptureView)']},
]});
