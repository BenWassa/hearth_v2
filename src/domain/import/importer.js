const VALID_TYPES = ['movie', 'show'];
const PLACEHOLDER_ID_TOKENS = new Set([
  'na',
  'n/a',
  'none',
  'null',
  'undefined',
  'unknown',
  'tbd',
  'id',
  '-',
  '--',
  '0',
]);
const PLACEHOLDER_PROVIDER_TOKENS = new Set([
  'na',
  'n/a',
  'none',
  'null',
  'undefined',
  'unknown',
]);
const WATCHED_FLAG_HEADERS = new Set([
  'watched',
  'seen',
  'iswatched',
  'is_watched',
  'is-watched',
  'is watched',
  'isseen',
  'is_seen',
  'is-seen',
  'is seen',
  'completed',
  'iscompleted',
  'is_completed',
  'is-completed',
  'is completed',
  'done',
  'watcheddate',
  'watched_date',
  'watched-date',
  'watched date',
  'lastwatched',
  'last_watched',
  'last-watched',
  'last watched',
]);
const STATUS_HEADERS = new Set([
  'status',
  'watchstatus',
  'watch_status',
  'watch-status',
  'watch status',
  'watchedornot',
  'watched_or_not',
  'watched-or-not',
  'watched or not',
]);

const normalizeToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const normalizeEnum = (value, aliases = {}) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  return aliases[trimmed] || trimmed;
};

const normalizeText = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim();
};

