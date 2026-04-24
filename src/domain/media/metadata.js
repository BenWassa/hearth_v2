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

export const getMetadataGaps = (
  item = {},
  { includeLogoGap = false } = {},
) => {
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
