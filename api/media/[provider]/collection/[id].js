const { logError, logInfo } = require('../../../_lib/logger');
const { getCollection } = require('../../../_lib/providerClient');
const {
  checkRateLimit,
  setRateLimitHeaders,
} = require('../../../_lib/rateLimit');
const { fail, getRequestId, ok } = require('../../../_lib/response');

const getParam = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const isTruthyParam = (value) => ['1', 'true', 'yes'].includes(getParam(value));

module.exports = async (req, res) => {
  const requestId = getRequestId(req);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const rate = checkRateLimit(req, 'collection-details');
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    logInfo('collection.details.rate_limited', {
      requestId,
      scope: 'collection-details',
    });
    return fail(
      req,
      res,
      429,
      'RATE_LIMITED',
      'Too many requests. Try again shortly.',
    );
  }

  const provider = getParam(req?.query?.provider);
  const id = getParam(req?.query?.id);
  const locale = getParam(req?.query?.locale) || 'en-US';
  const optional = isTruthyParam(req?.query?.optional);
  const includePartDetails = isTruthyParam(req?.query?.details);

  if (provider !== 'tmdb' || !id) {
    return fail(req, res, 400, 'BAD_REQUEST', 'Provider and id are required.');
  }

  logInfo('collection.details.request', { requestId, provider, id });

  const result = await getCollection({ id, locale, includePartDetails });
  if (!result.ok) {
    if (optional && result.status === 404) {
      logInfo('collection.details.optional_not_found', {
        requestId,
        provider,
        id,
      });
      return ok(
        req,
        res,
        {
          provider,
          providerId: id,
          name: '',
          overview: '',
          poster: '',
          backdrop: '',
          parts: [],
          subCollections: [],
        },
        {
          provider,
          cached: false,
          optional: true,
          found: false,
        },
      );
    }

    logError('collection.details.error', {
      requestId,
      provider,
      id,
      code: result.code,
      status: result.status,
    });
    return fail(req, res, result.status, result.code, result.message, {
      provider,
      cached: false,
    });
  }

  logInfo('collection.details.success', {
    requestId,
    provider,
    id,
  });

  return ok(req, res, result.data, {
    provider,
    cached: false,
  });
};
