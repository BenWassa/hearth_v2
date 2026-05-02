import { startOfLocalDay, toLocalDate } from '../../../utils/releaseDates.js';

const getSeasonNumber = (season = {}, fallback = null) => {
  const raw = season.seasonNumber ?? season.number ?? season.season_number;
  const parsed = Number.parseInt(`${raw}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getEpisodeNumber = (episode = {}, fallback = null) => {
  const raw = episode.episodeNumber ?? episode.number ?? episode.episode_number;
  const parsed = Number.parseInt(`${raw}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getEpisodeId = ({ episode, seasonNumber, episodeNumber }) =>
  String(
    episode.id ||
      episode.episodeId ||
      episode.tmdb_id ||
      episode.tmdbId ||
      (seasonNumber && episodeNumber ? `s${seasonNumber}e${episodeNumber}` : ''),
  );

export const getUpcomingReleases = (items = [], { now = new Date() } = {}) => {
  const today = startOfLocalDay(now);
  const releasesBySeason = new Map();

  items.forEach((item) => {
    if (!item || item.type !== 'show' || item.status === 'watched') return;
    const seasons = Array.isArray(item.seasons) ? item.seasons : [];
    seasons.forEach((season, seasonIndex) => {
      const seasonNumber = getSeasonNumber(season, seasonIndex + 1);
      if (seasonNumber === 0) return;
      const episodes = Array.isArray(season.episodes) ? season.episodes : [];
      episodes.forEach((episode, episodeIndex) => {
        const releaseDate = toLocalDate(
          episode.airDate || episode.air_date || episode.releaseDate,
        );
        if (!releaseDate) return;
        const releaseDay = startOfLocalDay(releaseDate);
        if (releaseDay < today) return;

        const episodeNumber = getEpisodeNumber(episode, episodeIndex + 1);
        const key = `${item.id || item.title || 'show'}:${seasonNumber}`;
        const nextRelease = {
          showId: item.id || '',
          showTitle: item.title || '',
          seasonNumber,
          seasonName:
            season.name || season.title || `Season ${seasonNumber || ''}`.trim(),
          seasonPoster: season.poster || season.posterUrl || '',
          poster: season.poster || season.posterUrl || item.poster || '',
          episodeId: getEpisodeId({ episode, seasonNumber, episodeNumber }),
          episodeTitle:
            episode.title || episode.name || `Episode ${episodeNumber}`,
          episodeNumber,
          airDate: episode.airDate || episode.air_date || episode.releaseDate,
          releaseTime: releaseDay,
          item,
        };
        const current = releasesBySeason.get(key);
        if (
          !current ||
          nextRelease.releaseTime < current.releaseTime ||
          (nextRelease.releaseTime === current.releaseTime &&
            nextRelease.episodeNumber < current.episodeNumber)
        ) {
          releasesBySeason.set(key, nextRelease);
        }
      });
    });
  });

  return Array.from(releasesBySeason.values()).sort((a, b) => {
    const dateDelta = a.releaseTime - b.releaseTime;
    if (dateDelta !== 0) return dateDelta;
    const titleDelta = a.showTitle.localeCompare(b.showTitle);
    if (titleDelta !== 0) return titleDelta;
    return a.seasonNumber - b.seasonNumber;
  });
};
