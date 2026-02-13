import { getSeasonEpisodes, getShowSeasons } from './client.js';

const mapEpisode = (episode = {}) => ({
  id: episode.episodeId,
  episodeNumber: episode.episodeNumber,
  name: episode.name || '',
  description: episode.overview || '',
  airDate: episode.airDate || '',
  runtimeMinutes: episode.runtimeMinutes,
  still: episode.stillUrl || '',
});

export const hydrateShowData = async ({ provider, providerId }) => {
  const seasonResponse = await getShowSeasons({ provider, providerId });
  const seasons = Array.isArray(seasonResponse?.seasons)
    ? seasonResponse.seasons
    : [];

  const seasonData = await Promise.all(
    seasons.map(async (season) => {
      let episodes = [];
      try {
        const episodesData = await getSeasonEpisodes({
          provider,
          providerId,
          seasonNumber: season.seasonNumber,
        });
        episodes = Array.isArray(episodesData?.episodes)
          ? episodesData.episodes.map(mapEpisode)
          : [];
      } catch {
        episodes = [];
      }

      return {
        seasonNumber: season.seasonNumber,
        name: season.name || `Season ${season.seasonNumber}`,
        episodeCount: season.episodeCount || episodes.length || 0,
        airDate: season.airDate || '',
        poster: season.posterUrl || '',
        episodes,
      };
    }),
  );

  return {
    seasonCount: seasonResponse?.seasonCount || seasonData.length,
    seasons: seasonData,
  };
};
