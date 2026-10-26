import { COLLECTION_CATALOG } from './collectionCatalog.js';
import {
  distinctShelfItems,
  getCollectionIdentity,
  getShelfItemIdentity,
  isFeatureFilm,
  isShortOrSpecial,
} from '../domain/media/collectionEligibility.js';
import { toMillis } from '../utils/time.js';

// Brand-level browsing places, never invented sequel relationships. The stable
// disney-animation ID remains for compatibility; Disney includes selected
// traditional animated/live-action films, not corporate ownership in general.
export const COLLECTION_WORLDS_VERSION = 2;
const worlds = [
  ['wizarding-world', 'Wizarding World', 'story'],
  ['marvel', 'Marvel', 'orbit'],
  ['star-wars', 'Star Wars', 'stars'],
  ['pixar', 'Pixar', 'play'],
  ['disney-animation', 'Disney', 'story'],
  ['dc', 'DC', 'orbit'],
  ['dreamworks', 'DreamWorks Animation', 'moon'],
  ['studio-ghibli', 'Studio Ghibli', 'moon'],
];
export const COLLECTION_WORLDS = worlds.map(([id, name, motif]) => ({
  id,
  name,
  motif,
  // Static, local production artwork; the button/heading always retains live text.
  cover: `/assets/worlds/${id}/cover.webp`,
  hero: `/assets/worlds/${id}/hero.webp`,
  wordmark: `/assets/worlds/${id}/wordmark.${
    ['star-wars', 'wizarding-world', 'studio-ghibli'].includes(id)
      ? 'svg'
      : 'png'
  }`,
  collectionIds: Object.values(COLLECTION_CATALOG)
    .filter((entry) => entry.worldId === id)
    .map((entry) => entry.providerId),
}));

// Explicit optional metadata is accepted only for known stable World IDs. This
// is separate from collection membership and never infers corporate ownership.
export const normalizeWorldIds = (value) => {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? [value]
    : [];
  const known = new Set(COLLECTION_WORLDS.map((world) => world.id));
  return [
    ...new Set(
      candidates.filter((id) => typeof id === 'string' && known.has(id)),
    ),
  ];
};

// Preserve omission: metadata refreshes without an explicit affiliation must not
// erase an existing catalog value. An explicit [] intentionally clears it.
export const getExplicitWorldMetadata = (item = {}) => {
  for (const source of [item.media, item]) {
    if (!source || typeof source !== 'object') continue;
    for (const field of ['worldIds', 'worldId']) {
      if (Object.prototype.hasOwnProperty.call(source, field)) {
        return { worldIds: normalizeWorldIds(source[field]) };
      }
    }
  }
  return {};
};

// Small, intentional standalone-film registry verified with the TMDB API on
// 2026-10-26. Future entries require provider IDs and editorial review. Unknown
// titles stay on the shelf rather than being guessed from names/ownership.
export const WORLD_STANDALONE_FILMS = {
  'tmdb:14160': 'pixar', // Up
  'tmdb:10681': 'pixar', // WALL·E
  'tmdb:2062': 'pixar', // Ratatouille
  'tmdb:11360': 'disney-animation', // Dumbo (1941)
  'tmdb:150689': 'disney-animation', // Cinderella (2015, live action)
  'tmdb:129': 'studio-ghibli', // Spirited Away
  'tmdb:128': 'studio-ghibli', // Princess Mononoke
  'tmdb:8392': 'studio-ghibli', // My Neighbor Totoro
  'tmdb:10515': 'studio-ghibli', // Castle in the Sky
  'tmdb:4935': 'studio-ghibli', // Howl's Moving Castle
  'tmdb:12477': 'studio-ghibli', // Grave of the Fireflies
};

const findWorld = (id) =>
  COLLECTION_WORLDS.find((world) => world.id === id) || null;
export const worldForSaga = (saga) =>
  findWorld(COLLECTION_CATALOG[getCollectionIdentity(saga)]?.worldId);

export const worldForItem = (item = {}) => {
  const explicit = getExplicitWorldMetadata(item).worldIds?.[0];
  const explicitWorld = findWorld(explicit);
  if (explicitWorld) return explicitWorld;
  if ((item.type || item.media?.type) !== 'movie') return null;
  const sagaWorld = worldForSaga(item);
  if (sagaWorld) return sagaWorld;
  const provider =
    item.source?.provider || item.media?.provider || item.provider || 'tmdb';
  const providerId =
    item.source?.providerId || item.media?.providerId || item.providerId;
  return findWorld(WORLD_STANDALONE_FILMS[`${provider}:${providerId}`]);
};

export const buildWorlds = (
  sagas = [],
  shelfItems,
  { now = Date.now() } = {},
) => {
  const allItems = distinctShelfItems([
    ...(shelfItems || []),
    ...sagas.flatMap((saga) => saga.items || []),
  ]);
  return COLLECTION_WORLDS.map((world) => {
    const children = sagas.filter(
      (saga) => worldForSaga(saga)?.id === world.id,
    );
    const childItems = distinctShelfItems(
      children.flatMap((saga) => saga.items || []),
    );
    const childKeys = new Set(
      childItems.map(getShelfItemIdentity).filter(Boolean),
    );
    const items = allItems.filter((item) => {
      const primary = worldForItem(item);
      return primary
        ? primary.id === world.id
        : childKeys.has(getShelfItemIdentity(item));
    });
    const features = items.filter(isFeatureFilm);
    const otherFilms = features.filter(
      (item) =>
        !childKeys.has(getShelfItemIdentity(item)) &&
        !childItems.includes(item),
    );
    const shorts = items.filter(isShortOrSpecial);
    const shows = items.filter(
      (item) => (item.type || item.media?.type) === 'show',
    );
    const validTime = (value) => {
      const time = toMillis(value);
      return time > 0 && time <= now ? time : 0;
    };
    const lastItemActivity = (item) =>
      Math.max(
        item.additionOrigin === 'manual' ? validTime(item.createdAt) : 0,
        item.status === 'watched'
          ? validTime(item.userState?.markedWatchedAt ?? item.markedWatchedAt)
          : 0,
      );
    return {
      ...world,
      sagas: children,
      otherFilms,
      shorts,
      shows,
      ownedTotal: features.length,
      ownedFeatureCount: features.length,
      ownedFeatureWatchedCount: features.filter(
        (item) => item.status === 'watched',
      ).length,
      unwatched: features.filter((item) => item.status !== 'watched').length,
      shortCount: shorts.length,
      showCount: shows.length,
      activity: Math.max(
        0,
        ...children.map((saga) => validTime(saga.activity?.lastActivityAt)),
        ...items.map(lastItemActivity),
      ),
    };
  })
    .filter(
      (world) =>
        world.sagas.length ||
        world.otherFilms.length ||
        world.shorts.length ||
        world.shows.length,
    )
    .sort((a, b) => b.activity - a.activity || a.name.localeCompare(b.name));
};
