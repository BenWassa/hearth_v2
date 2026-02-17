/**
 * Normalization utilities for ItemDetailsModal data
 */

export const normalizeGenres = (genres) => {
  if (!genres) return [];
  const formatGenre = (g) => {
    const trimmed = `${g}`.trim();
    return trimmed === 'Science Fiction' ? 'Sci-Fi' : trimmed;
  };
  if (Array.isArray(genres)) return genres.map(formatGenre).filter(Boolean);
  if (typeof genres === 'string') {
    return genres
      .split(',')
      .map((g) => formatGenre(g))
      .filter(Boolean);
  }
  return [];
};

export const toNumber = (value, fallback) => {
  if (Number.isFinite(value)) return value;
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildEpisodeKey = (episode, seasonNumber, episodeNumber) => {
  if (episode?.id) return `${episode.id}`;
  if (episode?.tmdb_id) return `${episode.tmdb_id}`;
  return `s${seasonNumber}e${episodeNumber}`;
};

export const normalizeSeasons = (seasons) => {
  if (!Array.isArray(seasons)) return [];
  return seasons
    .map((season, index) => {
      if (!season || typeof season !== 'object') return null;
      const number = toNumber(
        season.number ?? season.seasonNumber ?? season.season_number,
        index + 1,
      );
      const rawEpisodes = Array.isArray(season.episodes) ? season.episodes : [];
      const episodes = rawEpisodes
        .map((episode, episodeIndex) => {
          if (!episode || typeof episode !== 'object') return null;
          const episodeNumber = toNumber(
            episode.number ?? episode.episodeNumber ?? episode.episode_number,
            episodeIndex + 1,
          );
          return {
            id: buildEpisodeKey(episode, number, episodeNumber),
            number: episodeNumber,
            title: episode.title ?? episode.name ?? `Episode ${episodeNumber}`,
            airDate: episode.airDate ?? episode.air_date ?? '',
            description: episode.description ?? episode.overview ?? '',
            runtimeMinutes: toNumber(
              episode.runtimeMinutes ??
                episode.runtime_minutes ??
                episode.runtime,
              null,
            ),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.number - b.number);
      return {
        id: season.id ?? `season-${number}`,
        number,
        name: season.name ?? season.title ?? `Season ${number}`,
        airDate: season.airDate ?? season.air_date ?? '',
        episodeCount: toNumber(
          season.episodeCount ?? season.episode_count,
          episodes.length,
        ),
        episodes,
      };
    })
    .filter(Boolean)
    .filter((season) => {
      if (season.number === 0 && season.episodes.length === 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.number - b.number);
};
