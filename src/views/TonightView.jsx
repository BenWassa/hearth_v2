import React, { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  Coffee,
  Eye,
  Smile,
  Clock,
  Tv,
  Zap,
} from 'lucide-react';
import { isShowFullyWatched } from '../components/ItemDetailsModal/utils/showProgress.js';
import ItemDetailsModal from '../components/ItemDetailsModal.jsx';
import BottomNav from './components/tonight/BottomNav.jsx';
import HeroCarousel from './components/tonight/HeroCarousel.jsx';
import MetadataAuditModal from './components/tonight/MetadataAuditModal.jsx';
import { balanceRows } from './components/tonight/sectionBalance.js';
import SuggestionSection from './components/tonight/SuggestionSection.jsx';
import TonightHeaderMenu from './components/tonight/TonightHeaderMenu.jsx';
import WipeConfirmModal from './components/tonight/WipeConfirmModal.jsx';
import { toMillis } from '../utils/time.js';
import { getBackdropSrc } from '../utils/poster.js';

const getModifiedAt = (item) =>
  toMillis(
    item?.updatedAt || item?.startedAt || item?.createdAt || item?.timestamp,
  );

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

// Creates a stable daily shuffle that is unique per category (salt)
const getStableShuffled = (items, saltStr = '') => {
  if (!items || items.length <= 1) return items;

  const today = new Date();
  // Base seed: YYYYMMDD (Changes at midnight)
  const baseSeed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Convert the category name into a simple number to offset the seed
  let salt = 0;
  for (let i = 0; i < saltStr.length; i++) {
    salt += saltStr.charCodeAt(i);
  }

  const seed = baseSeed + salt;

  // Predictable pseudo-random number generator
  const seededRandom = (index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  // Sort using the seeded value
  return [...items].sort(
    (a, b) => seededRandom(items.indexOf(a)) - seededRandom(items.indexOf(b)),
  );
};

const SkeletonRail = ({ title, count = 6 }) => (
  <div className="space-y-1.5 shrink-0">
    <div
      className="h-3 w-28 rounded bg-stone-800/90 animate-pulse"
      aria-label={title}
    />
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
  spaceId,
  userSpaces = [],
  onSwitchSpace,
  onAddSpace,
  isDeletingAll,
  onSignOut,
  showUtilityMenu = true,
  showSignOut = true,
  isTemplateSession = false,
}) => {
  const currentlyWatchingShows = useMemo(
    () =>
      items
        .filter((item) => {
          if (item?.type !== 'show') return false;
          if (item?.status === 'watched') return false;
          if (item?.status === 'watching') return true;
          const watchedAny = Object.values(item?.episodeProgress || {}).some(
            Boolean,
          );
          if (!watchedAny) return false;
          const hasSeasonData =
            Array.isArray(item?.seasons) &&
            item.seasons.some((season) => season?.episodes?.length);
          if (hasSeasonData) return !isShowFullyWatched(item);
          return item?.status === 'watching';
        })
        .sort((a, b) => {
          const delta = getModifiedAt(b) - getModifiedAt(a);
          if (delta !== 0) return delta;
          return a.title.localeCompare(b.title);
        }),
    [items],
  );

  const unwatched = useMemo(
    () => items.filter((i) => i.status === 'unwatched'),
    [items],
  );

  // 1. Low friction, easy viewing
  const comfortWatches = useMemo(() => {
    const filtered = unwatched.filter(
      (i) => i.vibe === 'comfort' || i.energy === 'light',
    );
    return getStableShuffled(filtered, 'comfort');
  }, [unwatched]);

  // 2. High attention, gripping narratives
  const focusedWatches = useMemo(() => {
    const filtered = unwatched.filter(
      (i) => i.energy === 'focused' || i.vibe === 'gripping',
    );
    return getStableShuffled(filtered, 'focused');
  }, [unwatched]);

  // 3. 30 mins or less (Great for weeknights)
  const quickBites = useMemo(() => {
    const filtered = unwatched.filter(
      (i) => i.type === 'show' && (i.runtimeMinutes <= 35 || i.runtime <= 35),
    );
    return getStableShuffled(filtered, 'quick');
  }, [unwatched]);

  // 4. Guaranteed laughs
  const comedies = useMemo(() => {
    const filtered = unwatched.filter(
      (i) =>
        i.vibe !== 'gripping' &&
        i.vibe !== 'visual' &&
        Array.isArray(i.genres) &&
        i.genres.some((g) => g.toLowerCase().includes('comedy')),
    );
    return getStableShuffled(filtered, 'comedy');
  }, [unwatched]);

  // 5. Visually stunning films
  const visualMovies = useMemo(() => {
    const filtered = unwatched.filter(
      (i) => i.type === 'movie' && i.vibe === 'visual',
    );
    return getStableShuffled(filtered, 'visual');
  }, [unwatched]);

  // 6. Classic films
  const classicMovies = useMemo(() => {
    const filtered = unwatched.filter(
      (i) => i.type === 'movie' && i.vibe === 'classic',
    );
    return getStableShuffled(filtered, 'classic');
  }, [unwatched]);

  const [
    uniqueComfortWatches,
    uniqueComedies,
    uniqueQuickBites,
    uniqueFocusedWatches,
    uniqueVisualMovies,
    uniqueClassicMovies,
  ] = useMemo(
    () =>
      balanceRows([
        comfortWatches,
        comedies,
        quickBites,
        focusedWatches,
        visualMovies,
        classicMovies,
      ]),
    [
      comfortWatches,
      comedies,
      quickBites,
      focusedWatches,
      visualMovies,
      classicMovies,
    ],
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
    const candidates = unwatched;
    const withBackdrop = candidates.filter((item) => hasHeroBackdrop(item));
    const withLogo = withBackdrop.filter((item) => hasHeroLogo(item));
    const withoutLogo = withBackdrop.filter((item) => !hasHeroLogo(item));
    const ordered = [...withLogo, ...withoutLogo];

    return getStableShuffled(ordered, 'hero').slice(0, 5);
  }, [unwatched]);
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
            spaceId={spaceId}
            userSpaces={userSpaces}
            onSwitchSpace={onSwitchSpace}
            onAddSpace={onAddSpace}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            onImport={onImport}
            onExport={onExport}
            showDevMetadataTools={showDevMetadataTools}
            openAuditModal={openAuditModal}
            onDeleteAll={onDeleteAll}
            onOpenDeleteAll={handleOpenDeleteAll}
            onSignOut={onSignOut}
            showUtilityMenu={showUtilityMenu}
            showSignOut={showSignOut}
            isTemplateSession={isTemplateSession}
          />
          <div style={{ height: 'calc(68px + env(safe-area-inset-top))' }} />

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
                          index === 0
                            ? 'w-4 bg-stone-600'
                            : 'w-1.5 bg-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <SkeletonRail title="Currently Watching" />
                <SkeletonRail title="Easy & Comforting" />
                <SkeletonRail title="Need a Laugh" />
              </>
            ) : (
              <>
                <HeroCarousel items={heroItems} onOpenDetails={openDetails} />

                {currentlyWatchingShows.length > 0 && (
                  <SuggestionSection
                    title="Currently Watching"
                    Icon={Tv}
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

                {/* --- New Thematic Sections --- */}

                {uniqueComfortWatches.length > 0 && (
                  <SuggestionSection
                    title="Easy & Comforting"
                    Icon={Coffee}
                    size="md"
                    pool={uniqueComfortWatches}
                    suggestions={uniqueComfortWatches}
                    emptyLabel="Nothing light queued right now."
                    onToggleStatus={onToggleStatus}
                    onOpenDetails={openDetails}
                    layout="rail"
                    hideScrollbar
                    showEdgeFade
                    railPaddingClassName="px-1"
                    enableRewind
                    className="shrink-0"
                  />
                )}

                {uniqueComedies.length > 0 && (
                  <SuggestionSection
                    title="Need a Laugh"
                    Icon={Smile}
                    size="md"
                    pool={uniqueComedies}
                    suggestions={uniqueComedies}
                    emptyLabel="No comedies queued up."
                    onToggleStatus={onToggleStatus}
                    onOpenDetails={openDetails}
                    layout="rail"
                    hideScrollbar
                    showEdgeFade
                    railPaddingClassName="px-1"
                    enableRewind
                    className="shrink-0"
                  />
                )}

                {uniqueQuickBites.length > 0 && (
                  <SuggestionSection
                    title="Quick Bites"
                    Icon={Clock}
                    size="sm"
                    pool={uniqueQuickBites}
                    suggestions={uniqueQuickBites}
                    emptyLabel="No short episodes available."
                    onToggleStatus={onToggleStatus}
                    onOpenDetails={openDetails}
                    layout="rail"
                    hideScrollbar
                    showEdgeFade
                    railPaddingClassName="px-1"
                    enableRewind
                    className="shrink-0"
                  />
                )}

                {uniqueFocusedWatches.length > 0 && (
                  <SuggestionSection
                    title="Deep Dives"
                    Icon={Zap}
                    size="lg"
                    pool={uniqueFocusedWatches}
                    suggestions={uniqueFocusedWatches}
                    emptyLabel="No intense watches queued."
                    onToggleStatus={onToggleStatus}
                    onOpenDetails={openDetails}
                    layout="rail"
                    hideScrollbar
                    showEdgeFade
                    railPaddingClassName="px-1"
                    enableRewind
                    className="shrink-0"
                  />
                )}

                {uniqueVisualMovies.length > 0 && (
                  <SuggestionSection
                    title="Spectacles"
                    Icon={Eye}
                    size="lg"
                    pool={uniqueVisualMovies}
                    suggestions={uniqueVisualMovies}
                    emptyLabel="No visually driven films right now."
                    onToggleStatus={onToggleStatus}
                    onOpenDetails={openDetails}
                    layout="rail"
                    hideScrollbar
                    showEdgeFade
                    railPaddingClassName="px-1"
                    enableRewind
                    className="shrink-0"
                  />
                )}

                {uniqueClassicMovies.length > 0 && (
                  <SuggestionSection
                    title="The Classics"
                    Icon={Armchair}
                    size="lg"
                    pool={uniqueClassicMovies}
                    suggestions={uniqueClassicMovies}
                    emptyLabel="No classics queued up."
                    onToggleStatus={onToggleStatus}
                    onOpenDetails={openDetails}
                    layout="rail"
                    hideScrollbar
                    showEdgeFade
                    railPaddingClassName="px-1"
                    enableRewind
                    className="shrink-0"
                  />
                )}
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
        onMetadataRepairMissing={onMetadataRepairMissing}
        isMetadataRepairing={isMetadataRepairing}
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
