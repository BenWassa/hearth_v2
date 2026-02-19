#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.TEMPLATE_MEDIA_API_BASE || 'http://localhost:8080';
const OUTPUT_PATH = path.resolve('src/template/seed-media-map.json');
const RESUME_FROM_EXISTING = String(
  process.env.TEMPLATE_MEDIA_RESUME || '1',
).toLowerCase() !== '0';

const SEEDS = [
  { title: 'Paddington 2', type: 'movie', year: '2017', providerId: '346648' },
  { title: 'The Intern', type: 'movie', year: '2015', providerId: '257211' },
  { title: 'The Martian', type: 'movie', year: '2015', providerId: '286217' },
  { title: 'Legally Blonde', type: 'movie', year: '2001', providerId: '8835' },
  { title: 'School of Rock', type: 'movie', year: '2003', providerId: '1584' },
  { title: 'Knives Out', type: 'movie', year: '2019', providerId: '546554' },
  { title: "Ocean's Eleven", type: 'movie', year: '2001', providerId: '161' },
  { title: 'Gone Girl', type: 'movie', year: '2014', providerId: '210577' },
  { title: 'The Dark Knight', type: 'movie', year: '2008', providerId: '155' },
  {
    title: 'Spider-Man: Into the Spider-Verse',
    type: 'movie',
    year: '2018',
    providerId: '324857',
  },
  {
    title: 'The Grand Budapest Hotel',
    type: 'movie',
    year: '2014',
    providerId: '120467',
  },
  { title: 'Blade Runner 2049', type: 'movie', year: '2017', providerId: '335984' },
  { title: 'Roman Holiday', type: 'movie', year: '1953', providerId: '804' },
  { title: 'Casablanca', type: 'movie', year: '1942', providerId: '289' },
  { title: 'The Godfather', type: 'movie', year: '1972', providerId: '238' },
  { title: 'Ted Lasso', type: 'show', year: '2020', providerId: '97546' },
  { title: 'Gilmore Girls', type: 'show', year: '2000', providerId: '4586' },
  { title: 'Friday Night Lights', type: 'show', year: '2006', providerId: '4278' },
  { title: 'Abbott Elementary', type: 'show', year: '2021', providerId: '125935' },
  { title: 'Brooklyn Nine-Nine', type: 'show', year: '2013', providerId: '48891' },
  {
    title: 'The Great British Bake Off',
    type: 'show',
    year: '2010',
    providerId: '34549',
  },
  {
    title: 'Only Murders in the Building',
    type: 'show',
    year: '2021',
    providerId: '107113',
  },
  { title: 'Stranger Things', type: 'show', year: '2016', providerId: '66732' },
  { title: 'Severance', type: 'show', year: '2022', providerId: '95396' },
  { title: 'Planet Earth II', type: 'show', year: '2016', providerId: '68595' },
  { title: 'The Crown', type: 'show', year: '2016', providerId: '65494' },
  { title: 'Arcane', type: 'show', year: '2021', providerId: '94605' },
  { title: 'I Love Lucy', type: 'show', year: '1951', providerId: '2730' },
  { title: 'The Twilight Zone', type: 'show', year: '1959', providerId: '6357' },
  { title: 'The Wire', type: 'show', year: '2002', providerId: '1438' },
];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = 4;

const firstNonEmpty = (...values) =>
  values
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';

const resolvePrimaryCredit = ({ type, details }) => {
  const creators = Array.isArray(details?.creators) ? details.creators : [];
  const directors = Array.isArray(details?.directors) ? details.directors : [];
  const cast = Array.isArray(details?.cast) ? details.cast : [];

  if (type === 'show') {
    return firstNonEmpty(creators[0], directors[0], cast[0]);
  }
  return firstNonEmpty(directors[0], creators[0], cast[0]);
};

const isNonEmpty = (value) => String(value || '').trim().length > 0;

const hasCompleteItem = (item = {}) => {
  const type = String(item?.type || '');
  if (!isNonEmpty(item?.title)) return false;
  if (!isNonEmpty(item?.year)) return false;
  if (!isNonEmpty(item?.poster || item?.media?.poster)) return false;
  if (!isNonEmpty(item?.backdrop || item?.media?.backdrop)) return false;
  if (!isNonEmpty(item?.overview || item?.media?.overview)) return false;
  if (!Array.isArray(item?.genres) || item.genres.length === 0) return false;
  if (!Array.isArray(item?.actors) || item.actors.length === 0) return false;
  if (!isNonEmpty(item?.director)) return false;

  if (type === 'show') {
    const seasons = Array.isArray(item?.seasons) ? item.seasons : [];
    if (!seasons.length) return false;
    const hasEpisodeData = seasons.every(
      (season) => Array.isArray(season?.episodes) && season.episodes.length > 0,
    );
    if (!hasEpisodeData) return false;
  }

  return true;
};

