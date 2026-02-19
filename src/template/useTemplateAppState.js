import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isEpisodeWatched } from '../components/ItemDetailsModal/utils/showProgress.js';
import {
  buildTemplateSeedItems,
  TEMPLATE_SPACE_ID,
  TEMPLATE_SPACE_NAME,
} from './seedLibrary.js';
import { getMediaDetails } from '../services/mediaApi/client.js';
import { initializeFirebase } from '../services/firebase/client.js';
import {
  signInAnonymousUser,
  signOutUser,
  subscribeToAuth,
} from '../services/firebase/auth.js';

const TEMPLATE_SESSION_MESSAGE = 'Template mode: all changes reset on refresh.';

const asString = (value) => String(value || '').trim();

const asArray = (value) => (Array.isArray(value) ? value : []);

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeType = (value) => (value === 'show' ? 'show' : 'movie');

const normalizeStatus = (value) => {
  if (value === 'watched' || value === 'watching') return value;
  return 'unwatched';
};

const toNumericOrNull = (value) => {
  if (Number.isFinite(value)) return value;
  const parsed = Number.parseInt(asString(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapSeasonSummariesToSeasons = (seasonSummaries = []) =>
  asArray(seasonSummaries)
    .map((season) => {
      const seasonNumber = toNumericOrNull(season?.seasonNumber);
      if (!seasonNumber) return null;
      return {
        number: seasonNumber,
        seasonNumber,
        name: asString(season?.name) || `Season ${seasonNumber}`,
        episodeCount: toNumericOrNull(season?.episodeCount) || 0,
        airDate: asString(season?.airDate),
        poster: asString(season?.poster || season?.posterUrl),
        episodes: [],
      };
    })
    .filter(Boolean);

const isRateLimitedError = (error) => {
  const status = Number(error?.requestMeta?.status || error?.status || 0);
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    status === 429 ||
    code === 'rate_limited' ||
    message.includes('rate_limited') ||
    message.includes('too many requests')
  );
};

const pickPrimaryPerson = (values) => {
  if (!Array.isArray(values)) return '';
  return String(values[0] || '').trim();
};

const getPrimaryCredit = ({ item = {}, isShow = false } = {}) => {
  const direct = String(item?.director || '').trim();
  if (direct) return direct;

  const mediaDirectors = pickPrimaryPerson(item?.media?.directors);
  if (mediaDirectors) return mediaDirectors;

  if (isShow) {
    const mediaCreators = pickPrimaryPerson(item?.media?.creators);
    if (mediaCreators) return mediaCreators;
  }

  return '';
};

const getMetadataGaps = (item = {}) => {
  const gaps = [];
  const sourceProvider = String(item?.source?.provider || '').trim();
  const sourceProviderId = String(item?.source?.providerId || '').trim();
  const poster = String(item?.poster || item?.media?.poster || '').trim();
  const backdrop = String(item?.backdrop || item?.media?.backdrop || '').trim();
  const logo = String(
    item?.logo ||
      item?.logoUrl ||
      item?.media?.logo ||
      item?.media?.logoUrl ||
      '',
  ).trim();
  const runtimeMinutes = Number(
    item?.runtimeMinutes ?? item?.media?.runtimeMinutes,
  );
  const year = String(item?.year || item?.media?.year || '').trim();
  const overview = String(item?.overview || item?.media?.overview || '').trim();
  const genres = Array.isArray(item?.genres)
    ? item.genres
    : Array.isArray(item?.media?.genres)
    ? item.media.genres
    : [];
  const actors = Array.isArray(item?.actors)
    ? item.actors
    : Array.isArray(item?.media?.cast)
    ? item.media.cast
    : [];
  const isShow = item?.type === 'show';
  const director = getPrimaryCredit({ item, isShow });
  const seasonCount = Number(
    item?.totalSeasons ??
      item?.showData?.seasonCount ??
      (Array.isArray(item?.seasons) ? item.seasons.length : 0),
  );
  const seasons = Array.isArray(item?.seasons)
    ? item.seasons
    : Array.isArray(item?.showData?.seasons)
    ? item.showData.seasons
    : [];

  if (!sourceProvider || !sourceProviderId) gaps.push('source');
  if (!poster) gaps.push('poster');
  if (!backdrop) gaps.push('backdrop');
  if (!logo) gaps.push('logo');
  if (!isShow && (!Number.isFinite(runtimeMinutes) || runtimeMinutes <= 0)) {
    gaps.push('runtimeMinutes');
  }
  if (!year) gaps.push('year');
  if (!overview) gaps.push('overview');
  if (!genres.length) gaps.push('genres');
  if (!actors.length) gaps.push('actors');
  if (!director) gaps.push('director');
  if (isShow) {
    if (!Number.isFinite(seasonCount) || seasonCount < 1)
      gaps.push('seasonCount');
    if (!seasons.length) gaps.push('seasons');
  }

  return gaps;
};

const buildMetadataAuditReport = (items = []) => {
  const rows = items.map((item) => {
    const gaps = getMetadataGaps(item);
    return {
      id: item.id,
      title: item.title || '[untitled]',
      type: item.type || 'unknown',
      gaps,
    };
  });

  const itemsWithGaps = rows.filter((row) => row.gaps.length > 0);
  const gapCounts = itemsWithGaps.reduce(
    (acc, row) => {
      row.gaps.forEach((gap) => {
        acc[gap] = (acc[gap] || 0) + 1;
      });
      return acc;
    },
    {
      source: 0,
      poster: 0,
      backdrop: 0,
      logo: 0,
      runtimeMinutes: 0,
      year: 0,
      overview: 0,
      genres: 0,
      actors: 0,
      director: 0,
      seasonCount: 0,
      seasons: 0,
    },
  );

  const movieRows = rows.filter((row) => row.type === 'movie');
  const showRows = rows.filter((row) => row.type === 'show');

  return {
    generatedAt: Date.now(),
    totalItems: rows.length,
    completeItems: rows.length - itemsWithGaps.length,
    itemsWithGaps: itemsWithGaps.length,
    gapCounts,
    byType: {
      movie: {
        total: movieRows.length,
        withGaps: movieRows.filter((row) => row.gaps.length > 0).length,
      },
      show: {
        total: showRows.length,
        withGaps: showRows.filter((row) => row.gaps.length > 0).length,
      },
    },
    missingRows: itemsWithGaps,
  };
};

const normalizeSeasons = (value) =>
  asArray(value).map((season, seasonIndex) => {
    const normalizedSeason = asObject(season);
    const seasonNumber =
      toNumericOrNull(normalizedSeason.number) ||
      toNumericOrNull(normalizedSeason.seasonNumber) ||
      seasonIndex + 1;
    const episodes = asArray(normalizedSeason.episodes).map(
      (episode, episodeIndex) => {
        const normalizedEpisode = asObject(episode);
        const episodeNumber =
          toNumericOrNull(normalizedEpisode.number) ||
          toNumericOrNull(normalizedEpisode.episodeNumber) ||
          episodeIndex + 1;
        const fallbackId = `s${seasonNumber}e${episodeNumber}`;
        return {
          ...normalizedEpisode,
          id:
            asString(normalizedEpisode.id || normalizedEpisode.episodeId) ||
            fallbackId,
          number: episodeNumber,
          episodeNumber,
          seasonNumber,
          name:
            asString(normalizedEpisode.name || normalizedEpisode.title) ||
            `Episode ${episodeNumber}`,
          title:
            asString(normalizedEpisode.title || normalizedEpisode.name) ||
            `Episode ${episodeNumber}`,
        };
      },
    );
    return {
      ...normalizedSeason,
      number: seasonNumber,
      seasonNumber,
      name: asString(normalizedSeason.name) || `Season ${seasonNumber}`,
      episodeCount: episodes.length,
      episodes,
    };
  });

const isShowFullyWatched = (item) => {
  if (!item || item.type !== 'show') return true;
  const seasons = Array.isArray(item.seasons) ? item.seasons : [];
  const seasonsWithEpisodes = seasons.filter(
    (season) => Array.isArray(season?.episodes) && season.episodes.length > 0,
  );
  if (!seasonsWithEpisodes.length) return false;
  const progress = item.episodeProgress || {};
  return seasonsWithEpisodes.every((season) =>
    season.episodes.every((episode) =>
      isEpisodeWatched(progress, {
        ...episode,
        seasonNumber:
          episode?.seasonNumber ?? episode?.season_number ?? season?.number,
        number:
          episode?.number ?? episode?.episodeNumber ?? episode?.episode_number,
      }),
    ),
  );
};

const setValueByPath = (target, path, value) => {
  const segments = String(path || '')
    .split('.')
    .filter(Boolean);
  if (!segments.length) return;
  let cursor = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!cursor[segment] || typeof cursor[segment] !== 'object') {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
  cursor[segments[segments.length - 1]] = value;
};

const clearHearthStorage = () => {
  const shouldDelete = (key) =>
    key.startsWith('hearth') || key.startsWith('hearth:');

  if (typeof localStorage !== 'undefined') {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && shouldDelete(key)) localStorage.removeItem(key);
    }
  }

  if (typeof sessionStorage !== 'undefined') {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key && shouldDelete(key)) sessionStorage.removeItem(key);
    }
  }
};

