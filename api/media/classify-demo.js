const { createHandler } = require('./classify-batch');
const {
  createClassificationService,
} = require('../_lib/classificationService');

// Accept only verified anonymous demo sessions. Public TMDB identities are the
// entire request; notes, household state and client classifications are rejected
// by the shared strict batch validator. Cache/leases/budgets remain server-only.
const service = createClassificationService({ persistCatalog: false });
const isDemoUser = (user) =>
  Boolean(user.uid) && user.firebase?.sign_in_provider === 'anonymous';
module.exports = createHandler({
  classify: service.classify,
  isAllowedUser: isDemoUser,
});
module.exports.isDemoUser = isDemoUser;
