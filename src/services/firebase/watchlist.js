import {
  canonicalMediaKey,
  tagProvenance,
} from '../../domain/media/classification.mjs';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  getExplicitWorldMetadata,
  normalizeWorldIds,
} from '../../config/collectionWorlds.js';
import { buildMediaId } from '../../domain/media/schema.js';
import { normalizeWatchStatus } from '../../domain/media/status.js';

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const pickPrimaryCredit = ({ payload = {}, media = {}, type = '' }) => {
  const direct = asString(payload.director);
  if (direct) return direct;

  const mediaDirectors = asArray(media.directors)
    .map((value) => asString(value))
    .find(Boolean);
  if (mediaDirectors) return mediaDirectors;

  if (type === 'show') {
    const mediaCreators = asArray(media.creators)
      .map((value) => asString(value))
      .find(Boolean);
    if (mediaCreators) return mediaCreators;
  }

  return '';
};

const asNumberOrNull = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCollection = (value = {}) => {
  const collectionData = asObject(value);
  const providerId = asString(collectionData.providerId);
  const name = asString(collectionData.name);
  if (!providerId || !name) return null;
  return {
    provider: asString(collectionData.provider || 'tmdb'),
    providerId,
    name,
    poster: asString(collectionData.poster),
    backdrop: asString(collectionData.backdrop),
  };
};

const getWatchlistDocRef = (db, appId, spaceId, itemId) =>
  doc(db, 'artifacts', appId, 'spaces', spaceId, 'watchlist_items', itemId);

const getCatalogDocRef = (db, appId, mediaId) =>
  doc(db, 'artifacts', appId, 'media_catalog', mediaId);

const deriveMediaId = (payload = {}) => {
  const explicit = asString(payload.mediaId);
  if (explicit) return explicit;
  return buildMediaId(payload);
};

const buildCatalogPayload = (payload = {}, mediaId) => {
  const source = asObject(payload.source);
  const media = asObject(payload.media);
  const showData = asObject(payload.showData);
  const genres = asArray(media.genres).length
    ? asArray(media.genres)
    : asArray(payload.genres);
  const cast = asArray(media.cast).length
    ? asArray(media.cast)
    : asArray(payload.actors);
  const seasons = asArray(showData.seasons).length
    ? asArray(showData.seasons)
    : asArray(payload.seasons);
  const seasonCount = asNumberOrNull(
    showData.seasonCount ?? payload.totalSeasons,
  );

  const title = asString(media.title || payload.title);
  const type = asString(media.type || payload.type || 'movie');
  const year = asString(media.year || payload.year);
  const runtimeMinutes = asNumberOrNull(
    media.runtimeMinutes ?? payload.runtimeMinutes,
  );
  const director = pickPrimaryCredit({ payload, media, type });
  const poster = asString(media.poster || payload.poster);
  const backdrop = asString(media.backdrop || payload.backdrop);
  const logo = asString(media.logo || payload.logo);

  return {
    mediaId,
    source: {
      provider: asString(
        source.provider || media.provider || payload.provider || 'tmdb',
      ),
      providerId: asString(
        source.providerId || media.providerId || payload.providerId,
      ),
      fetchedAt: asNumberOrNull(source.fetchedAt) || Date.now(),
      staleAfter: asNumberOrNull(source.staleAfter),
      locale: asString(source.locale || 'en-US'),
    },
    media: {
      ...getExplicitWorldMetadata(payload),
      type,
      title,
      originalTitle: asString(media.originalTitle),
      keywords: asArray(media.keywords),
      year,
      runtimeMinutes,
      overview: asString(media.overview),
      poster,
      backdrop,
      logo,
      genres,
      cast,
      creators: asArray(media.creators),
      directors: asArray(media.directors).length
        ? asArray(media.directors)
        : director
        ? [director]
        : [],
      language: asString(media.language),
      country: asArray(media.country),
      rating:
        typeof media.rating === 'number' && Number.isFinite(media.rating)
          ? media.rating
          : null,
      providerUpdatedAt: asString(media.providerUpdatedAt),
      collection: normalizeCollection(media.collection),
      showStatus: asString(media.showStatus),
      inProduction:
        typeof media.inProduction === 'boolean' ? media.inProduction : null,
      nextEpisodeAirDate:
        media.nextEpisodeAirDate != null
          ? asString(media.nextEpisodeAirDate)
          : null,
      lastEpisodeAirDate:
        media.lastEpisodeAirDate != null
          ? asString(media.lastEpisodeAirDate)
          : null,
    },
    showData: {
      seasonCount,
      seasons,
    },
    title,
    type,
    year,
    runtimeMinutes,
    director,
    genres,
    actors: cast,
    poster,
    backdrop,
    logo,
    totalSeasons: seasonCount,
    seasons,
    updatedAt: serverTimestamp(),
  };
};

