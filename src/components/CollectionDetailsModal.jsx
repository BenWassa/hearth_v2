import React from 'react';
import { CheckCircle2, Clapperboard, Play, X } from 'lucide-react';
import { getBackdropSrc, getPosterSrc } from '../utils/poster.js';
import LazyMediaImage from './media/LazyMediaImage.jsx';
import PosterPlaceholder from './cards/PosterPlaceholder.jsx';

const CollectionDetailsModal = ({
  isOpen,
  collection,
  onClose,
  onOpenItem,
}) => {
  if (!isOpen || !collection) return null;

  const items = Array.isArray(collection.items) ? collection.items : [];
  const backdrop = getBackdropSrc(collection) || getPosterSrc(collection);
  const nextItem = collection.nextItem;

  const openItem = (item) => {
    onClose?.();
    onOpenItem?.(item);
  };

  return (
    <>
      <button
        className="fixed inset-0 z-[70] cursor-default bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close collection"
      />
      <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center animate-in fade-in duration-200">
        <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-stone-800 bg-stone-950 shadow-2xl sm:rounded-2xl">
          <div className="relative h-44 overflow-hidden bg-stone-900">
            {backdrop ? (
              <LazyMediaImage
                src={backdrop}
                alt=""
                className="h-full w-full object-cover opacity-55"
                loading="eager"
                decoding="async"
                fetchPriority="auto"
              />
            ) : (
              <div className="h-full w-full bg-stone-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/10" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full border border-stone-700 bg-stone-950/80 p-2 text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100"
              aria-label="Close collection"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-4 left-4 right-14">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-500/25">
                <Clapperboard className="h-3.5 w-3.5" />
                Collection
              </div>
              <h2 className="text-2xl font-serif leading-tight text-stone-100">
                {collection.title}
              </h2>
              <p className="mt-1 text-sm text-stone-300">
                {collection.watchedCount}/{collection.totalCount} watched
                {collection.year ? ` / ${collection.year}` : ''}
              </p>
            </div>
          </div>

          <div className="max-h-[calc(88vh-11rem)] overflow-y-auto px-4 py-4">
            {nextItem && nextItem.status !== 'watched' && (
              <button
                type="button"
                onClick={() => openItem(nextItem)}
                className="mb-4 flex w-full items-center justify-between rounded-xl border border-amber-700/35 bg-amber-500/10 px-3 py-2.5 text-left transition-colors hover:bg-amber-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    Next Up
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-stone-100">
                    {nextItem.title}
                  </div>
                </div>
                <Play className="h-4 w-4 text-amber-300" />
              </button>
            )}

            <div className="space-y-2">
              {items.map((item, index) => {
                const poster = getPosterSrc(item);
                const isWatched = item.status === 'watched';
                return (
                  <button
                    key={item.id || item.mediaId || `${item.title}-${index}`}
                    type="button"
                    onClick={() => openItem(item)}
                    className="flex w-full items-center gap-3 rounded-xl border border-stone-800/80 bg-stone-900/45 p-2 text-left transition-colors hover:border-stone-700 hover:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <div className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded bg-stone-900">
                      {poster ? (
                        <LazyMediaImage
                          src={poster}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="auto"
                        />
                      ) : (
                        <PosterPlaceholder title={item.title} type="movie" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-stone-100">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500">
                        {item.year || 'Year pending'}
                      </div>
                    </div>
                    {isWatched ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                    ) : (
                      <span className="rounded bg-stone-800 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        Queued
                      </span>
                    )}
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
