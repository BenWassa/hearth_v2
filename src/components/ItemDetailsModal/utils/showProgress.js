const sortSeasonsAsc = (seasons = []) =>
  [...seasons].sort((a, b) => a.number - b.number);

const sortEpisodesAsc = (episodes = []) =>
  [...episodes].sort((a, b) => a.number - b.number);

export const getEpisodeProgressKeys = (episode) => {
  if (!episode || typeof episode !== 'object') return [];
  const fallbackKey =
    Number.isFinite(episode.seasonNumber) && Number.isFinite(episode.number)
      ? `s${episode.seasonNumber}e${episode.number}`
      : null;
  return Array.from(
    new Set(
      [episode.id, ...(episode.progressKeys || []), fallbackKey]
        .filter(Boolean)
        .map((key) => `${key}`),
    ),
  );
};

export const isEpisodeWatched = (episodeProgress, episode) =>
  getEpisodeProgressKeys(episode).some((key) => Boolean(episodeProgress?.[key]));

export const getShowEntryTarget = ({ seasons, episodeProgress }) => {
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const progress = episodeProgress || {};
  const orderedSeasons = sortSeasonsAsc(seasons);

  for (let seasonIndex = 0; seasonIndex < orderedSeasons.length; seasonIndex += 1) {
    const season = orderedSeasons[seasonIndex];
    const orderedEpisodes = sortEpisodesAsc(season.episodes || []);
    const nextUnwatched = orderedEpisodes.find(
      (episode) => !isEpisodeWatched(progress, episode),
    );
    if (nextUnwatched) {
      return {
        seasonNumber: season.number,
        episodeId: nextUnwatched.id,
      };
    }
  }

  const latestSeason = orderedSeasons[orderedSeasons.length - 1];
  const latestEpisodes = sortEpisodesAsc(latestSeason.episodes || []);
  const latestEpisode = latestEpisodes[latestEpisodes.length - 1] || null;
  return {
    seasonNumber: latestSeason.number,
    episodeId: latestEpisode?.id || null,
  };
};
