export const REMOVAL_TTL = 24 * 60 * 60 * 1000;
export const removalMillis = (value) =>
  typeof value?.toMillis === 'function' ? value.toMillis() : Number(value) || 0;
export const isRemoved = (item) =>
  item.removedAt != null || item.removedBy != null;
export const isExpired = (item, now = Date.now()) =>
  isRemoved(item) &&
  item.removedAt != null &&
  now - removalMillis(item.removedAt) >= REMOVAL_TTL;

export const PURGE_TTL = 7 * REMOVAL_TTL;
export const isPurgeable = (item, now = Date.now()) =>
  isRemoved(item) &&
  item.removedAt != null &&
  now - removalMillis(item.removedAt) >= PURGE_TTL;
export const clearedRemovalMarkers = {
  removedAt: null,
  removedBy: null,
  removedItem: null,
};

export const perTitle = (ids, action) =>
  Promise.all(
    ids.map(async (itemId) => {
      try {
        return { itemId, status: await action(itemId) };
      } catch (error) {
        return { itemId, status: 'failed', error };
      }
    }),
  );
