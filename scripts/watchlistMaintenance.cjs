// Retained documents must not be changed by household enrichment jobs.
exports.isActiveWatchlistDocument = (data) =>
  data.removedAt == null && data.removedBy == null;
