'use strict';

function buildCandidate(input) {
  return {
    selected: input.items,
    blocked: [],
    status: 'Complete',
    designReview: {},
    optionalReviewLinks: input.reviewLinks || [],
    userInputNeeded: 'test everything manually',
    deploymentAuthorized: true,
  };
}

module.exports = { buildCandidate };
