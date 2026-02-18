import React, { useEffect, useMemo, useState } from 'react';
import { DAILY_TRAY_STORAGE_PREFIX } from '../config/constants.js';
import {
  buildTonightTray,
  isTonightTrayValidForPool,
} from '../domain/watchlist.js';
import { isEpisodeWatched } from '../components/ItemDetailsModal/utils/showProgress.js';
import ItemDetailsModal from '../components/ItemDetailsModal.js';
import BottomNav from './components/tonight/BottomNav.js';
import MetadataAuditModal from './components/tonight/MetadataAuditModal.js';
import SuggestionSection from './components/tonight/SuggestionSection.js';
import TonightHeaderMenu from './components/tonight/TonightHeaderMenu.js';
import WipeConfirmModal from './components/tonight/WipeConfirmModal.js';
import { toMillis } from '../utils/time.js';

const getModifiedAt = (item) =>
  toMillis(item?.updatedAt || item?.startedAt || item?.createdAt || item?.timestamp);

const isShowComplete = (item) => {
  const seasons = Array.isArray(item?.seasons) ? item.seasons : [];
  const seasonsWithEpisodes = seasons.filter(
    (season) => Array.isArray(season?.episodes) && season.episodes.length > 0,
  );
  if (!seasonsWithEpisodes.length) return false;
  const progress = item?.episodeProgress || {};
  return seasonsWithEpisodes.every((season) =>
    season.episodes.every((episode) => isEpisodeWatched(progress, episode)),
  );
};

