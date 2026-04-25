import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clapperboard,
  Library,
  Play,
  Plus,
  X,
} from 'lucide-react';
import useCollectionDetails from '../hooks/useCollectionDetails.js';
import { getBackdropSrc, getPosterSrc } from '../utils/poster.js';
import LazyMediaImage from './media/LazyMediaImage.jsx';
import PosterPlaceholder from './cards/PosterPlaceholder.jsx';

const stripCollectionSuffix = (title = '') =>
  title.replace(/\s+Collection$/i, '').trim();

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const getProviderKey = (item = {}) => {
  const mediaId = asString(item.mediaId || item.media_id);
  const [mediaProvider = '', mediaProviderId = ''] = mediaId.split(':');
  const provider = asString(
    item?.source?.provider ||
      item?.media?.provider ||
      item?.provider ||
      mediaProvider ||
      'tmdb',
  ).toLowerCase();
  const providerId = asString(
    item?.source?.providerId ||
      item?.media?.providerId ||
      item?.providerId ||
      mediaProviderId,
  );
  return provider && providerId ? `${provider}:${providerId}` : '';
};

const getFallbackKey = (item = {}) =>
  `${asString(item.title).toLowerCase()}:${asString(item.year)}`;

const getItemKey = (item = {}) => getProviderKey(item) || getFallbackKey(item);

const mapDiscoveryItem = (part = {}, watchlistItem = null) => {
  if (watchlistItem) {
    return {
      ...watchlistItem,
      owned: true,
      watchlistItem,
      discoveryItem: part,
    };
  }

  const provider = asString(part.provider) || 'tmdb';
  const providerId = asString(part.providerId);
  const poster = asString(part.poster || part.posterUrl);
  const backdrop = asString(part.backdrop || part.backdropUrl);

  return {
    ...part,
    id: '',
    provider,
    providerId,
    source: {
      provider,
      providerId,
      locale: 'en-US',
    },
    media: {
      ...part,
      provider,
      providerId,
      poster,
      backdrop,
      logo: asString(part.logo || part.logoUrl),
    },
    poster,
    backdrop,
    status: 'unwatched',
    owned: false,
    watchlistItem: null,
    discoveryItem: part,
  };
};

const CollectionShelfSkeleton = () => (
  <div
    className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4"
    aria-hidden="true"
  >
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={`collection-part-skeleton-${index}`}>
        <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-stone-900 ring-1 ring-stone-50/5" />
        <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-stone-800/90" />
        <div className="mt-1 h-2.5 w-10 animate-pulse rounded bg-stone-800/60" />
      </div>
    ))}
  </div>
);

