const VALID_WATCH_STATUSES = new Set(['unwatched', 'watching', 'watched']);

export const normalizeWatchStatus = (value, fallback = 'unwatched') => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_WATCH_STATUSES.has(normalized)) return normalized;
  return fallback;
};

export const isValidWatchStatus = (value) => {
  if (typeof value !== 'string') return false;
  return VALID_WATCH_STATUSES.has(value.trim().toLowerCase());
};

export const WATCH_STATUSES = Object.freeze({
  UNWATCHED: 'unwatched',
  WATCHING: 'watching',
  WATCHED: 'watched',
});
