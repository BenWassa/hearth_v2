import { startOfLocalDay, toLocalDate } from '../../../utils/releaseDates.js';

const getSeasonNumber = (season = {}) =>
  toFiniteNumber(
    season?.number ?? season?.seasonNumber ?? season?.season_number,
  );

const getEpisodeNumber = (episode = {}) =>
  toFiniteNumber(
    episode?.number ?? episode?.episodeNumber ?? episode?.episode_number,
  );

const sortSeasonsAsc = (seasons = []) =>
  [...seasons].sort((a, b) => {
    const aNumber = getSeasonNumber(a) ?? 0;
    const bNumber = getSeasonNumber(b) ?? 0;
    return aNumber - bNumber;
  });

const sortEpisodesAsc = (episodes = []) =>
  [...episodes].sort((a, b) => {
    const aNumber = getEpisodeNumber(a) ?? 0;
    const bNumber = getEpisodeNumber(b) ?? 0;
    return aNumber - bNumber;
  });

const toFiniteNumber = (value) => {
  if (Number.isFinite(value)) return value;
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getEpisodeProgressKeys = (episode) => {
  if (!episode || typeof episode !== 'object') return [];
  const seasonNumber = toFiniteNumber(
    episode.seasonNumber ?? episode.season_number,
  );
  const episodeNumber = toFiniteNumber(
    episode.number ?? episode.episodeNumber ?? episode.episode_number,
  );
  const fallbackKey =
    Number.isFinite(seasonNumber) && Number.isFinite(episodeNumber)
      ? `s${seasonNumber}e${episodeNumber}`
      : null;
  return Array.from(
    new Set(
      [
        episode.id,
        episode.episodeId,
        episode.tmdb_id,
        episode.tmdbId,
        ...(episode.progressKeys || []),
        fallbackKey,
      ]
        .filter(Boolean)
        .map((key) => `${key}`),
    ),
  );
};

export const isEpisodeWatched = (episodeProgress, episode) =>
  getEpisodeProgressKeys(episode).some((key) =>
    Boolean(episodeProgress?.[key]),
  );

const getEpisodeProgressShape = (episode, season) => ({
  ...episode,
  seasonNumber:
    episode?.seasonNumber ?? episode?.season_number ?? getSeasonNumber(season),
  number: getEpisodeNumber(episode),
});

const isReleasedEpisode = (episode = {}, now = new Date()) => {
  const releaseDate = toLocalDate(
    episode?.airDate || episode?.air_date || episode?.releaseDate,
  );
  if (!releaseDate) return true;
  return startOfLocalDay(releaseDate) <= startOfLocalDay(now);
};

export const getShowWatchProgressSummary = (
  item,
  { now = new Date() } = {},
) => {
  if (!item || item.type !== 'show') {
    return {
      releasedTotal: 0,
      watchedReleased: 0,
      watchedAny: false,
      fullyWatched: false,
    };
  }
  const seasons = Array.isArray(item.seasons) ? item.seasons : [];
  const progress = item.episodeProgress || {};
  let releasedTotal = 0;
  let watchedReleased = 0;

  seasons.forEach((season) => {
    const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
    episodes.forEach((episode) => {
      if (!isReleasedEpisode(episode, now)) return;
      releasedTotal += 1;
      if (
        isEpisodeWatched(progress, getEpisodeProgressShape(episode, season))
      ) {
        watchedReleased += 1;
      }
    });
  });

  return {
    releasedTotal,
    watchedReleased,
    watchedAny: Object.values(progress).some(Boolean),
    fullyWatched: releasedTotal > 0 && watchedReleased === releasedTotal,
  };
};

export const isShowFullyWatched = (item, options) => {
  if (!item || item.type !== 'show') return true;
  return getShowWatchProgressSummary(item, options).fullyWatched;
};

export const getShowWatchStatus = (item, options) => {
  if (!item || item.type !== 'show') return item?.status || 'unwatched';
  const summary = getShowWatchProgressSummary(item, options);
  if (summary.fullyWatched) return 'watched';
  if (summary.watchedAny) return 'watching';
  return 'unwatched';
};

export const getShowEntryTarget = ({ seasons, episodeProgress }) => {
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const progress = episodeProgress || {};
  const orderedSeasons = sortSeasonsAsc(seasons);
  const releasedTargets = [];

  for (
    let seasonIndex = 0;
    seasonIndex < orderedSeasons.length;
    seasonIndex += 1
  ) {
    const season = orderedSeasons[seasonIndex];
    const orderedEpisodes = sortEpisodesAsc(season.episodes || []);
    const releasedEpisodes = orderedEpisodes.filter((episode) =>
      isReleasedEpisode(episode),
    );
    releasedEpisodes.forEach((episode) => {
      releasedTargets.push({ season, episode });
    });
    const nextUnwatched = orderedEpisodes.find(
      (episode) =>
        isReleasedEpisode(episode) &&
        !isEpisodeWatched(progress, getEpisodeProgressShape(episode, season)),
    );
    if (nextUnwatched) {
      return {
        seasonNumber: getSeasonNumber(season),
        episodeId: nextUnwatched.id || nextUnwatched.episodeId || null,
      };
    }
  }

  const latestReleased = releasedTargets[releasedTargets.length - 1];
  if (latestReleased) {
    return {
      seasonNumber: getSeasonNumber(latestReleased.season),
      episodeId:
        latestReleased.episode?.id || latestReleased.episode?.episodeId || null,
    };
  }

  const firstSeason = orderedSeasons[0];
  const firstEpisodes = sortEpisodesAsc(firstSeason.episodes || []);
  const firstEpisode = firstEpisodes[0] || null;
  return {
    seasonNumber: getSeasonNumber(firstSeason),
    episodeId: firstEpisode?.id || firstEpisode?.episodeId || null,
  };
};
