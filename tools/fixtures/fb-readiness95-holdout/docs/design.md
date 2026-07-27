# Current design rules

- A review-ready candidate records `ariaLabel`, `focusVisible`, and
  `narrowViewportChecked` as true.
- Keep only review links beginning with `https://`.
- When `automatedChecksPassed: true`, routine user QA is not required:
  `userInputNeeded` is `none`.
