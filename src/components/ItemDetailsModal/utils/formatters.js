/**
 * Formatting utilities for ItemDetailsModal
 */

export const formatRuntime = (runtimeMinutes) => {
  if (!Number.isFinite(runtimeMinutes) || runtimeMinutes <= 0) return '';
  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = runtimeMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

const getTimeFormatter = () =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatFinishTime = ({ runtimeMinutes, startedAt }) => {
  if (!Number.isFinite(runtimeMinutes) || runtimeMinutes <= 0) return '';
  const formatter = getTimeFormatter();
  const startedAtDate = startedAt ? new Date(startedAt) : null;
  const baseTime =
    startedAtDate && !Number.isNaN(startedAtDate.valueOf())
      ? startedAtDate
      : new Date();
  const finishMs = baseTime.getTime() + runtimeMinutes * 60 * 1000;
  const roundedMs = Math.round(finishMs / 60000) * 60000;
  return formatter.format(new Date(roundedMs));
};

export const formatStartTime = (startedAt) => {
  if (!startedAt) return '';
  const startedAtDate = new Date(startedAt);
  if (Number.isNaN(startedAtDate.valueOf())) return '';
  return getTimeFormatter().format(startedAtDate);
};
