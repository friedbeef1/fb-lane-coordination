'use strict';

function buildCandidate(input) {
  return {
    selected: input.items,
    blocked: [],
    status: 'Complete',
    deploymentAuthorized: true,
    designReview: {},
    optionalReviewLinks: input.reviewLinks || [],
    userInputNeeded: 'manual testing required',
  };
}

module.exports = { buildCandidate };
