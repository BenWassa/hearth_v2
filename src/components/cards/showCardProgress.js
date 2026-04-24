import { isEpisodeWatched } from '../ItemDetailsModal/utils/showProgress.js';

const toFiniteNumber = (value) => {
  if (Number.isFinite(value)) return value;
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const toEpisodeSlotKey = (seasonNumber, episodeNumber) => {
  if (!Number.isFinite(seasonNumber) || !Number.isFinite(episodeNumber)) {
    return null;
  }
  return `s${seasonNumber}e${episodeNumber}`;
};

const toEpisodeIdentityKey = (episode) => {
  const raw =
    episode?.id ??
    episode?.episodeId ??
    episode?.tmdb_id ??
    episode?.tmdbId ??
    null;
  return raw ? `id:${raw}` : null;
};

const normalizeEpisodeTotal = (season) => {
  const episodeCount = toFiniteNumber(
    season?.episodeCount ?? season?.episode_count,
  );
  if (episodeCount && episodeCount > 0) return episodeCount;
  const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
  return episodes.length;
};

export const getShowWatchProgress = (item) => {
  if (item?.type !== 'show') return { percent: 0, watched: 0, total: 0 };

  const progressObj = item?.episodeProgress || {};
  const seasons = Array.isArray(item?.seasons) ? item.seasons : [];
  const watchedSlots = new Set();
  let totalEpisodesFromSeasons = 0;

  seasons.forEach((season) => {
    const seasonNumber = toFiniteNumber(
      season?.number ?? season?.seasonNumber ?? season?.season_number,
    );
    // Season 0 is extras/featurettes – exclude from progress tracking
    if (seasonNumber === 0) return;
    totalEpisodesFromSeasons += normalizeEpisodeTotal(season);
    const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
    episodes.forEach((episode) => {
      if (
        !isEpisodeWatched(progressObj, {
          ...episode,
          seasonNumber:
            episode?.seasonNumber ?? episode?.season_number ?? seasonNumber,
          number:
            episode?.number ??
            episode?.episodeNumber ??
            episode?.episode_number,
        })
      ) {
        return;
      }
      const episodeNumber = toFiniteNumber(
        episode?.number ?? episode?.episodeNumber ?? episode?.episode_number,
      );
      const slotKey = toEpisodeSlotKey(seasonNumber, episodeNumber);
      if (slotKey) {
        watchedSlots.add(slotKey);
        return;
      }
      const identityKey = toEpisodeIdentityKey(episode);
      if (identityKey) watchedSlots.add(identityKey);
    });
  });

  Object.entries(progressObj).forEach(([key, watched]) => {
    if (!watched) return;
    const match = /^s(\d+)e(\d+)$/i.exec(`${key}`);
    if (!match) return;
    const sNum = Number(match[1]);
    if (sNum === 0) return; // ignore Season 0 extras
    watchedSlots.add(`s${sNum}e${Number(match[2])}`);
  });

  const explicitTotal = toFiniteNumber(
    item.totalEpisodes ??
      item.media?.totalEpisodes ??
      item.showData?.episodeCount,
  );
  const denominator = Math.max(totalEpisodesFromSeasons, explicitTotal || 0);
  const watchedCount = watchedSlots.size;

  if (denominator > 0) {
    const clampedWatched = Math.min(watchedCount, denominator);
    return {
      percent: Math.min(Math.round((clampedWatched / denominator) * 100), 100),
      watched: clampedWatched,
      total: denominator,
    };
  }

  const fallbackWatched = Object.values(progressObj).filter(Boolean).length;
  return {
    percent: fallbackWatched > 0 ? 5 : 0,
    watched: fallbackWatched,
    total: 0,
  };
};

export const getShowWatchProgressPercent = (item) =>
  getShowWatchProgress(item).percent;
