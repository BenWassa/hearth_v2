import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Eye,
  Film,
  Heart,
  Moon,
  Plus,
  Search,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import { normalizeSearchText } from '../utils/text.js';
import PosterCard from '../components/cards/PosterCard.js';
import ItemDetailsModal from '../components/ItemDetailsModal.js';

const ShelfView = ({
  items,
  onAdd,
  onToggleStatus,
  onUpdate,
  onDelete,
  onBulkDelete,
  isBulkDeleting = false,
  onBack,
}) => {
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

  const selectedCount = selectedIds.size;
  const isSelectionBusy = isBulkDeleting || isBulkMarking;
  const normalizedQuery = useMemo(
    () => normalizeSearchText(searchQuery),
    [searchQuery],
  );
  const isSearching = normalizedQuery.length > 0;
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openDetails = (item) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

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
    if (didDelete) {
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

  // Apply type filters to unwatched items
  const unwatched = useMemo(() => {
    return items.filter((i) => {
      if (i.status !== 'unwatched') return false;
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
    () => (viewTab === 'memories' ? watchedFiltered : unwatched),
    [viewTab, watchedFiltered, unwatched],
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

      backlog.forEach((item) => {
        const energyId = item.energy || 'balanced';
        if (groups[energyId]) {
          groups[energyId].push(item);
        }
      });

      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.title.localeCompare(b.title));
      });
    } else {
      VIBES.forEach((v) => (groups[v.id] = []));

      backlog.forEach((item) => {
        if (groups[item.vibe]) {
          groups[item.vibe].push(item);
        }
      });

      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.title.localeCompare(b.title));
      });
    }

    return groups;
  };

  // Group/sort unwatched based on sortBy setting
  const itemsByVibe = useMemo(() => {
    return buildGroupedItems(unwatched);
  }, [unwatched, sortBy]);
  const memoriesByGroup = useMemo(() => {
    return buildGroupedItems(watchedFiltered);
  }, [watchedFiltered, sortBy]);

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
      {/* ── Sticky header block: tabs-as-title + filter bar ── */}
      <div className="sticky top-0 z-20">
        {/* Tabs row — doubles as the page header */}
        <header className="px-4 sm:px-5 pt-4 bg-stone-950 border-b border-stone-800/60 flex items-end justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setViewTab('library')}
              className={`pb-3 text-base font-serif tracking-wide transition-colors border-b-2 -mb-px ${
                viewTab === 'library'
                  ? 'text-stone-100 border-amber-500'
                  : 'text-stone-500 border-transparent hover:text-stone-300'
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setViewTab('memories')}
              className={`pb-3 text-base font-serif tracking-wide transition-colors border-b-2 -mb-px ${
                viewTab === 'memories'
                  ? 'text-stone-100 border-amber-500'
                  : 'text-stone-500 border-transparent hover:text-stone-300'
              }`}
            >
              Memories
            </button>
          </div>
          <div className="flex items-center gap-2 pb-2.5">
            <button
              onClick={() => {
                setIsSearchOpen((prev) => {
                  const next = !prev;
                  if (!next) setSearchQuery('');
                  return next;
                });
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isSearchOpen
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-stone-500 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSelectionMode}
              className={`text-xs font-semibold uppercase tracking-widest transition-colors px-2 py-1 rounded-md ${
                selectionMode
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {selectionMode ? 'Done' : 'Select'}
            </button>
          </div>
        </header>

        {/* Search input — expands below header when open */}
        {isSearchOpen && (
          <div className="px-4 sm:px-5 py-2.5 bg-stone-950 border-b border-stone-800/60">
            <div className="flex items-center gap-2.5 bg-stone-900/70 border border-stone-700/60 rounded-xl px-3 py-2 focus-within:border-amber-500/40 transition-colors">
              <Search className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your library…"
                autoFocus
                className="flex-1 bg-transparent text-stone-200 placeholder-stone-500 text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-stone-500 hover:text-stone-200 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sort + Type Filter Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/40 flex items-center gap-3 overflow-x-auto no-scrollbar">
          {/* Sort pill group */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setSortBy('vibe')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                sortBy === 'vibe'
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
            >
              Vibe
            </button>
            <button
              onClick={() => setSortBy('energy')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                sortBy === 'energy'
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
            >
              Energy
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
            >
              A–Z
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-stone-800 shrink-0" />

          {/* Type Filter Buttons */}
          <div className="flex gap-2 shrink-0">
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
              className={`p-2 rounded-lg transition-colors ${
                showMovies && !showShows
                  ? 'bg-stone-800 text-stone-200 ring-1 ring-stone-700'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
              title="Filter by Movies"
            >
              <Film className="w-4 h-4" />
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
              className={`p-2 rounded-lg transition-colors ${
                showShows && !showMovies
                  ? 'bg-stone-800 text-stone-200 ring-1 ring-stone-700'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
              title="Filter by Shows"
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* ── End sticky header block ── */}

      <div className={`px-2 sm:px-3 pt-2 pb-40 ${contentGapClassName}`}>
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
                    {filteredItems.map((item) => (
                      <PosterCard
                        key={item.id}
                        item={item}
                        onToggle={() => onToggleStatus(item.id, item.status)}
                        onDelete={
                          item.status !== 'watched'
                            ? () => onDelete(item.id)
                            : null
                        }
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(item.id)}
                        onSelect={() => toggleSelected(item.id)}
                        onOpenDetails={openDetails}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Categories/Sort Groups */}
                {Object.entries(itemsByVibe).map(([groupId, groupItems]) => {
                  if (groupItems.length === 0) return null;

                  // Determine header based on sort mode
                  let header = null;
                  let HeaderIcon = null;

                  if (sortBy === 'alphabetical') {
                    header = 'All Items';
                  } else if (sortBy === 'energy') {
                    const energyDef = ENERGIES.find((e) => e.id === groupId);
                    if (energyDef) {
                      header = energyDef.label;
                      HeaderIcon = energyDef.icon;
                    }
                  } else {
                    // vibe mode
                    const vibeDef = VIBES.find((v) => v.id === groupId);
                    if (vibeDef) {
                      header = vibeDef.label;
                      HeaderIcon = vibeDef.icon;
                    }
                  }

                  return (
                    <div key={groupId} className={sectionGapClassName}>
                      <div className="flex items-center gap-1.5 pl-0.5 pt-1">
                        {HeaderIcon && (
                          <HeaderIcon className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
                        )}
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                          {header}
                        </h3>
                      </div>
                      <div className={cardGridClassName}>
                        {groupItems.map((item) => (
                          <PosterCard
                            key={item.id}
                            item={item}
                            onToggle={() =>
                              onToggleStatus(item.id, item.status)
                            }
                            onDelete={() => onDelete(item.id)}
                            selectionMode={selectionMode}
                            isSelected={selectedIds.has(item.id)}
                            onSelect={() => toggleSelected(item.id)}
                            onOpenDetails={openDetails}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                  {filteredItems.map((item) => (
                    <PosterCard
                      key={item.id}
                      item={item}
                      onToggle={() => onToggleStatus(item.id, item.status)}
                      onDelete={null}
                      selectionMode={false}
                      isSelected={false}
                      onSelect={null}
                      onOpenDetails={openDetails}
                    />
                  ))}
                </div>
              )
            ) : watched.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-700">
                  <Heart className="w-8 h-8" />
                </div>
                <p className="text-stone-400 font-serif text-lg">
                  No memories yet
                </p>
                <p className="text-stone-400 text-xs mt-2">
                  When you finish watching something, it'll appear here
                </p>
              </div>
            ) : watchedFiltered.length === 0 ? (
              <div className="text-sm text-stone-400 text-center py-12">
                No memories match the current filters.
              </div>
            ) : (
              <>
                {Object.entries(memoriesByGroup).map(([groupId, groupItems]) => {
                  if (groupItems.length === 0) return null;

                  let header = null;
                  let HeaderIcon = null;

                  if (sortBy === 'alphabetical') {
                    header = 'All Items';
                  } else if (sortBy === 'energy') {
                    const energyDef = ENERGIES.find((e) => e.id === groupId);
                    if (energyDef) {
                      header = energyDef.label;
                      HeaderIcon = energyDef.icon;
                    }
                  } else {
                    const vibeDef = VIBES.find((v) => v.id === groupId);
                    if (vibeDef) {
                      header = vibeDef.label;
                      HeaderIcon = vibeDef.icon;
                    }
                  }

                  return (
                    <div key={groupId} className={sectionGapClassName}>
                      <div className="flex items-center gap-1.5 pl-0.5 pt-1">
                        {HeaderIcon && (
                          <HeaderIcon className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
                        )}
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                          {header}
                        </h3>
                      </div>
                      <div className={cardGridClassName}>
                        {groupItems.map((item) => (
                          <PosterCard
                            key={item.id}
                            item={item}
                            onToggle={() =>
                              onToggleStatus(item.id, item.status)
                            }
                            onDelete={null}
                            selectionMode={false}
                            isSelected={false}
                            onSelect={null}
                            onOpenDetails={openDetails}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      <ItemDetailsModal
        isOpen={isDetailOpen}
        item={detailItem}
        onClose={closeDetails}
        onToggleStatus={onToggleStatus}
        onUpdate={onUpdate}
      />

      {isBulkDeleteConfirmOpen && (
        <>
          <button
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm cursor-default"
            onClick={() => setIsBulkDeleteConfirmOpen(false)}
            aria-label="Close confirmation"
          />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-red-800/60 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-300" />
                  <h3 className="text-lg font-serif text-red-100">
                    Delete Selected Titles?
                  </h3>
                </div>
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(false)}
                  className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
                  aria-label="Close confirmation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-stone-300">
                This will remove{' '}
                <span className="font-medium">
                  {selectedCount} selected title{selectedCount === 1 ? '' : 's'}
                </span>{' '}
                from your shelf.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
                  disabled={isBulkDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-700 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {viewTab === 'library' && selectionMode && (
        <div
          className="fixed left-1/2 -translate-x-1/2 bottom-[7.7rem] z-50 max-w-md w-[calc(100%-3rem)]"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto w-fit bg-stone-900/75 backdrop-blur-xl border border-stone-700/60 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/40">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBulkMarkWatched}
                disabled={selectedCount === 0 || isSelectionBusy}
                className="flex flex-col items-center gap-1 text-stone-200 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest">
                  Seen
                </span>
              </button>
              <span className="text-[11px] text-stone-400 min-w-16 text-center">
                {isBulkMarking
                  ? 'Saving...'
                  : isBulkDeleting
                  ? 'Deleting...'
                  : `${selectedCount} selected`}
              </span>
              <button
                onClick={requestBulkDelete}
                disabled={selectedCount === 0 || isSelectionBusy}
                className="flex flex-col items-center gap-1 text-red-300 hover:text-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest">
                  Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav - Tonight, Add & Library */}
      <nav
        className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40 max-w-md w-[calc(100%-3rem)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="bg-stone-900/40 backdrop-blur-2xl border border-stone-700/50 rounded-3xl shadow-2xl shadow-black/40 p-2">
          <div className="flex items-center justify-around gap-2">
            {/* Add Button */}
            <button
              onClick={onAdd}
              className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-white/5 transition-all duration-300 active:scale-95"
              title="Add new item"
            >
              <Plus className="w-6 h-6 text-stone-300 group-hover:text-amber-300 transition-colors" />
              <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-colors">
                Add
              </span>
            </button>

            {/* Tonight Button */}
            <button
              onClick={onBack}
              className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-white/5 transition-all duration-300 active:scale-95"
              title="Back to Tonight"
            >
              <Moon className="w-6 h-6 text-stone-300 group-hover:text-amber-300 transition-colors" />
              <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-colors">
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
