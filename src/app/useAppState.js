import { useEffect, useState } from 'react';
import { buildImportDedupeKey } from '../domain/import/importer.js';
import {
  adaptWatchlistItem,
  mapWatchlistUpdatesForWrite,
} from '../domain/media/adapters.js';
import { buildWatchlistPayload } from '../domain/media/schema.js';
import {
  DAILY_TRAY_STORAGE_PREFIX,
  SPACE_ID_STORAGE_KEY,
} from '../config/constants.js';
import { toMillis } from '../utils/time.js';
import { getJoinSpaceId, clearJoinParam } from '../utils/url.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { useVersionUpdates } from './useVersionUpdates.js';
import { getAppId, initializeFirebase } from '../services/firebase/client.js';
import {
  signInWithGoogle,
  signInUser,
  signOutUser,
  subscribeToAuth,
} from '../services/firebase/auth.js';
import {
  createOrJoinSpaceByName,
  fetchSpace,
  joinSpace,
} from '../services/firebase/spaces.js';
import {
  addWatchlistItem,
  bulkDeleteWatchlistItems,
  deleteWatchlistItem,
  subscribeWatchlist,
  updateWatchlistItem,
  updateWatchlistStatus,
} from '../services/firebase/watchlist.js';
import {
  getMediaDetails,
  refreshMediaMetadata,
  searchMedia,
} from '../services/mediaApi/client.js';
import { hydrateShowData } from '../services/mediaApi/showData.js';

const appId = getAppId();
const VIEW_STORAGE_KEY = 'hearth:last_view';
const VIEW_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const getInitialView = () => {
  if (typeof localStorage === 'undefined') return 'onboarding';
  const raw = localStorage.getItem(VIEW_STORAGE_KEY);
  if (!raw) return 'onboarding';
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed?.view &&
      parsed?.timestamp &&
      Date.now() - parsed.timestamp < VIEW_TTL_MS
    ) {
      return parsed.view;
    }
    return 'tonight';
  } catch (err) {
    console.warn('Failed to parse stored view', err);
    return 'onboarding';
  }
};

const isShowFullyWatched = (item) => {
  if (!item || item.type !== 'show') return true;
  const seasons = Array.isArray(item.seasons) ? item.seasons : [];
  if (!seasons.length) return false;
  const progress = item.episodeProgress || {};
  return seasons.every(
    (season) =>
      Array.isArray(season.episodes) &&
      season.episodes.length > 0 &&
      season.episodes.every((episode) => Boolean(progress[episode.id])),
  );
};

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const scoreSearchResult = ({ result, title, type, year }) => {
  let score = 0;
  const wantedType = type === 'show' ? 'show' : 'movie';
  const normalizedWantedTitle = normalizeSearchText(title);
  const normalizedResultTitle = normalizeSearchText(result?.title);
  const wantedYear = String(year || '').trim();
  const resultYear = String(result?.year || '').trim();

  if (result?.type === wantedType) score += 30;
  if (normalizedResultTitle && normalizedResultTitle === normalizedWantedTitle) {
    score += 50;
  }
  if (
    normalizedResultTitle &&
    normalizedWantedTitle &&
    normalizedResultTitle.includes(normalizedWantedTitle)
  ) {
    score += 10;
  }
  if (wantedYear && resultYear && wantedYear === resultYear) score += 15;
  return score;
};

const MIN_AUTO_MATCH_SCORE = 50;

