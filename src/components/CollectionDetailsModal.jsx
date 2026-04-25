import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clapperboard, Play, X } from 'lucide-react';
import { getBackdropSrc, getPosterSrc } from '../utils/poster.js';
import LazyMediaImage from './media/LazyMediaImage.jsx';
import PosterPlaceholder from './cards/PosterPlaceholder.jsx';

const stripCollectionSuffix = (title = '') =>
  title.replace(/\s+Collection$/i, '').trim();

const CollectionDetailsModal = ({
  isOpen,
  collection,
  onClose,
  onOpenItem,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const items = Array.isArray(collection?.items) ? collection.items : [];
  const firstItem = items[0] || null;
  const logoSrc = String(
    firstItem?.logo ||
      firstItem?.logoUrl ||
      firstItem?.media?.logo ||
      firstItem?.media?.logoUrl ||
      '',
  ).trim();
  const displayTitle = stripCollectionSuffix(collection?.title || '');

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  useEffect(() => {
    setLogoFailed(false);
  }, [isOpen, collection?.id, logoSrc]);

  if (!isOpen || !collection) return null;

  const backdrop = getBackdropSrc(collection) || getPosterSrc(collection);
  const nextItem = collection.nextItem;
  const totalCount = items.length || Number(collection.totalCount) || 0;
  const watchedCount = Number(collection.watchedCount) || 0;
  const progressPercentage =
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;
  const isComplete = totalCount > 0 && watchedCount >= totalCount;
  const showNextUp = nextItem && nextItem.status !== 'watched' && !isComplete;
  const nextItemPoster = nextItem ? getPosterSrc(nextItem) : '';

  const openItem = (item) => {
    onClose?.();
    onOpenItem?.(item);
  };

  return (
    <>
      <button
        className="fixed inset-0 z-[70] cursor-default bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close collection"
      />
      <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center animate-in fade-in duration-200">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-t-2xl border border-stone-800/80 bg-stone-950 shadow-2xl shadow-black/60 sm:rounded-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
          {/* Hero header */}
          <div className="relative h-56 overflow-hidden bg-stone-900 sm:h-64">
            {backdrop ? (
              <LazyMediaImage
                src={backdrop}
                alt=""
                className="h-full w-full object-cover opacity-65"
                loading="eager"
                decoding="async"
                fetchPriority="auto"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-stone-900 to-stone-950" />
            )}

            {/* Three-stop gradient — top vignette + side fade + dominant bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/70 via-transparent to-stone-950/30" />

            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg border border-stone-50/10 bg-stone-950/70 p-2 text-stone-200 backdrop-blur-sm transition-colors hover:border-stone-50/25 hover:bg-stone-950/85 hover:text-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Close collection"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-100 ring-1 ring-stone-50/15 backdrop-blur-[2px]">
                  <Clapperboard className="h-3 w-3" />
                  Collection
                </span>
                {isComplete && (
                  <span className="inline-flex items-center rounded-lg bg-amber-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-950 ring-1 ring-amber-300/40">
                    Complete
                  </span>
                )}
              </div>

              {logoSrc && !logoFailed ? (
                <img
                  src={logoSrc}
                  alt={displayTitle}
                  className="mt-3 max-h-16 max-w-[78%] object-contain object-left drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] sm:max-h-20 sm:max-w-[62%]"
                  onError={() => setLogoFailed(true)}
                  loading="eager"
                />
              ) : (
                <h2 className="mt-3 font-serif text-3xl leading-tight text-stone-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-4xl">
                  {displayTitle}
                </h2>
              )}

              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 w-32 overflow-hidden rounded-full bg-stone-50/15 sm:w-40">
                  <div
                    className="h-full rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-[width] duration-[600ms] ease-out"
                    style={{ width: `${Math.max(progressPercentage, 2)}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
                  {watchedCount} / {totalCount} watched
                  {collection.year ? ` · ${collection.year}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[calc(90vh-14rem)] overflow-y-auto px-5 py-5 sm:max-h-[calc(90vh-16rem)] sm:px-6 sm:py-6">
            {/* Next Up — promoted with mini-poster */}
            {showNextUp && (
              <button
                type="button"
                onClick={() => openItem(nextItem)}
                className="group mb-6 flex w-full items-center gap-4 rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.06] to-transparent p-3 text-left transition-all hover:border-amber-400/50 hover:from-amber-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-stone-900 ring-1 ring-stone-50/10">
                  {nextItemPoster ? (
                    <LazyMediaImage
                      src={nextItemPoster}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      fetchPriority="auto"
                      fallback={
                        <PosterPlaceholder
                          title={nextItem.title}
                          type="movie"
                        />
                      }
                    />
                  ) : (
                    <PosterPlaceholder title={nextItem.title} type="movie" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                    Next Up
                  </div>
                  <div className="mt-1 truncate font-serif text-lg leading-snug text-stone-100">
                    {nextItem.title}
                  </div>
                  {nextItem.year && (
                    <div className="mt-0.5 text-xs text-stone-400">
                      {nextItem.year}
                    </div>
                  )}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950 transition-transform group-hover:scale-105">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              </button>
            )}

            {/* Section header for the shelf */}
            <div className="mb-3 flex items-baseline justify-between px-0.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                The collection
              </div>
              <div className="text-[11px] font-medium text-stone-500">
                {totalCount} {totalCount === 1 ? 'film' : 'films'}
              </div>
            </div>

            {/* Poster shelf — 2-col mobile, 3-col sm, 4-col md */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {items.map((item, index) => {
                const poster = getPosterSrc(item);
                const isWatched = item.status === 'watched';
                const queuePosition = index + 1;
                return (
                  <button
                    key={item.id || item.mediaId || `${item.title}-${index}`}
                    type="button"
                    onClick={() => openItem(item)}
                    className="group flex flex-col text-left focus:outline-none"
                    aria-label={`Open ${item.title}`}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-900 ring-1 ring-stone-50/5 shadow-md shadow-black/40 transition-[transform,box-shadow,--tw-ring-color] duration-[300ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:ring-amber-400/40 group-hover:shadow-lg group-hover:shadow-black/60 motion-safe:group-hover:-translate-y-0.5 group-active:scale-[0.98] group-focus-visible:ring-2 group-focus-visible:ring-amber-400">
                      {poster ? (
                        <LazyMediaImage
                          src={poster}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:scale-[1.04]"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="auto"
                          fallback={
                            <PosterPlaceholder
                              title={item.title}
                              type="movie"
                            />
                          }
                        />
                      ) : (
                        <PosterPlaceholder title={item.title} type="movie" />
                      )}

                      {/* Watched / queue indicator */}
                      {isWatched ? (
                        <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-md shadow-black/40 ring-2 ring-stone-950/60">
                          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="absolute right-1.5 top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-stone-950/85 px-1.5 text-[10px] font-bold tabular-nums text-stone-300 ring-1 ring-stone-50/10 backdrop-blur-sm">
                          {queuePosition}
                        </div>
                      )}

                      {/* Soft dim for watched items */}
                      {isWatched && (
                        <div className="pointer-events-none absolute inset-0 bg-stone-950/35" />
                      )}
                    </div>

                    <div className="mt-2 px-0.5">
                      <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-stone-100 group-hover:text-amber-50">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-stone-500">
                        {item.year || '—'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionDetailsModal;
