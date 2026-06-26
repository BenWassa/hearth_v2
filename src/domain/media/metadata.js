export const METADATA_GAP_KEYS = Object.freeze([
  'source',
  'poster',
  'backdrop',
  'logo',
  'runtimeMinutes',
  'year',
  'overview',
  'genres',
  'actors',
  'director',
  'seasonCount',
  'seasons',
]);

export const hasValue = (value) => String(value || '').trim().length > 0;

export const hasListValues = (value) => {
  return Array.isArray(value) && value.some((entry) => hasValue(entry));
};

const PLACEHOLDER_EPISODE_TEXT = new Set([
  'no description yet.',
  'no description yet',
  'there is no description yet.',
  'there is no description yet',
  'no overview available.',
  'no overview available',
  'no overview yet.',
  'no overview yet',
  'tba',
  'tbd',
]);

const toPositiveInteger = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getSeasonNumber = (season = {}) =>
  toPositiveInteger(
    season?.seasonNumber ?? season?.number ?? season?.season_number,
  );

const getEpisodeNumber = (episode = {}) =>
  toPositiveInteger(
    episode?.episodeNumber ?? episode?.number ?? episode?.episode_number,
  );

const getEpisodeTitle = (episode = {}) =>
  String(episode?.name || episode?.title || '').trim();

const hasMeaningfulEpisodeText = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return Boolean(normalized) && !PLACEHOLDER_EPISODE_TEXT.has(normalized);
};

const hasMeaningfulEpisodeDescription = (episode = {}) =>
  hasMeaningfulEpisodeText(episode?.description) ||
  hasMeaningfulEpisodeText(episode?.overview);

const hasRichEpisodeMetadata = (episode = {}) => {
  const hasVisual = hasValue(episode?.still) || hasValue(episode?.stillUrl);
  return hasMeaningfulEpisodeDescription(episode) || hasVisual;
};

const isGenericEpisodeTitle = ({ title, episodeNumber }) =>
  episodeNumber !== null && title.toLowerCase() === `episode ${episodeNumber}`;

// Providers (TMDB) frequently publish an upcoming episode with only a title and
// still image, then backfill the synopsis on or shortly after the air date.
// Stills alone therefore should NOT mark a just-released episode as complete —
// otherwise the description that lands later is never pulled in. We only enforce
// this for a bounded window after air so episodes the provider never describes
// don't trigger refreshes forever.
const RECENTLY_AIRED_DESCRIPTION_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

const getEpisodeAirMs = (episode = {}) => {
  const raw = String(episode?.airDate ?? episode?.air_date ?? '').trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
};

const needsAiredDescriptionBackfill = (episode = {}) => {
  const airMs = getEpisodeAirMs(episode);
  if (airMs === null) return false;
  const now = Date.now();
  if (airMs > now) return false; // not aired yet — leniency is expected
  if (now - airMs > RECENTLY_AIRED_DESCRIPTION_WINDOW_MS) return false;
  return !hasMeaningfulEpisodeDescription(episode);
};

export const isEpisodeMetadataIncomplete = (episode = {}) => {
  const title = getEpisodeTitle(episode);
  if (!title) return true;

  const episodeNumber = getEpisodeNumber(episode);
  if (isGenericEpisodeTitle({ title, episodeNumber })) return true;
  if (needsAiredDescriptionBackfill(episode)) return true;
  return !hasRichEpisodeMetadata(episode);
};

export const hasSeasonEpisodeMetadataGaps = (season = {}) => {
  const seasonNumber = getSeasonNumber(season);
  if (seasonNumber === null) return false;

  const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
  const episodeCount = toPositiveInteger(
    season?.episodeCount ?? season?.episode_count,
  );

  if (episodeCount !== null && episodeCount > episodes.length) return true;
  return episodes.some((episode) => isEpisodeMetadataIncomplete(episode));
};

export const getShowSeasonsForMetadata = (item = {}) => {
  if (Array.isArray(item?.showData?.seasons)) return item.showData.seasons;
  if (Array.isArray(item?.seasons)) return item.seasons;
  return [];
};

export const hasShowEpisodeMetadataGaps = (item = {}) => {
  if (item?.type !== 'show') return false;
  const seasons = getShowSeasonsForMetadata(item);
  if (!seasons.length) return true;
  return seasons.some((season) => hasSeasonEpisodeMetadataGaps(season));
};

export const shouldRefreshShowEpisodeMetadata = (item = {}) => {
  if (!hasShowEpisodeMetadataGaps(item)) return false;
  const provider = String(item?.source?.provider || '')
    .trim()
    .toLowerCase();
  const providerId = String(item?.source?.providerId || '').trim();
  return provider === 'tmdb' && Boolean(providerId);
};

const ACTIVE_SHOW_STATUSES = new Set([
  'returning series',
  'in production',
  'pilot',
]);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const isActivelyAiringShow = (item = {}) => {
  if (item?.type !== 'show') return false;
  const showStatus = String(item?.media?.showStatus || item?.showStatus || '')
    .trim()
    .toLowerCase();
  if (ACTIVE_SHOW_STATUSES.has(showStatus)) return true;
  if (item?.media?.inProduction === true || item?.inProduction === true) return true;
  const nextAirDate =
    item?.media?.nextEpisodeAirDate ?? item?.nextEpisodeAirDate ?? null;
  if (nextAirDate) {
    const airMs = Date.parse(String(nextAirDate));
    if (Number.isFinite(airMs) && airMs > Date.now() - THIRTY_DAYS_MS) return true;
  }
  return false;
};