const derivePrimaryCredit = (item, type) => {
  const director = asString(item?.director);
  if (director) return director;

  const media = asObject(item?.media);
  const mediaDirectors = asArray(media.directors)
    .map((entry) => asString(entry))
    .find(Boolean);
  if (mediaDirectors) return mediaDirectors;

  if (type === 'show') {
    const mediaCreators = asArray(media.creators)
      .map((entry) => asString(entry))
      .find(Boolean);
    if (mediaCreators) return mediaCreators;
  }

  return '';
};

const normalizeTemplateItem = (rawItem, fallbackId, fallbackCreatedAt) => {
  const item = asObject(rawItem);
  const source = asObject(item.source);
  const media = asObject(item.media);
  const showData = asObject(item.showData);
  const userState = asObject(item.userState);

  const type = normalizeType(media.type || item.type);
  const now = Date.now();
  const seasons = normalizeSeasons(showData.seasons || item.seasons);
  const title = asString(media.title || item.title) || 'Untitled';
  const createdAt =
    item.createdAt || item.timestamp || fallbackCreatedAt || now;
  const vibe = asString(userState.vibe || item.vibe) || 'comfort';
  const energy = asString(userState.energy || item.energy) || 'balanced';
  const overview = asString(media.overview || item.overview);
  const poster = asString(media.poster || media.posterUrl || item.poster);
  const backdrop = asString(
    media.backdrop || media.backdropUrl || item.backdrop,
  );
  const logo = asString(
    media.logo || media.logoUrl || item.logo || item.logoUrl,
  );
  const runtimeMinutes = toNumericOrNull(
    media.runtimeMinutes ?? item.runtimeMinutes,
  );
  const genres = asArray(media.genres).length
    ? asArray(media.genres)
    : asArray(item.genres);
  const actors = asArray(media.cast).length
    ? asArray(media.cast)
    : asArray(item.actors);
  const seasonCountRaw =
    toNumericOrNull(showData.seasonCount ?? item.totalSeasons) ||
    seasons.length ||
    null;
  const seasonCount = type === 'show' ? seasonCountRaw : null;

  return {
    id: asString(item.id) || fallbackId,
    title,
    type,
    year: asString(media.year || item.year),
    vibe,
    energy,
    status: normalizeStatus(userState.status || item.status),
    note: asString(userState.note || item.note),
    runtimeMinutes,
    overview,
    genres,
    actors,
    director: derivePrimaryCredit(item, type),
    poster,
    backdrop,
    logo,
    source: {
      provider: asString(source.provider),
      providerId: asString(source.providerId),
      fetchedAt: toNumericOrNull(source.fetchedAt),
      staleAfter: toNumericOrNull(source.staleAfter),
      locale: asString(source.locale),
    },
    media: {
      ...media,
      type,
      title,
      year: asString(media.year || item.year),
      runtimeMinutes,
      overview,
      poster,
      backdrop,
      logo,
      genres,
      cast: actors,
      creators: asArray(media.creators),
      directors: asArray(media.directors),
      language: asString(media.language),
      country: asArray(media.country),
      rating: Number.isFinite(media.rating) ? media.rating : null,
      providerUpdatedAt: asString(media.providerUpdatedAt),
    },
    showData:
      type === 'show'
        ? {
            seasonCount,
            seasons,
          }
        : { seasonCount: null, seasons: [] },
    totalSeasons: type === 'show' ? seasonCount : null,
    seasons,
    episodeProgress: asObject(
      userState.episodeProgress || item.episodeProgress,
    ),
    createdAt,
    updatedAt: now,
    startedAt: item.startedAt || null,
  };
};

