const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getCollection = (item = {}) => {
  const mediaCollection = asObject(item?.media?.collection);
  const directCollection = asObject(item?.collection);
  const collection = Object.keys(mediaCollection).length
    ? mediaCollection
    : directCollection;
  const providerId = asString(collection.providerId || collection.id);
  const name = asString(collection.name);

  if (!providerId || !name) return null;

  return {
    provider: asString(collection.provider || item?.source?.provider || 'tmdb'),
    providerId,
    name,
    poster: asString(collection.poster),
    backdrop: asString(collection.backdrop),
  };
};

export const getCollectionKey = (item = {}) => {
  if (item?.type !== 'movie') return '';
  const collection = getCollection(item);
  if (!collection) return '';
  return `${collection.provider}:${collection.providerId}`;
};

const sortCollectionItems = (items = []) =>
  [...items].sort((a, b) => {
    const yearDelta = (asNumber(a.year) || 9999) - (asNumber(b.year) || 9999);
    if (yearDelta !== 0) return yearDelta;
    return asString(a.title).localeCompare(asString(b.title));
  });

export const buildCollectionRollups = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const key = getCollectionKey(item);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const rollupsByKey = new Map();
  groups.forEach((groupItems, key) => {
    if (groupItems.length < 2) return;
    const sortedItems = sortCollectionItems(groupItems);
    const first = sortedItems[0];
    const collection = getCollection(first);
    const unwatchedItems = sortedItems.filter(
      (item) => item.status !== 'watched',
    );
    const watchedCount = sortedItems.length - unwatchedItems.length;
    const nextItem = unwatchedItems[0] || sortedItems[sortedItems.length - 1];
    const years = sortedItems
      .map((item) => asNumber(item.year))
      .filter((year) => year !== null);
    const firstYear = years.length ? Math.min(...years) : null;
    const lastYear = years.length ? Math.max(...years) : null;

    rollupsByKey.set(key, {
      id: `collection:${key}`,
      type: 'collection',
      title: collection.name,
      collection,
      items: sortedItems,
      totalCount: sortedItems.length,
      watchedCount,
      nextItem,
      status: watchedCount === sortedItems.length ? 'watched' : 'unwatched',
      vibe: nextItem?.vibe || first?.vibe || '',
      energy: nextItem?.energy || first?.energy || 'balanced',
      poster: collection.poster || first?.poster || '',
      backdrop: collection.backdrop || first?.backdrop || '',
      year:
        firstYear && lastYear
          ? firstYear === lastYear
            ? String(firstYear)
            : `${firstYear}-${lastYear}`
          : '',
    });
  });

  const usedCollectionKeys = new Set();
  return items
    .map((item) => {
      const key = getCollectionKey(item);
      const rollup = rollupsByKey.get(key);
      if (!rollup) return item;
      if (usedCollectionKeys.has(key)) return null;
      usedCollectionKeys.add(key);
      return rollup;
    })
    .filter(Boolean);
};
