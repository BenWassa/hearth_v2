const sortSeasonsAsc = (seasons = []) =>
  [...seasons].sort((a, b) => a.number - b.number);

const sortEpisodesAsc = (episodes = []) =>
  [...episodes].sort((a, b) => a.number - b.number);

export const getShowEntryTarget = ({ seasons, episodeProgress }) => {
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const progress = episodeProgress || {};
  const orderedSeasons = sortSeasonsAsc(seasons);

  for (let seasonIndex = orderedSeasons.length - 1; seasonIndex >= 0; seasonIndex -= 1) {
    const season = orderedSeasons[seasonIndex];
    const orderedEpisodes = sortEpisodesAsc(season.episodes || []);
    const nextUnwatched = orderedEpisodes.find(
      (episode) => !progress?.[episode.id],
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