const buildWatchlistPayload = (
  payload = {},
  mediaId,
  preserveCreatedAt = false,
) => {
  const userState = asObject(payload.userState);
  const media = asObject(payload.media);
  const status = normalizeWatchStatus(
    userState.status || payload.status || 'unwatched',
  );
  const vibe = asString(userState.vibe || payload.vibe);
  const energy = asString(userState.energy || payload.energy);
  const note = asString(userState.note || payload.note);
  const episodeProgress = asObject(
    userState.episodeProgress || payload.episodeProgress,
  );

  const base = {
    schemaVersion: 2,
    mediaId,
    addedBy: asString(payload.addedBy),
    additionOrigin: payload.additionOrigin === 'import' ? 'import' : 'manual',
    status,
    vibe,
    energy,
    note,
    episodeProgress,
    title: asString(media.title || payload.title),
    type: asString(media.type || payload.type || 'movie'),
    year: asString(media.year || payload.year),
    poster: asString(media.poster || payload.poster),
    backdrop: asString(media.backdrop || payload.backdrop),
    logo: asString(media.logo || payload.logo),
    userState: {
      tagProvenance: tagProvenance(payload),
      status,
      vibe,
      energy,
      note,
      episodeProgress,
    },
    updatedAt: serverTimestamp(),
  };

  if (!preserveCreatedAt) {
    base.createdAt = serverTimestamp();
  }

  return base;
};

const mergeWatchlistWithCatalog = (watchData = {}, catalogData = {}) => {
  const catalogWorldMetadata = getExplicitWorldMetadata(catalogData);
  const worldMetadata = Object.keys(catalogWorldMetadata).length
    ? catalogWorldMetadata
    : getExplicitWorldMetadata(watchData);
  const media = { ...asObject(catalogData.media), ...worldMetadata };
  const source = asObject(catalogData.source);
  const showData = asObject(catalogData.showData);
  const userState = asObject(watchData.userState);
  const type = asString(media.type || catalogData.type || watchData.type);
  const director = pickPrimaryCredit({
    payload: watchData,
    media,
    type,
  });

  return {
    ...watchData,
    ...worldMetadata,
    schemaVersion: 2,
    mediaId: asString(watchData.mediaId || catalogData.mediaId),
    source,
    media,
    showData,
    userState,
    title: asString(media.title || catalogData.title || watchData.title),
    type,
    year: asString(media.year || catalogData.year || watchData.year),
    director,
    poster: asString(media.poster || catalogData.poster || watchData.poster),
    backdrop: asString(
      media.backdrop || catalogData.backdrop || watchData.backdrop,
    ),
    logo: asString(media.logo || catalogData.logo || watchData.logo),
    runtimeMinutes: asNumberOrNull(
      media.runtimeMinutes ??
        catalogData.runtimeMinutes ??
        watchData.runtimeMinutes,
    ),
    genres: asArray(media.genres).length
      ? asArray(media.genres)
      : asArray(catalogData.genres).length
      ? asArray(catalogData.genres)
      : asArray(watchData.genres),
    actors: asArray(media.cast).length
      ? asArray(media.cast)
      : asArray(catalogData.actors).length
      ? asArray(catalogData.actors)
      : asArray(watchData.actors),
    totalSeasons: asNumberOrNull(
      showData.seasonCount ??
        catalogData.totalSeasons ??
        watchData.totalSeasons,
    ),
    totalEpisodes: asNumberOrNull(
      showData.episodeCount ??
        catalogData.totalEpisodes ??
        watchData.totalEpisodes,
    ),
    seasons: asArray(showData.seasons).length
      ? asArray(showData.seasons)
      : asArray(catalogData.seasons).length
      ? asArray(catalogData.seasons)
      : asArray(watchData.seasons),
    collection: normalizeCollection(media.collection),
  };
};

