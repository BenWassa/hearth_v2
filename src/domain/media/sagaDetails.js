import { COLLECTION_CATALOG } from '../../config/collectionCatalog.js';
import {
  getCollectionIdentity,
  hasFilmFormatMetadata,
  isFeatureFilm,
  isShortOrSpecial,
} from './collectionEligibility.js';

// Pure view-model for the saga page. It merges the household shelf with the
// provider's collection parts and keeps three questions apart: what is owned,
// what the provider lists beyond the shelf, and what is a short or special.
// It never infers franchise completion or an owned next film from provider data.

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

export const stripCollectionSuffix = (title = '') =>
  title.replace(/\s+Collection$/i, '').trim();

const getProviderKey = (item = {}) => {
  const mediaId = asString(item.mediaId || item.media_id);
  const [mediaProvider = '', mediaProviderId = ''] = mediaId.split(':');
  const provider = asString(
    item?.source?.provider ||
      item?.media?.provider ||
      item?.provider ||
      mediaProvider ||
      'tmdb',
  ).toLowerCase();
  const providerId = asString(
    item?.source?.providerId ||
      item?.media?.providerId ||
      item?.providerId ||
      mediaProviderId,
  );
  return provider && providerId ? `${provider}:${providerId}` : '';
};

const getFallbackKey = (item = {}) =>
  `${asString(item.title).toLowerCase()}:${asString(item.year)}`;

export const getItemKey = (item = {}) =>
  getProviderKey(item) || getFallbackKey(item);

// A saga page item: either the owned shelf record (opened as-is) or a
// provider-listed film shaped like a shelf item that is not owned.
const mapDiscoveryItem = (part = {}, watchlistItem = null) => {
  if (watchlistItem) {
    return {
      ...watchlistItem,
      owned: true,
      watchlistItem,
      discoveryItem: part,
    };
  }

  const provider = asString(part.provider) || 'tmdb';
  const providerId = asString(part.providerId);
  const poster = asString(part.poster || part.posterUrl);
  const backdrop = asString(part.backdrop || part.backdropUrl);

  return {
    ...part,
    id: '',
    provider,
    providerId,
    source: {
      provider,
      providerId,
      locale: 'en-US',
    },
    media: {
      ...part,
      provider,
      providerId,
      poster,
      backdrop,
      logo: asString(part.logo || part.logoUrl),
    },
    poster,
    backdrop,
    status: 'unwatched',
    owned: false,
    watchlistItem: null,
    discoveryItem: part,
  };
};

const releaseYear = (item) => {
  const year = Number.parseInt(item?.year, 10);
  return Number.isFinite(year) ? year : Number.POSITIVE_INFINITY;
};

