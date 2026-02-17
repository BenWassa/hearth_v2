const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const asNumberOrNull = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeCredits = (values) =>
  asArray(values)
    .map((value) => asString(value))
    .filter(Boolean);

const normalizeToken = (value) =>
  asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildMediaId = (item = {}) => {
  const source = asObject(item.source);
  const media = asObject(item.media);
  const provider = normalizeToken(
    source.provider || media.provider || item.provider,
  );
  const providerId = normalizeToken(
    source.providerId || media.providerId || item.providerId,
  );
  if (provider && providerId) return `${provider}:${providerId}`;

  const type = normalizeToken(media.type || item.type || 'movie') || 'movie';
  const title = normalizeToken(media.title || item.title);
  const year = normalizeToken(media.year || item.year) || 'na';
  if (title) return `manual:${type}:${title}:${year}`;
  return `manual:${type}:untitled:${year}`;
};

export const WATCHLIST_SCHEMA_VERSION = 2;

export const isV2Payload = (item = {}) => {
  return (
    item?.schemaVersion === WATCHLIST_SCHEMA_VERSION ||
    (item?.source && item?.media)
  );
};

export const buildLegacyWatchlistPayload = (item = {}, userId) => {
  const mediaId = buildMediaId(item);
  const payload = {
    mediaId,
    title: asString(item.title),
    type: asString(item.type || 'movie'),
    vibe: asString(item.vibe),
    energy: asString(item.energy),
    addedBy: userId,
    status: asString(item.status || 'unwatched'),
  };

  if (item.note) payload.note = asString(item.note);
  if (item.poster) payload.poster = asString(item.poster);
  if (item.backdrop) payload.backdrop = asString(item.backdrop);
  if (item.year) payload.year = asString(item.year);
  if (item.director) payload.director = asString(item.director);
  if (Array.isArray(item.genres) && item.genres.length)
    payload.genres = item.genres;
  if (Array.isArray(item.actors) && item.actors.length)
    payload.actors = item.actors;
  if (Number.isFinite(item.runtimeMinutes))
    payload.runtimeMinutes = item.runtimeMinutes;
  if (item.totalSeasons) payload.totalSeasons = item.totalSeasons;
  if (Array.isArray(item.seasons) && item.seasons.length)
    payload.seasons = item.seasons;
  if (item.episodeProgress) payload.episodeProgress = item.episodeProgress;

  return payload;
};

export const buildV2WatchlistPayload = (item = {}, userId) => {
  const source = asObject(item.source);
  const media = asObject(item.media);
  const showData = asObject(item.showData);
  const userState = asObject(item.userState);
  const mediaGenres = asArray(media.genres);
  const mediaCast = asArray(media.cast);
  const showSeasons = asArray(showData.seasons);

  const status = asString(userState.status || item.status || 'unwatched');
  const title = asString(media.title || item.title);
  const type = asString(media.type || item.type || 'movie');
  const primaryDirector = asString(item.director);
  const directors = normalizeCredits(media.directors);
  const creators = normalizeCredits(media.creators);
  const normalizedDirectors =
    directors.length > 0 ? directors : primaryDirector ? [primaryDirector] : [];
  const normalizedCreators =
    creators.length > 0
      ? creators
      : type === 'show' && primaryDirector
      ? [primaryDirector]
      : [];
  const vibe = asString(userState.vibe || item.vibe);
  const energy = asString(userState.energy || item.energy);
  const note = asString(userState.note || item.note);

  const runtimeMinutes = asNumberOrNull(
    media.runtimeMinutes ?? item.runtimeMinutes,
  );
  const genres = mediaGenres.length ? mediaGenres : asArray(item.genres);
  const cast = mediaCast.length ? mediaCast : asArray(item.actors);
  const seasons = showSeasons.length ? showSeasons : asArray(item.seasons);
  const seasonCount = asNumberOrNull(showData.seasonCount ?? item.totalSeasons);
  const episodeProgress = asObject(
    Object.keys(userState.episodeProgress || {}).length
      ? userState.episodeProgress
      : item.episodeProgress,
  );

  const mediaId = buildMediaId(item);

  return {
    schemaVersion: WATCHLIST_SCHEMA_VERSION,
    mediaId,
    addedBy: userId,
    status,
    title,
    type,
    vibe,
    energy,
    note,
    poster: asString(media.poster || item.poster),
    backdrop: asString(media.backdrop || item.backdrop),
    year: asString(media.year || item.year),
    director:
      asString(item.director) ||
      normalizedDirectors[0] ||
      (type === 'show' ? normalizedCreators[0] || '' : ''),
    runtimeMinutes,
    genres,
    actors: cast,
    totalSeasons: seasonCount,
    seasons,
    episodeProgress,
    source: {
      provider: asString(source.provider || 'tmdb'),
      providerId: asString(source.providerId || ''),
      fetchedAt:
        asNumberOrNull(source.fetchedAt) ||
        (typeof Date.now === 'function' ? Date.now() : 0),
      staleAfter: asNumberOrNull(source.staleAfter),
      locale: asString(source.locale || 'en-US'),
    },
    media: {
      type,
      title,
      originalTitle: asString(media.originalTitle),
      year: asString(media.year || item.year),
      runtimeMinutes,
      overview: asString(media.overview),
      poster: asString(media.poster || item.poster),
      backdrop: asString(media.backdrop || item.backdrop),
      genres,
      cast,
      creators: normalizedCreators,
      directors: normalizedDirectors,
      language: asString(media.language),
      country: asArray(media.country),
      rating:
        typeof media.rating === 'number' && Number.isFinite(media.rating)
          ? media.rating
          : null,
      providerUpdatedAt: asString(media.providerUpdatedAt),
    },
    showData: {
      seasonCount,
      seasons,
    },
    userState: {
      status,
      vibe,
      energy,
      note,
      episodeProgress,
    },
  };
};

export const buildWatchlistPayload = (item = {}, userId) => {
  if (isV2Payload(item)) return buildV2WatchlistPayload(item, userId);
  return buildLegacyWatchlistPayload(item, userId);
};