const CATALOG_PATH_ALIASES = {
  title: 'media.title',
  type: 'media.type',
  year: 'media.year',
  runtimeMinutes: 'media.runtimeMinutes',
  poster: 'media.poster',
  backdrop: 'media.backdrop',
  logo: 'media.logo',
  genres: 'media.genres',
  actors: 'media.cast',
  totalSeasons: 'showData.seasonCount',
  totalEpisodes: 'showData.episodeCount',
  seasons: 'showData.seasons',
  collection: 'media.collection',
};

const WATCHLIST_ONLY_KEYS = new Set([
  'status',
  'vibe',
  'energy',
  'note',
  'episodeProgress',
  'userState.status',
  'userState.vibe',
  'userState.energy',
  'userState.note',
  'userState.episodeProgress',
]);

const isCatalogUpdateKey = (key) =>
  key === 'media' ||
  key === 'source' ||
  key === 'showData' ||
  key.startsWith('media.') ||
  key.startsWith('source.') ||
  key.startsWith('showData.') ||
  Object.prototype.hasOwnProperty.call(CATALOG_PATH_ALIASES, key);

export const subscribeWatchlist = ({ db, appId, spaceId, onNext, onError }) => {
  const q = query(
    collection(db, 'artifacts', appId, 'spaces', spaceId, 'watchlist_items'),
  );
  let snapshotGeneration = 0;
  return onSnapshot(
    q,
    (snapshot) => {
      const generation = snapshotGeneration + 1;
      snapshotGeneration = generation;
      Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const watchData = docSnap.data();
          const mediaId = asString(watchData.mediaId || docSnap.id);
          let catalogData = {};
          if (mediaId) {
            try {
              const catalogSnapshot = await getDoc(
                getCatalogDocRef(db, appId, mediaId),
              );
              if (catalogSnapshot.exists()) {
                catalogData = catalogSnapshot.data();
              }
            } catch (err) {
              console.warn('Failed to load catalog data for watchlist item', {
                mediaId,
                err,
              });
            }
          }
          const merged = mergeWatchlistWithCatalog(watchData, catalogData);
          return {
            id: docSnap.id,
            data: () => merged,
          };
        }),
      )
        .then((docs) => {
          if (generation !== snapshotGeneration) return;
          onNext({ docs });
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    onError,
  );
};

export const addWatchlistItem = async ({ db, appId, spaceId, payload }) => {
  const mediaId = deriveMediaId(payload);
  const watchRef = getWatchlistDocRef(db, appId, spaceId, mediaId);
  const mediaRef = getCatalogDocRef(db, appId, mediaId);

  const batch = writeBatch(db);
  batch.set(mediaRef, buildCatalogPayload(payload, mediaId), { merge: true });
  batch.set(watchRef, buildWatchlistPayload(payload, mediaId));
  await batch.commit();
  return watchRef;
};

export const updateWatchlistStatus = async ({
  db,
  appId,
  spaceId,
  itemId,
  status,
}) => {
  const normalizedStatus = normalizeWatchStatus(status);
  return updateWatchlistItem({
    db,
    appId,
    spaceId,
    itemId,
    updates: { status: normalizedStatus },
  });
};