const pickBestSearchResult = ({ results, title, type, year }) => {
  if (!Array.isArray(results) || !results.length) return null;

  const ranked = [...results]
    .map((result) => ({
      result,
      score: scoreSearchResult({ result, title, type, year }),
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (!top || top.score < MIN_AUTO_MATCH_SCORE) return null;
  return top.result;
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
  const runtimeMinutes = Number(
    item?.runtimeMinutes ?? item?.media?.runtimeMinutes,
  );
  const year = String(item?.year || item?.media?.year || '').trim();
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
  if (!Number.isFinite(runtimeMinutes) || runtimeMinutes <= 0) {
    gaps.push('runtimeMinutes');
  }
  if (!year) gaps.push('year');
  if (!genres.length) gaps.push('genres');
  if (!actors.length) gaps.push('actors');
  if (!director) gaps.push('director');
  if (isShow) {
    if (!Number.isFinite(seasonCount) || seasonCount < 1) gaps.push('seasonCount');
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
      runtimeMinutes: 0,
      year: 0,
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

const clearSpaceTrayCache = (targetSpaceId) => {
  if (typeof localStorage === 'undefined' || !targetSpaceId) return;
  const storagePrefix = `${DAILY_TRAY_STORAGE_PREFIX}:${targetSpaceId}:`;
  const keysToRemove = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith(storagePrefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

const IMPORT_PREVIEW_LIMIT = 6;

const appendPreviewCard = (cards = [], card) => {
  const withoutDuplicate = cards.filter((existing) => existing.id !== card.id);
  return [card, ...withoutDuplicate].slice(0, IMPORT_PREVIEW_LIMIT);
};

export const useAppState = () => {
  const {
    autoReloadCountdown,
    dismissUpdate,
    handleReloadNow,
    newVersionAvailable,
    notifyUpdate,
    updateMessage,
  } = useVersionUpdates();

  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [firebaseInitResolved, setFirebaseInitResolved] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [spaceId, setSpaceId] = useState(
    () => localStorage.getItem(SPACE_ID_STORAGE_KEY) || '',
  );
  const [spaceName, setSpaceName] = useState('');
  const [joinSpaceId, setJoinSpaceId] = useState(() => getJoinSpaceId());
  const [joinError, setJoinError] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(getInitialView);
  const [decisionResult, setDecisionResult] = useState(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const [contextItems, setContextItems] = useState([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isWipingSpace, setIsWipingSpace] = useState(false);
  const [isMetadataRepairing, setIsMetadataRepairing] = useState(false);
  const [isSpaceSetupRunning, setIsSpaceSetupRunning] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const isBootstrapping =
    Boolean(user) && Boolean(spaceId || joinSpaceId) && loading;

  // Persist the current view to localStorage (no auto-redirect while using)
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        VIEW_STORAGE_KEY,
        JSON.stringify({ view, timestamp: Date.now() }),
      );
    }
  }, [view]);

  const notifyError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 4000);
  };

  useEffect(() => {
    const onReady = (client) => {
      setAuth(client.auth);
      setDb(client.db);
      setFirebaseInitResolved(true);
    };
    const client = initializeFirebase(onReady);
    setAuth(client.auth);
    setDb(client.db);
  }, []);

  useEffect(() => {
    if (!firebaseInitResolved) return undefined;

    const initAuth = async () => {
      if (!auth || !auth.app) {
        if (typeof window !== 'undefined' && window.__firebase_config) {
          // Config exists; auth state is still settling.
          return;
        }
        console.log('Firebase auth not available, skipping authentication');
        setAuthResolved(true);
        setLoading(false);
        return;
      }

      try {
        const initialToken =
          typeof __initial_auth_token !== 'undefined' && __initial_auth_token
            ? __initial_auth_token
            : null;
        await signInUser(auth, initialToken);
      } catch (err) {
        console.error('Error signing in:', err);
        notifyError("Couldn't sign in. Try again.");
      }
    };

    initAuth();

    try {
      const unsubscribe = subscribeToAuth(auth, (u) => {
        setUser(u);
        setAuthResolved(true);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Error attaching auth state listener:', err);
      setAuthResolved(true);
    }

    setLoading(false);
    return undefined;
  }, [auth, firebaseInitResolved]);

  useEffect(() => {
    if (!user) return;
    if (!spaceId && !joinSpaceId) {
      setView('onboarding');
      setLoading(false);
    }
  }, [user, spaceId, joinSpaceId]);

  useEffect(() => {
    if (!authResolved) return;
    if (user) return;
    setView('onboarding');
    setLoading(false);
  }, [authResolved, user]);

  useEffect(() => {
    if (!user || !db || !joinSpaceId) return;

    let isMounted = true;

    const runJoin = async () => {
      setIsSpaceSetupRunning(true);
      setLoading(true);
      try {
        const data = await joinSpace({
          db,
          appId,
          spaceId: joinSpaceId,
          userId: user.uid,
        });

        if (!data) {
          if (isMounted) {
            setJoinError('Invite link is invalid or expired.');
            setView('onboarding');
            setJoinSpaceId('');
            setSpaceId('');
            setSpaceName('');
          }
          clearJoinParam();
          return;
        }

        localStorage.setItem(SPACE_ID_STORAGE_KEY, joinSpaceId);
        if (isMounted) {
          setSpaceId(joinSpaceId);
          setSpaceName(data?.name || 'Tonight');
          setJoinError('');
          setView('tonight');
        }
        clearJoinParam();
        setJoinSpaceId('');
      } catch (err) {
        console.error('Error joining space:', err);
        if (isMounted) {
          setJoinError('Invite link is invalid or expired.');
          setView('onboarding');
          setJoinSpaceId('');
          setSpaceId('');
          setSpaceName('');
        }
        clearJoinParam();
        notifyError("Couldn't join space. Try again.");
      } finally {
        if (isMounted) {
          setIsSpaceSetupRunning(false);
          setLoading(false);
        }
      }
    };

    runJoin();

    return () => {
      isMounted = false;
    };
  }, [db, joinSpaceId, user]);

  useEffect(() => {
    if (!user || !db || !spaceId || joinSpaceId) return;

    let isMounted = true;

    const loadSpace = async () => {
      setLoading(true);
      try {
        const data = await fetchSpace({ db, appId, spaceId });
        if (!data) {
          localStorage.removeItem(SPACE_ID_STORAGE_KEY);
          if (isMounted) {
            setSpaceId('');
            setSpaceName('');
            setJoinError('Space not found. Create a new one.');
            setView('onboarding');
          }
          return;
        }
        if (isMounted) {
          setSpaceName(data?.name || 'Tonight');
          setView('tonight');
        }
      } catch (err) {
        console.error('Error loading space:', err);
        notifyError("Couldn't load space. Try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSpace();

    return () => {
      isMounted = false;
    };
  }, [db, joinSpaceId, spaceId, user]);

  useEffect(() => {
    if (!firebaseInitResolved) return;
    if (!user || !spaceId || !db) {
      if (!db) {
        if (typeof window !== 'undefined' && window.__firebase_config) return;
        console.log('Firebase not available, using local storage only');
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeWatchlist({
      db,
      appId,
      spaceId,
      onNext: (snapshot) => {
        const fetchedItems = snapshot.docs.map((docSnap) =>
          adaptWatchlistItem({
            id: docSnap.id,
            ...docSnap.data(),
          }),
        );
        fetchedItems.sort((a, b) => {
          const aTime = toMillis(a.createdAt || a.timestamp);
          const bTime = toMillis(b.createdAt || b.timestamp);
          return bTime - aTime;
        });
        setItems(fetchedItems);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Error fetching items:', error);
        notifyError("Couldn't load the shelf. Try again.");
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, [db, firebaseInitResolved, spaceId, user]);

  const handleCreateSpace = async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (!user || !db || !auth || !auth.app) {
      notifyError('Sign in with Google to create or join a space.');
      return;
    }

    const authUser = auth.currentUser;
    if (!authUser || authUser.uid !== user.uid) {
      notifyError('Auth session is still syncing. Please try again.');
      return;
    }

    try {
      await authUser.getIdToken(true);
    } catch (tokenErr) {
      console.error(
        'Error refreshing auth token before space create:',
        tokenErr,
      );
      notifyError("Couldn't verify your sign-in session. Try again.");
      return;
    }

    setIsSpaceSetupRunning(true);
    try {
      const space = await createOrJoinSpaceByName({
        db,
        appId,
        name: trimmedName,
        userId: user.uid,
      });

      if (!space?.id) {
        throw new Error('space-unavailable');
      }

      localStorage.setItem(SPACE_ID_STORAGE_KEY, space.id);
      setSpaceId(space.id);
      setSpaceName(space.name || trimmedName);
      setView('tonight');
    } catch (err) {
      console.error('Error creating space:', {
        code: err?.code,
        message: err?.message,
        appId,
        userUid: user?.uid,
      });
      notifyError("Couldn't create space. Try again.");
    } finally {
      setIsSpaceSetupRunning(false);
    }
  };

  const handleSignIn = async () => {
    if (!auth || !auth.app) {
      notifyError('Auth service is not available.');
      return;
    }
    setIsSigningIn(true);
    try {
      await signInWithGoogle(auth);
    } catch (err) {
      console.error('Error signing in with Google:', err);
      notifyError('Google sign-in failed. Try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleInvite = async () => {
    if (!spaceId) {
      notifyError('Space not available. Create a space first.');
      return;
    }
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : '';
    const inviteUrl = `${baseUrl}?join=${spaceId}`;
    const copied = await copyToClipboard(inviteUrl);
    if (copied) {
      notifyUpdate('Invite link copied. Share it to join your space.');
    } else {
      notifyError('Could not copy invite link. Try again.');
    }
  };

  const handleAddItem = async (itemData) => {
    if (!user || !spaceId || !db) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    try {
      const payload = buildWatchlistPayload(
        {
          ...itemData,
          status: itemData?.status || 'unwatched',
        },
        user.uid,
      );

      const hasProviderIdentity = Boolean(
        payload?.source?.provider && payload?.source?.providerId,
      );
      if (hasProviderIdentity) {
        const duplicateExists = items.some((existingItem) => {
          if (payload.mediaId && existingItem?.mediaId === payload.mediaId) {
            return true;
          }
          const existingProvider = String(
            existingItem?.source?.provider || '',
          ).toLowerCase();
          const existingProviderId = String(existingItem?.source?.providerId || '');
          const nextProvider = String(payload.source.provider || '').toLowerCase();
          const nextProviderId = String(payload.source.providerId || '');
          return (
            existingProvider &&
            existingProviderId &&
            existingProvider === nextProvider &&
            existingProviderId === nextProviderId
          );
        });

        if (duplicateExists) {
          notifyError('That title is already on your shelf.');
          return;
        }
      }

      await addWatchlistItem({ db, appId, spaceId, payload });
      setView('tonight');
    } catch (err) {
      console.error('Error adding item:', err);
      notifyError("Something didn't save. Try again.");
    }
  };

  const handleImportItems = async (itemsToImport) => {
    if (!user || !spaceId || !db) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    const hydratedShowCache = new Map();
    const loadHydratedShowData = async ({ provider, providerId }) => {
      const cacheKey = `${provider}:${providerId}`;
      if (!hydratedShowCache.has(cacheKey)) {
        const pending = hydrateShowData({ provider, providerId }).catch((err) => {
          hydratedShowCache.delete(cacheKey);
          throw err;
        });
        hydratedShowCache.set(cacheKey, pending);
      }
      return hydratedShowCache.get(cacheKey);
    };

    try {
      const existingKeys = new Set(
        items.map((existingItem) => buildImportDedupeKey(existingItem)).filter(Boolean),
      );
      const importKeys = new Set();
      const itemsForLookup = [];
      let duplicateCount = 0;

      for (const item of itemsToImport) {
        const dedupeKey = buildImportDedupeKey(item);
        if (!dedupeKey) {
          itemsForLookup.push(item);
          continue;
        }
        if (existingKeys.has(dedupeKey) || importKeys.has(dedupeKey)) {
          duplicateCount += 1;
          continue;
        }
        importKeys.add(dedupeKey);
        itemsForLookup.push(item);
      }

      if (!itemsForLookup.length) {
        if (duplicateCount > 0) {
          notifyError(
            `Skipped ${duplicateCount} duplicate import item${
              duplicateCount === 1 ? '' : 's'
            } (same title/type/year or provider).`,
          );
        }
        return;
      }

      let matchedCount = 0;
      let unmatchedCount = 0;
      let importedCount = 0;
      const showHydrationQueue = [];

      setImportProgress({
        phase: 'matching',
        startedAt: Date.now(),
        total: itemsForLookup.length,
        processed: 0,
        imported: 0,
        matched: 0,
        unmatched: 0,
        duplicateCount,
        hydrationTotal: 0,
        hydrationCompleted: 0,
        previewCards: [],
      });

      for (let index = 0; index < itemsForLookup.length; index += 1) {
        const item = itemsForLookup[index];
        const title = String(item?.title || '').trim();
        const itemType = item?.type === 'show' ? 'show' : 'movie';
        let nextItem = item;
        let resolvedType = itemType;
        let provider = '';
        let providerId = '';

        if (!title) {
          unmatchedCount += 1;
        } else {
          try {
            const searchData = await searchMedia({
              q: title,
              type: itemType,
              page: 1,
            });
            const best = pickBestSearchResult({
              results: searchData?.results,
              title,
              type: itemType,
              year: item?.year,
            });

            if (best?.provider && best?.providerId) {
              const details = await getMediaDetails({
                provider: best.provider,
                providerId: best.providerId,
                type: best.type || itemType,
              });
              resolvedType = details?.type === 'show' ? 'show' : 'movie';
              provider = best.provider;
              providerId = best.providerId;

              const poster =
                details?.posterUrl || best.posterUrl || item?.poster || '';
              const backdrop =
                details?.backdropUrl || best.backdropUrl || item?.backdrop || '';

              nextItem = {
                ...item,
                schemaVersion: 2,
                title: details?.title || best.title || title,
                type: resolvedType,
                year: details?.year || best.year || item?.year || '',
                runtimeMinutes: Number.isFinite(details?.runtimeMinutes)
                  ? details.runtimeMinutes
                  : item?.runtimeMinutes,
                genres:
                  Array.isArray(details?.genres) && details.genres.length
                    ? details.genres
                    : item?.genres,
                actors:
                  Array.isArray(details?.cast) && details.cast.length
                    ? details.cast
                    : item?.actors,
                director:
                  String(
                    (Array.isArray(details?.directors) && details.directors[0]) ||
                      (resolvedType === 'show' &&
                      Array.isArray(details?.creators) &&
                      details.creators[0]
                        ? details.creators[0]
                        : '') ||
                      item?.director ||
                      '',
                  ).trim(),
                poster,
                backdrop,
                source: {
                  provider: best.provider,
                  providerId: best.providerId,
                  fetchedAt: Date.now(),
                  locale: 'en-US',
                },
                media: {
                  ...details,
                  type: resolvedType,
                  title: details?.title || best.title || title,
                  poster,
                  backdrop,
                },
                showData: { seasonCount: null, seasons: [] },
              };
              matchedCount += 1;
            } else {
              unmatchedCount += 1;
            }
          } catch {
            unmatchedCount += 1;
          }
        }

        const payload = buildWatchlistPayload(
          {
            ...nextItem,
            status: nextItem?.status || 'unwatched',
          },
          user.uid,
        );

        await addWatchlistItem({ db, appId, spaceId, payload });
        importedCount += 1;

        if (resolvedType === 'show' && provider && providerId) {
          showHydrationQueue.push({
            itemId: payload.mediaId,
            provider,
            providerId,
            title: payload.title || title,
          });
        }

        const previewId = payload.mediaId || `${index}`;
        const progressSnapshot = {
          imported: importedCount,
          matched: matchedCount,
          unmatched: unmatchedCount,
        };
        setImportProgress((current) => {
          if (!current) return current;
          return {
            ...current,
            processed: progressSnapshot.imported,
            imported: progressSnapshot.imported,
            matched: progressSnapshot.matched,
            unmatched: progressSnapshot.unmatched,
            previewCards: appendPreviewCard(current.previewCards, {
              id: previewId,
              title: payload.title || title || '[untitled]',
              poster: payload.poster || '',
              type: payload.type || itemType,
            }),
          };
        });
      }

      setIsImportOpen(false);
      setView('tonight');
      if (importedCount > 0) {
        notifyUpdate(
          `Imported ${importedCount} title${
            importedCount === 1 ? '' : 's'
          }.`,
        );
      }
      if (matchedCount > 0) {
        notifyUpdate(
          `Found metadata for ${matchedCount} imported title${
            matchedCount === 1 ? '' : 's'
          }.`,
        );
      }
      if (unmatchedCount > 0) {
        notifyError(
          `${unmatchedCount} import item${
            unmatchedCount === 1 ? '' : 's'
          } could not be matched for poster/backdrop.`,
        );
      }
      if (duplicateCount > 0) {
        notifyError(
          `Skipped ${duplicateCount} duplicate import item${
            duplicateCount === 1 ? '' : 's'
          } (same title/type/year or provider).`,
        );
      }

      if (!showHydrationQueue.length) {
        setImportProgress(null);
        return;
      }

      setImportProgress((current) => {
        if (!current) return current;
        return {
          ...current,
          phase: 'hydrating',
          hydrationTotal: showHydrationQueue.length,
          hydrationCompleted: 0,
        };
      });

      void (async () => {
        let hydratedCount = 0;
        let hydrationFailedCount = 0;

        for (const show of showHydrationQueue) {
          try {
            const showData = await loadHydratedShowData({
              provider: show.provider,
              providerId: show.providerId,
            });
            await updateWatchlistItem({
              db,
              appId,
              spaceId,
              itemId: show.itemId,
              updates: {
                showData,
                totalSeasons: showData?.seasonCount || null,
                seasons: Array.isArray(showData?.seasons) ? showData.seasons : [],
              },
            });
            hydratedCount += 1;
          } catch (err) {
            console.warn('Show hydration failed during import:', show.title, err);
            hydrationFailedCount += 1;
          } finally {
            const hydrationProgress = hydratedCount + hydrationFailedCount;
            setImportProgress((current) => {
              if (!current) return current;
              return {
                ...current,
                hydrationCompleted: hydrationProgress,
              };
            });
          }
        }

        if (hydratedCount > 0) {
          notifyUpdate(
            `Loaded episode guides for ${hydratedCount} imported show${
              hydratedCount === 1 ? '' : 's'
            }.`,
          );
        }
        if (hydrationFailedCount > 0) {
          notifyError(
            `${hydrationFailedCount} show${
              hydrationFailedCount === 1 ? '' : 's'
            } could not load full season metadata yet.`,
          );
        }
        setImportProgress(null);
      })();
    } catch (err) {
      console.error('Error importing items:', err);
      setImportProgress(null);
      notifyError("Something didn't save. Try again.");
    }
  };

  const handleExportItems = async () => {
    if (!items.length) {
      notifyError('Nothing to export yet.');
      return;
    }
    const payload = items.map((item) => {
      const entry = {
        title: item.title,
        type: item.type,
        vibe: item.vibe,
        energy: item.energy,
      };
      if (item.note) entry.note = item.note;
      if (item.poster) entry.poster = item.poster;
      if (item.backdrop) entry.backdrop = item.backdrop;
      if (item.year) entry.year = item.year;
      if (item.director) entry.director = item.director;
      if (item.genres?.length) entry.genres = item.genres;
      if (item.actors?.length) entry.actors = item.actors;
      if (Number.isFinite(item.runtimeMinutes)) {
        entry.runtimeMinutes = item.runtimeMinutes;
      }
      if (item.totalSeasons) entry.totalSeasons = item.totalSeasons;
      if (Array.isArray(item.seasons) && item.seasons.length) {
        entry.seasons = item.seasons;
      }
      if (item.episodeProgress) entry.episodeProgress = item.episodeProgress;
      if (item.startedAt) entry.startedAt = item.startedAt;
      return entry;
    });
    const exportText = JSON.stringify(payload, null, 2);
    const copied = await copyToClipboard(exportText);
    if (copied) {
      notifyUpdate('Export copied to clipboard.');
    } else {
      notifyError('Could not copy export. Try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser(auth);
    } catch (err) {
      console.warn('Sign out failed:', err);
    } finally {
      localStorage.removeItem(SPACE_ID_STORAGE_KEY);
      setSpaceId('');
      setSpaceName('');
      setItems([]);
      setUser(null);
      setView('onboarding');
    }
  };

  const handleMarkWatched = async (id, currentStatus) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    const item = items.find((entry) => entry.id === id);
    if (
      currentStatus !== 'watched' &&
      item?.type === 'show' &&
      !isShowFullyWatched(item)
    ) {
      notifyError('Finish every episode to mark this show watched.');
      return;
    }
    const newStatus = currentStatus === 'watched' ? 'unwatched' : 'watched';
    try {
      await updateWatchlistStatus({
        db,
        appId,
        spaceId,
        itemId: id,
        status: newStatus,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      notifyError("Something didn't save. Try again.");
    }
  };

  const handleUpdateItem = async (id, updates) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    const item = items.find((entry) => entry.id === id);
    const nextUpdates = { ...updates };
    if (
      item?.type === 'show' &&
      Object.prototype.hasOwnProperty.call(updates, 'episodeProgress')
    ) {
      const nextItem = { ...item, ...updates };
      const fullyWatched = isShowFullyWatched(nextItem);
      if (fullyWatched && item.status !== 'watched') {
        nextUpdates.status = 'watched';
      } else if (!fullyWatched && item.status === 'watched') {
        nextUpdates.status = 'unwatched';
      }
    }
    const writeUpdates = mapWatchlistUpdatesForWrite(item, nextUpdates);
    try {
      await updateWatchlistItem({
        db,
        appId,
        spaceId,
        itemId: id,
        updates: writeUpdates,
      });
    } catch (err) {
      console.error('Error updating item:', err);
      notifyError("Something didn't save. Try again.");
    }
  };

  const handleDelete = async (id, options = {}) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    const shouldConfirm = !options?.skipConfirm;
    if (
      shouldConfirm &&
      typeof window !== 'undefined' &&
      !window.confirm('Remove this memory?')
    ) {
      return;
    }
    try {
      await deleteWatchlistItem({ db, appId, spaceId, itemId: id });
    } catch (err) {
      console.error('Error deleting:', err);
      notifyError("Couldn't remove that. Try again.");
    }
  };

  const buildUpdatesFromRefreshed = (refreshed = {}) => {
    const updates = {
      schemaVersion: 2,
      source: refreshed.source,
      media: {
        ...refreshed.media,
        poster: refreshed.media?.poster || refreshed.media?.posterUrl || '',
        backdrop:
          refreshed.media?.backdrop || refreshed.media?.backdropUrl || '',
      },
      showData: refreshed.showData || { seasonCount: null, seasons: [] },
    };

    if (refreshed.media?.title) updates.title = refreshed.media.title;
    if (refreshed.media?.type) updates.type = refreshed.media.type;
    if (refreshed.media?.year) updates.year = refreshed.media.year;
    if (Number.isFinite(refreshed.media?.runtimeMinutes)) {
      updates.runtimeMinutes = refreshed.media.runtimeMinutes;
    }
    if (Array.isArray(refreshed.media?.genres)) {
      updates.genres = refreshed.media.genres;
    }
    if (Array.isArray(refreshed.media?.cast)) {
      updates.actors = refreshed.media.cast;
    }
    const refreshedType = refreshed.media?.type || refreshed.type || '';
    const isShow = refreshedType === 'show';
    const primaryCredit =
      (Array.isArray(refreshed.media?.directors) && refreshed.media.directors[0]) ||
      (isShow && Array.isArray(refreshed.media?.creators)
        ? refreshed.media.creators[0]
        : '');
    if (primaryCredit) {
      updates.director = String(primaryCredit).trim();
    }
    if (refreshed.media?.poster || refreshed.media?.posterUrl) {
      updates.poster = refreshed.media.poster || refreshed.media.posterUrl;
    }
    if (refreshed.media?.backdrop || refreshed.media?.backdropUrl) {
      updates.backdrop = refreshed.media.backdrop || refreshed.media.backdropUrl;
    }
    if (Number.isFinite(refreshed.showData?.seasonCount) && refreshed.showData.seasonCount > 0) {
      updates.totalSeasons = refreshed.showData.seasonCount;
    }
    if (Array.isArray(refreshed.showData?.seasons)) {
      updates.seasons = refreshed.showData.seasons;
    }

    return updates;
  };

  const handleRefreshMetadata = async (id) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return;
    }

    const item = items.find((entry) => entry.id === id);
    if (!item?.source?.provider || !item?.source?.providerId) {
      notifyError('This item has no provider metadata source.');
      return;
    }

    try {
      const refreshed = await refreshMediaMetadata({
        provider: item.source.provider,
        providerId: item.source.providerId,
        type: item.type || 'auto',
      });

      await updateWatchlistItem({
        db,
        appId,
        spaceId,
        itemId: id,
        updates: buildUpdatesFromRefreshed(refreshed),
      });
      notifyUpdate('Metadata refreshed.');
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      notifyError('Could not refresh metadata right now.');
    }
  };

  const handleMetadataAudit = () => {
    const report = buildMetadataAuditReport(items);
    if (!report.totalItems) {
      notifyUpdate('Metadata audit: no titles to check.');
      return report;
    }
    if (!report.itemsWithGaps) {
      notifyUpdate(`Metadata audit: all ${report.totalItems} title(s) look complete.`);
      return report;
    }
    notifyUpdate(
      `Metadata audit: ${report.itemsWithGaps}/${report.totalItems} need repair.`,
    );
    return report;
  };

  const handleMetadataRepairMissing = async () => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    if (isMetadataRepairing) return;

    const candidates = items.filter((item) => getMetadataGaps(item).length > 0);
    if (!candidates.length) {
      notifyUpdate('No missing metadata found to repair.');
      return;
    }

    setIsMetadataRepairing(true);
    let repaired = 0;
    let failed = 0;
    try {
      for (const item of candidates) {
        try {
          let provider = String(item?.source?.provider || '').trim();
          let providerId = String(item?.source?.providerId || '').trim();
          let refreshed = null;

          if (!provider || !providerId) {
            const itemType = item?.type === 'show' ? 'show' : 'movie';
            const searchData = await searchMedia({ q: item.title, type: itemType, page: 1 });
            const best = pickBestSearchResult({
              results: searchData?.results,
              title: item.title,
              type: itemType,
              year: item?.year,
            });
            provider = String(best?.provider || '').trim();
            providerId = String(best?.providerId || '').trim();
          }

          if (!provider || !providerId) {
            failed += 1;
            continue;
          }

          refreshed = await refreshMediaMetadata({
            provider,
            providerId,
            type: item?.type || 'auto',
          });

          await updateWatchlistItem({
            db,
            appId,
            spaceId,
            itemId: item.id,
            updates: buildUpdatesFromRefreshed(refreshed),
          });
          repaired += 1;
        } catch (error) {
          console.warn('Metadata repair failed for item:', item?.title, error);
          failed += 1;
        }
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

  const handleBulkDelete = async (ids, options = {}) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return false;
    }
    if (!ids || ids.length === 0) return false;
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
      await bulkDeleteWatchlistItems({
        db,
        appId,
        spaceId,
        itemIds: ids,
      });
      setView('tonight');
      return true;
    } catch (err) {
      console.error('Error deleting items:', err);
      notifyError("Couldn't remove items. Try again.");
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return false;
    }

    const itemIds = items.map((item) => item.id).filter(Boolean);
    setIsWipingSpace(true);

    try {
      if (itemIds.length > 0) {
        await bulkDeleteWatchlistItems({
          db,
          appId,
          spaceId,
          itemIds,
        });
      }

      clearSpaceTrayCache(spaceId);
      setItems([]);
      setContextItems([]);
      setDecisionResult(null);
      setIsImportOpen(false);
      setView('tonight');
      notifyUpdate('Space wiped clean.');
      return true;
    } catch (err) {
      console.error('Error wiping space:', err);
      notifyError("Couldn't clear this space. Try again.");
      return false;
    } finally {
      setIsWipingSpace(false);
    }
  };

  const startDecision = (poolOfItems) => {
    const pool =
      poolOfItems && poolOfItems.length > 0
        ? poolOfItems
        : items.filter((i) => i.status === 'unwatched');

    if (pool.length === 0) return;

    setIsDeciding(true);
    setContextItems(pool);
    setView('decision');

    setTimeout(() => {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      setDecisionResult(randomItem);
      setIsDeciding(false);
    }, 2000);
  };

  return {
    authResolved,
    autoReloadCountdown,
    contextItems,
    decisionResult,
    dismissUpdate,
    errorMessage,
    handleAddItem,
    handleBulkDelete,
    handleCreateSpace,
    handleDeleteAll,
    handleDelete,
    handleExportItems,
    handleImportItems,
    handleInvite,
    handleMarkWatched,
    handleMetadataAudit,
    handleMetadataRepairMissing,
    handleRefreshMetadata,
    handleReloadNow,
    handleSignIn,
    handleSignOut,
    handleUpdateItem,
    isBulkDeleting,
    isBootstrapping,
    isDeciding,
    isImportOpen,
    isMetadataRepairing,
    isSpaceSetupRunning,
    isWipingSpace,
    isSigningIn,
    importProgress,
    items,
    joinError,
    loading,
    newVersionAvailable,
    user,
    setDecisionResult,
    setIsImportOpen,
    setView,
    spaceId,
    spaceName,
    startDecision,
    updateMessage,
    view,
  };
};
