const { logError, logInfo } = require('../../_lib/logger');
const { getMediaDetails } = require('../../_lib/providerClient');
const { checkRateLimit, setRateLimitHeaders } = require('../../_lib/rateLimit');
const { fail, getRequestId, ok } = require('../../_lib/response');

const getParam = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

module.exports = async (req, res) => {
  const requestId = getRequestId(req);
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const rate = checkRateLimit(req, 'media-details');
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    logInfo('media.details.rate_limited', { requestId, scope: 'media-details' });
    return fail(req, res, 429, 'RATE_LIMITED', 'Too many requests. Try again shortly.');
  }

  const provider = getParam(req?.query?.provider);
  const id = getParam(req?.query?.id);
  const type = getParam(req?.query?.type).toLowerCase();

  if (provider !== 'tmdb' || !id) {
    return fail(req, res, 400, 'BAD_REQUEST', 'Provider and id are required.');
  }

  logInfo('media.details.request', { requestId, provider, id, type: type || 'auto' });

  const result = await getMediaDetails({ id, type: type || 'auto' });
  if (!result.ok) {
    if (result.status === 429) {
      logInfo('media.details.upstream_rate_limited', { requestId, provider, id });
    }
    logError('media.details.error', {
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

  logInfo('media.details.success', {
    requestId,
    provider,
    id,
    resolvedType: result.type,
  });

  return ok(req, res, result.data, {
    provider,
    cached: false,
  });
};
