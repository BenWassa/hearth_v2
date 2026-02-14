const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const toImageUrl = (path, size = 'w500') => {
  if (typeof path !== 'string' || !path.trim()) return '';
  return `${IMAGE_BASE}/${size}${path}`;
};

const mapNames = (items = [], limit = 10) =>
  (Array.isArray(items) ? items : [])
    .map((entry) => entry && entry.name)
    .filter(Boolean)
    .slice(0, limit);

const mapCrewByJob = (items = [], jobs = []) =>
  (Array.isArray(items) ? items : [])
    .filter((entry) => entry && jobs.includes(entry.job))
    .map((entry) => entry.name)
    .filter(Boolean);

const yearFromDate = (dateValue) => {
  if (!dateValue || typeof dateValue !== 'string') return '';
  return dateValue.slice(0, 4);
};

const mapSeasonSummaries = (seasons = []) =>
  (Array.isArray(seasons) ? seasons : [])
    .map((season) => ({
      seasonNumber: Number.isFinite(season?.season_number)
        ? season.season_number
        : null,
      name: season?.name || '',
      episodeCount: Number.isFinite(season?.episode_count)
        ? season.episode_count
        : 0,
      airDate: season?.air_date || '',
      posterUrl: toImageUrl(season?.poster_path, 'w342'),
    }))
    .filter((season) => Number.isFinite(season.seasonNumber));

const mapMovieDetails = (data = {}) => ({
  provider: 'tmdb',
  providerId: String(data.id || ''),
  type: 'movie',
  title: data.title || data.original_title || '',
  originalTitle: data.original_title || data.title || '',
  year: yearFromDate(data.release_date),
  runtimeMinutes: Number.isFinite(data.runtime) ? data.runtime : null,
  overview: data.overview || '',
  posterUrl: toImageUrl(data.poster_path, 'w500'),
  backdropUrl: toImageUrl(data.backdrop_path, 'w780'),
  genres: mapNames(data.genres, 8),
  cast: mapNames(data.credits?.cast, 12),
  creators: [],
  directors: mapCrewByJob(data.credits?.crew, ['Director']),
  language: data.original_language || '',
  country: mapNames(data.production_countries, 3),
  rating: Number.isFinite(data.vote_average) ? data.vote_average : null,
  seasonCount: null,
  providerUpdatedAt: new Date().toISOString(),
});

const mapShowDetails = (data = {}) => ({
  provider: 'tmdb',
  providerId: String(data.id || ''),
  type: 'show',
  title: data.name || data.original_name || '',
  originalTitle: data.original_name || data.name || '',
  year: yearFromDate(data.first_air_date),
  runtimeMinutes:
    Array.isArray(data.episode_run_time) && Number.isFinite(data.episode_run_time[0])
      ? data.episode_run_time[0]
      : null,
  overview: data.overview || '',
  posterUrl: toImageUrl(data.poster_path, 'w500'),
  backdropUrl: toImageUrl(data.backdrop_path, 'w780'),
  genres: mapNames(data.genres, 8),
  cast: mapNames(data.credits?.cast, 12),
  creators: mapNames(data.created_by, 6),
  directors: [],
  language: data.original_language || '',
  country: (Array.isArray(data.origin_country) ? data.origin_country : []).slice(
    0,
    3,
  ),
  rating: Number.isFinite(data.vote_average) ? data.vote_average : null,
  seasonCount: Number.isFinite(data.number_of_seasons)
    ? data.number_of_seasons
    : null,
  seasonSummaries: mapSeasonSummaries(data.seasons),
  providerUpdatedAt: new Date().toISOString(),
});

module.exports = {
  mapMovieDetails,
  mapShowDetails,
};
