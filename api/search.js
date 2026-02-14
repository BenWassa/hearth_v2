const { logError, logInfo } = require('./_lib/logger');
const { search } = require('./_lib/providerClient');
const { checkRateLimit, setRateLimitHeaders } = require('./_lib/rateLimit');
const { fail, getRequestId, ok } = require('./_lib/response');
const { validateSearchQuery } = require('./_lib/validate');

module.exports = async (req, res) => {
  const requestId = getRequestId(req);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const rate = checkRateLimit(req, 'search');
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    logInfo('search.rate_limited', { requestId, scope: 'search', remaining: rate.remaining });
    return fail(req, res, 429, 'RATE_LIMITED', 'Too many requests. Try again shortly.');
  }

  const validation = validateSearchQuery(req.query || {});
  if (!validation.ok) {
    return fail(
      req,
      res,
      validation.error.status,
      validation.error.code,
      validation.error.message,
    );
  }

  const { q, type, page } = validation.value;
  logInfo('search.request', { requestId, q, type, page });

  const result = await search({ q, type, page });
  if (!result.ok) {
    if (result.status === 429) {
      logInfo('search.upstream_rate_limited', { requestId, scope: 'search' });
    }
    logError('search.error', {
      requestId,
      code: result.code,
      status: result.status,
    });
    return fail(req, res, result.status, result.code, result.message, {
      provider: 'tmdb',
      cached: false,
    });
  }

  logInfo('search.success', {
    requestId,
    count: result.data.results.length,
    page: result.data.page,
  });

  return ok(req, res, result.data, {
    provider: 'tmdb',
    cached: false,
  });
};