const fetchJsonWithRetry = async (url) => {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url);
      const payload = await response.json();
      if (response.ok && payload?.ok && payload?.data) {
        return payload.data;
      }
      const message =
        payload?.error?.message || `Request failed (${response.status}) for ${url}`;
      lastError = new Error(message);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < MAX_RETRIES) {
      await sleep(400 * (attempt + 1));
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
};

const mapSeasonSummariesToSeasons = (seasonSummaries = []) =>
  (Array.isArray(seasonSummaries) ? seasonSummaries : [])
    .map((season) => {
      const seasonNumber = Number(season?.seasonNumber);
      if (!Number.isFinite(seasonNumber) || seasonNumber < 1) return null;
      return {
        number: seasonNumber,
        seasonNumber,
        name: String(season?.name || `Season ${seasonNumber}`),
        episodeCount: Number(season?.episodeCount || 0),
        airDate: String(season?.airDate || ''),
        poster: String(season?.posterUrl || ''),
        episodes: [],
      };
    })
    .filter(Boolean);

const fetchMediaDetails = async ({ providerId, type }) => {
  const url = `${API_BASE}/api/media/tmdb/${providerId}?type=${type}`;
  return fetchJsonWithRetry(url);
};

const mapEpisodes = (episodes = [], seasonNumber) =>
  (Array.isArray(episodes) ? episodes : [])
    .map((episode) => {
      const episodeNumber = Number(episode?.episodeNumber);
      if (!Number.isFinite(episodeNumber) || episodeNumber < 1) return null;
      const season = Number.isFinite(Number(seasonNumber)) ? Number(seasonNumber) : null;
      const fallbackId =
        season && episodeNumber ? `s${season}e${episodeNumber}` : '';
      const episodeId = firstNonEmpty(episode?.episodeId, fallbackId);
      const name = firstNonEmpty(episode?.name, `Episode ${episodeNumber}`);
      return {
        id: episodeId || fallbackId,
        episodeId: episodeId || fallbackId,
        number: episodeNumber,
        episodeNumber,
        seasonNumber: season,
        name,
        title: name,
        overview: String(episode?.overview || ''),
        airDate: String(episode?.airDate || ''),
        runtimeMinutes: Number.isFinite(episode?.runtimeMinutes)
          ? episode.runtimeMinutes
          : null,
        still: String(episode?.stillUrl || ''),
      };
    })
    .filter(Boolean);

const fetchShowSeasonsWithEpisodes = async ({ providerId, seasonSummaries = [] }) => {
  const seasonsUrl = `${API_BASE}/api/media/tmdb/${providerId}/seasons`;
  const seasonListPayload = await fetchJsonWithRetry(seasonsUrl);
  const seasonList = Array.isArray(seasonListPayload?.seasons)
    ? seasonListPayload.seasons
    : [];

  const fallbackSummaries = mapSeasonSummariesToSeasons(seasonSummaries);
  const fallbackBySeasonNumber = new Map(
    fallbackSummaries.map((season) => [Number(season.seasonNumber), season]),
  );

  const seasons = [];
  for (const season of seasonList) {
    const seasonNumber = Number(season?.seasonNumber);
    if (!Number.isFinite(seasonNumber) || seasonNumber < 1) continue;

    const episodesUrl = `${API_BASE}/api/media/tmdb/${providerId}/season/${seasonNumber}`;
    const episodePayload = await fetchJsonWithRetry(episodesUrl);
    const episodes = mapEpisodes(episodePayload?.episodes, seasonNumber);
    const fallback = fallbackBySeasonNumber.get(seasonNumber) || {};
    const declaredEpisodeCount = Number.isFinite(season?.episodeCount)
      ? season.episodeCount
      : 0;

    if (episodes.length === 0 && declaredEpisodeCount <= 0) {
      continue;
    }

    seasons.push({
      number: seasonNumber,
      seasonNumber,
      name: firstNonEmpty(season?.name, fallback?.name, `Season ${seasonNumber}`),
      episodeCount: declaredEpisodeCount > 0 ? declaredEpisodeCount : episodes.length,
      airDate: String(season?.airDate || fallback?.airDate || ''),
      poster: firstNonEmpty(season?.posterUrl, fallback?.poster),
      episodes,
    });

    await sleep(120);
  }

  return seasons;
};

