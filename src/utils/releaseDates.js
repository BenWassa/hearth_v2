export const toLocalDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      0,
      0,
      0,
      0,
    );
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

export const startOfLocalDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const isUpcomingDate = (airDate, now = new Date()) => {
  const releaseDate = toLocalDate(airDate);
  if (!releaseDate) return false;
  return startOfLocalDay(releaseDate) >= startOfLocalDay(now);
};

export const formatReleaseDate = (airDate, now = new Date()) => {
  const releaseDate = toLocalDate(airDate);
  if (!releaseDate) return '';
  const today = startOfLocalDay(now);
  const releaseDay = startOfLocalDay(releaseDate);
  if (releaseDay === today) return 'Releases today';
  return `Releases ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(releaseDate)}`;
};
