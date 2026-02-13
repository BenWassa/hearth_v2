const VALID_TYPES = ['movie', 'show'];

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

      if (
        [
          'title',
          'type',
          'vibe',
          'energy',
          'note',
          'poster',
          'year',
          'director',
          'actors',
          'cast',
          'genres',
          'backdrop',
        ].includes(header)
      ) {
        if (header === 'cast') {
          row.actors = values[index] || '';
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
  const source =
    raw?.source && typeof raw.source === 'object' && !Array.isArray(raw.source)
      ? raw.source
      : null;
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
    title: normalizeText(raw?.title),
    type: normalizeEnum(raw?.type, typeAliases),
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