const run = async () => {
  console.log(`Generating template media map from ${API_BASE} ...`);
  let existingItems = [];
  if (RESUME_FROM_EXISTING) {
    try {
      const existingRaw = await fs.readFile(OUTPUT_PATH, 'utf8');
      const existingJson = JSON.parse(existingRaw);
      existingItems = Array.isArray(existingJson?.items) ? existingJson.items : [];
    } catch {
      existingItems = [];
    }
  }

  const existingByProviderKey = new Map(
    existingItems.map((item) => {
      const provider = String(item?.source?.provider || '').toLowerCase();
      const providerId = String(item?.source?.providerId || '');
      const type = String(item?.type || '');
      return [`${provider}:${providerId}:${type}`, item];
    }),
  );

  const items = [];
  let failures = 0;

  for (const seed of SEEDS) {
    const resumeKey = `tmdb:${seed.providerId}:${seed.type}`;
    const existing = existingByProviderKey.get(resumeKey);
    if (existing && hasCompleteItem(existing)) {
      items.push(existing);
      console.log(`skip ${seed.type}  ${seed.title} (already complete)`);
      continue;
    }

    try {
      const details = await fetchMediaDetails({
        providerId: seed.providerId,
        type: seed.type,
      });
      const seasons =
        seed.type === 'show'
          ? await fetchShowSeasonsWithEpisodes({
              providerId: seed.providerId,
              seasonSummaries: details.seasonSummaries,
            })
          : [];
      items.push({
        id: `template-${slugify(`${seed.title}-${seed.year}-${seed.type}`)}`,
        title: details.title || seed.title,
        year: details.year || seed.year,
        type: seed.type,
        runtimeMinutes: Number.isFinite(details.runtimeMinutes)
          ? details.runtimeMinutes
          : null,
        overview: String(details.overview || ''),
        genres: Array.isArray(details.genres) ? details.genres : [],
        actors: Array.isArray(details.cast) ? details.cast : [],
        director: resolvePrimaryCredit({ type: seed.type, details }),
        poster: String(details.posterUrl || ''),
        backdrop: String(details.backdropUrl || ''),
        logo: String(details.logoUrl || ''),
        source: {
          provider: 'tmdb',
          providerId: String(seed.providerId),
          fetchedAt: Date.now(),
          locale: 'en-US',
        },
        media: {
          provider: 'tmdb',
          providerId: String(seed.providerId),
          type: seed.type,
          title: details.title || seed.title,
          year: details.year || seed.year,
          runtimeMinutes: Number.isFinite(details.runtimeMinutes)
            ? details.runtimeMinutes
            : null,
          overview: String(details.overview || ''),
          poster: String(details.posterUrl || ''),
          backdrop: String(details.backdropUrl || ''),
          logo: String(details.logoUrl || ''),
          genres: Array.isArray(details.genres) ? details.genres : [],
          cast: Array.isArray(details.cast) ? details.cast : [],
          creators: Array.isArray(details.creators) ? details.creators : [],
          directors: Array.isArray(details.directors) ? details.directors : [],
          language: String(details.language || ''),
          country: Array.isArray(details.country) ? details.country : [],
          rating: Number.isFinite(details.rating) ? details.rating : null,
          providerUpdatedAt: String(details.providerUpdatedAt || ''),
        },
        totalSeasons:
          seed.type === 'show'
            ? seasons.length
            : null,
        seasons,
        showData:
          seed.type === 'show'
            ? {
                seasonCount: seasons.length,
                seasons,
              }
            : { seasonCount: null, seasons: [] },
      });
      console.log(`ok  ${seed.type}  ${seed.title}`);
      await sleep(260);
    } catch (error) {
      failures += 1;
      console.warn(`err ${seed.type}  ${seed.title}: ${error.message}`);
      await sleep(500);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    totalSeeds: SEEDS.length,
    successCount: items.length,
    failureCount: failures,
    items,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${items.length} items to ${OUTPUT_PATH}`);
  if (failures > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
