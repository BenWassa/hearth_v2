import React, { useEffect, useMemo, useState } from 'react';
import { isEpisodeWatched } from '../components/ItemDetailsModal/utils/showProgress.js';
import ItemDetailsModal from '../components/ItemDetailsModal.js';
import BottomNav from './components/tonight/BottomNav.js';
import HeroCarousel from './components/tonight/HeroCarousel.js';
import MetadataAuditModal from './components/tonight/MetadataAuditModal.js';
import SuggestionSection from './components/tonight/SuggestionSection.js';
import TonightHeaderMenu from './components/tonight/TonightHeaderMenu.js';
import WipeConfirmModal from './components/tonight/WipeConfirmModal.js';
import { toMillis } from '../utils/time.js';
import { getBackdropSrc } from '../utils/poster.js';

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
    season.episodes.every((episode) =>
      isEpisodeWatched(progress, {
        ...episode,
        seasonNumber:
          episode?.seasonNumber ?? episode?.season_number ?? season?.number,
        number:
          episode?.number ??
          episode?.episodeNumber ??
          episode?.episode_number,
      }),
    ),
  );
};

const hasHeroLogo = (item) =>
  Boolean(
    String(
      item?.logo ||
        item?.logoUrl ||
        item?.media?.logo ||
        item?.media?.logoUrl ||
        '',
    ).trim(),
  );

const hasHeroBackdrop = (item) => Boolean(getBackdropSrc(item));

const SkeletonRail = ({ title, count = 6 }) => (
  <div className="space-y-1.5 shrink-0">
    <div className="h-3 w-28 rounded bg-stone-800/90 animate-pulse" aria-label={title} />
    <div className="relative px-1">
      <div className="pb-1 overflow-x-hidden">
        <div className="flex gap-1.5 min-w-max">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={`${title}-skeleton-${index}`}
              className="w-[clamp(6.53rem,14.4vw,8.55rem)] shrink-0"
            >
              <div className="h-1 w-full bg-stone-700/80 animate-pulse" />
              <div className="aspect-[2/3] w-full bg-stone-900/80 border border-stone-800 animate-pulse" />
              <div className="mt-2 h-3 w-4/5 rounded bg-stone-800/90 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-stone-950/85 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-stone-950/85 to-transparent" />
    </div>
  </div>
);

const TonightView = ({
  items,
  isLoading = false,
  onAdd,
  onImport,
  onExport,
  onInvite,
  onDeleteAll,
  onDelete,
  onToggleStatus,
  onUpdate,
  showDevMetadataTools = false,
  onMetadataAudit,
  onMetadataRepairMissing,
  isMetadataRepairing = false,
  goToShelf,
  importProgress,
  spaceName,
  isDeletingAll,
  onSignOut,
}) => {
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

  const heroItems = useMemo(() => {
    const candidates = [...unwatchedMovies, ...unwatchedShows];
    const withBackdrop = candidates.filter((item) => hasHeroBackdrop(item));
    const withLogo = withBackdrop.filter((item) => hasHeroLogo(item));
    const withoutLogo = withBackdrop.filter((item) => !hasHeroLogo(item));
    return [...withLogo, ...withoutLogo].slice(0, 5);
  }, [unwatchedMovies, unwatchedShows]);
  const showSkeleton = isLoading && items.length === 0;

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
      <div className="flex-1 min-h-0 pb-6 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
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
          <div className="h-[68px]" />

          <div className="px-3 sm:px-4 pt-2 pb-24 flex flex-col gap-5">
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
            {showSkeleton ? (
              <>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-stone-800/60 bg-stone-900/80 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-800/80 to-stone-900/90" />
                  <div className="absolute bottom-5 right-5 h-10 w-28 rounded bg-stone-700/80" />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`hero-dot-skeleton-${index}`}
                        className={`h-1 rounded-full ${
                          index === 0 ? 'w-4 bg-stone-600' : 'w-1.5 bg-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <SkeletonRail title="Currently Watching" />
                <SkeletonRail title="Movies" />
                <SkeletonRail title="TV Shows" />
              </>
            ) : (
              <>
                <HeroCarousel items={heroItems} onOpenDetails={openDetails} />

                {currentlyWatchingShows.length > 0 && (
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
                )}

                <SuggestionSection
                  title="Movies"
                  pool={unwatchedMovies}
                  suggestions={unwatchedMovies}
                  emptyLabel="No movies queued yet."
                  onToggleStatus={onToggleStatus}
                  onOpenDetails={openDetails}
                  layout="rail"
                  hideScrollbar
                  showEdgeFade
                  railPaddingClassName="px-1"
                  hideDecide
                  enableRewind
                  className="shrink-0"
                />
                <SuggestionSection
                  title="TV Shows"
                  pool={unwatchedShows}
                  suggestions={unwatchedShows}
                  emptyLabel="No shows queued yet."
                  onToggleStatus={onToggleStatus}
                  onOpenDetails={openDetails}
                  layout="rail"
                  hideScrollbar
                  showEdgeFade
                  railPaddingClassName="px-1"
                  hideDecide
                  enableRewind
                  className="shrink-0"
                />
              </>
            )}
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
