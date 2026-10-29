import { allocateTonightThemes } from '../domain/media/tonightClassification.js';
import { composeTonightRows } from '../domain/media/tonightComposition.js';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Armchair,
  Coffee,
  Eye,
  Smile,
  Clock,
  Zap,
  Moon,
  Flame,
} from 'lucide-react';
import { isShowFullyWatched } from '../components/ItemDetailsModal/utils/showProgress.js';
import ShelfEmptyState from './components/ShelfEmptyState.jsx';
import BottomNav from './components/tonight/BottomNav.jsx';
import CollectionsRail from './components/tonight/CollectionsRail.jsx';
import WorldsRail from './components/tonight/WorldsRail.jsx';
import CollectionsBrowseView from './CollectionsBrowseView.jsx';
import ComingSoonRail from './components/tonight/ComingSoonRail.jsx';
import HeroCarousel from './components/tonight/HeroCarousel.jsx';
import SuggestionSection from './components/tonight/SuggestionSection.jsx';
import TonightHeaderMenu from './components/tonight/TonightHeaderMenu.jsx';
import {
  lazyWithPrefetch,
  prefetchOnIdle,
  useHasBeenTrue,
} from '../app/lazyWithPrefetch.js';
import { getUpcomingReleases } from './components/tonight/upcomingReleases.js';
import { buildCollectionRollups } from '../domain/media/collections.js';
import {
  isFeatureFilm,
  filterEligibleCollections,
  distinctShelfItems,
} from '../domain/media/collectionEligibility.js';
import { toMillis } from '../utils/time.js';
import { getBackdropSrc } from '../utils/poster.js';

const ItemDetailsModal = lazyWithPrefetch(() =>
  import('../components/ItemDetailsModal.jsx'),
);
const SagaPage = lazyWithPrefetch(() => import('../components/SagaPage.jsx'));
const MetadataAuditModal = lazyWithPrefetch(() =>
  import('./components/tonight/MetadataAuditModal.jsx'),
);
const WipeConfirmModal = lazyWithPrefetch(() =>
  import('./components/tonight/WipeConfirmModal.jsx'),
);

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

// Presentation for each composed Tonight row key. Titles come from the
// composition module; this only adds the icon, card size and empty label.
// `mixed` (compact libraries) and `unknown` (fallback) share a neutral icon.
const DEFAULT_ROW_CONFIG = {
  Icon: Moon,
  size: 'md',
  emptyLabel: 'Nothing queued right now.',
};
const ROW_CONFIG = {
  comfort: {
    Icon: Coffee,
    size: 'md',
    emptyLabel: 'Nothing light queued right now.',
  },
  comedy: { Icon: Smile, size: 'md', emptyLabel: 'No comedies queued up.' },
  hooked: {
    Icon: Flame,
    size: 'lg',
    emptyLabel: 'No plot-driven watches queued.',
  },
  quick: {
    Icon: Clock,
    size: 'sm',
    emptyLabel: 'No short episodes available.',
  },
  focused: { Icon: Zap, size: 'lg', emptyLabel: 'No intense watches queued.' },
  visual: {
    Icon: Eye,
    size: 'lg',
    emptyLabel: 'No visually driven films right now.',
  },
  classic: {
    Icon: Armchair,
    size: 'lg',
    emptyLabel: 'No classics queued up.',
  },
  mixed: DEFAULT_ROW_CONFIG,
  unknown: DEFAULT_ROW_CONFIG,
};

// Local-date seed (YYYYMMDD, changes at local midnight) for daily shuffled
// item ordering within rows. Thematic row display order stays fixed.
const getLocalDateSeed = (date = new Date()) =>
  String(
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate(),
  );

