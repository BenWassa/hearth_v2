import ShelfEmptyState from './components/ShelfEmptyState.jsx';
import RecentlyRemoved from './RecentlyRemoved.jsx';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  BookOpen,
  Eye,
  Film,
  Moon,
  Plus,
  Search,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import { normalizeSearchText } from '../utils/text.js';
import PosterCard from '../components/cards/PosterCard.jsx';
import {
  lazyWithPrefetch,
  prefetchOnIdle,
  useHasBeenTrue,
} from '../app/lazyWithPrefetch.js';
import Button from '../components/ui/Button.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import {
  FALLBACK_SHELF_GROUP,
  getEffectiveShelfEnergy,
  getEffectiveShelfVibe,
} from '../domain/media/shelfGroups.js';

const ItemDetailsModal = lazyWithPrefetch(() =>
  import('../components/ItemDetailsModal.jsx'),
);

const BulkDeleteDialog = ({ count, isDeleting, onCancel, onConfirm }) => {
  return (
    <Dialog
      onClose={onCancel}
      aria-labelledby="bulk-delete-title"
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))] outline-none"
    >
      <div
        aria-hidden="true"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-stone-950/85"
      />
      <div className="relative bg-stone-900 border border-red-800/60 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-300" />
            <h3
              id="bulk-delete-title"
              className="text-lg font-serif text-stone-100"
            >
              Remove Selected Titles?
            </h3>
          </div>
          <IconButton
            label="Close confirmation"
            onClick={onCancel}
            className="-mr-2 text-stone-400"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>
        <p className="text-sm text-stone-300">
          This will remove{' '}
          <span className="font-medium">
            {count} selected title{count === 1 ? '' : 's'}
          </span>{' '}
          from your shelf. You can restore them from Recently removed for 24
          hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-11"
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            type="button"
            className="min-h-11"
          >
            {isDeleting ? 'Removing...' : 'Remove Selected'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

const FILTER_BUTTON_BASE =
  'min-h-11 px-3 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold tracking-wide transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60';
const SORT_BUTTON_BASE =
  'min-h-11 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60';
const SORT_ACTIVE = 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30';
const SORT_INACTIVE =
  'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50';

const ShelfView = ({
  items,
  onAdd,
  onToggleStatus,
  onUpdate,
  onDelete,
  onBulkDelete,
  isBulkDeleting = false,
  removedItems = [],
  onRestoreRemoved,
  onPurgeRemoved,
  onBack,
  showRemoved = false,
  onOpenRemoved,
}) => {
  const [removalMessage, setRemovalMessage] = useState('');
  useEffect(() => {
    if (!removalMessage) return;
    const timer = setTimeout(() => setRemovalMessage(''), 8000);
    return () => clearTimeout(timer);
  }, [removalMessage]);
  const watched = useMemo(
    () => items.filter((i) => i.status === 'watched'),
    [items],
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkMarking, setIsBulkMarking] = useState(false);
  const [sortBy, setSortBy] = useState('vibe'); // 'vibe', 'energy', or 'alphabetical'
  const [showMovies, setShowMovies] = useState(true);
  const [showShows, setShowShows] = useState(true);
  const [viewTab, setViewTab] = useState('library'); // 'library' or 'memories'

  const hasTabItems =
    viewTab === 'memories'
      ? watched.length > 0
      : items.some((item) => item.status !== 'watched');

  const selectedCount = selectedIds.size;
  const isSelectionBusy = isBulkDeleting || isBulkMarking;
  const normalizedQuery = useMemo(
    () => normalizeSearchText(searchQuery),
    [searchQuery],
  );
  const isSearching = normalizedQuery.length > 0;
  const toggleSelectionMode = () => {
    setRemovalMessage('');
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  };

  const toggleSelected = useCallback((id) => {
    setRemovalMessage('');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const openDetails = useCallback((item) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  useEffect(() => {
    if (!detailItem) return;
    const updated = items.find((current) => current.id === detailItem.id);
    if (updated && updated !== detailItem) {
      setDetailItem(updated);
    }
  }, [detailItem, items]);

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    const didDelete = await onBulkDelete(Array.from(selectedIds), {
      skipConfirm: true,
    });
    if (Array.isArray(didDelete)) {
      const count = didDelete.filter(
        (result) => result.status === 'removed',
      ).length;
      const failures = didDelete.length - count;
      setRemovalMessage(
        `${count} title${count === 1 ? '' : 's'} removed.${
          failures ? ` ${failures} could not be removed. Try again.` : ''
        }`,
      );
      setSelectedIds(
        new Set(
          didDelete
            .filter((result) => result.status !== 'removed')
            .map((result) => result.itemId),
        ),
      );
      setSelectionMode(failures > 0);
      setIsBulkDeleteConfirmOpen(false);
    } else if (didDelete) {
      setSelectedIds(new Set());
      setSelectionMode(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const requestBulkDelete = () => {
    if (selectedCount === 0 || isBulkDeleting) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleBulkMarkWatched = async () => {
    if (!onToggleStatus || selectedCount === 0 || isSelectionBusy) return;
    setIsBulkMarking(true);
    try {
      const selectedItems = items.filter(
        (item) => selectedIds.has(item.id) && item.status !== 'watched',
      );
      await Promise.all(
        selectedItems.map((item) => onToggleStatus(item.id, item.status)),
      );
      setSelectedIds(new Set());
      setSelectionMode(false);
    } finally {
      setIsBulkMarking(false);
    }
  };

  // Active library includes both untouched titles and in-progress shows.
  const libraryItems = useMemo(() => {
    return items.filter((i) => {
      if (i.status === 'watched') return false;
      if (!showMovies && i.type === 'movie') return false;
      if (!showShows && i.type === 'show') return false;
      return true;
    });
  }, [items, showMovies, showShows]);
  const watchedFiltered = useMemo(() => {
    return watched.filter((i) => {
      if (!showMovies && i.type === 'movie') return false;
      if (!showShows && i.type === 'show') return false;
      return true;
    });
  }, [watched, showMovies, showShows]);
  const searchBaseItems = useMemo(
    () => (viewTab === 'memories' ? watchedFiltered : libraryItems),
    [viewTab, watchedFiltered, libraryItems],
  );
  const filteredItems = useMemo(() => {
    if (!isSearching) return [];
    return searchBaseItems.filter((item) =>
      normalizeSearchText(item.title || '').includes(normalizedQuery),
    );
  }, [isSearching, normalizedQuery, searchBaseItems]);
  const contentGapClassName = 'space-y-4';
  const sectionGapClassName = 'space-y-1.5';
  const cardGridClassName =
    'grid [grid-template-columns:repeat(auto-fill,minmax(clamp(5.85rem,12.6vw,7.65rem),1fr))] gap-1.5';

  const buildGroupedItems = (sourceItems = []) => {
    const backlog = sourceItems;
    const groups = {};

    if (sortBy === 'alphabetical') {
      groups.alphabetical = [...backlog].sort((a, b) =>
        a.title.localeCompare(b.title),
      );
    } else if (sortBy === 'energy') {
      ENERGIES.forEach((e) => (groups[e.id] = []));
      groups[FALLBACK_SHELF_GROUP] = [];

      backlog.forEach((item) => {
        const energyId = getEffectiveShelfEnergy(item);
        const targetGroup = groups[energyId] ? energyId : FALLBACK_SHELF_GROUP;
        groups[targetGroup].push(item);
      });

      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.title.localeCompare(b.title));
      });
    } else {
      VIBES.forEach((v) => (groups[v.id] = []));
      groups[FALLBACK_SHELF_GROUP] = [];

      backlog.forEach((item) => {
        const vibeId = getEffectiveShelfVibe(item);
        const targetGroup = groups[vibeId] ? vibeId : FALLBACK_SHELF_GROUP;
        groups[targetGroup].push(item);
      });

      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.title.localeCompare(b.title));
      });
    }

    return groups;
  };

  // Keep per-item handlers stable across search, selection and dialog updates.
  const cardActions = useMemo(
    () =>
      new Map(
        items.map((item) => [
          item.id,
          {
            toggle: () => onToggleStatus(item.id, item.status),
            delete: () => onDelete(item.id),
            select: () => toggleSelected(item.id),
          },
        ]),
      ),
    [items, onToggleStatus, onDelete, toggleSelected],
  );

  const renderShelfItem = (
    item,
    { canDelete = true, canSelect = true } = {},
  ) => {
    return (
      <PosterCard
        key={item.id}
        item={item}
        onToggle={cardActions.get(item.id)?.toggle}
        onDelete={canDelete ? cardActions.get(item.id)?.delete : null}
        selectionMode={canSelect ? selectionMode : false}
        isSelected={canSelect ? selectedIds.has(item.id) : false}
        onSelect={canSelect ? cardActions.get(item.id)?.select : null}
        onOpenDetails={openDetails}
      />
    );
  };

  // Group/sort active library items based on sortBy setting
  const itemsByVibe = useMemo(() => {
    return buildGroupedItems(libraryItems);
  }, [libraryItems, sortBy]);
  const memoriesByGroup = useMemo(() => {
    return buildGroupedItems(watchedFiltered);
  }, [watchedFiltered, sortBy]);

  const getGroupHeader = (groupId) => {
    if (sortBy === 'alphabetical') return { header: null, HeaderIcon: null };
    const definitions = sortBy === 'energy' ? ENERGIES : VIBES;
    const definition = definitions.find((d) => d.id === groupId);
    if (definition) {
      return { header: definition.label, HeaderIcon: definition.icon };
    }
    return { header: 'Unsorted', HeaderIcon: null };
  };

  const renderGroups = (groups, itemOptions) =>
    Object.entries(groups).map(([groupId, groupItems]) => {
      if (groupItems.length === 0) return null;
      const { header, HeaderIcon } = getGroupHeader(groupId);

      return (
        <div key={groupId} className={sectionGapClassName}>
          {header && (
            <div className="flex items-center gap-1.5 pl-0.5 pt-1">
              {HeaderIcon && (
                <HeaderIcon className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
              )}
              <h3 className="text-label font-bold uppercase tracking-[0.14em] text-stone-400">
                {header}
              </h3>
            </div>
          )}
          <div className={cardGridClassName}>
            {groupItems.map((item) => renderShelfItem(item, itemOptions))}
          </div>
        </div>
      );
    });

  const hasOpenedDetails = useHasBeenTrue(isDetailOpen);

  useEffect(() => prefetchOnIdle([ItemDetailsModal]), []);

  if (showRemoved)
    return (
      <RecentlyRemoved
        items={removedItems}
        onRestore={(id) => {
          setRemovalMessage('');
          return onRestoreRemoved(id);
        }}
        onPurge={onPurgeRemoved}
        onBack={() => onBack('shelf')}
      />
    );

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Sticky header block: tabs-as-title + filter bar ── */}
      <div className="sticky top-0 z-20">
        {/* Tabs row, doubles as the page header */}
        <header className="px-4 sm:px-5 pt-[calc(1rem+var(--safe-top))] bg-shell border-b border-stone-800/60 flex items-end justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setViewTab('library')}
              aria-pressed={viewTab === 'library'}
              className={`min-h-11 pb-3 text-base font-serif tracking-wide transition-opacity border-b-2 -mb-px focus:outline-none focus-visible:text-amber-300 ${
                viewTab === 'library'
                  ? 'text-stone-100 border-amber-500'
                  : 'text-stone-400 border-transparent hover:text-stone-200'
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setViewTab('memories')}
              aria-pressed={viewTab === 'memories'}
              className={`min-h-11 pb-3 text-base font-serif tracking-wide transition-opacity border-b-2 -mb-px focus:outline-none focus-visible:text-amber-300 ${
                viewTab === 'memories'
                  ? 'text-stone-100 border-amber-500'
                  : 'text-stone-400 border-transparent hover:text-stone-200'
              }`}
            >
              Memories
            </button>
          </div>
          <div className="flex items-center gap-1 pb-1">
            <button
              onClick={() => {
                setIsSearchOpen((prev) => {
                  const next = !prev;
                  if (!next) setSearchQuery('');
                  return next;
                });
              }}
              className={`min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
                isSearchOpen
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
              aria-label="Search library"
              aria-pressed={isSearchOpen}
              type="button"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSelectionMode}
              className={`min-h-11 min-w-11 text-xs font-semibold uppercase tracking-widest transition-opacity px-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
                selectionMode
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              aria-pressed={selectionMode}
              type="button"
            >
              {selectionMode ? 'Done' : 'Select'}
            </button>
          </div>
        </header>

        {/* Search input, expands below header when open */}
        {isSearchOpen && (
          <div className="px-4 sm:px-5 py-2.5 bg-stone-950 border-b border-stone-800/60">
            <div className="flex items-center gap-2.5 bg-stone-900/70 border border-stone-700/60 rounded-xl px-3 focus-within:border-amber-500/40 transition-opacity">
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your library…"
                aria-label="Search your library"
                autoFocus
                className="flex-1 min-h-11 bg-transparent text-stone-200 placeholder-stone-400 text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="min-h-11 min-w-11 -mr-3 flex items-center justify-center text-stone-400 hover:text-stone-200 transition-opacity rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sort + Type Filter Bar */}
        {hasTabItems && (
          <div className="px-4 sm:px-5 py-1.5 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/40 flex items-center gap-3 overflow-x-auto no-scrollbar">
            {/* Sort pill group */}
            <div
              className="flex gap-2 shrink-0"
              role="group"
              aria-label="Sort by"
            >
              {[
                ['vibe', 'Vibe'],
                ['energy', 'Energy'],
                ['alphabetical', 'A–Z'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSortBy(id)}
                  className={`${SORT_BUTTON_BASE} ${
                    sortBy === id ? SORT_ACTIVE : SORT_INACTIVE
                  }`}
                  aria-pressed={sortBy === id}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-stone-800 shrink-0" />

            {/* Type Filter Buttons */}
            <div
              className="flex gap-2 shrink-0"
              role="group"
              aria-label="Filter by type"
            >
              <button
                onClick={() => {
                  // If clicking movies: if movies are only one shown, reset to both. If both shown, show only movies
                  if (showMovies && !showShows) {
                    // Movies only - reset to both
                    setShowMovies(true);
                    setShowShows(true);
                  } else {
                    // Either both shown or movies not shown - focus on movies only
                    setShowMovies(true);
                    setShowShows(false);
                  }
                }}
                className={`${FILTER_BUTTON_BASE} ${
                  showMovies && !showShows
                    ? 'bg-stone-800 text-stone-200 ring-1 ring-stone-700'
                    : SORT_INACTIVE
                }`}
                aria-pressed={showMovies && !showShows}
                type="button"
              >
                <Film className="w-4 h-4" />
                Movies
              </button>
              <button
                onClick={() => {
                  // If clicking shows: if shows are only one shown, reset to both. If both shown, show only shows
                  if (showShows && !showMovies) {
                    // Shows only - reset to both
                    setShowMovies(true);
                    setShowShows(true);
                  } else {
                    // Either both shown or shows not shown - focus on shows only
                    setShowMovies(false);
                    setShowShows(true);
                  }
                }}
                className={`${FILTER_BUTTON_BASE} ${
                  showShows && !showMovies
                    ? 'bg-stone-800 text-stone-200 ring-1 ring-stone-700'
                    : SORT_INACTIVE
                }`}
                aria-pressed={showShows && !showMovies}
                type="button"
              >
                <Tv className="w-4 h-4" />
                Shows
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── End sticky header block ── */}
      {viewTab === 'library' && (removedItems.length > 0 || removalMessage) && (
        <div className="px-4 text-sm text-stone-300">
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="min-h-8 pt-3"
          >
            {removalMessage && `${removalMessage} Restore within 24 hours.`}
          </p>
          <Button
            variant="ghost"
            className="min-h-11 !pl-0 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            onClick={onOpenRemoved}
          >
            Recently removed
          </Button>
        </div>
      )}

      <div
        className={`${
          hasTabItems ? 'px-2 sm:px-3' : 'px-4 sm:px-5'
        } pt-2 pb-40 ${contentGapClassName}`}
      >
        {viewTab === 'library' && (
          <>
            {isSearching ? (
              <div className={sectionGapClassName}>
                {filteredItems.length === 0 ? (
                  <div className="text-sm text-stone-400 text-center py-12">
                    No matches yet. Try another title.
                  </div>
                ) : (
                  <div className={cardGridClassName}>
                    {filteredItems.map((item) =>
                      renderShelfItem(item, {
                        canDelete: item.status !== 'watched',
                      }),
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {items.length === 0 ? (
                  <ShelfEmptyState
                    title="Your Library is empty"
                    description="Keep the movies and shows you want to watch here."
                    action="Add your first title"
                    onAction={onAdd}
                  />
                ) : libraryItems.length === 0 ? (
                  <ShelfEmptyState
                    title={
                      watched.length === items.length
                        ? 'Everything is watched'
                        : 'No titles match these filters.'
                    }
                    description={
                      watched.length === items.length
                        ? 'Your watched titles are in Memories.'
                        : 'Try showing both movies and shows to see the rest of your shelf.'
                    }
                    action={
                      watched.length === items.length
                        ? 'Add something to watch'
                        : 'Show all titles'
                    }
                    onAction={
                      watched.length === items.length
                        ? onAdd
                        : () => {
                            setShowMovies(true);
                            setShowShows(true);
                          }
                    }
                  />
                ) : (
                  renderGroups(itemsByVibe)
                )}
              </>
            )}
          </>
        )}
        {viewTab === 'memories' && (
          <div className={sectionGapClassName}>
            {isSearching ? (
              filteredItems.length === 0 ? (
                <div className="text-sm text-stone-400 text-center py-12">
                  No matches yet. Try another title.
                </div>
              ) : (
                <div className={cardGridClassName}>
                  {filteredItems.map((item) =>
                    renderShelfItem(item, {
                      canDelete: false,
                      canSelect: false,
                    }),
                  )}
                </div>
              )
            ) : watched.length === 0 ? (
              <ShelfEmptyState
                title="Nothing watched yet"
                description="Titles you mark as watched will appear here."
                action={
                  items.length === 0 ? 'Add your first title' : 'Go to Library'
                }
                onAction={
                  items.length === 0 ? onAdd : () => setViewTab('library')
                }
              />
            ) : watchedFiltered.length === 0 ? (
              <div className="text-sm text-stone-400 text-center py-12">
                No memories match the current filters.
              </div>
            ) : (
              <>
                {renderGroups(memoriesByGroup, {
                  canDelete: false,
                  canSelect: false,
                })}
              </>
            )}
          </div>
        )}
      </div>

      {hasOpenedDetails && (
        <Suspense fallback={null}>
          <ItemDetailsModal
            isOpen={isDetailOpen}
            item={detailItem}
            onClose={closeDetails}
            onToggleStatus={onToggleStatus}
            onUpdate={onUpdate}
          />
        </Suspense>
      )}

      {isBulkDeleteConfirmOpen && (
        <BulkDeleteDialog
          count={selectedCount}
          isDeleting={isBulkDeleting}
          onCancel={() => setIsBulkDeleteConfirmOpen(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {viewTab === 'library' && selectionMode && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(7.7rem+var(--safe-bottom))] z-50 max-w-md w-[calc(100%-3rem)]">
          <div className="mx-auto w-fit bg-stone-900 border border-stone-700 rounded-2xl px-2 py-1.5 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkWatched}
                disabled={selectedCount === 0 || isSelectionBusy}
                className="min-h-11 min-w-11 px-3 flex flex-col items-center justify-center gap-1 rounded-xl text-stone-200 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                type="button"
              >
                <Eye className="w-4 h-4" />
                <span className="text-label uppercase tracking-widest">
                  Seen
                </span>
              </button>
              <span className="text-label text-stone-400 min-w-16 text-center">
                {isBulkMarking
                  ? 'Saving...'
                  : isBulkDeleting
                  ? 'Deleting...'
                  : `${selectedCount} selected`}
              </span>
              <button
                onClick={requestBulkDelete}
                disabled={selectedCount === 0 || isSelectionBusy}
                className="min-h-11 min-w-11 px-3 flex flex-col items-center justify-center gap-1 rounded-xl text-red-300 hover:text-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-label uppercase tracking-widest">
                  Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav - Tonight, Add & Library */}
      <nav className="fixed left-1/2 -translate-x-1/2 bottom-[calc(1.5rem+var(--safe-bottom))] z-40 max-w-md w-[calc(100%-3rem)]">
        <div className="bg-stone-900/40 backdrop-blur-2xl border border-stone-700/50 rounded-3xl shadow-2xl shadow-black/40 p-2">
          <div className="flex items-center justify-around gap-2">
            {/* Add Button */}
            <button
              onClick={onAdd}
              className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-stone-100/5 transition-[opacity,transform] duration-300 motion-safe:active:scale-95"
              title="Add new item"
            >
              <Plus className="w-6 h-6 text-stone-300 group-hover:text-amber-300 transition-opacity" />
              <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-opacity">
                Add
              </span>
            </button>

            {/* Tonight Button */}
            <button
              onClick={onBack}
              className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-stone-100/5 transition-[opacity,transform] duration-300 motion-safe:active:scale-95"
              title="Back to Tonight"
            >
              <Moon className="w-6 h-6 text-stone-300 group-hover:text-amber-300 transition-opacity" />
              <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-opacity">
                Tonight
              </span>
            </button>

            {/* Library Button - Current Page (inactive) */}
            <button
              disabled
              className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-default"
              title="Library"
            >
              <BookOpen className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-bold tracking-wide text-amber-300">
                Library
              </span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default ShelfView;
