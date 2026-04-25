const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const toImageUrl = (path, size = 'w500') => {
  if (typeof path !== 'string' || !path.trim()) return '';
  return `${IMAGE_BASE}/${size}${path}`;
};

const inferType = (item = {}, fallbackType = 'all') => {
  const raw = item.media_type || fallbackType;
  if (raw === 'tv' || raw === 'show') return 'show';
  if (raw === 'movie') return 'movie';
  return 'movie';
};

const titleFor = (item = {}, type = 'movie') => {
  if (type === 'show') return item.name || item.original_name || '';
  return item.title || item.original_title || '';
};

const yearFor = (item = {}, type = 'movie') => {
  const dateValue =
    type === 'show' ? item.first_air_date || '' : item.release_date || '';
  if (!dateValue || typeof dateValue !== 'string') return '';
  return dateValue.slice(0, 4);
};

const releaseDateFor = (item = {}, type = 'movie') => {
  const dateValue =
    type === 'show' ? item.first_air_date || '' : item.release_date || '';
  return typeof dateValue === 'string' ? dateValue : '';
};

const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapSearchItem = (item = {}, fallbackType = 'all') => {
  const type = inferType(item, fallbackType);
  return {
    provider: 'tmdb',
    providerId: String(item.id || ''),
    type,
    title: titleFor(item, type),
    year: yearFor(item, type),
    releaseDate: releaseDateFor(item, type),
    originalTitle:
      type === 'show' ? item.original_name || '' : item.original_title || '',
    popularity: numberOrNull(item.popularity),
    voteCount: numberOrNull(item.vote_count),
    posterUrl: toImageUrl(item.poster_path, 'w342'),
    backdropUrl: toImageUrl(item.backdrop_path, 'w780'),
    overview: item.overview || '',
  };
};

module.exports = {
  mapSearchItem,
};