const hydrateTemplateItem = async (item, state = {}) => {
  if (state.rateLimited) return item;
  const baseType = normalizeType(item?.type);

  try {
    const provider = asString(item?.source?.provider).toLowerCase();
    const providerId = asString(item?.source?.providerId);

    if (provider !== 'tmdb' || !providerId) {
      return item;
    }

    const details = await getMediaDetails({
      provider,
      providerId,
      type: baseType,
    });

    const year = asString(details?.year || item?.year);
    const runtimeMinutes = toNumericOrNull(
      details?.runtimeMinutes ?? item?.runtimeMinutes,
    );
    const genres =
      Array.isArray(details?.genres) && details.genres.length
        ? details.genres
        : asArray(item?.genres);
    const actors =
      Array.isArray(details?.cast) && details.cast.length
        ? details.cast
        : asArray(item?.actors);
    const overview = asString(details?.overview || item?.overview);
    const director =
      baseType === 'show'
        ? asString(
            details?.creators?.[0] || details?.directors?.[0] || item?.director,
          )
        : asString(details?.directors?.[0] || item?.director);
    const seasons =
      baseType === 'show'
        ? mapSeasonSummariesToSeasons(details?.seasonSummaries)
        : [];
    const seasonCount =
      baseType === 'show'
        ? toNumericOrNull(details?.seasonCount) || seasons.length || null
        : null;

    return {
      ...item,
      source: {
        provider,
        providerId,
        fetchedAt: Date.now(),
        locale: 'en-US',
      },
      media: {
        provider,
        providerId,
        type: baseType,
        title: asString(details?.title || item?.title),
        year,
        runtimeMinutes,
        overview,
        poster: asString(details?.posterUrl || ''),
        backdrop: asString(details?.backdropUrl || ''),
        logo: asString(details?.logoUrl || ''),
        genres,
        cast: actors,
        creators: asArray(details?.creators),
        directors: asArray(details?.directors),
        language: asString(details?.language),
        country: asArray(details?.country),
        rating: Number.isFinite(details?.rating) ? details.rating : null,
        providerUpdatedAt: asString(details?.providerUpdatedAt),
      },
      title: asString(details?.title || item?.title),
      year,
      runtimeMinutes,
      genres,
      actors,
      overview,
      director,
      poster: asString(details?.posterUrl || ''),
      backdrop: asString(details?.backdropUrl || ''),
      logo: asString(details?.logoUrl || ''),
      totalSeasons: seasonCount,
      seasons,
      showData:
        baseType === 'show'
          ? {
              seasonCount,
              seasons,
            }
          : { seasonCount: null, seasons: [] },
      updatedAt: Date.now(),
    };
  } catch (error) {
    if (isRateLimitedError(error)) {
      state.rateLimited = true;
    }
    return item;
  }
};

