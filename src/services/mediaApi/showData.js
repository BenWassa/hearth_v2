import { getSeasonEpisodes, getShowSeasons } from './client.js';

const EPISODE_FETCH_CONCURRENCY = 2;

const isHydratableSeason = (seasonNumber) =>
  Number.isFinite(seasonNumber) && seasonNumber >= 1;

const mapEpisode = (episode = {}) => ({
  id: episode.episodeId,
  episodeNumber: episode.episodeNumber,
  name: episode.name || '',
  description: episode.overview || '',
  airDate: episode.airDate || '',
  runtimeMinutes: episode.runtimeMinutes,
  still: episode.stillUrl || '',
});

const mapWithConcurrency = async (values, limit, mapper) => {
  if (!Array.isArray(values) || !values.length) return [];

  const results = new Array(values.length);
  const workerCount = Math.max(1, Math.min(limit, values.length));
  let cursor = 0;

  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};

export const hydrateShowData = async ({ provider, providerId }) => {
  const seasonResponse = await getShowSeasons({ provider, providerId });
  const seasons = Array.isArray(seasonResponse?.seasons)
    ? seasonResponse.seasons
    : [];

  const seasonData = await mapWithConcurrency(
    seasons,
    EPISODE_FETCH_CONCURRENCY,
    async (season) => {
      const seasonNumber = season?.seasonNumber;
      let episodes = [];
      if (isHydratableSeason(seasonNumber)) {
        try {
          const episodesData = await getSeasonEpisodes({
            provider,
            providerId,
            seasonNumber,
          });
          episodes = Array.isArray(episodesData?.episodes)
            ? episodesData.episodes.map(mapEpisode)
            : [];
        } catch {
          episodes = [];
        }
      }

      return {
        seasonNumber,
        name: season.name || `Season ${seasonNumber}`,
        episodeCount: season.episodeCount || episodes.length || 0,
        airDate: season.airDate || '',
        poster: season.posterUrl || '',
        episodes,
      };
    },
  );

  return {
    seasonCount: seasonResponse?.seasonCount || seasonData.length,
    seasons: seasonData,
  };
};