// Release order by year; ties and unknown years keep their incoming order.
const byRelease = (list) =>
  list
    .map((item, index) => ({ item, index, year: releaseYear(item) }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year < b.year ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);

const uniqueByKey = (list) => [
  ...new Map(list.map((item) => [getItemKey(item), item])).values(),
];

const withMovieType = (part) => ({ ...part, type: part.type || 'movie' });

export const buildSagaDetails = ({
  collection,
  householdItems = [],
  providerDetails = null,
}) => {
  const collectionIdentity = getCollectionIdentity(collection || {});
  const relatedShelfItems = householdItems.filter(
    (item) =>
      collectionIdentity && getCollectionIdentity(item) === collectionIdentity,
  );
  const shelfItems = uniqueByKey([
    ...(Array.isArray(collection?.items) ? collection.items : []),
    ...relatedShelfItems,
  ]);
  const ownedFeatures = byRelease(shelfItems.filter(isFeatureFilm));
  const ownedByKey = new Map(
    [...shelfItems, ...householdItems]
      .map((item) => [getItemKey(item), item])
      .filter(([key]) => key),
  );

  const providerParts = Array.isArray(providerDetails?.parts)
    ? providerDetails.parts.map(withMovieType)
    : [];
  const providerFeatures = providerParts.filter(isFeatureFilm);
  const providerFeatureCountKnown =
    providerParts.length > 0 && providerParts.every(hasFilmFormatMetadata);

  const mapParts = (parts) =>
    parts.map((part) =>
      mapDiscoveryItem(part, ownedByKey.get(getItemKey(part))),
    );

  // Shelf films always stay visible, even when the provider omits them or
  // returns them without format metadata. A provider feature that matches any
  // household record is shown as owned too.
  const ownedKeys = new Set(ownedFeatures.map(getItemKey));
  const matchedProviderOwned = providerFeatures.filter((part) => {
    const key = getItemKey(part);
    return !ownedKeys.has(key) && ownedByKey.has(key);
  });
  const ownedDisplay = mapParts(
    byRelease(uniqueByKey([...ownedFeatures, ...matchedProviderOwned])),
  );
  const unownedKeys = new Set();
  const unownedDisplay = mapParts(
    providerFeatures.filter((part) => {
      const key = getItemKey(part);
      if (ownedByKey.has(key) || unownedKeys.has(key)) return false;
      unownedKeys.add(key);
      return true;
    }),
  );
  const shorts = mapParts(
    uniqueByKey([
      ...providerParts.filter(isShortOrSpecial),
      ...shelfItems.filter(isShortOrSpecial),
    ]),
  );
  // Owned shorts lead; provider-only ones follow in release order.
  const shortItems = [
    ...byRelease(shorts.filter((item) => item.owned)),
    ...byRelease(shorts.filter((item) => !item.owned)),
  ];

  const subCollections = Array.isArray(providerDetails?.subCollections)
    ? providerDetails.subCollections
        .map((subCollection) => ({
          ...subCollection,
          parts: mapParts(
            (Array.isArray(subCollection.parts) ? subCollection.parts : [])
              .map(withMovieType)
              .filter(isFeatureFilm),
          ),
        }))
        .filter((subCollection) => subCollection.parts.length > 0)
    : [];
  const subCollectionKeys = new Set(
    subCollections.flatMap((subCollection) =>
      subCollection.parts.map(getItemKey),
    ),
  );
  const ownedOutsideSubCollections = ownedDisplay.filter(
    (item) => !subCollectionKeys.has(getItemKey(item)),
  );
  // Provider features that no sub-collection groups still belong on the page.
  const unownedOutsideSubCollections = unownedDisplay.filter(
    (item) => !subCollectionKeys.has(getItemKey(item)),
  );

  const isAnthology =
    (collection?.eligibility?.sequenceMode ||
      COLLECTION_CATALOG[getCollectionIdentity(collection || {})]
        ?.sequenceMode) === 'anthology';
  const ownedTotalCount = ownedFeatures.length;
  const watchedCount = ownedFeatures.filter(
    (item) => item.status === 'watched',
  ).length;
  const fullTotalCount = providerFeatures.length || ownedTotalCount;
  const isComplete = ownedTotalCount > 0 && watchedCount >= ownedTotalCount;
  const nextItem =
    ownedFeatures.find((item) => item.status !== 'watched') || null;

  let countSuffix = 'on your shelf';
  if (providerFeatures.length)
    countSuffix = providerFeatureCountKnown
      ? 'in the feature saga'
      : 'listed by provider';

  return {
    isAnthology,
    ownedTotalCount,
    watchedCount,
    progressPercentage:
      ownedTotalCount > 0
        ? Math.round((watchedCount / ownedTotalCount) * 100)
        : 0,
    isComplete,
    nextItem: !isAnthology && !isComplete ? nextItem : null,
    ownedDisplay,
    unownedDisplay,
    shortItems,
    subCollections,
    ownedOutsideSubCollections,
    unownedOutsideSubCollections,
    countLabel: `${fullTotalCount} ${
      fullTotalCount === 1 ? 'film' : 'films'
    } ${countSuffix}`,
  };
};
