const { checkRateLimit, setRateLimitHeaders } = require('../_lib/rateLimit');
const { fail, ok } = require('../_lib/response');
const { tmdbGet } = require('../_lib/providerClient');
const { mapDirector } = require('../_lib/directorMapper');
const catalog = require('../../src/config/directorCatalog.json');

const allowed = new Map(
  catalog.directors.map((director) => [String(director.personId), director]),
);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  const rate = checkRateLimit(req, 'director-details');
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    return fail(req, res, 429, 'RATE_LIMITED', 'Too many requests. Try again shortly.');
  }

  const id = String(req?.query?.id || '').trim();
  const director = allowed.get(id);
  if (!director) {
    return fail(req, res, 404, 'NOT_FOUND', 'Director is not in this collection.');
  }
  const result = await tmdbGet(`/person/${id}`, {
    append_to_response: 'movie_credits',
    language: 'en-US',
  });
  if (!result.ok) {
    return fail(req, res, result.status, result.code, result.message);
  }
  try {
    return ok(req, res, mapDirector(result.data, director), {
      provider: 'tmdb',
      cached: false,
    });
  } catch {
    return fail(req, res, 503, 'UPSTREAM_UNAVAILABLE', 'Director credits could not be verified.');
  }
};
