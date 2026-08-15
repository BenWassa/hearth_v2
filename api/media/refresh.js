const { logError, logInfo } = require('../_lib/logger');
const {
  getMediaDetails,
  getSeasonEpisodes,
  getShowSeasons,
} = require('../_lib/providerClient');
const { checkRateLimit, setRateLimitHeaders } = require('../_lib/rateLimit');
const { fail, getRequestId, ok } = require('../_lib/response');
const { mapWithConcurrency } = require('../_lib/concurrency');

const SEASON_FETCH_CONCURRENCY = 2;

const setUpstreamRetryAfter = (res, result = {}) => {
  if (result.status !== 429) return;
  const retryAfterMs = Number(result.retryAfterMs || 1000);
  res.setHeader(
    'Retry-After',
    String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
  );
};

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

  if (
    provider !== 'tmdb' ||
    typeof providerId !== 'string' ||
    !providerId.trim()
  ) {
    return fail(
      req,
      res,
      400,
      'BAD_REQUEST',
      'provider and providerId are required.',
    );
  }

  logInfo('media.refresh.request', { requestId, provider, providerId, type });

  const details = await getMediaDetails({
    id: providerId,
    type,
    locale,
  });

  if (!details.ok) {
    setUpstreamRetryAfter(res, details);
    if (details.status === 429) {
      logInfo('media.refresh.upstream_rate_limited', {
        requestId,
        provider,
        providerId,
      });
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
      setUpstreamRetryAfter(res, seasonsResult);
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
    const seasonResults = await mapWithConcurrency(
      seasons,
      SEASON_FETCH_CONCURRENCY,
      async (season) => {
        const episodesResult = await getSeasonEpisodes({
          id: providerId,
          seasonNumber: season.seasonNumber,
        });
        return {
          episodesResult,
          season,
        };
      },
    );

    const failedSeason = seasonResults.find(
      ({ episodesResult }) => !episodesResult.ok,
    );
    if (failedSeason) {
      const { episodesResult, season } = failedSeason;
      setUpstreamRetryAfter(res, episodesResult);
      logError('media.refresh.season_error', {
        requestId,
        provider,
        providerId,
        seasonNumber: season.seasonNumber,
        code: episodesResult.code,
        status: episodesResult.status,
      });
      return fail(
        req,
        res,
        episodesResult.status,
        episodesResult.code,
        episodesResult.message,
        { provider, cached: false },
      );
    }

    const seasonDetails = seasonResults.map(({ season, episodesResult }) => {
      return {
        seasonNumber: season.seasonNumber,
        name: season.name,
        episodeCount: season.episodeCount,
        airDate: season.airDate,
        poster: season.posterUrl,
        episodes: episodesResult.data.episodes,
      };
    });

    showData = {
      seasonCount: seasonsResult.data?.seasonCount || seasonDetails.length,
      seasons: seasonDetails,
    };
  }

  const STALE_24H = 1000 * 60 * 60 * 24;
  const STALE_30D = 1000 * 60 * 60 * 24 * 30;
  const ACTIVE_SHOW_STATUSES = new Set([
    'returning series',
    'in production',
    'pilot',
  ]);
  const isAiringShow =
    details.type === 'show' &&
    (ACTIVE_SHOW_STATUSES.has(
      String(details.data.showStatus || '').toLowerCase(),
    ) ||
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