const applyTemplateUpdates = (currentItem, updates) => {
  const next = { ...currentItem };
  Object.entries(asObject(updates)).forEach(([key, value]) => {
    if (key.includes('.')) {
      setValueByPath(next, key, value);
    } else {
      next[key] = value;
    }
  });

  if (next.showData && typeof next.showData === 'object') {
    next.seasons = next.showData.seasons || next.seasons;
    next.totalSeasons = next.showData.seasonCount || next.totalSeasons;
  }
  if (next.media && typeof next.media === 'object') {
    next.title = asString(next.media.title || next.title) || next.title;
    next.type = normalizeType(next.media.type || next.type);
    next.year = asString(next.media.year || next.year);
    next.overview = asString(next.media.overview || next.overview);
    next.poster = asString(next.media.poster || next.poster);
    next.backdrop = asString(next.media.backdrop || next.backdrop);
    next.logo = asString(next.media.logo || next.logo);
    next.runtimeMinutes =
      toNumericOrNull(next.media.runtimeMinutes ?? next.runtimeMinutes) ||
      next.runtimeMinutes;
    next.genres = asArray(next.media.genres).length
      ? asArray(next.media.genres)
      : next.genres;
    next.actors = asArray(next.media.cast).length
      ? asArray(next.media.cast)
      : next.actors;
  }
  if (next.userState && typeof next.userState === 'object') {
    next.vibe = asString(next.userState.vibe || next.vibe) || next.vibe;
    next.energy = asString(next.userState.energy || next.energy) || next.energy;
    next.note = asString(next.userState.note || next.note);
    next.status = normalizeStatus(next.userState.status || next.status);
    next.episodeProgress = asObject(
      next.userState.episodeProgress || next.episodeProgress,
    );
  }

  next.type = normalizeType(next.type);
  next.status = normalizeStatus(next.status);
  next.seasons = normalizeSeasons(next.seasons);
  next.totalSeasons =
    next.type === 'show'
      ? toNumericOrNull(next.totalSeasons) || next.seasons.length || null
      : null;
  next.updatedAt = Date.now();
  return next;
};

