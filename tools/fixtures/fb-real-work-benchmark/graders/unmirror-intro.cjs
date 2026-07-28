const {grade} = require('./_shared.cjs');
const headline = 'Why all that effort perfecting a reflection no one else sees\\?';
exports.grade = root => grade(root, {criteria: [
  {id:'web-headline', path:'^src/', pattern:headline},
  {id:'android-headline', path:'^android-native/', pattern:headline},
  {id:'ios-headline', path:'^ios-native/', pattern:headline},
  {id:'focused-tests', path:'(test|Test|spec)', pattern:headline},
]});