// Creates a stable daily shuffle that is unique per category (salt)
const getStableShuffled = (items, saltStr = '') => {
  if (!items || items.length <= 1) return items;

  const today = new Date();
  // Base seed: YYYYMMDD (Changes at midnight)
  const baseSeed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

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
  onAddItem,
  showDevMetadataTools = false,
  onMetadataAudit,
  onMetadataRefreshAll,
  backgroundAuditReport = null,
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
  loadTemplateScenario,
  templateScenario,
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

  const upcomingReleases = useMemo(
    () => getUpcomingReleases(items).slice(0, 12),
    [items],
  );

  const unwatched = useMemo(
    () => items.filter((i) => i.status === 'unwatched'),
    [items],
  );

  const rawCollections = useMemo(
    () =>
      buildCollectionRollups(
        distinctShelfItems(items).filter(isFeatureFilm),
      ).filter((entry) => entry?.type === 'collection'),
    [items],
  );
  // Editorial defaults only: there are no household overrides to wait for, so
  // sagas and Worlds render immediately.
  const collections = useMemo(
    () => filterEligibleCollections(rawCollections),
    [rawCollections],
  );
  const [isCollectionsBrowseOpen, setIsCollectionsBrowseOpen] = useState(false);
  const [browseWorldId, setBrowseWorldId] = useState(null);
  const collectionsOpener = useRef(null);
  const browseCollections = (event) => {
    collectionsOpener.current = event?.currentTarget || null;
    event?.currentTarget?.focus({ preventScroll: true });
    setBrowseWorldId(null);
    setIsCollectionsBrowseOpen(true);
  };
  const openWorld = (worldId, opener) => {
    collectionsOpener.current = opener;
    setBrowseWorldId(worldId);
    setIsCollectionsBrowseOpen(true);
  };

  const closeCollectionsBrowse = () => {
    setIsCollectionsBrowseOpen(false);
    // The background becomes inert before Dialog's mount effect can capture its
    // opener in real browsers. Restore the saved control after removing inert.
    requestAnimationFrame(() => {
      if (collectionsOpener.current?.isConnected)
        collectionsOpener.current.focus({ preventScroll: true });
    });
  };

  // Thematic rows: one primary theme per title, then bounded and ordered by the
  // composer. Items within every row use only the daily seeded shuffle.
  const tonightDateSeed = getLocalDateSeed();
  const tonight = useMemo(() => {
    const now = new Date();
    return composeTonightRows(allocateTonightThemes(unwatched, { now }), {
      sessionSeed: tonightDateSeed,
    });
  }, [unwatched, tonightDateSeed]);
  const tonightRows = tonight.rows;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [collectionDetail, setCollectionDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  // Seed the modal with the latest silent background audit so gaps are visible
  // instantly; the open handler still kicks off a fresh on-demand audit.
  const openAuditModalReport = auditReport || backgroundAuditReport;

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

  const openDetails = useCallback((item) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  }, []);

  // A card on Tonight passes itself so closing the saga returns focus to it
  // once the background is no longer inert; opens from the browser pass none.
  const collectionOpener = useRef(null);
  const openCollection = useCallback((collection, opener = null) => {
    collectionOpener.current = opener;
    setCollectionDetail(collection);
    setIsCollectionOpen(true);
  }, []);

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const closeCollection = () => {
    setIsCollectionOpen(false);
    setCollectionDetail(null);
    requestAnimationFrame(() => {
      if (collectionOpener.current?.isConnected)
        collectionOpener.current.focus({ preventScroll: true });
    });
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

  const hasOpenedDetails = useHasBeenTrue(isDetailOpen);
  // Worlds sit after the first suggestion rail so decision content comes first.
  // The Classics row never anchors them (Collections sits directly above it).
  const worldsAfter =
    currentlyWatchingShows.length > 0
      ? 'currently'
      : tonightRows.find((row) => row.key !== 'classic')?.key || 'top';
  const worldsRail = (
    <WorldsRail
      collections={collections}
      items={items}
      onOpenWorld={openWorld}
    />
  );

  const collectionsRail = (
    <CollectionsRail
      collections={collections}
      items={items}
      onOpenCollection={openCollection}
      onBrowse={browseCollections}
    />
  );
  const hasClassicRow = tonightRows.some((row) => row.key === 'classic');
  // Empty state only when there is truly nothing to watch tonight: no themed
  // rows, nothing in progress and no hero artwork to show.
  const showEmptyState =
    tonight.isEmpty &&
    currentlyWatchingShows.length === 0 &&
    heroItems.length === 0;

  const hasOpenedCollection = useHasBeenTrue(isCollectionOpen);
  const hasOpenedAudit = useHasBeenTrue(isAuditModalOpen);
  const hasOpenedWipe = useHasBeenTrue(isWipeConfirmOpen);

  useEffect(() => prefetchOnIdle([ItemDetailsModal, SagaPage]), []);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div
        aria-hidden={isCollectionsBrowseOpen || undefined}
        inert={isCollectionsBrowseOpen ? '' : undefined}
        className="flex-1 min-h-0 pb-6 flex flex-col overflow-hidden"
      >
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
            loadTemplateScenario={loadTemplateScenario}
            templateScenario={templateScenario}
          />
          {/* Clears the fixed header, which itself sits below the cutout. */}
          <div className="h-[calc(68px+var(--safe-top))]" />

          <div
            className={`${
              showEmptyState ? 'px-4 sm:px-5' : 'px-3 sm:px-4'
            } pt-2 pb-24 flex flex-col gap-5`}
          >
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
                  <div className="absolute inset-0 bg-stone-900" />
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

                {worldsAfter === 'top' && worldsRail}

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

                {worldsAfter === 'currently' && worldsRail}

                <ComingSoonRail
                  releases={upcomingReleases}
                  onOpenDetails={openDetails}
                />

                {/* --- Thematic rows (composed, MECE) --- */}

                {showEmptyState && (
                  <ShelfEmptyState
                    illustration="/assets/empty-states/tonight.png"
                    title={
                      items.length === 0
                        ? 'Nothing added yet'
                        : 'Nothing unwatched right now'
                    }
                    action={
                      items.length === 0
                        ? 'Add your first title'
                        : 'Add something to watch'
                    }
                    onAction={onAdd}
                  />
                )}

                {tonightRows.map((row) => {
                  const config = ROW_CONFIG[row.key] || DEFAULT_ROW_CONFIG;
                  return (
                    <React.Fragment key={row.key}>
                      {row.key === 'classic' && collectionsRail}
                      <SuggestionSection
                        title={row.title}
                        Icon={config.Icon}
                        size={config.size}
                        pool={row.items}
                        suggestions={row.items}
                        emptyLabel={config.emptyLabel}
                        onToggleStatus={onToggleStatus}
                        onOpenDetails={openDetails}
                        layout="rail"
                        hideScrollbar
                        showEdgeFade
                        railPaddingClassName="px-1"
                        className="shrink-0"
                      />
                      {worldsAfter === row.key && worldsRail}
                    </React.Fragment>
                  );
                })}

                {!hasClassicRow && collectionsRail}
              </>
            )}
          </div>
        </div>

        <BottomNav onAdd={onAdd} goToShelf={goToShelf} />
      </div>

      {hasOpenedDetails && (
        <Suspense fallback={null}>
          <ItemDetailsModal
            isOpen={isDetailOpen}
            item={detailItem}
            onClose={closeDetails}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            onAddItem={onAddItem}
            onUpdate={onUpdate}
          />
        </Suspense>
      )}

      {hasOpenedCollection && (
        <Suspense fallback={null}>
          <SagaPage
            isOpen={isCollectionOpen}
            householdItems={items}
            collection={
              collections.find((entry) => entry.id === collectionDetail?.id) ||
              collectionDetail
            }
            onClose={closeCollection}
            onOpenItem={openDetails}
          />
        </Suspense>
      )}

      {hasOpenedAudit && (
        <Suspense fallback={null}>
          <MetadataAuditModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
            isAuditLoading={isAuditLoading}
            auditReport={openAuditModalReport}
            onMetadataRefreshAll={onMetadataRefreshAll}
            isMetadataRepairing={isMetadataRepairing}
          />
        </Suspense>
      )}

      {isCollectionsBrowseOpen && (
        <CollectionsBrowseView
          collections={collections}
          items={items}
          initialWorldId={browseWorldId}
          onOpenItem={openDetails}
          onClose={closeCollectionsBrowse}
          onOpenCollection={openCollection}
        />
      )}

      {hasOpenedWipe && (
        <Suspense fallback={null}>
          <WipeConfirmModal
            isOpen={isWipeConfirmOpen}
            isDeletingAll={isDeletingAll}
            wipeConfirmText={wipeConfirmText}
            setWipeConfirmText={setWipeConfirmText}
            canConfirmWipe={canConfirmWipe}
            onClose={closeWipeModal}
            onConfirm={confirmDeleteAll}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TonightView;