export const useTemplateAppState = () => {
  const [authResolved, setAuthResolved] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [items, setItems] = useState(() =>
    buildTemplateSeedItems().map((item) =>
      normalizeTemplateItem(item, item.id, item.createdAt),
    ),
  );
  const [view, setView] = useState('tonight');
  const [decisionResult, setDecisionResult] = useState(null);
  const [decisionContext, setDecisionContext] = useState(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const [contextItems, setContextItems] = useState([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updateMessage, setUpdateMessage] = useState(TEMPLATE_SESSION_MESSAGE);
  const loading = false;
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isWipingSpace, setIsWipingSpace] = useState(false);
  const [isMetadataRepairing, setIsMetadataRepairing] = useState(false);
  const errorTimerRef = useRef(null);
  const updateTimerRef = useRef(null);
  const idCounterRef = useRef(1);

  useEffect(() => {
    clearHearthStorage();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const attachAuth = async (nextAuth) => {
      if (!isMounted) return;
      if (!nextAuth || !nextAuth.app) {
        setAuthResolved(true);
        return;
      }

      if (nextAuth.currentUser && !nextAuth.currentUser.isAnonymous) {
        try {
          await signOutUser(nextAuth);
        } catch (err) {
          console.warn('Template mode sign-out failed:', err);
        }
      }

      unsubscribe = subscribeToAuth(nextAuth, (user) => {
        if (!isMounted) return;
        if (user && !user.isAnonymous) {
          setAuthUser(null);
          signOutUser(nextAuth).catch((err) => {
            console.warn('Blocked non-anonymous template session:', err);
          });
          return;
        }
        setAuthUser(user || null);
        setAuthResolved(true);
      });

      try {
        await signInAnonymousUser(nextAuth);
      } catch (err) {
        console.warn('Template anonymous sign-in failed:', err);
        if (isMounted) {
          setAuthResolved(true);
        }
      }
    };

    initializeFirebase(({ auth }) => {
      attachAuth(auth);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, []);

  const notifyError = useCallback((message) => {
    setErrorMessage(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMessage(''), 4000);
  }, []);

  const notifyUpdate = useCallback((message) => {
    setUpdateMessage(message);
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => setUpdateMessage(''), 4000);
  }, []);

  const createItemId = () => {
    const next = idCounterRef.current;
    idCounterRef.current += 1;
    return `template-user-item-${next}`;
  };

  const handleAddItem = async (itemData) => {
    const normalized = normalizeTemplateItem(
      itemData,
      createItemId(),
      Date.now(),
    );

    const duplicateExists = items.some((existing) => {
      return (
        asString(existing.title).toLowerCase() ===
          asString(normalized.title).toLowerCase() &&
        normalizeType(existing.type) === normalizeType(normalized.type) &&
        asString(existing.year) === asString(normalized.year)
      );
    });
    if (duplicateExists) {
      notifyError('That title is already on your shelf.');
      return;
    }

    setItems((current) => [normalized, ...current]);
    setView('tonight');
    notifyUpdate('Title added to shelf.');
  };

  const handleImportItems = async () => {
    notifyError('Import is disabled in template mode.');
  };

  const handleExportItems = async () => {
    notifyError('Export is disabled in template mode.');
  };

  const handleSignOut = async () => {};

  const handleMetadataAudit = () => {
    const report = buildMetadataAuditReport(items);
    if (!report.totalItems) {
      notifyUpdate('Metadata audit: no titles to check.');
      return report;
    }
    if (!report.itemsWithGaps) {
      notifyUpdate(
        `Metadata audit: all ${report.totalItems} title(s) look complete.`,
      );
      return report;
    }
    notifyUpdate(
      `Metadata audit: ${report.itemsWithGaps}/${report.totalItems} need repair.`,
    );
    return report;
  };

  const handleMetadataRepairMissing = async () => {
    if (isMetadataRepairing) return;
    const candidates = items.filter((item) => getMetadataGaps(item).length > 0);
    if (!candidates.length) {
      notifyUpdate('No missing metadata found to repair.');
      return;
    }

    setIsMetadataRepairing(true);
    const hydrationState = { rateLimited: false };
    let repaired = 0;
    let failed = 0;

    try {
      const updatesById = new Map();
      for (const item of candidates) {
        const beforeGaps = getMetadataGaps(item).length;
        const next = await hydrateTemplateItem(item, hydrationState);
        const afterGaps = getMetadataGaps(next).length;
        if (afterGaps < beforeGaps) {
          updatesById.set(item.id, next);
          repaired += 1;
        } else {
          failed += 1;
        }
      }

      if (updatesById.size > 0) {
        setItems((current) =>
          current.map((item) =>
            updatesById.has(item.id)
              ? normalizeTemplateItem(
                  updatesById.get(item.id),
                  item.id,
                  item.createdAt,
                )
              : item,
          ),
        );
      }
    } finally {
      setIsMetadataRepairing(false);
    }

    if (repaired > 0) {
      notifyUpdate(`Metadata repair completed for ${repaired} title(s).`);
    }
    if (failed > 0) {
      notifyError(`${failed} title(s) still missing metadata after repair.`);
    }
  };

  const handleMarkWatched = async (id, currentStatus) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (
          currentStatus !== 'watched' &&
          item?.type === 'show' &&
          !isShowFullyWatched(item)
        ) {
          notifyError('Finish every episode to mark this show watched.');
          return item;
        }
        const nextStatus =
          currentStatus === 'watched' ? 'unwatched' : 'watched';
        return {
          ...item,
          status: nextStatus,
          updatedAt: Date.now(),
        };
      }),
    );
  };

  const handleUpdateItem = async (id, updates) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        return applyTemplateUpdates(item, updates);
      }),
    );
  };

  const handleDelete = async (id, options = {}) => {
    const shouldConfirm = !options?.skipConfirm;
    if (
      shouldConfirm &&
      typeof window !== 'undefined' &&
      !window.confirm('Remove this memory?')
    ) {
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleBulkDelete = async (ids, options = {}) => {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const shouldConfirm = !options?.skipConfirm;
    if (
      shouldConfirm &&
      typeof window !== 'undefined' &&
      !window.confirm(
        `Delete ${ids.length} item${
          ids.length === 1 ? '' : 's'
        }? This cannot be undone.`,
      )
    ) {
      return false;
    }
    setIsBulkDeleting(true);
    try {
      const idSet = new Set(ids);
      setItems((current) => current.filter((item) => !idSet.has(item.id)));
      return true;
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsWipingSpace(true);
    try {
      setItems([]);
      setContextItems([]);
      setDecisionResult(null);
      setDecisionContext(null);
      setIsImportOpen(false);
      setView('tonight');
      notifyUpdate('Template shelf cleared.');
      return true;
    } finally {
      setIsWipingSpace(false);
    }
  };

  const startDecision = (poolOfItems, context = null) => {
    const pool =
      poolOfItems && poolOfItems.length > 0
        ? poolOfItems
        : items.filter(
            (entry) =>
              entry.status === 'unwatched' || entry.status === 'watching',
          );

    if (pool.length === 0) return;
    setIsDeciding(true);
    setDecisionResult(null);
    setDecisionContext(context);
    setContextItems(pool);
    setView('decision');

    setTimeout(() => {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      setDecisionResult(randomItem);
      setIsDeciding(false);
    }, 2000);
  };

  const handleReloadNow = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const resolvedUpdateMessage = useMemo(() => {
    return updateMessage || TEMPLATE_SESSION_MESSAGE;
  }, [updateMessage]);

  return {
    authResolved,
    autoReloadCountdown: null,
    contextItems,
    decisionContext,
    decisionResult,
    dismissUpdate: () => setUpdateMessage(''),
    errorMessage,
    handleAddItem,
    handleBulkDelete,
    handleCreateSpace: async () => {},
    handleDeleteAll,
    handleDelete,
    handleExportItems,
    handleImportItems,
    handleMarkWatched,
    handleMetadataAudit,
    handleMetadataRepairMissing,
    handleRefreshMetadata: async () => {},
    handleReloadNow,
    handleSignIn: async () => {},
    handleSignOut,
    handleUpdateItem,
    importProgress: null,
    isBootstrapping: false,
    isBulkDeleting,
    isDeciding,
    isImportOpen,
    isMetadataRepairing,
    isSigningIn: false,
    isSpaceSetupRunning: false,
    isWipingSpace,
    items,
    joinError: '',
    loading,
    newVersionAvailable: false,
    setDecisionResult,
    setIsImportOpen,
    setView,
    spaceId: TEMPLATE_SPACE_ID,
    spaceName: TEMPLATE_SPACE_NAME,
    startDecision,
    updateMessage: resolvedUpdateMessage,
    user:
      authUser && authUser.uid
        ? {
            uid: authUser.uid,
            displayName: authUser.displayName || 'Demo User',
            email: authUser.email || '',
            isAnonymous: Boolean(authUser.isAnonymous),
          }
        : { uid: 'template-user', displayName: 'Template User' },
    view,
  };
};
