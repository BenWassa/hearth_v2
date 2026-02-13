import { getAppBase } from './env.js';

let cachedIndex = null;
let cachedIndexPromise = null;
let cachedLegacyMap = null;
let cachedLegacyPromise = null;
const cachedShows = new Map();
const cachedShowPromises = new Map();

const normalizeKey = (value) => {
  if (!value) return '';
  return `${value}`.trim();
};

const normalizeTitle = (value) => {
  if (!value) return '';
  const lowered = `${value}`.toLowerCase();
  const expanded = lowered.replace(/&/g, 'and').replace(/['’]/g, '');
  return expanded
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const findBestTitleMatch = (title, entries) => {
  if (!title) return null;
  const inputTokens = title.split(' ').filter(Boolean);
  if (!inputTokens.length) return null;
  const inputSet = new Set(inputTokens);
  const minScore = Math.max(2, Math.ceil(inputTokens.length * 0.6));
  let best = null;
  let bestScore = 0;
  let bestTies = 0;

  for (const entry of entries) {
    const candidateTitle = normalizeTitle(entry?.title);
    if (!candidateTitle) continue;
    const candidateTokens = candidateTitle.split(' ');
    let score = 0;
    for (const token of candidateTokens) {
      if (inputSet.has(token)) score += 1;
    }
    if (candidateTitle.includes(title) || title.includes(candidateTitle)) {
      score += 1;
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
      bestTies = 0;
    } else if (score === bestScore && score > 0) {
      bestTies += 1;
    }
  }

  if (!best || bestScore < minScore || bestTies > 0) return null;
  return best;
};

const resolveEpisodeKey = (item) => {
  const tmdbId = item?.tmdb_id ?? item?.tmdbId;
  const tmdbKey = normalizeKey(tmdbId);
  if (tmdbKey) return tmdbKey;
  return normalizeKey(item?.title);
};

export const getEpisodeMap = async () => {
  if (cachedIndex || cachedLegacyMap) {
    return { index: cachedIndex, legacyMap: cachedLegacyMap };
  }
  if (!cachedIndexPromise) {
    const baseUrl = getAppBase();
    const indexUrl = `${baseUrl}/episode-index.json`;
    cachedIndexPromise = fetch(indexUrl)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((index) => {
        if (index && typeof index === 'object') {
          cachedIndex = index;
          return { index: cachedIndex, legacyMap: null };
        }
        if (!cachedLegacyPromise) {
          const legacyUrl = `${baseUrl}/episode-map.json`;
          cachedLegacyPromise = fetch(legacyUrl)
            .then((resp) => (resp.ok ? resp.json() : {}))
            .catch(() => ({}));
        }
        return cachedLegacyPromise.then((legacy) => {
          cachedLegacyMap = legacy || {};
          return { index: null, legacyMap: cachedLegacyMap };
        });
      })
      .catch(() => {
        cachedLegacyMap = {};
        return { index: null, legacyMap: cachedLegacyMap };
      });
  }
  return cachedIndexPromise;
};

const getEpisodeShow = async (tmdbId) => {
  const key = normalizeKey(tmdbId);
  if (!key) return null;
  if (cachedShows.has(key)) return cachedShows.get(key);
  if (!cachedShowPromises.has(key)) {
    const baseUrl = getAppBase();
    const url = `${baseUrl}/episode-map/${key}.json`;
    cachedShowPromises.set(
      key,
      fetch(url)
        .then((resp) => (resp.ok ? resp.json() : null))
        .catch(() => null),
    );
  }
  const show = await cachedShowPromises.get(key);
  cachedShows.set(key, show);
  return show;
};

const getSeasonsFromLegacyMap = (map, item) => {
  const key = resolveEpisodeKey(item);
  if (key && map?.[key]?.seasons) return map[key].seasons;
  const title = normalizeTitle(item?.title);
  if (!title) return null;
  const entries = Object.values(map || {});
  const exact = entries.find((entry) => normalizeTitle(entry?.title) === title);
  if (exact?.seasons) return exact.seasons;
  const fallback = findBestTitleMatch(title, entries);
  return fallback?.seasons ?? null;
};

export const getEpisodeSeasons = async (item) => {
  const { index, legacyMap } = await getEpisodeMap();
  if (legacyMap) return getSeasonsFromLegacyMap(legacyMap, item);

  const key = resolveEpisodeKey(item);
  const title = normalizeTitle(item?.title);
  const entries = Object.values(index || {});
  let entry = null;

  if (key && index?.[key]) {
    entry = index[key];
  } else if (title) {
    entry = entries.find(
      (candidate) => normalizeTitle(candidate?.title) === title,
    );
    if (!entry) {
      entry = findBestTitleMatch(title, entries);
    }
  }

  const tmdbId = normalizeKey(entry?.tmdb_id ?? entry?.tmdbId);
  if (!tmdbId) return null;
  const show = await getEpisodeShow(tmdbId);
  return show?.seasons ?? null;
};
