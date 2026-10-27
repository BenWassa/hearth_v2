// Uses manual createdAt/addedAt and markedWatchedAt; episodeProgress is boolean-only.
const DAY = 24 * 60 * 60 * 1000;
const HALF_LIFE_DAYS = 10;
const MAX_SIGNAL_SCORE = 5;

const toMillis = (value) => {
  if (value && typeof value.toDate === 'function') {
    try {
      return toMillis(value.toDate());
    } catch {
      return null;
    }
  }
  if (value && typeof value === 'object' && Number.isFinite(value.seconds)) {
    return value.seconds * 1000;
  }
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
  }
  return null;
};

const recentSignal = (timestamp, now) => {
  const time = toMillis(timestamp);
  if (time === null || time > now) return 0;
  const ageDays = (now - time) / DAY;
  return Math.min(MAX_SIGNAL_SCORE, 2 ** (-ageDays / HALF_LIFE_DAYS));
};

export const activityScore = (item, { now = new Date() } = {}) => {
  if (!item || typeof item !== 'object') return 0;
  const nowTime = toMillis(now);
  if (nowTime === null) return 0;

  const userState = item.userState || {};
  const isWatched = userState.status === 'watched' || item.status === 'watched';
  const watchTimestamp = isWatched
    ? userState.markedWatchedAt ?? item.markedWatchedAt
    : null;
  const isManualAdd = item.additionOrigin !== 'import';
  const addTimestamp = isManualAdd ? item.createdAt ?? item.addedAt : null;

  return (
    recentSignal(watchTimestamp, nowTime) + recentSignal(addTimestamp, nowTime)
  );
};