const normalizeTextOrNumber = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`.trim();
  }
  if (typeof value === 'string') return value.trim();
  return '';
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  const status = normalizeStatus(normalized);
  if (status === 'watched') return true;
  if (status === 'unwatched') return false;
  return null;
};

const hasMeaningfulToken = (value, placeholders = PLACEHOLDER_ID_TOKENS) => {
  const token = normalizeToken(value);
  if (!token) return false;
  return !placeholders.has(token);
};

export const hasUsableProviderIdentity = ({
  provider = '',
  providerId = '',
} = {}) => {
  const providerToken = normalizeToken(provider);
  const providerIdToken = normalizeToken(providerId);

  if (!providerToken || PLACEHOLDER_PROVIDER_TOKENS.has(providerToken)) {
    return false;
  }
  if (!hasMeaningfulToken(providerIdToken, PLACEHOLDER_ID_TOKENS)) {
    return false;
  }

  if (providerToken === 'tmdb') {
    return /^\d+$/.test(providerIdToken) && providerIdToken !== '0';
  }

  return true;
};

const normalizeStatus = (value) => {
  if (!value || typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (
    ['watched', 'seen', 'complete', 'completed', 'done', 'finished'].includes(
      normalized,
    )
  ) {
    return 'watched';
  }
  if (
    [
      'unwatched',
      'not watched',
      'not seen',
      'unseen',
      'todo',
      'to-watch',
      'to watch',
      'queued',
    ].includes(normalized)
  ) {
    return 'unwatched';
  }
  return '';
};

const normalizeWatchedHint = (value) => {
  const normalizedBoolean = normalizeBoolean(value);
  if (normalizedBoolean !== null) return normalizedBoolean;

  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (
    ['na', 'n/a', 'none', 'null', 'undefined', 'unknown', '-', '--'].includes(
      normalized,
    )
  ) {
    return null;
  }
  if (
    ['never', 'not yet', 'not watched yet', 'unwatched'].includes(normalized)
  ) {
    return false;
  }
  const status = normalizeStatus(normalized);
  if (status === 'watched') return true;
  if (status === 'unwatched') return false;

  const parsedDate = Date.parse(normalized);
  if (Number.isFinite(parsedDate)) return true;

  return null;
};

const normalizeStatusFromAliases = (raw = {}) => {
  const statusHints = [
    raw?.status,
    raw?.watchStatus,
    raw?.watch_status,
    raw?.['watch-status'],
    raw?.['watch status'],
    raw?.watchedOrNot,
    raw?.watched_or_not,
    raw?.['watched-or-not'],
    raw?.['watched or not'],
    raw?.userState?.status,
    raw?.userState?.watchStatus,
    raw?.userState?.watch_status,
    raw?.userState?.['watch-status'],
    raw?.userState?.['watch status'],
    raw?.userState?.watchedOrNot,
    raw?.userState?.watched_or_not,
    raw?.userState?.['watched-or-not'],
    raw?.userState?.['watched or not'],
  ];

  for (const hint of statusHints) {
    const normalizedStatus = normalizeStatus(
      typeof hint === 'string' ? hint : '',
    );
    if (normalizedStatus) return normalizedStatus;

    const normalizedBoolean = normalizeBoolean(hint);
    if (normalizedBoolean === true) return 'watched';
    if (normalizedBoolean === false) return 'unwatched';
  }

  return '';
};

const normalizeStatusFromFlags = (raw = {}) => {
  const watchedHints = [
    raw?.watched,
    raw?.watchedOrNot,
    raw?.watched_or_not,
    raw?.['watched-or-not'],
    raw?.['watched or not'],
    raw?.seen,
    raw?.isWatched,
    raw?.is_watched,
    raw?.['is-watched'],
    raw?.isSeen,
    raw?.is_seen,
    raw?.['is-seen'],
    raw?.completed,
    raw?.isCompleted,
    raw?.is_completed,
    raw?.['is-completed'],
    raw?.done,
    raw?.watchStatus,
    raw?.watch_status,
    raw?.['watch-status'],
    raw?.['watch status'],
    raw?.watchedDate,
    raw?.watched_date,
    raw?.['watched-date'],
    raw?.['watched date'],
    raw?.lastWatched,
    raw?.last_watched,
    raw?.['last-watched'],
    raw?.['last watched'],
    raw?.userState?.watched,
    raw?.userState?.watchedOrNot,
    raw?.userState?.watched_or_not,
    raw?.userState?.['watched-or-not'],
    raw?.userState?.['watched or not'],
    raw?.userState?.seen,
    raw?.userState?.isWatched,
    raw?.userState?.is_watched,
    raw?.userState?.['is-watched'],
    raw?.userState?.completed,
    raw?.userState?.isCompleted,
    raw?.userState?.is_completed,
    raw?.userState?.['is-completed'],
    raw?.userState?.watchStatus,
    raw?.userState?.watch_status,
    raw?.userState?.['watch-status'],
    raw?.userState?.['watch status'],
    raw?.userState?.watchedDate,
    raw?.userState?.watched_date,
    raw?.userState?.['watched-date'],
    raw?.userState?.['watched date'],
    raw?.userState?.lastWatched,
    raw?.userState?.last_watched,
    raw?.userState?.['last-watched'],
    raw?.userState?.['last watched'],
  ];

  for (const hint of watchedHints) {
    const normalized = normalizeWatchedHint(hint);
    if (normalized === true) return 'watched';
    if (normalized === false) return 'unwatched';
  }

  return '';
};

const parseProviderIdentityFromMediaId = (value) => {
  const normalized = normalizeTextOrNumber(value);
  if (!normalized) return null;

  const [providerRaw = '', providerIdRaw = ''] = normalized.split(':');
  const provider = normalizeText(providerRaw).toLowerCase();
  const providerId = normalizeText(providerIdRaw);
  if (!hasUsableProviderIdentity({ provider, providerId })) return null;
  return { provider, providerId };
};

const normalizeRuntimeMinutes = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : '';
  }
  return '';
};

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => `${entry}`.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const parseCsv = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      items: [],
      error: 'CSV must include headers and at least one row.',
    };
  }

  const headerLine = parseCsvLine(lines[0]);
  const headers = headerLine.map((h) => h.toLowerCase());

  if (!headers.includes('title')) {
    return { items: [], error: 'CSV header must include "title".' };
  }

  const items = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      if (header === 'runtimeminutes' || header === 'runtime') {
        row.runtimeMinutes = values[index] || '';
        return;
      }
      if (WATCHED_FLAG_HEADERS.has(header)) {
        row.watched = values[index] || '';
        return;
      }

      if (
        [
          'title',
          'type',
          'vibe',
          'energy',
          'status',
          'note',
          'poster',
          'year',
          'director',
          'actors',
          'cast',
          'genres',
          'backdrop',
          'provider',
          'providerid',
          'tmdbid',
          'tmdb_id',
          'mediaid',
          ...STATUS_HEADERS,
        ].includes(header)
      ) {
        if (header === 'cast') {
          row.actors = values[index] || '';
          return;
        }
        if (header === 'providerid') {
          row.providerId = values[index] || '';
          return;
        }
        if (header === 'tmdbid') {
          row.tmdbId = values[index] || '';
          return;
        }
        if (header === 'mediaid') {
          row.mediaId = values[index] || '';
          return;
        }
        if (STATUS_HEADERS.has(header)) {
          row.status = values[index] || '';
          return;
        }
        row[header] = values[index] || '';
      }
    });
    return row;
  });

  return { items, error: '' };
};

const normalizeSmartQuotes = (text) =>
  text
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

export const parseText = (text) => {
  const normalized = normalizeSmartQuotes(text || '');
  const trimmed = normalized.trim();
  if (!trimmed) {
    return { items: [], error: 'Paste JSON or CSV to preview.' };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.items)
      ? parsed.items
      : null;

    if (!items) {
      return { items: [], error: 'JSON must be an array of items.' };
    }

    return { items, error: '', format: 'json' };
  } catch (err) {
    const { items, error } = parseCsv(trimmed);
    if (error) {
      return { items: [], error: 'Could not parse JSON or CSV.' };
    }
    return { items, error: '', format: 'csv' };
  }
};

export const normalizeItem = (raw) => {
  const typeAliases = { film: 'movie', tv: 'show', series: 'show' };
  const rawSource =
    raw?.source && typeof raw.source === 'object' && !Array.isArray(raw.source)
      ? { ...raw.source }
      : {};
  const sourceProvider = normalizeText(
    raw?.provider ?? raw?.source?.provider ?? rawSource.provider,
  );
  const sourceProviderId = normalizeTextOrNumber(
    raw?.providerId ??
      raw?.tmdbId ??
      raw?.tmdb_id ??
      raw?.source?.providerId ??
      rawSource.providerId,
  );
  if (sourceProvider) rawSource.provider = sourceProvider;
  if (sourceProviderId) {
    rawSource.providerId = sourceProviderId;
    if (!rawSource.provider) rawSource.provider = 'tmdb';
  }
  const mediaId = normalizeTextOrNumber(raw?.mediaId ?? raw?.media_id);
  const mediaIdentity = parseProviderIdentityFromMediaId(mediaId);
  if (!rawSource.provider && mediaIdentity?.provider) {
    rawSource.provider = mediaIdentity.provider;
  }
  if (!rawSource.providerId && mediaIdentity?.providerId) {
    rawSource.providerId = mediaIdentity.providerId;
  }
  const source = Object.keys(rawSource).length > 0 ? rawSource : null;
  const media =
    raw?.media && typeof raw.media === 'object' && !Array.isArray(raw.media)
      ? raw.media
      : null;
  const showData =
    raw?.showData &&
    typeof raw.showData === 'object' &&
    !Array.isArray(raw.showData)
      ? raw.showData
      : null;
  const userState =
    raw?.userState &&
    typeof raw.userState === 'object' &&
    !Array.isArray(raw.userState)
      ? raw.userState
      : null;

  return {
    schemaVersion:
      Number.isFinite(raw?.schemaVersion) && raw.schemaVersion > 0
        ? raw.schemaVersion
        : '',
    mediaId,
    title: normalizeText(raw?.title),
    type: normalizeEnum(raw?.type, typeAliases),
    status:
      normalizeStatusFromAliases(raw) || normalizeStatusFromFlags(raw) || '',
    vibe: normalizeEnum(raw?.vibe),
    energy: normalizeEnum(raw?.energy),
    note: normalizeText(raw?.note),
    poster: normalizeText(raw?.poster),
    backdrop: normalizeText(raw?.backdrop ?? raw?.backdrop_path),
    year: normalizeTextOrNumber(raw?.year),
    director: normalizeText(raw?.director),
    genres: normalizeList(raw?.genres),
    actors: normalizeList(raw?.actors ?? raw?.cast),
    runtimeMinutes: normalizeRuntimeMinutes(
      raw?.runtimeMinutes ?? raw?.runtime,
    ),
    totalSeasons: raw?.totalSeasons ?? raw?.seasonCount ?? '',
    seasons: Array.isArray(raw?.seasons) ? raw.seasons : [],
    episodeProgress:
      raw?.episodeProgress && typeof raw.episodeProgress === 'object'
        ? raw.episodeProgress
        : null,
    source,
    media,
    showData,
    userState,
  };
};

export const resolveDefaults = (item, defaults = {}) => ({
  ...item,
  vibe: item.vibe || defaults.vibe,
  energy: item.energy || defaults.energy,
});

export const validateItem = (
  item,
  { validVibes, validEnergies, allowMissing = false } = {},
) => {
  const errors = [];
  const missing = [];

  if (!item.title) {
    errors.push({ field: 'title', message: 'Title is required.' });
  }

  if (!item.type) {
    errors.push({ field: 'type', message: 'Type is required.' });
  } else if (!VALID_TYPES.includes(item.type)) {
    errors.push({ field: 'type', message: 'Type must be movie or show.' });
  }

  if (!item.vibe) {
    missing.push('vibe');
  } else if (validVibes && !validVibes.includes(item.vibe)) {
    errors.push({
      field: 'vibe',
      message: 'Vibe must be one of the listed options.',
    });
  }

  if (!item.energy) {
    missing.push('energy');
  } else if (validEnergies && !validEnergies.includes(item.energy)) {
    errors.push({
      field: 'energy',
      message: 'Energy must be one of the listed options.',
    });
  }

  const isValid = errors.length === 0 && (allowMissing || missing.length === 0);

  return { errors, missing, isValid };
};

export const commitImport = async (items, writeItem) => {
  const results = [];
  for (const item of items) {
    // Sequential to keep error handling predictable.
    results.push(await writeItem(item));
  }
  return results;
};

export const buildImportDedupeKey = (item = {}) => {
  const sourceProvider = normalizeToken(item?.source?.provider);
  const sourceProviderId = normalizeToken(item?.source?.providerId);
  if (
    hasUsableProviderIdentity({
      provider: sourceProvider,
      providerId: sourceProviderId,
    })
  ) {
    return `provider:${sourceProvider}:${sourceProviderId}`;
  }
  const mediaIdentity = parseProviderIdentityFromMediaId(item?.mediaId);
  if (mediaIdentity?.provider && mediaIdentity?.providerId) {
    return `provider:${normalizeToken(mediaIdentity.provider)}:${normalizeToken(
      mediaIdentity.providerId,
    )}`;
  }

  const title = normalizeToken(item?.title);
  if (!title) return '';

  const type = normalizeToken(item?.type) === 'show' ? 'show' : 'movie';
  const year = normalizeToken(item?.year) || 'na';
  return `title:${title}:${type}:${year}`;
};
