import { toMillis } from '../../utils/time.js';

const DAY = 86400000;
export const sagaName = (title = '') =>
  title.replace(/\s+collection$/i, '').trim();
const nameOrder = (a, b) =>
  sagaName(a.title).localeCompare(sagaName(b.title), 'en') ||
  a.id.localeCompare(b.id);

// Only explicit household intent contributes. Unknown historical dates stay unknown.
export const getSagaActivity = (saga, now, providerTotal = null) => {
  const validTime = (value) => {
    const time = toMillis(value);
    return time > 0 && time <= now ? time : 0;
  };
  let lastManualAddAt = 0;
  let lastMarkedWatchedAt = 0;
  let recentIntentionalAddCount = 0;
  const seen = new Set();
  const items = (saga.items || []).filter((item) => {
    const key = item.mediaId || item.id;
    if (key && seen.has(key)) return false;
    if (key) seen.add(key);
    return true;
  });
  for (const item of items) {
    const added =
      item.additionOrigin === 'manual' ? validTime(item.createdAt) : 0;
    const watched =
      item.status === 'watched'
        ? validTime(item.userState?.markedWatchedAt ?? item.markedWatchedAt)
        : 0;
    lastManualAddAt = Math.max(lastManualAddAt, added);
    lastMarkedWatchedAt = Math.max(lastMarkedWatchedAt, watched);
    if (added && now - added <= 7 * DAY) recentIntentionalAddCount++;
  }
  const ownedWatched = items.filter((item) => item.status === 'watched').length;
  const ownedUnwatched = items.length - ownedWatched;
  const hasKnownUnownedPart = Number(providerTotal) > items.length;
  const watchAge = lastMarkedWatchedAt
    ? (now - lastMarkedWatchedAt) / DAY
    : Infinity;
  const addAge = lastManualAddAt ? (now - lastManualAddAt) / DAY : Infinity;
  const actionable = ownedUnwatched > 0;
  // A priority ladder keeps an available next film ahead of exploration.
  const tier =
    actionable && watchAge <= 30
      ? 4
      : actionable && addAge <= 14
      ? 3
      : hasKnownUnownedPart && watchAge <= 7
      ? 2
      : actionable && ownedWatched > 0 && watchAge <= 60
      ? 1
      : 0;
  const score =
    8 * 2 ** (-watchAge / 10) +
    5 * 2 ** (-addAge / 7) +
    Math.min(2, Math.max(0, recentIntentionalAddCount - 1));
  const reason =
    lastMarkedWatchedAt && watchAge <= 30
      ? 'Watched recently'
      : recentIntentionalAddCount
      ? `${recentIntentionalAddCount} ${
          recentIntentionalAddCount === 1 ? 'film added' : 'films added'
        } this week`
      : tier
      ? 'Continue your saga'
      : '';
  return {
    ownedTotal: items.length,
    ownedWatched,
    ownedUnwatched,
    providerTotalKnown: providerTotal,
    lastManualAddAt,
    lastMarkedWatchedAt,
    recentIntentionalAddCount,
    lastActivityAt: Math.max(lastManualAddAt, lastMarkedWatchedAt),
    nextOwnedUnwatched: items.find((item) => item.status !== 'watched') || null,
    hasKnownUnownedPart,
    tier,
    score,
    reason,
  };
};

export const rankSagas = (sagas, { now, counts = new Map() }) =>
  sagas
    .map((saga) => ({
      ...saga,
      activity: getSagaActivity(saga, now, counts.get(saga.id)),
    }))
    .sort(
      (a, b) =>
        b.activity.lastActivityAt - a.activity.lastActivityAt ||
        nameOrder(a, b),
    );

export const selectTonightSagas = (sagas, options) =>
  rankSagas(sagas, options)
    .filter((saga) => saga.activity.tier > 0)
    .sort(
      (a, b) =>
        b.activity.tier - a.activity.tier ||
        b.activity.score - a.activity.score ||
        nameOrder(a, b),
    )
    .slice(0, 2);

// Keep positions stable during a visit while still reflecting live counts and removals.
export const preserveSagaOrder = (sagas, ids) => {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return [...sagas].sort(
    (a, b) =>
      (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity) ||
      nameOrder(a, b),
  );
};
