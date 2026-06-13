const { logError, logInfo } = require('../_lib/logger');
const {
  getMediaDetails,
  getSeasonEpisodes,
  getShowSeasons,
} = require('../_lib/providerClient');
const { checkRateLimit, setRateLimitHeaders } = require('../_lib/rateLimit');
const { fail, getRequestId, ok } = require('../_lib/response');

module.exports = async (req, res) => {
  const requestId = getRequestId(req);
  res.setHeader('Cache-Control', 'no-store');

  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    return fail(req, res, 405, 'BAD_REQUEST', 'Use POST for this endpoint.');
  }

  const rate = checkRateLimit(req, 'refresh');
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    logInfo('media.refresh.rate_limited', { requestId, scope: 'refresh' });
    return fail(req, res, 429, 'RATE_LIMITED', 'Too many refresh requests.', {
      cached: false,
      provider: 'tmdb',
    });
  }

  const provider = req?.body?.provider;
  const providerId = req?.body?.providerId;
  const type = req?.body?.type || 'auto';
  const locale = req?.body?.locale || 'en-US';

  if (provider !== 'tmdb' || typeof providerId !== 'string' || !providerId.trim()) {
    return fail(req, res, 400, 'BAD_REQUEST', 'provider and providerId are required.');
  }

  logInfo('media.refresh.request', { requestId, provider, providerId, type });

  const details = await getMediaDetails({
    id: providerId,
    type,
    locale,
  });

  if (!details.ok) {
    if (details.status === 429) {
      logInfo('media.refresh.upstream_rate_limited', { requestId, provider, providerId });
    }
    logError('media.refresh.error', {
      requestId,
      provider,
      providerId,
      code: details.code,
      status: details.status,
    });
    return fail(req, res, details.status, details.code, details.message, {
      provider,
      cached: false,
    });
  }

  let showData = {
    seasonCount: null,
    seasons: [],
  };

  if (details.type === 'show') {
    const seasonsResult = await getShowSeasons({ id: providerId });
    if (!seasonsResult.ok) {
      return fail(
        req,
        res,
        seasonsResult.status,
        seasonsResult.code,
        seasonsResult.message,
        {
          provider,
          cached: false,
        },
      );
    }

    const seasons = Array.isArray(seasonsResult.data?.seasons)
      ? seasonsResult.data.seasons
      : [];
    const seasonDetails = await Promise.all(
      seasons.map(async (season) => {
        const episodesResult = await getSeasonEpisodes({
          id: providerId,
          seasonNumber: season.seasonNumber,
        });
        return {
          seasonNumber: season.seasonNumber,
          name: season.name,
          episodeCount: season.episodeCount,
          airDate: season.airDate,
          poster: season.posterUrl,
          episodes: episodesResult.ok ? episodesResult.data.episodes : [],
        };
      }),
    );

    showData = {
      seasonCount: seasonsResult.data?.seasonCount || seasonDetails.length,
      seasons: seasonDetails,
    };
  }

  const STALE_24H = 1000 * 60 * 60 * 24;
  const STALE_30D = 1000 * 60 * 60 * 24 * 30;
  const ACTIVE_SHOW_STATUSES = new Set(['returning series', 'in production', 'pilot']);
  const isAiringShow =
    details.type === 'show' &&
    (ACTIVE_SHOW_STATUSES.has(String(details.data.showStatus || '').toLowerCase()) ||
      Boolean(details.data.inProduction));

  return ok(
    req,
    res,
    {
      source: {
        provider,
        providerId,
        fetchedAt: Date.now(),
        staleAfter: Date.now() + (isAiringShow ? STALE_24H : STALE_30D),
        locale,
      },
      media: details.data,
      showData,
    },
    {
      provider,
      cached: false,
    },
  );
};