export const updateWatchlistItem = async ({
  db,
  appId,
  spaceId,
  itemId,
  updates,
}) => {
  const watchlistUpdates = {};
  const catalogUpdates = {};
  const entries = Object.entries(updates || {});

  entries.forEach(([key, value]) => {
    if (
      ['worldId', 'worldIds', 'media.worldId', 'media.worldIds'].includes(key)
    ) {
      catalogUpdates['media.worldIds'] = normalizeWorldIds(value);
      return;
    }
    if (key === 'media' && value && typeof value === 'object') {
      catalogUpdates.media = {
        ...value,
        ...getExplicitWorldMetadata({ media: value }),
      };
      delete catalogUpdates.media.worldId;
      return;
    }
    if (WATCHLIST_ONLY_KEYS.has(key)) {
      watchlistUpdates[key] = value;
      return;
    }
    if (isCatalogUpdateKey(key)) {
      catalogUpdates[key] = value;
      return;
    }
    if (Object.prototype.hasOwnProperty.call(CATALOG_PATH_ALIASES, key)) {
      catalogUpdates[key] = value;
      return;
    }
    watchlistUpdates[key] = value;
  });

  Object.entries(catalogUpdates).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(CATALOG_PATH_ALIASES, key)) {
      const mappedPath = CATALOG_PATH_ALIASES[key];
      catalogUpdates[mappedPath] = value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(watchlistUpdates, 'status')) {
    watchlistUpdates.status = normalizeWatchStatus(watchlistUpdates.status);
    watchlistUpdates['userState.status'] = watchlistUpdates.status;
  }
  if (Object.prototype.hasOwnProperty.call(watchlistUpdates, 'vibe')) {
    watchlistUpdates['userState.vibe'] = watchlistUpdates.vibe;
  }
  if (Object.prototype.hasOwnProperty.call(watchlistUpdates, 'energy')) {
    watchlistUpdates['userState.energy'] = watchlistUpdates.energy;
  }
  if (Object.prototype.hasOwnProperty.call(watchlistUpdates, 'note')) {
    watchlistUpdates['userState.note'] = watchlistUpdates.note;
  }
  if (
    Object.prototype.hasOwnProperty.call(watchlistUpdates, 'episodeProgress')
  ) {
    watchlistUpdates['userState.episodeProgress'] =
      watchlistUpdates.episodeProgress;
  }
  if (Object.keys(watchlistUpdates).length > 0) {
    watchlistUpdates.updatedAt = serverTimestamp();
  }

  if (Object.keys(catalogUpdates).length > 0) {
    catalogUpdates.updatedAt = serverTimestamp();
  }

  const requestedStatus = watchlistUpdates['userState.status'];
  if (requestedStatus !== undefined) {
    const watchRef = getWatchlistDocRef(db, appId, spaceId, itemId);
    // Read the current shared record atomically: repeated writes by two members
    // must not manufacture another watch event.
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(watchRef);
      const current = snapshot.data() || {};
      const previous = current.userState?.status || current.status;
      if ((current.type || '') === 'movie' && previous !== requestedStatus) {
        watchlistUpdates['userState.markedWatchedAt'] =
          requestedStatus === 'watched' ? serverTimestamp() : null;
      }
      transaction.update(watchRef, watchlistUpdates);
      if (Object.keys(catalogUpdates).length) {
        transaction.set(getCatalogDocRef(db, appId, itemId), catalogUpdates, {
          merge: true,
        });
      }
    });
  }

  if (Object.keys(catalogUpdates).length === 0) {
    if (Object.keys(watchlistUpdates).length === 0) return Promise.resolve();
    return updateDoc(
      getWatchlistDocRef(db, appId, spaceId, itemId),
      watchlistUpdates,
    );
  }

  if (Object.keys(watchlistUpdates).length === 0) {
    const batch = writeBatch(db);
    batch.set(getCatalogDocRef(db, appId, itemId), catalogUpdates, {
      merge: true,
    });
    return batch.commit();
  }

  const batch = writeBatch(db);
  batch.update(
    getWatchlistDocRef(db, appId, spaceId, itemId),
    watchlistUpdates,
  );
  batch.set(getCatalogDocRef(db, appId, itemId), catalogUpdates, {
    merge: true,
  });
  return batch.commit();
};

export const deleteWatchlistItem = async ({ db, appId, spaceId, itemId }) => {
  return deleteDoc(getWatchlistDocRef(db, appId, spaceId, itemId));
};

export const bulkDeleteWatchlistItems = async ({
  db,
  appId,
  spaceId,
  itemIds,
}) => {
  return Promise.all(
    itemIds.map((itemId) =>
      deleteDoc(getWatchlistDocRef(db, appId, spaceId, itemId)),
    ),
  );
};

// Conditional, facet-only enrichment. update() interprets field paths correctly
// and never advances the household activity timestamp or overwrites progress.
export const persistCatalogClassification = async ({
  db,
  appId,
  mediaId,
  classification,
}) => {
  const ref = getCatalogDocRef(db, appId, mediaId);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (!current || canonicalMediaKey(current) !== classification.key) return;
    const existing = current.media?.classification;
    if (existing?.classifiedAt >= classification.classifiedAt) return;
    transaction.update(ref, { 'media.classification': classification });
  });
};