export const shouldRefreshAiringShowMetadata = (item = {}) => {
  if (!isActivelyAiringShow(item)) return false;
  const provider = String(item?.source?.provider || '')
    .trim()
    .toLowerCase();
  const providerId = String(item?.source?.providerId || '').trim();
  if (provider !== 'tmdb' || !providerId) return false;
  const staleAfter = Number(item?.source?.staleAfter || 0);
  // Items added via search or import never went through the refresh endpoint,
  // so they carry no staleAfter. Previously these airing shows were never
  // auto-refreshed and silently missed new episodes/seasons. Treat a missing
  // staleAfter as "due now" so the first background pass pulls fresh data and
  // stamps a real staleAfter for subsequent runs.
  if (!staleAfter) return true;
  return Date.now() > staleAfter;
};

export const pickPrimaryPerson = (values) => {
  if (!Array.isArray(values)) return '';
  return String(values[0] || '').trim();
};

export const getPrimaryCredit = ({ item = {}, isShow = false } = {}) => {
  const direct = String(item?.director || '').trim();
  if (direct) return direct;

  const mediaDirectors = pickPrimaryPerson(item?.media?.directors);
  if (mediaDirectors) return mediaDirectors;

  if (isShow) {
    const mediaCreators = pickPrimaryPerson(item?.media?.creators);
    if (mediaCreators) return mediaCreators;
  }

  return '';
};

export const getMetadataGaps = (item = {}, { includeLogoGap = false } = {}) => {
  const gaps = [];
  const sourceProvider = String(item?.source?.provider || '').trim();
  const sourceProviderId = String(item?.source?.providerId || '').trim();
  const poster = String(item?.poster || item?.media?.poster || '').trim();
  const backdrop = String(item?.backdrop || item?.media?.backdrop || '').trim();
  const logo = String(
    item?.logo ||
      item?.logoUrl ||
      item?.media?.logo ||
      item?.media?.logoUrl ||
      '',
  ).trim();
  const runtimeMinutes = Number(
    item?.runtimeMinutes ?? item?.media?.runtimeMinutes,
  );
  const year = String(item?.year || item?.media?.year || '').trim();
  const overview = String(item?.overview || item?.media?.overview || '').trim();
  const genres = Array.isArray(item?.genres)
    ? item.genres
    : Array.isArray(item?.media?.genres)
    ? item.media.genres
    : [];
  const actors = Array.isArray(item?.actors)
    ? item.actors
    : Array.isArray(item?.media?.cast)
    ? item.media.cast
    : [];
  const isShow = item?.type === 'show';
  const director = getPrimaryCredit({ item, isShow });
  const seasonCount = Number(
    item?.totalSeasons ??
      item?.showData?.seasonCount ??
      (Array.isArray(item?.seasons) ? item.seasons.length : 0),
  );
  const seasons = Array.isArray(item?.seasons)
    ? item.seasons
    : Array.isArray(item?.showData?.seasons)
    ? item.showData.seasons
    : [];

  if (!sourceProvider || !sourceProviderId) gaps.push('source');
  if (!poster) gaps.push('poster');
  if (!backdrop) gaps.push('backdrop');
  if (includeLogoGap && !logo) gaps.push('logo');
  if (!isShow && (!Number.isFinite(runtimeMinutes) || runtimeMinutes <= 0)) {
    gaps.push('runtimeMinutes');
  }
  if (!year) gaps.push('year');
  if (!overview) gaps.push('overview');
  if (!genres.length) gaps.push('genres');
  if (!actors.length) gaps.push('actors');
  if (!director) gaps.push('director');
  if (isShow) {
    if (!Number.isFinite(seasonCount) || seasonCount < 1)
      gaps.push('seasonCount');
    if (!seasons.length) gaps.push('seasons');
  }

  return gaps;
};

export const buildMetadataAuditReport = (
  items = [],
  { includeLogoGap = false } = {},
) => {
  const rows = items.map((item) => {
    const gaps = getMetadataGaps(item, { includeLogoGap });
    return {
      id: item.id,
      title: item.title || '[untitled]',
      type: item.type || 'unknown',
      gaps,
    };
  });

  const itemsWithGaps = rows.filter((row) => row.gaps.length > 0);
  const gapCounts = itemsWithGaps.reduce(
    (acc, row) => {
      row.gaps.forEach((gap) => {
        acc[gap] = (acc[gap] || 0) + 1;
      });
      return acc;
    },
    METADATA_GAP_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {}),
  );

  const movieRows = rows.filter((row) => row.type === 'movie');
  const showRows = rows.filter((row) => row.type === 'show');

  return {
    generatedAt: Date.now(),
    totalItems: rows.length,
    completeItems: rows.length - itemsWithGaps.length,
    itemsWithGaps: itemsWithGaps.length,
    gapCounts,
    byType: {
      movie: {
        total: movieRows.length,
        withGaps: movieRows.filter((row) => row.gaps.length > 0).length,
      },
      show: {
        total: showRows.length,
        withGaps: showRows.filter((row) => row.gaps.length > 0).length,
      },
    },
    missingRows: itemsWithGaps,
  };
};