const TonightView = ({
  items,
  onAdd,
  onImport,
  onExport,
  onInvite,
  onDeleteAll,
  onDelete,
  onDecide,
  onToggleStatus,
  onUpdate,
  showDevMetadataTools = false,
  onMetadataAudit,
  onMetadataRepairMissing,
  isMetadataRepairing = false,
  goToShelf,
  importProgress,
  spaceId,
  spaceName,
  isDeletingAll,
  onSignOut,
}) => {
  const unwatched = items.filter((i) => i.status === 'unwatched');
  const currentlyWatchingShows = useMemo(
    () =>
      items
        .filter((item) => {
          if (item?.type !== 'show') return false;
          if (item?.status === 'watched') return false;
          const watchedAny = Object.values(item?.episodeProgress || {}).some(Boolean);
          if (!watchedAny) return false;
          const hasSeasonData =
            Array.isArray(item?.seasons) && item.seasons.some((season) => season?.episodes?.length);
          if (hasSeasonData) return !isShowComplete(item);
          return item?.status === 'watching';
        })
        .sort((a, b) => {
          const delta = getModifiedAt(b) - getModifiedAt(a);
          if (delta !== 0) return delta;
          return a.title.localeCompare(b.title);
        }),
    [items],
  );
  const unwatchedMovies = useMemo(
    () => items.filter((i) => i.type === 'movie' && i.status === 'unwatched'),
    [items],
  );
  const unwatchedShows = useMemo(
    () => items.filter((i) => i.type === 'show' && i.status === 'unwatched'),
    [items],
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  const spaceLabel =
    spaceName && spaceName.trim() ? spaceName.trim() : 'Tonight';
  const activeImportTotal = Number(importProgress?.total || 0);
  const activeImportProcessed = Number(importProgress?.processed || 0);
  const showImportBanner = activeImportTotal > 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const wipePhrase = 'WIPE';
  const canConfirmWipe =
    wipeConfirmText.trim().toUpperCase() === wipePhrase && !isDeletingAll;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const openDetails = (item) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const openAuditModal = async () => {
    setIsAuditModalOpen(true);
    setIsAuditLoading(true);
    try {
      const report = await onMetadataAudit?.();
      setAuditReport(report || null);
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    if (!detailItem) return;
    const updated = items.find((current) => current.id === detailItem.id);
    if (updated && updated !== detailItem) {
      setDetailItem(updated);
    }
  }, [detailItem, items]);

  const buildDailyTray = (pool, type) => {
    if (pool.length === 0) return [];
    const storageKey = `${DAILY_TRAY_STORAGE_PREFIX}:${
      spaceId || 'anon'
    }:${type}:${todayKey}`;

    try {
      const cached = JSON.parse(localStorage.getItem(storageKey) || 'null');
      const ids = Array.isArray(cached?.ids) ? cached.ids : [];
      const byId = new Map(pool.map((item) => [item.id, item]));
      const fromCache = ids.map((id) => byId.get(id)).filter(Boolean);
      if (
        fromCache.length === Math.min(3, pool.length) &&
        isTonightTrayValidForPool(pool, fromCache)
      ) {
        return fromCache;
      }
    } catch (err) {
      console.warn('Failed to read cached tray', err);
    }

    const tray = buildTonightTray(pool);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ids: tray.map((item) => item.id) }),
      );
    } catch (err) {
      console.warn('Failed to cache tray', err);
    }
    return tray;
  };

  const movieSuggestions = useMemo(() => {
    return buildDailyTray(unwatchedMovies, 'movie');
  }, [unwatchedMovies, spaceId, todayKey]);

  const showSuggestions = useMemo(() => {
    return buildDailyTray(unwatchedShows, 'show');
  }, [unwatchedShows, spaceId, todayKey]);

  const handleOpenDeleteAll = () => {
    setWipeConfirmText('');
    setIsWipeConfirmOpen(true);
  };

  const closeWipeModal = () => {
    if (isDeletingAll) return;
    setIsWipeConfirmOpen(false);
    setWipeConfirmText('');
  };

  const confirmDeleteAll = async () => {
    if (!canConfirmWipe || !onDeleteAll) return;
    const didDelete = await onDeleteAll();
    if (didDelete) {
      setIsWipeConfirmOpen(false);
      setWipeConfirmText('');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-500">
      <TonightHeaderMenu
        greeting={greeting}
        spaceLabel={spaceLabel}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onInvite={onInvite}
        onImport={onImport}
        onExport={onExport}
        showDevMetadataTools={showDevMetadataTools}
        openAuditModal={openAuditModal}
        onMetadataRepairMissing={onMetadataRepairMissing}
        isMetadataRepairing={isMetadataRepairing}
        onDeleteAll={onDeleteAll}
        onOpenDeleteAll={handleOpenDeleteAll}
        onSignOut={onSignOut}
      />

      <div className="flex-1 min-h-0 px-3 sm:px-4 pb-6 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 pb-2 overflow-hidden">
          {showImportBanner && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-2 py-1.5 space-y-0.5">
              <div className="text-sm text-amber-200 tabular-nums">
                Importing {activeImportProcessed}/{activeImportTotal}
              </div>
              {importProgress?.isRateLimitedBackoff && (
                <div className="text-xs text-amber-300/90">
                  Retrying after rate limit...
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pb-2">
            <SuggestionSection
              title="Movies"
              pool={unwatchedMovies}
              suggestions={movieSuggestions}
              emptyLabel="No movies queued yet."
              onDecide={(pool) =>
                onDecide?.(pool, {
                  source: 'section',
                  filterType: 'type',
                  filterId: 'movie',
                })
              }
              onToggleStatus={onToggleStatus}
              onOpenDetails={openDetails}
              layout="rail"
              className="shrink-0"
            />
            <SuggestionSection
              title="TV Shows"
              pool={unwatchedShows}
              suggestions={showSuggestions}
              emptyLabel="No shows queued yet."
              onDecide={(pool) =>
                onDecide?.(pool, {
                  source: 'section',
                  filterType: 'type',
                  filterId: 'show',
                })
              }
              onToggleStatus={onToggleStatus}
              onOpenDetails={openDetails}
              layout="rail"
              className="shrink-0"
            />
            <SuggestionSection
              title="Currently Watching"
              pool={currentlyWatchingShows}
              suggestions={currentlyWatchingShows}
              emptyLabel="No shows in progress yet."
              onToggleStatus={onToggleStatus}
              onOpenDetails={openDetails}
              layout="rail"
              hideScrollbar
              showEdgeFade
              railPaddingClassName="px-1"
              hideDecide
              className="shrink-0"
            />
          </div>
        </div>

        <BottomNav onAdd={onAdd} goToShelf={goToShelf} />
      </div>

      <ItemDetailsModal
        isOpen={isDetailOpen}
        item={detailItem}
        onClose={closeDetails}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />

      <MetadataAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        isAuditLoading={isAuditLoading}
        auditReport={auditReport}
      />

      <WipeConfirmModal
        isOpen={isWipeConfirmOpen}
        isDeletingAll={isDeletingAll}
        wipeConfirmText={wipeConfirmText}
        setWipeConfirmText={setWipeConfirmText}
        canConfirmWipe={canConfirmWipe}
        onClose={closeWipeModal}
        onConfirm={confirmDeleteAll}
      />
    </div>
  );
};

export default TonightView;
