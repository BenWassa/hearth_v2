const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const toImageUrl = (path, size = 'w342') => {
  if (typeof path !== 'string' || !path.trim()) return '';
  return `${IMAGE_BASE}/${size}${path}`;
};

const mapSeason = (season = {}) => ({
  seasonNumber: Number.isFinite(season.season_number)
    ? season.season_number
    : null,
  name: season.name || '',
  episodeCount: Number.isFinite(season.episode_count) ? season.episode_count : 0,
  airDate: season.air_date || '',
  posterUrl: toImageUrl(season.poster_path),
});

module.exports = {
  mapSeason,
};
