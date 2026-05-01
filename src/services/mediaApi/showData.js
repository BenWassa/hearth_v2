import { getSeasonEpisodes, getShowSeasons } from './client.js';
import { hasSeasonEpisodeMetadataGaps } from '../../domain/media/metadata.js';

const EPISODE_FETCH_CONCURRENCY = 2;

const isHydratableSeason = (seasonNumber) =>
  Number.isFinite(seasonNumber) && seasonNumber >= 1;

const toPositiveInteger = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getSeasonNumber = (season = {}) =>
  toPositiveInteger(
    season?.seasonNumber ?? season?.number ?? season?.season_number,
  );

const mapEpisode = (episode = {}) => ({
  id: episode.episodeId,
  episodeNumber: episode.episodeNumber,
  name: episode.name || '',
  description: episode.overview || '',
  airDate: episode.airDate || '',
  runtimeMinutes: episode.runtimeMinutes,
  still: episode.stillUrl || '',
});

const mapSeasonSummary = (season = {}, episodes = []) => ({
  seasonNumber: season?.seasonNumber,
  name: season?.name || `Season ${season?.seasonNumber}`,
  episodeCount: season?.episodeCount || episodes.length || 0,
  airDate: season?.airDate || '',
  poster: season?.posterUrl || season?.poster || '',
  episodes,
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
        ...mapSeasonSummary(season, episodes),
        seasonNumber,
      };
    },
  );

  return {
    seasonCount: seasonResponse?.seasonCount || seasonData.length,
    episodeCount: seasonResponse?.episodeCount || 0,
    seasons: seasonData,
  };
};

const indexSeasonsByNumber = (seasons = []) => {
  const indexed = new Map();
  seasons.forEach((season) => {
    const seasonNumber = getSeasonNumber(season);
    if (seasonNumber !== null) indexed.set(seasonNumber, season);
  });
  return indexed;
};

const normalizeExistingSeason = (season = {}) => ({
  seasonNumber: getSeasonNumber(season),
  name: season?.name || season?.title || '',
  episodeCount:
    toPositiveInteger(season?.episodeCount ?? season?.episode_count) ||
    (Array.isArray(season?.episodes) ? season.episodes.length : 0),
  airDate: season?.airDate || season?.air_date || '',
  poster: season?.poster || season?.posterUrl || '',
  episodes: Array.isArray(season?.episodes) ? season.episodes : [],
});

const shouldRefreshSeason = ({ summary = {}, existingSeason = null }) => {
  const seasonNumber = summary?.seasonNumber;
  if (!isHydratableSeason(seasonNumber)) return false;
  if (!existingSeason) return true;
  return hasSeasonEpisodeMetadataGaps({
    ...existingSeason,
    episodeCount:
      summary?.episodeCount ??
      existingSeason?.episodeCount ??
      existingSeason?.episode_count,
  });
};

export const refreshShowDataForMissingEpisodes = async ({
  provider,
  providerId,
  currentShowData = {},
}) => {
  const seasonResponse = await getShowSeasons({ provider, providerId });
  const summaries = Array.isArray(seasonResponse?.seasons)
    ? seasonResponse.seasons
    : [];
  const existingSeasons = Array.isArray(currentShowData?.seasons)
    ? currentShowData.seasons
    : [];
  const existingByNumber = indexSeasonsByNumber(existingSeasons);

  const seasonsToRefresh = summaries.filter((summary) =>
    shouldRefreshSeason({
      summary,
      existingSeason: existingByNumber.get(summary?.seasonNumber),
    }),
  );

  const refreshedByNumber = new Map();
  await mapWithConcurrency(
    seasonsToRefresh,
    EPISODE_FETCH_CONCURRENCY,
    async (season) => {
      try {
        const episodesData = await getSeasonEpisodes({
          provider,
          providerId,
          seasonNumber: season.seasonNumber,
        });
        const episodes = Array.isArray(episodesData?.episodes)
          ? episodesData.episodes.map(mapEpisode)
          : [];
        refreshedByNumber.set(
          season.seasonNumber,
          mapSeasonSummary(season, episodes),
        );
      } catch {
        const existingSeason = existingByNumber.get(season.seasonNumber);
        if (existingSeason) {
          refreshedByNumber.set(season.seasonNumber, {
            ...mapSeasonSummary(season, []),
            ...normalizeExistingSeason(existingSeason),
            episodeCount:
              season?.episodeCount ||
              normalizeExistingSeason(existingSeason).episodeCount,
          });
        }
      }
    },
  );

  const mergedSeasons = summaries.map((summary) => {
    const seasonNumber = summary?.seasonNumber;
    const refreshed = refreshedByNumber.get(seasonNumber);
    if (refreshed) return refreshed;

    const existingSeason = existingByNumber.get(seasonNumber);
    if (existingSeason) {
      const normalizedExisting = normalizeExistingSeason(existingSeason);
      return {
        ...mapSeasonSummary(summary, normalizedExisting.episodes),
        ...normalizedExisting,
        name: summary?.name || normalizedExisting.name,
        episodeCount:
          summary?.episodeCount ||
          normalizedExisting.episodeCount ||
          normalizedExisting.episodes.length,
        airDate: summary?.airDate || normalizedExisting.airDate,
        poster: summary?.posterUrl || normalizedExisting.poster,
      };
    }

    return mapSeasonSummary(summary, []);
  });

  return {
    seasonCount: seasonResponse?.seasonCount || mergedSeasons.length,
    episodeCount:
      seasonResponse?.episodeCount || currentShowData?.episodeCount || 0,
    seasons: mergedSeasons,
  };
};
