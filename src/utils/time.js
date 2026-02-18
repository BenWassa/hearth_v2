export const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : 0;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value.toMillis === 'function') {
    const millis = value.toMillis();
    return Number.isFinite(millis) ? millis : 0;
  }
  if (typeof value === 'object') {
    const seconds = Number(value.seconds);
    if (Number.isFinite(seconds)) {
      const nanos = Number(value.nanoseconds || 0);
      const millis = seconds * 1000 + Math.floor(nanos / 1e6);
      return Number.isFinite(millis) ? millis : 0;
    }
  }
  return 0;
};
