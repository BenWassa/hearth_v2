const { logError, logInfo } = require('../_lib/logger');
const {
  getMediaDetails,
  getSeasonEpisodes,
  getShowSeasons,
} = require('../_lib/providerClient');
const { checkRateLimit } = require('../_lib/rateLimit');
const { fail, getRequestId, ok } = require('../_lib/response');

module.exports = async (req, res) => {
  const requestId = getRequestId(req);
  res.setHeader('Cache-Control', 'no-store');

  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    return fail(req, res, 405, 'BAD_REQUEST', 'Use POST for this endpoint.');
  }

  const rate = checkRateLimit(req, 'refresh');
  if (!rate.allowed) {
    if (rate.retryAfterMs) {
      res.setHeader('Retry-After', String(Math.ceil(rate.retryAfterMs / 1000)));
    }
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
  });

  if (!details.ok) {
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

  return ok(
    req,
    res,
    {
      source: {
        provider,
        providerId,
        fetchedAt: Date.now(),
        staleAfter: Date.now() + 1000 * 60 * 60 * 24 * 30,
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
