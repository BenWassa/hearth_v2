import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Film, Heart, Moon, Plus, Search, Tv, X } from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import { normalizeSearchText } from '../utils/text.js';
import Button from '../components/ui/Button.js';
import PosterCard from '../components/cards/PosterCard.js';
import ItemDetailsModal from '../components/ItemDetailsModal.js';

const ShelfView = ({
  items,
  onAdd,
  onToggleStatus,
  onRefreshMetadata,
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
  const [sortBy, setSortBy] = useState('vibe'); // 'vibe', 'energy', or 'alphabetical'
  const [showMovies, setShowMovies] = useState(true);
  const [showShows, setShowShows] = useState(true);
  const [viewTab, setViewTab] = useState('library'); // 'library' or 'memories'

  const selectedCount = selectedIds.size;
  const allIds = useMemo(() => items.map((item) => item.id), [items]);
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
    const didDelete = await onBulkDelete(Array.from(selectedIds));
    if (didDelete) {
      setSelectedIds(new Set());
      setSelectionMode(false);
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
  const searchBaseItems = useMemo(
    () => (viewTab === 'memories' ? watched : unwatched),
    [viewTab, watched, unwatched],
  );
  const filteredItems = useMemo(() => {
    if (!isSearching) return [];
    return searchBaseItems.filter((item) =>
      normalizeSearchText(item.title || '').includes(normalizedQuery),
    );
  }, [isSearching, normalizedQuery, searchBaseItems]);

  // Group/sort unwatched based on sortBy setting
  const itemsByVibe = useMemo(() => {
    if (sortBy === 'alphabetical') {
      // Sort alphabetically - return as single group
      const sorted = [...unwatched].sort((a, b) =>
        a.title.localeCompare(b.title),
      );
      return { alphabetical: sorted };
    } else if (sortBy === 'energy') {
      // Group by energy
      const groups = {};
      ENERGIES.forEach((e) => (groups[e.id] = []));

      unwatched.forEach((item) => {
        const energyId = item.energy || 'balanced';
        if (groups[energyId]) {
          groups[energyId].push(item);
        }
      });

      // Sort within each energy group alphabetically
      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.title.localeCompare(b.title));
      });

      return groups;
    } else {
      // Default: group by vibe
      const groups = {};
      VIBES.forEach((v) => (groups[v.id] = []));
      let others = [];

      unwatched.forEach((item) => {
        if (groups[item.vibe]) {
          groups[item.vibe].push(item);
        } else {
          others.push(item);
        }
      });

      // Sort within each vibe group alphabetically
      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.title.localeCompare(b.title));
      });

      return groups;
    }
  }, [unwatched, sortBy]);

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-6 py-8 bg-stone-950/95 sticky top-0 z-20 border-b border-stone-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-stone-200">
            {viewTab === 'library' ? 'Library' : 'Memories'}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsSearchOpen((prev) => {
                  const next = !prev;
                  if (!next) setSearchQuery('');
                  return next;
                });
              }}
              className={`p-2 rounded-full transition-colors ${
                isSearchOpen
                  ? 'bg-stone-900 text-amber-400'
                  : 'bg-stone-900/40 text-stone-400 hover:text-amber-400'
              }`}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSelectionMode}
              className="text-stone-400 hover:text-amber-400 text-xs uppercase tracking-widest"
            >
              {selectionMode ? 'Done' : 'Select'}
            </button>
          </div>
        </div>
        {isSearchOpen && (
          <div className="mt-5">
            <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your library..."
                autoFocus
                className="flex-1 bg-transparent text-stone-200 placeholder-stone-400 text-sm font-serif focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-stone-400 hover:text-stone-200"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-stone-900 bg-stone-950/50 sticky top-[73px] z-10 flex gap-6">
        <button
          onClick={() => setViewTab('library')}
          className={`pb-2 px-2 font-medium text-sm transition-colors border-b-2 ${
            viewTab === 'library'
              ? 'text-amber-400 border-amber-400'
              : 'text-stone-500 border-transparent hover:text-stone-300'
          }`}
        >
          Library
        </button>
        <button
          onClick={() => setViewTab('memories')}
          className={`pb-2 px-2 font-medium text-sm transition-colors border-b-2 ${
            viewTab === 'memories'
              ? 'text-amber-400 border-amber-400'
              : 'text-stone-500 border-transparent hover:text-stone-300'
          }`}
        >
          Memories {watched.length > 0 && `(${watched.length})`}
        </button>
      </div>

      {/* Sort and Type Filter Buttons - Only show for Library */}
      {viewTab === 'library' && (
        <div className="px-6 py-4 border-b border-stone-900 bg-stone-950/50 sticky top-[120px] z-10 flex items-center gap-3">
          {/* Sort Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('vibe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === 'vibe'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                  : 'bg-stone-900/40 text-stone-400 border border-stone-800 hover:text-stone-300'
              }`}
            >
              By Vibe
            </button>
            <button
              onClick={() => setSortBy('energy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === 'energy'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                  : 'bg-stone-900/40 text-stone-400 border border-stone-800 hover:text-stone-300'
              }`}
            >
              By Energy
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                  : 'bg-stone-900/40 text-stone-400 border border-stone-800 hover:text-stone-300'
              }`}
            >
              A-Z
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-stone-800" />

          {/* Type Filter Buttons */}
          <div className="flex gap-2">
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
              className={`p-1.5 rounded-lg transition-colors ${
                showMovies && !showShows
                  ? 'bg-stone-900/60 text-stone-300 border border-stone-700'
                  : 'bg-stone-900/20 text-stone-400 border border-stone-800 hover:text-stone-500'
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
              className={`p-1.5 rounded-lg transition-colors ${
                showShows && !showMovies
                  ? 'bg-stone-900/60 text-stone-300 border border-stone-700'
                  : 'bg-stone-900/20 text-stone-400 border border-stone-800 hover:text-stone-500'
              }`}
              title="Filter by Shows"
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-6 space-y-10">
        {viewTab === 'library' && (
          <>
            {selectionMode && (
              <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2">
                  <div className="text-sm sm:text-base text-stone-300 font-semibold uppercase tracking-widest">
                    Selected:{' '}
                    <span className="text-lg sm:text-xl text-amber-400 font-bold">
                      {selectedCount}
                    </span>
                  </div>
                  {isBulkDeleting && (
                    <div className="text-xs text-amber-400 bg-amber-900/10 border border-amber-900/30 rounded-lg px-3 py-2 inline-block">
                      Deleting... this can take a moment.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-5 w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto"
                    variant="secondary"
                    onClick={() => {
                      if (
                        selectedCount === allIds.length &&
                        allIds.length > 0
                      ) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(allIds));
                      }
                    }}
                    disabled={allIds.length === 0 || isBulkDeleting}
                  >
                    {selectedCount === allIds.length && allIds.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    variant="danger"
                    onClick={handleBulkDelete}
                    disabled={selectedCount === 0 || isBulkDeleting}
                  >
                    {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              </div>
            )}
            {isSearching ? (
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="text-sm text-stone-400 text-center py-12">
                    No matches yet. Try another title.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {filteredItems.map((item) => (
                      <PosterCard
                        key={item.id}
                        item={item}
                        onToggle={() => onToggleStatus(item.id, item.status)}
                        onDelete={
                          item.status === 'unwatched'
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
                    <div key={groupId} className="space-y-4">
                      <div className="flex items-center gap-2 text-stone-400/80 pl-1">
                        {HeaderIcon && <HeaderIcon className="w-4 h-4" />}
                        <h3 className="text-xs font-bold uppercase tracking-widest">
                          {header}
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
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
          <div className="space-y-6">
            {isSearching ? (
              filteredItems.length === 0 ? (
                <div className="text-sm text-stone-400 text-center py-12">
                  No matches yet. Try another title.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
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
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {watched.map((item) => (
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
            )}
          </div>
        )}
      </div>

      <ItemDetailsModal
        isOpen={isDetailOpen}
        item={detailItem}
        onClose={closeDetails}
        onToggleStatus={onToggleStatus}
        onRefreshMetadata={onRefreshMetadata}
        onUpdate={onUpdate}
      />

      {/* Bottom Nav */}
      <div
        className="mt-auto sticky bottom-0 z-40 w-full border-t border-stone-900 bg-gradient-to-b from-stone-950/0 to-stone-950"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {selectionMode && (
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-stone-400">
              {selectedCount} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={toggleSelectionMode}
                className="text-sm text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedCount === 0 || isBulkDeleting}
                className="px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 disabled:opacity-50 transition-colors"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

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
