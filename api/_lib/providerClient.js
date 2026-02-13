const { mapSearchItem } = require('./mappers/searchMapper');
const { mapMovieDetails, mapShowDetails } = require('./mappers/mediaMapper');
const { mapSeason } = require('./mappers/seasonMapper');
const { mapEpisode } = require('./mappers/episodeMapper');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TIMEOUT_MS = 7000;

const getAuth = () => {
  const token =
    process.env.MEDIA_PROVIDER_READ_TOKEN ||
    process.env.TMDB_READ_ACCESS_TOKEN ||
    '';
  const apiKey =
    process.env.MEDIA_PROVIDER_API_KEY || process.env.TMDB_API_KEY || '';
  if (token) return { token, apiKey: '' };
  if (apiKey) return { token: '', apiKey };
  return { token: '', apiKey: '' };
};

const getTimeoutMs = () => {
  const parsed = Number.parseInt(process.env.API_TIMEOUT_MS || '', 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_TIMEOUT_MS;
};

const endpointForType = (type) => {
  if (type === 'movie') return '/search/movie';
  if (type === 'show') return '/search/tv';
  return '/search/multi';
};

const detailsEndpointForType = (type, id) => {
  if (type === 'show') return `/tv/${id}`;
  return `/movie/${id}`;
};

const mapStatusToError = (status) => {
  if (status === 404) {
    return { status: 404, code: 'NOT_FOUND', message: 'Resource not found.' };
  }
  if (status === 429) {
    return {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again shortly.',
    };
  }
  if (status >= 400 && status < 500) {
    return {
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Invalid request to media provider.',
    };
  }
  return {
    status: 503,
    code: 'UPSTREAM_UNAVAILABLE',
    message: 'Media provider is temporarily unavailable.',
  };
};

const fetchJson = async (url, options = {}) => {
  const timeoutMs = getTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        ...mapStatusToError(response.status),
        upstreamStatus: response.status,
        upstreamBody: json,
      };
    }
    return { ok: true, data: json };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 503,
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'Media provider timeout.',
      };
    }
    return {
      ok: false,
      status: 503,
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Media provider request failed.',
    };
  } finally {
    clearTimeout(timer);
  }
};

const tmdbGet = async (path, params = {}) => {
  const { token, apiKey } = getAuth();
  if (!token && !apiKey) {
    return {
      ok: false,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Provider credentials are not configured.',
    };
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  if (apiKey) {
    url.searchParams.set('api_key', apiKey);
  }

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

  return fetchJson(url.toString(), { headers });
};

const tryFetchDetails = async ({ id, type }) => {
  const detailsPath = detailsEndpointForType(type, id);
  const response = await tmdbGet(detailsPath, {
    append_to_response: 'credits',
  });
  if (!response.ok) return response;

  return {
    ok: true,
    data: type === 'show' ? mapShowDetails(response.data) : mapMovieDetails(response.data),
    raw: response.data,
    type,
  };
};

const resolveDetailsType = async ({ id, preferredType }) => {
  const attempts =
    preferredType === 'movie'
      ? ['movie', 'show']
      : preferredType === 'show'
      ? ['show', 'movie']
      : ['show', 'movie'];

  for (const type of attempts) {
    const result = await tryFetchDetails({ id, type });
    if (result.ok) return result;
    if (result.status === 404) continue;
    return result;
  }

  return {
    ok: false,
    status: 404,
    code: 'NOT_FOUND',
    message: 'Media not found.',
  };
};

const search = async ({ q, type, page }) => {
  const response = await tmdbGet(endpointForType(type), {
    query: q,
    page,
    include_adult: false,
  });
  if (!response.ok) return response;

  const results = Array.isArray(response.data.results) ? response.data.results : [];
  return {
    ok: true,
    data: {
      results: results.map((item) => mapSearchItem(item, type)),
      page: response.data.page || page,
      totalPages: response.data.total_pages || 0,
      totalResults: response.data.total_results || results.length,
    },
  };
};

const getMediaDetails = async ({ id, type }) => {
  return resolveDetailsType({ id, preferredType: type });
};

const getShowSeasons = async ({ id }) => {
  const response = await tmdbGet(`/tv/${id}`, {});
  if (!response.ok) return response;

  const seasons = Array.isArray(response.data.seasons) ? response.data.seasons : [];
  return {
    ok: true,
    data: {
      provider: 'tmdb',
      showId: String(id),
      seasonCount: Number.isFinite(response.data.number_of_seasons)
        ? response.data.number_of_seasons
        : seasons.length,
      seasons: seasons
        .map(mapSeason)
        .filter((season) => Number.isFinite(season.seasonNumber)),
    },
  };
};

const getSeasonEpisodes = async ({ id, seasonNumber }) => {
  const response = await tmdbGet(`/tv/${id}/season/${seasonNumber}`, {});
  if (!response.ok) return response;

  const episodes = Array.isArray(response.data.episodes) ? response.data.episodes : [];
  return {
    ok: true,
    data: {
      provider: 'tmdb',
      showId: String(id),
      seasonNumber,
      episodes: episodes.map((episode) => mapEpisode(episode, seasonNumber)),
    },
  };
};

module.exports = {
  getMediaDetails,
  getSeasonEpisodes,
  getShowSeasons,
  search,
};
