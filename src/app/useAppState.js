import { useEffect, useState } from 'react';
import { commitImport } from '../domain/import/importer.js';
import {
  adaptWatchlistItem,
  mapWatchlistUpdatesForWrite,
} from '../domain/media/adapters.js';
import { buildWatchlistPayload } from '../domain/media/schema.js';
import { SPACE_ID_STORAGE_KEY } from '../config/constants.js';
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
  createSpace,
  fetchSpace,
  findUserSpaceByName,
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
import { refreshMediaMetadata } from '../services/mediaApi/client.js';

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
  const [isSpaceSetupRunning, setIsSpaceSetupRunning] = useState(false);
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
    if (!user || !db) {
      notifyError('Sign in with Google to create or join a space.');
      return;
    }
    setIsSpaceSetupRunning(true);
    try {
      const existingSpace = await findUserSpaceByName({
        db,
        appId,
        userId: user.uid,
        name: trimmedName,
      });

      const space =
        existingSpace ||
        (await createSpace({
          db,
          appId,
          name: trimmedName,
          userId: user.uid,
        }));

      localStorage.setItem(SPACE_ID_STORAGE_KEY, space.id);
      setSpaceId(space.id);
      setSpaceName(space.name || trimmedName);
      setView('tonight');
    } catch (err) {
      console.error('Error creating space:', err);
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
    try {
      await commitImport(itemsToImport, async (item) => {
        const payload = buildWatchlistPayload(
          {
            ...item,
            status: item?.status || 'unwatched',
          },
          user.uid,
        );
        return addWatchlistItem({ db, appId, spaceId, payload });
      });
      setIsImportOpen(false);
      setView('tonight');
    } catch (err) {
      console.error('Error importing items:', err);
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

  const handleDelete = async (id) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return;
    }
    if (
      typeof window !== 'undefined' &&
      window.confirm('Remove this memory?')
    ) {
      try {
        await deleteWatchlistItem({ db, appId, spaceId, itemId: id });
      } catch (err) {
        console.error('Error deleting:', err);
        notifyError("Couldn't remove that. Try again.");
      }
    }
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
      if (refreshed.media?.poster || refreshed.media?.posterUrl) {
        updates.poster = refreshed.media.poster || refreshed.media.posterUrl;
      }
      if (refreshed.media?.backdrop || refreshed.media?.backdropUrl) {
        updates.backdrop =
          refreshed.media.backdrop || refreshed.media.backdropUrl;
      }
      if (refreshed.showData?.seasonCount) {
        updates.totalSeasons = refreshed.showData.seasonCount;
      }
      if (Array.isArray(refreshed.showData?.seasons)) {
        updates.seasons = refreshed.showData.seasons;
      }

      await updateWatchlistItem({
        db,
        appId,
        spaceId,
        itemId: id,
        updates,
      });
      notifyUpdate('Metadata refreshed.');
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      notifyError('Could not refresh metadata right now.');
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!db || !spaceId) {
      notifyError('Database not available. Please check your connection.');
      return false;
    }
    if (!ids || ids.length === 0) return false;
    if (
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
    handleDelete,
    handleExportItems,
    handleImportItems,
    handleInvite,
    handleMarkWatched,
    handleRefreshMetadata,
    handleReloadNow,
    handleSignIn,
    handleSignOut,
    handleUpdateItem,
    isBulkDeleting,
    isBootstrapping,
    isDeciding,
    isImportOpen,
    isSpaceSetupRunning,
    isSigningIn,
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
