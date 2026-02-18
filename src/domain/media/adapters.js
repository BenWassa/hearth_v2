import { WATCHLIST_SCHEMA_VERSION } from './schema.js';
import { normalizeWatchStatus } from './status.js';

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asString = (value) => (typeof value === 'string' ? value : '');

const pickPrimaryCredit = ({ rawItem = {}, media = {}, type = '' }) => {
  const direct = asString(rawItem.director).trim();
  if (direct) return direct;

  const mediaDirectors = asArray(media.directors)
    .map((value) => asString(value).trim())
    .find(Boolean);
  if (mediaDirectors) return mediaDirectors;

  if (type === 'show') {
    const mediaCreators = asArray(media.creators)
      .map((value) => asString(value).trim())
      .find(Boolean);
    if (mediaCreators) return mediaCreators;
  }

  return '';
};

export const adaptWatchlistItem = (rawItem = {}) => {
  if (rawItem?.schemaVersion !== WATCHLIST_SCHEMA_VERSION) return rawItem;

  const source = asObject(rawItem.source);
  const media = asObject(rawItem.media);
  const showData = asObject(rawItem.showData);
  const userState = asObject(rawItem.userState);
  const type = asString(media.type) || asString(rawItem.type);

  return {
    ...rawItem,
    source,
    media,
    showData,
    userState,
    status: normalizeWatchStatus(
      asString(userState.status) || asString(rawItem.status),
    ),
    title: asString(media.title) || asString(rawItem.title),
    type,
    vibe: asString(userState.vibe) || asString(rawItem.vibe),
    energy: asString(userState.energy) || asString(rawItem.energy),
    note: asString(userState.note) || asString(rawItem.note),
    director: pickPrimaryCredit({ rawItem, media, type }),
    poster: asString(media.poster) || asString(rawItem.poster),
    backdrop: asString(media.backdrop) || asString(rawItem.backdrop),
    year: media.year || rawItem.year || '',
    runtimeMinutes: Number.isFinite(media.runtimeMinutes)
      ? media.runtimeMinutes
      : rawItem.runtimeMinutes,
    genres: asArray(media.genres).length
      ? asArray(media.genres)
      : asArray(rawItem.genres),
    actors: asArray(media.cast).length
      ? asArray(media.cast)
      : asArray(rawItem.actors),
    totalSeasons:
      showData.seasonCount ||
      rawItem.totalSeasons ||
      asArray(showData.seasons).length ||
      '',
    seasons: asArray(showData.seasons).length
      ? asArray(showData.seasons)
      : asArray(rawItem.seasons),
    episodeProgress: asObject(userState.episodeProgress),
  };
};

export const mapWatchlistUpdatesForWrite = (item = {}, updates = {}) => {
  if (item?.schemaVersion !== WATCHLIST_SCHEMA_VERSION) return updates;

  const mapped = { ...updates };

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const normalizedStatus = normalizeWatchStatus(updates.status);
    mapped.status = normalizedStatus;
    mapped['userState.status'] = normalizedStatus;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'vibe')) {
    mapped['userState.vibe'] = updates.vibe;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'energy')) {
    mapped['userState.energy'] = updates.energy;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'note')) {
    mapped['userState.note'] = updates.note;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'episodeProgress')) {
    mapped['userState.episodeProgress'] = updates.episodeProgress;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
    mapped['media.title'] = updates.title;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'runtimeMinutes')) {
    mapped['media.runtimeMinutes'] = updates.runtimeMinutes;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'poster')) {
    mapped['media.poster'] = updates.poster;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'backdrop')) {
    mapped['media.backdrop'] = updates.backdrop;
  }

  return mapped;
};
