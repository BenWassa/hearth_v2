import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { buildMediaId } from '../../domain/media/schema.js';

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const asNumberOrNull = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
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
  const poster = asString(media.poster || payload.poster);
  const backdrop = asString(media.backdrop || payload.backdrop);

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
      type,
      title,
      originalTitle: asString(media.originalTitle),
      year,
      runtimeMinutes,
      overview: asString(media.overview),
      poster,
      backdrop,
      genres,
      cast,
      creators: asArray(media.creators),
      directors: asArray(media.directors),
      language: asString(media.language),
      country: asArray(media.country),
      rating:
        typeof media.rating === 'number' && Number.isFinite(media.rating)
          ? media.rating
          : null,
      providerUpdatedAt: asString(media.providerUpdatedAt),
    },
    showData: {
      seasonCount,
      seasons,
    },
    title,
    type,
    year,
    runtimeMinutes,
    genres,
    actors: cast,
    poster,
    backdrop,
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
  const status = asString(userState.status || payload.status || 'unwatched');
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
    status,
    vibe,
    energy,
    note,
    episodeProgress,
    userState: {
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
  const media = asObject(catalogData.media);
  const source = asObject(catalogData.source);
  const showData = asObject(catalogData.showData);
  const userState = asObject(watchData.userState);

  return {
    ...watchData,
    schemaVersion: 2,
    mediaId: asString(watchData.mediaId || catalogData.mediaId),
    source,
    media,
    showData,
    userState,
    title: asString(media.title || catalogData.title || watchData.title),
    type: asString(media.type || catalogData.type || watchData.type),
    year: asString(media.year || catalogData.year || watchData.year),
    poster: asString(media.poster || catalogData.poster || watchData.poster),
    backdrop: asString(
      media.backdrop || catalogData.backdrop || watchData.backdrop,
    ),
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
    seasons: asArray(showData.seasons).length
      ? asArray(showData.seasons)
      : asArray(catalogData.seasons).length
      ? asArray(catalogData.seasons)
      : asArray(watchData.seasons),
  };
};

const CATALOG_PATH_ALIASES = {
  title: 'media.title',
  type: 'media.type',
  year: 'media.year',
  runtimeMinutes: 'media.runtimeMinutes',
  poster: 'media.poster',
  backdrop: 'media.backdrop',
  genres: 'media.genres',
  actors: 'media.cast',
  totalSeasons: 'showData.seasonCount',
  seasons: 'showData.seasons',
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
  return onSnapshot(
    q,
    (snapshot) => {
      Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const watchData = docSnap.data();
          const mediaId = asString(watchData.mediaId || docSnap.id);
          let catalogData = {};
          if (mediaId) {
            const catalogSnapshot = await getDoc(
              getCatalogDocRef(db, appId, mediaId),
            );
            if (catalogSnapshot.exists()) {
              catalogData = catalogSnapshot.data();
            }
          }
          const merged = mergeWatchlistWithCatalog(watchData, catalogData);
          return {
            id: docSnap.id,
            data: () => merged,
          };
        }),
      )
        .then((docs) => onNext({ docs }))
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
  batch.set(watchRef, buildWatchlistPayload(payload, mediaId), { merge: true });
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
  return updateDoc(getWatchlistDocRef(db, appId, spaceId, itemId), {
    status,
    'userState.status': status,
    updatedAt: serverTimestamp(),
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
