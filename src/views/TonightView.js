import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Moon,
  Menu,
  X,
  Check,
  Plus,
  BookOpen,
  Zap,
} from 'lucide-react';
import {
  VIBES,
  ENERGIES,
  DAILY_TRAY_STORAGE_PREFIX,
} from '../config/constants.js';
import { APP_VERSION } from '../version';
import { buildTonightTray } from '../domain/watchlist.js';
import ItemCard from '../components/cards/ItemCard.js';
import ItemDetailsModal from '../components/ItemDetailsModal.js';

const TonightView = ({
  items,
  onAdd,
  onImport,
  onExport,
  onInvite,
  onDecide,
  onToggleStatus,
  onRefreshMetadata,
  onUpdate,
  goToShelf,
  spaceId,
  spaceName,
  onSignOut,
}) => {
  const unwatched = items.filter((i) => i.status === 'unwatched');
  const unwatchedMovies = useMemo(
    () => unwatched.filter((i) => i.type === 'movie'),
    [unwatched],
  );
  const unwatchedShows = useMemo(
    () => unwatched.filter((i) => i.type === 'show'),
    [unwatched],
  );
  const spaceLabel =
    spaceName && spaceName.trim() ? spaceName.trim() : 'Tonight';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [pickFilterMode, setPickFilterMode] = useState(null); // 'vibe', 'energy', or null
  const [pickFilters, setPickFilters] = useState({
    vibe: null,
    energy: null,
    type: null, // 'movie' or 'show'
  });
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [localPickError, setLocalPickError] = useState('');
  const todayKey = new Date().toISOString().slice(0, 10);

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
      if (fromCache.length === Math.min(3, pool.length)) {
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

  // Logic to generate the "Tonight Tray"
  // We want 1 Light, 1 Balanced, 1 Focused if available, otherwise fallback to random
  const movieSuggestions = useMemo(() => {
    return buildDailyTray(unwatchedMovies, 'movie');
  }, [unwatchedMovies, spaceId, todayKey]);
  const showSuggestions = useMemo(() => {
    return buildDailyTray(unwatchedShows, 'show');
  }, [unwatchedShows, spaceId, todayKey]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-500">
      {isMenuOpen && (
        <button
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
      <header className="px-6 py-8 flex justify-between items-start">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">
            {getGreeting()}
          </p>
          <h2
            className="text-3xl font-serif text-stone-100 max-w-full"
            title={spaceLabel}
            aria-label={spaceLabel}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {spaceLabel}
          </h2>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`p-2 rounded-full transition-colors ${
              isMenuOpen
                ? 'bg-stone-900 text-amber-400'
                : 'bg-stone-900/50 text-stone-400 hover:text-stone-200'
            }`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-stone-950 border border-stone-800 rounded-xl shadow-2xl overflow-hidden z-30"
              role="menu"
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onInvite();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Invite partner
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onImport();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onExport();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Export
              </button>
              <div className="px-4 py-3 text-xs text-stone-400 border-t border-stone-900">
                Version {APP_VERSION}
              </div>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onSignOut();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 transition-colors border-t border-stone-900"
                role="menuitem"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 space-y-8 overflow-y-auto pb-32">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Movies
              </h3>
              {unwatchedMovies.length > 0 && (
                <button
                  onClick={() => onDecide(unwatchedMovies)}
                  className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Pick for us
                </button>
              )}
            </div>
            {movieSuggestions.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {movieSuggestions.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => onToggleStatus(item.id, item.status)}
                    minimal={false}
                    onOpenDetails={openDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-3 opacity-70 bg-stone-900/30 border border-stone-800 rounded-xl">
                <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-stone-400">
                  <Moon className="w-5 h-5" />
                </div>
                <p className="text-xs text-stone-400">No movies queued yet.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
                TV Shows
              </h3>
              {unwatchedShows.length > 0 && (
                <button
                  onClick={() => onDecide(unwatchedShows)}
                  className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Pick for us
                </button>
              )}
            </div>
            {showSuggestions.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {showSuggestions.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => onToggleStatus(item.id, item.status)}
                    minimal={false}
                    onOpenDetails={openDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-3 opacity-70 bg-stone-900/30 border border-stone-800 rounded-xl">
                <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-stone-400">
                  <Moon className="w-5 h-5" />
                </div>
                <p className="text-xs text-stone-400">No shows queued yet.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Pick for us Header */}
            <div className="flex items-center justify-center gap-2 px-2 py-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-serif text-amber-200">Pick for us</h4>
            </div>

            {/* Featured Pick CTA */}
            <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/10 border border-amber-500/30 rounded-2xl p-2 mt-0 space-y-2">
              {/* Quick pick options: 3 columns, 1 row */}
              <div className="flex gap-4">
                {/* Random */}
                <button
                  onClick={() => {
                    onDecide();
                  }}
                  className="flex-1 min-h-[56px] py-0 px-5 rounded-lg bg-amber-600/20 border border-amber-600/40 text-amber-300 hover:bg-amber-600/30 text-sm font-semibold uppercase tracking-wide transition-colors active:scale-95"
                  title="Pick a random item from all unwatched"
                >
                  Random
                </button>

                {/* Vibe */}
                <button
                  onClick={() => {
                    setLocalPickError('');
                    setPickFilterMode('vibe');
                    setIsPickModalOpen(true);
                  }}
                  className="flex-1 min-h-[56px] py-0 px-5 rounded-lg bg-stone-900/40 border border-stone-700 text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 text-sm font-semibold uppercase tracking-wide transition-colors active:scale-95"
                  title="Pick by vibe preference"
                >
                  Vibe
                </button>

                {/* Energy */}
                <button
                  onClick={() => {
                    setPickFilterMode('energy');
                    setIsPickModalOpen(true);
                  }}
                  className="flex-1 min-h-[56px] py-0 px-5 rounded-lg bg-stone-900/40 border border-stone-700 text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 text-sm font-semibold uppercase tracking-wide transition-colors active:scale-95"
                  title="Pick by energy level"
                >
                  Energy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav - Add, Tonight & Library */}
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

              {/* Tonight Button - Current Page (inactive) */}
              <button
                disabled
                className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-default"
                title="Tonight"
              >
                <Moon className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold tracking-wide text-amber-300">
                  Tonight
                </span>
              </button>

              {/* Library Button */}
              <button
                onClick={goToShelf}
                className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-white/5 transition-all duration-300 active:scale-95"
                title="Go to Library"
              >
                <BookOpen className="w-6 h-6 text-stone-300 group-hover:text-stone-100 transition-colors" />
                <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-colors">
                  Library
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Vibe Filter Modal */}
        {isPickModalOpen && pickFilterMode === 'vibe' && (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
              onClick={() => {
                setPickFilterMode(null);
                setIsPickModalOpen(false);
                setPickFilters((prev) => ({ ...prev, vibe: null }));
              }}
              aria-label="Close modal"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/30 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-xl font-serif text-amber-200">
                      Choose a Vibe
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setPickFilterMode(null);
                      setIsPickModalOpen(false);
                      setPickFilters((prev) => ({ ...prev, vibe: null }));
                    }}
                    className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-stone-400 -mt-2">
                  Pick the mood you're in for tonight
                </p>
                {localPickError && (
                  <div className="text-xs text-amber-300 mt-1">
                    {localPickError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {VIBES.map((vibe, idx) => (
                    <button
                      key={vibe.id}
                      onClick={() => {
                        const newVibe =
                          pickFilters.vibe === vibe.id ? null : vibe.id;
                        setPickFilters((prev) => ({ ...prev, vibe: newVibe }));

                        // If the user just selected a vibe, immediately pick for them
                        if (newVibe) {
                          const filtered = [
                            ...unwatchedMovies,
                            ...unwatchedShows,
                          ].filter((item) => item.vibe === newVibe);

                          if (filtered.length > 0) {
                            const pickedItem =
                              filtered[
                                Math.floor(Math.random() * filtered.length)
                              ];
                            onDecide([pickedItem]);
                            setPickFilters({
                              vibe: null,
                              energy: null,
                              type: null,
                            });
                            setPickFilterMode(null);
                            setIsPickModalOpen(false);
                            return;
                          }

                          setLocalPickError('No items match that vibe yet.');
                          setTimeout(() => setLocalPickError(''), 2500);
                        }
                      }}
                      className={`p-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                        pickFilters.vibe === vibe.id
                          ? 'bg-amber-600/40 text-amber-50 border-2 border-amber-500/80 shadow-lg scale-105'
                          : 'bg-stone-800/60 text-stone-300 border-2 border-stone-700/50 hover:bg-stone-800 hover:border-amber-600/30 hover:text-amber-200'
                      } ${
                        idx === VIBES.length - 1 && VIBES.length % 2 === 1
                          ? 'col-span-2'
                          : ''
                      }`}
                    >
                      {vibe.icon && <vibe.icon className="w-6 h-6" />}
                      <span>{vibe.label}</span>
                    </button>
                  ))}
                </div>

                {/* Submit button removed — selecting a vibe picks immediately */}
              </div>
            </div>
          </>
        )}

        <ItemDetailsModal
          isOpen={isDetailOpen}
          item={detailItem}
          onClose={closeDetails}
          onToggleStatus={onToggleStatus}
          onRefreshMetadata={onRefreshMetadata}
          onUpdate={onUpdate}
        />

        {/* Energy Filter Modal */}
        {isPickModalOpen && pickFilterMode === 'energy' && (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
              onClick={() => {
                setPickFilterMode(null);
                setIsPickModalOpen(false);
                setPickFilters((prev) => ({ ...prev, energy: null }));
              }}
              aria-label="Close modal"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/30 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-xl font-serif text-amber-200">
                      Choose Energy Level
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setPickFilterMode(null);
                      setIsPickModalOpen(false);
                      setPickFilters((prev) => ({ ...prev, energy: null }));
                    }}
                    className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-stone-400 -mt-2">
                  How much attention do you want to give?
                </p>
                {localPickError && (
                  <div className="text-xs text-amber-300 mt-1">
                    {localPickError}
                  </div>
                )}

                <div className="space-y-3">
                  {ENERGIES.map((energy) => (
                    <button
                      key={energy.id}
                      onClick={() => {
                        const newEnergy =
                          pickFilters.energy === energy.id ? null : energy.id;
                        setPickFilters((prev) => ({
                          ...prev,
                          energy: newEnergy,
                        }));

                        // If the user selects an energy level, pick immediately
                        if (newEnergy) {
                          const filtered = [
                            ...unwatchedMovies,
                            ...unwatchedShows,
                          ].filter((item) => item.energy === newEnergy);

                          if (filtered.length > 0) {
                            const pickedItem =
                              filtered[
                                Math.floor(Math.random() * filtered.length)
                              ];
                            onDecide([pickedItem]);
                            setPickFilters({
                              vibe: null,
                              energy: null,
                              type: null,
                            });
                            setPickFilterMode(null);
                            setIsPickModalOpen(false);
                            return;
                          }

                          setLocalPickError(
                            'No items match that energy level yet.',
                          );
                          setTimeout(() => setLocalPickError(''), 2500);
                        }
                      }}
                      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                        pickFilters.energy === energy.id
                          ? 'bg-amber-600/40 text-amber-50 border-2 border-amber-500/80 shadow-lg scale-[1.02]'
                          : 'bg-stone-800/60 text-stone-300 border-2 border-stone-700/50 hover:bg-stone-800 hover:border-amber-600/30 hover:text-amber-200'
                      }`}
                    >
                      {energy.icon && (
                        <energy.icon className="w-6 h-6 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base">
                          {energy.label}
                        </div>
                        {energy.desc && (
                          <div className="text-xs opacity-80 mt-0.5">
                            {energy.desc}
                          </div>
                        )}
                      </div>
                      {pickFilters.energy === energy.id && (
                        <Check className="w-5 h-5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Submit button removed — selecting an energy picks immediately */}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TonightView;
