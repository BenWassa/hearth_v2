const { logError, logInfo } = require('../../../_lib/logger');
const { getShowSeasons } = require('../../../_lib/providerClient');
const { checkRateLimit, setRateLimitHeaders } = require('../../../_lib/rateLimit');
const { fail, getRequestId, ok } = require('../../../_lib/response');

const getParam = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

module.exports = async (req, res) => {
  const requestId = getRequestId(req);
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const rate = checkRateLimit(req, 'media-seasons');
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    logInfo('media.seasons.rate_limited', { requestId, scope: 'media-seasons' });
    return fail(req, res, 429, 'RATE_LIMITED', 'Too many requests. Try again shortly.');
  }

  const provider = getParam(req?.query?.provider);
  const id = getParam(req?.query?.id);

  if (provider !== 'tmdb' || !id) {
    return fail(req, res, 400, 'BAD_REQUEST', 'Provider and id are required.');
  }

  logInfo('media.seasons.request', { requestId, provider, id });
  const result = await getShowSeasons({ id });
  if (!result.ok) {
    if (result.status === 429) {
      logInfo('media.seasons.upstream_rate_limited', { requestId, provider, id });
    }
    logError('media.seasons.error', {
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

  return ok(req, res, result.data, {
    provider,
    cached: false,
  });
};