const CollectionDetailsModal = ({
  isOpen,
  collection,
  onClose,
  onOpenItem,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const items = Array.isArray(collection?.items) ? collection.items : [];
  const firstItem = items[0] || null;
  const collectionProvider =
    asString(collection?.collection?.provider) || 'tmdb';
  const collectionProviderId = asString(collection?.collection?.providerId);
  const {
    data: collectionDetails,
    loading: isCollectionLoading,
    error: collectionError,
  } = useCollectionDetails({
    provider: collectionProvider,
    providerId: collectionProviderId,
    enabled: isOpen && Boolean(collectionProviderId),
  });
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
  const ownedByKey = new Map(
    items.map((item) => [getItemKey(item), item]).filter(([key]) => key),
  );
  const fullParts = Array.isArray(collectionDetails?.parts)
    ? collectionDetails.parts
    : [];
  const displayItems = (fullParts.length ? fullParts : items).map((part) => {
    const ownedItem = ownedByKey.get(getItemKey(part)) || null;
    return mapDiscoveryItem(part, fullParts.length ? ownedItem : part);
  });
  const subCollectionRows =
    Array.isArray(collectionDetails?.subCollections) &&
    collectionDetails.subCollections.length > 0
      ? collectionDetails.subCollections
          .map((subCollection) => ({
            ...subCollection,
            parts: (Array.isArray(subCollection.parts)
              ? subCollection.parts
              : []
            ).map((part) =>
              mapDiscoveryItem(part, ownedByKey.get(getItemKey(part)) || null),
            ),
          }))
          .filter((subCollection) => subCollection.parts.length > 0)
      : [];
  const ownedTotalCount = items.length || Number(collection.totalCount) || 0;
  const fullTotalCount =
    fullParts.length || displayItems.length || ownedTotalCount;
  const watchedCount = Number(collection.watchedCount) || 0;
  const progressPercentage =
    ownedTotalCount > 0
      ? Math.round((watchedCount / ownedTotalCount) * 100)
      : 0;
  const isComplete = ownedTotalCount > 0 && watchedCount >= ownedTotalCount;
  const showNextUp = nextItem && nextItem.status !== 'watched' && !isComplete;
  const nextItemPoster = nextItem ? getPosterSrc(nextItem) : '';

  const openItem = (item) => {
    onClose?.();
    onOpenItem?.(item.watchlistItem || item);
  };

  const renderPosterGrid = (gridItems) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
      {gridItems.map((item, index) => {
        const poster = getPosterSrc(item);
        const isOwned = item.owned !== false;
        const isWatched = isOwned && item.status === 'watched';
        const queuePosition = isOwned
          ? items.findIndex((ownedItem) => ownedItem === item.watchlistItem) +
              1 || index + 1
          : null;
        const itemTitle = item.title || 'Untitled movie';
        const key = getItemKey(item) || `${itemTitle}-${index}`;

        return (
          <button
            key={key}
            type="button"
            onClick={() => openItem(item)}
            className="group flex flex-col text-left focus:outline-none"
            aria-label={
              isOwned ? `Open ${itemTitle}` : `Add ${itemTitle} to shelf`
            }
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-900 ring-1 ring-stone-50/5 shadow-md shadow-black/40 transition-[transform,box-shadow,--tw-ring-color] duration-[300ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:ring-amber-400/40 group-hover:shadow-lg group-hover:shadow-black/60 motion-safe:group-hover:-translate-y-0.5 group-active:scale-[0.98] group-focus-visible:ring-2 group-focus-visible:ring-amber-400">
              {poster ? (
                <LazyMediaImage
                  src={poster}
                  alt=""
                  className={`h-full w-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:scale-[1.04] ${
                    isOwned ? '' : 'opacity-40 grayscale'
                  }`}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="auto"
                  fallback={
                    <PosterPlaceholder title={itemTitle} type="movie" />
                  }
                />
              ) : (
                <PosterPlaceholder title={itemTitle} type="movie" />
              )}

              {isWatched ? (
                <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-md shadow-black/40 ring-2 ring-stone-950/60">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                </div>
              ) : isOwned ? (
                <div className="absolute right-1.5 top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-stone-950/85 px-1.5 text-[10px] font-bold tabular-nums text-stone-300 ring-1 ring-stone-50/10 backdrop-blur-sm">
                  {queuePosition}
                </div>
              ) : (
                <div className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-stone-950/90 text-amber-300 shadow-md shadow-black/40 ring-1 ring-amber-400/35 backdrop-blur-sm">
                  <Library className="h-3.5 w-3.5" />
                  <Plus className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-500 p-0.5 text-amber-950 ring-1 ring-stone-950" />
                </div>
              )}

              {isWatched && (
                <div className="pointer-events-none absolute inset-0 bg-stone-950/35" />
              )}
              {!isOwned && (
                <div className="pointer-events-none absolute inset-0 bg-stone-950/20" />
              )}
            </div>

            <div className="mt-2 px-0.5">
              <div
                className={`line-clamp-2 text-[13px] font-semibold leading-snug ${
                  isOwned
                    ? 'text-stone-100 group-hover:text-amber-50'
                    : 'text-stone-400 group-hover:text-stone-200'
                }`}
              >
                {itemTitle}
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">
                {item.year || '-'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

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
                  {watchedCount} / {ownedTotalCount} watched
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
                {fullTotalCount} {fullTotalCount === 1 ? 'film' : 'films'}
              </div>
            </div>

            {isCollectionLoading ? (
              <CollectionShelfSkeleton />
            ) : subCollectionRows.length > 0 ? (
              <div className="space-y-7">
                {subCollectionRows.map((subCollection) => (
                  <section key={subCollection.id} className="space-y-3">
                    <div className="px-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                      {stripCollectionSuffix(subCollection.name)}
                    </div>
                    {renderPosterGrid(subCollection.parts)}
                  </section>
                ))}
              </div>
            ) : (
              renderPosterGrid(displayItems)
            )}

            {collectionError && !isCollectionLoading && (
              <div className="mt-4 rounded-lg border border-stone-800 bg-stone-900/50 px-3 py-2 text-xs text-stone-400">
                Full series details are unavailable right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionDetailsModal;
