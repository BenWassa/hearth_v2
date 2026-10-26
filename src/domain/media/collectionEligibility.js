import { COLLECTION_CATALOG } from '../../config/collectionCatalog.js';

const asText = (value) => (value == null ? '' : String(value).trim());
const getCollection = (value = {}) =>
  value.media?.collection || value.collection || {};

export const getCollectionIdentity = (value = {}) => {
  const collection = getCollection(value);
  const providerId = asText(collection.providerId ?? collection.id);
  if (!providerId) return '';
  const provider = asText(
    collection.provider || value.source?.provider || 'tmdb',
  ).toLowerCase();
  return `${provider}:${providerId}`;
};

// Whether a provider part can safely contribute to a verified feature total.
// Unknown runtime/kind remains a browsable movie, not verified format evidence.
export const hasFilmFormatMetadata = (item = {}) => {
  const type = item.type || item.media?.type;
  if (type && type !== 'movie') return false;
  const runtime = Number(
    item.runtimeMinutes ?? item.media?.runtimeMinutes ?? item.runtime,
  );
  const kind = asText(
    item.contentKind ||
      item.kind ||
      item.format ||
      item.media?.contentKind ||
      item.media?.kind ||
      item.media?.format,
  ).toLowerCase();
  return (
    (Number.isFinite(runtime) && runtime > 0) ||
    [
      'feature',
      'feature-film',
      'feature_film',
      'short',
      'short-film',
      'short_film',
      'special',
      'compilation',
    ].includes(kind) ||
    item.isShort === true ||
    item.isSpecial === true ||
    item.media?.isShort === true ||
    item.media?.isSpecial === true
  );
};

// Missing runtime is not evidence of a short. Explicit type wins over runtime;
// <=40 minutes is a conservative short heuristic, never a title-name guess.
export const isShortOrSpecial = (item = {}) => {
  if ((item.type || item.media?.type) !== 'movie') return false;
  const kind = asText(
    item.contentKind ||
      item.kind ||
      item.format ||
      item.media?.contentKind ||
      item.media?.kind ||
      item.media?.format,
  ).toLowerCase();
  if (
    item.isShort === true ||
    item.isSpecial === true ||
    item.media?.isShort === true ||
    item.media?.isSpecial === true
  )
    return true;
  if (
    ['short', 'special', 'compilation', 'short-film', 'short_film'].includes(
      kind,
    )
  )
    return true;
  if (['feature', 'feature-film', 'feature_film'].includes(kind)) return false;
  const runtime = Number(
    item.runtimeMinutes ?? item.media?.runtimeMinutes ?? item.runtime,
  );
  return runtime > 0 && runtime <= 40;
};

export const isFeatureFilm = (item = {}) =>
  (item.type || item.media?.type) === 'movie' && !isShortOrSpecial(item);

export const getShelfItemIdentity = (item = {}) => {
  const providerId = asText(
    item.source?.providerId || item.media?.providerId || item.providerId,
  );
  const provider = asText(
    item.source?.provider || item.media?.provider || item.provider || 'tmdb',
  );
  const type = item.type || item.media?.type || 'movie';
  return providerId
    ? `${provider}:${type}:${providerId}`
    : asText(item.mediaId || item.id);
};

export const distinctShelfItems = (items = []) => {
  const seen = new Set();
  const seenObjects = new Set();
  return items.filter((item) => {
    if (!item || typeof item !== 'object' || item.owned === false) return false;
    const key = getShelfItemIdentity(item);
    if ((key && seen.has(key)) || (!key && seenObjects.has(item))) return false;
    if (key) seen.add(key);
    else seenObjects.add(item);
    return true;
  });
};

// Shared preference absence is distinct from an explicit Hide. Supports persisted
// 'show'/'hide' values and booleans at the pure boundary, never truthy coercion.
export const getCollectionPreference = (preferences, identity) => {
  const value =
    preferences instanceof Map
      ? preferences.get(identity)
      : preferences?.[identity];
  const preference =
    value && typeof value === 'object' ? value.visibility : value;
  if (preference === true || preference === 'show') return 'show';
  if (preference === false || preference === 'hide') return 'hide';
  return 'default';
};

export const classifyCollection = (saga = {}, preferences = {}) => {
  const identity = getCollectionIdentity(saga);
  const editorial = COLLECTION_CATALOG[identity] || null;
  const preference = getCollectionPreference(preferences, identity);
  const owned = distinctShelfItems(Array.isArray(saga.items) ? saga.items : []);
  const features = owned.filter(isFeatureFilm);
  const base = {
    identity,
    preference,
    editorial,
    sequenceMode: editorial?.sequenceMode || 'linear',
    ownedFeatureCount: features.length,
    ownedFeatureWatchedCount: features.filter(
      (item) => item.status === 'watched',
    ).length,
    shortCount: owned.filter(isShortOrSpecial).length,
  };
  if (!identity)
    return { ...base, eligible: false, reason: 'metadata_unavailable' };
  if (preference === 'hide')
    return { ...base, eligible: false, reason: 'household_hidden' };
  if (!features.length)
    return {
      ...base,
      eligible: false,
      reason: base.shortCount ? 'short_only' : 'metadata_unavailable',
    };
  if (preference === 'show')
    return { ...base, eligible: true, reason: 'household_shown' };
  if (editorial?.defaultVisible)
    return { ...base, eligible: true, reason: 'editorial_default' };
  return {
    ...base,
    eligible: false,
    reason: editorial ? 'editorial_hidden' : 'not_curated',
  };
};

export const filterEligibleCollections = (sagas = [], preferences = {}) =>
  sagas
    .map((saga) => ({
      ...saga,
      eligibility: classifyCollection(saga, preferences),
    }))
    .filter((saga) => saga.eligibility.eligible);
