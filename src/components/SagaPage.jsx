import React, { useId, useState } from 'react';
import { ArrowLeft, Play, Plus } from 'lucide-react';
import useCollectionDetails from '../hooks/useCollectionDetails.js';
import {
  buildSagaDetails,
  getItemKey,
  stripCollectionSuffix,
} from '../domain/media/sagaDetails.js';
import Dialog from './ui/Dialog.jsx';
import IconButton from './ui/IconButton.jsx';
import ProgressBar from './ui/ProgressBar.jsx';
import { getBackdropSrc, getPosterSrc } from '../utils/poster.js';
import LazyMediaImage from './media/LazyMediaImage.jsx';
import PosterPlaceholder from './cards/PosterPlaceholder.jsx';

const TITLE_ID = 'saga-page-title';

// Neutral artwork scrim: the backdrop fades into Shell Black, same vignette
// as the World page hero.
const HERO_SCRIM =
  'bg-[linear-gradient(180deg,rgba(12,10,9,0.5)_0%,rgba(12,10,9,0)_26%,rgba(12,10,9,0)_42%,rgba(12,10,9,0.8)_80%,#0c0a09_100%)]';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

const eyebrow =
  'text-label font-bold uppercase tracking-[0.22em] text-stone-400';

const GridSkeleton = () => (
  <div role="status" className="mt-3">
    <span className="sr-only">Loading films from this saga</span>
    <div className="grid grid-cols-3 gap-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`saga-part-skeleton-${index}`}>
          <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-stone-900 motion-reduce:animate-none" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-stone-800/90 motion-reduce:animate-none" />
          <div className="mt-1 h-2.5 w-10 animate-pulse rounded bg-stone-800/60 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  </div>
);

const SagaHero = ({ backdrop, title, onClose }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasArt = Boolean(backdrop) && !imageFailed;
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pb-2 pt-[calc(var(--safe-top)+8px)]">
        <IconButton
          label="Close collection"
          variant="overlay"
          onClick={onClose}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </IconButton>
      </header>
      {/* Natural 16:9 behind the status bar, never cropped into a strip. */}
      <div aria-hidden="true" className="-mx-4">
        <div
          className={`relative w-full overflow-hidden bg-stone-900 ${
            hasArt ? 'h-0' : 'h-[calc(var(--safe-top)+72px)]'
          }`}
          style={
            hasArt
              ? { paddingBottom: 'calc(56.25% + var(--safe-top, 0px))' }
              : undefined
          }
        >
          {hasArt && (
            <div className="absolute inset-0">
              <LazyMediaImage
                src={backdrop}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={() => setImageFailed(true)}
              />
            </div>
          )}
          <div className={`absolute inset-0 ${HERO_SCRIM}`} />
        </div>
      </div>
      <h1
        id={TITLE_ID}
        className={`relative z-10 font-serif text-3xl leading-tight text-stone-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${
          hasArt ? '-mt-14' : 'mt-2'
        }`}
      >
        {title}
      </h1>
    </>
  );
};

const PosterTile = ({ item, onOpen }) => {
  const descriptionId = useId();
  const poster = getPosterSrc(item);
  const isOwned = item.owned !== false;
  const isWatched = isOwned && item.status === 'watched';
  const title = item.title || 'Untitled movie';
  return (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        onOpen(item);
      }}
      className="group flex min-h-11 flex-col text-left focus:outline-none"
      aria-label={isOwned ? `Open ${title}` : `Add ${title} to shelf`}
      aria-describedby={isWatched ? descriptionId : undefined}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-900 ring-1 ring-stone-50/5 group-focus-visible:ring-2 group-focus-visible:ring-amber-400 motion-safe:transition-transform motion-safe:group-active:scale-[0.98]">
        {poster ? (
          <LazyMediaImage
            src={poster}
            alt=""
            className={`h-full w-full object-cover ${
              isOwned ? '' : 'opacity-40 grayscale'
            }`}
            loading="lazy"
            decoding="async"
            fetchPriority="auto"
            fallback={<PosterPlaceholder title={title} type="movie" />}
          />
        ) : (
          <PosterPlaceholder title={title} type="movie" />
        )}
        {isWatched && (
          <>
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-950/80 text-[11px] text-amber-300"
            >
              ✓
            </span>
            <span id={descriptionId} className="sr-only">
              Watched
            </span>
          </>
        )}
        {!isOwned && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-950/90 text-amber-300 ring-1 ring-stone-50/15"
          >
            <Plus className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div
          className={`line-clamp-2 text-sm leading-snug ${
            isOwned ? 'text-stone-100' : 'text-stone-400'
          }`}
        >
          {title}
        </div>
        <div className="mt-0.5 whitespace-nowrap text-label tabular-nums text-stone-400">
          {item.year || '-'}
          {!isOwned && <span className="ml-2">Not on your shelf</span>}
        </div>
      </div>
    </button>
  );
};

const PosterGrid = ({ items, onOpen }) => (
  <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5">
    {items.map((item, index) => (
      <PosterTile
        key={getItemKey(item) || `${item.title}-${index}`}
        item={item}
        onOpen={onOpen}
      />
    ))}
  </div>
);

const SagaPage = ({
  isOpen,
  collection,
  householdItems = [],
  onClose,
  onOpenItem,
}) => {
  const providerId =
    typeof collection?.collection?.providerId === 'string'
      ? collection.collection.providerId.trim()
      : String(collection?.collection?.providerId ?? '').trim();
  const provider =
    (typeof collection?.collection?.provider === 'string' &&
      collection.collection.provider.trim()) ||
    'tmdb';
  // The hook never exposes the previous saga's parts while another loads.
  const {
    data: providerDetails,
    loading: isProviderLoading,
    error: providerError,
  } = useCollectionDetails({
    provider,
    providerId,
    enabled: isOpen && Boolean(providerId),
    details: true,
    optional: true,
  });

  if (!isOpen || !collection) return null;

  const details = buildSagaDetails({
    collection,
    householdItems,
    providerDetails,
  });
  const displayTitle = stripCollectionSuffix(collection.title || '');
  const backdrop = getBackdropSrc(collection) || getPosterSrc(collection);
  const hasSubCollections = details.subCollections.length > 0;
  const openItem = (item) => onOpenItem?.(item.watchlistItem || item);
  const next = details.nextItem;
  const nextPoster = next ? getPosterSrc(next) : '';

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby={TITLE_ID}
      className="fixed inset-0 z-[60]"
    >
      {/* Flat scrim so nothing outside the 448px panel is clickable on wide screens. */}
      <div aria-hidden="true" className="absolute inset-0 bg-stone-950/85" />
      <div className="relative mx-auto flex h-full max-w-md flex-col bg-stone-950 pb-[var(--safe-bottom)]">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
          <SagaHero
            key={collection.id}
            backdrop={backdrop}
            title={displayTitle}
            onClose={onClose}
          />

          {/* Positioned so it paints above the hero, which the title overlaps. */}
          <div className="relative z-10 mt-3 flex items-center gap-3">
            <div className="w-28 shrink-0">
              <ProgressBar
                value={details.progressPercentage}
                min={2}
                heightClassName="h-1"
                trackClassName="bg-stone-800"
              />
            </div>
            <p className="min-w-0 text-sm text-stone-300">
              {details.watchedCount} of {details.ownedTotalCount} watched
              {collection.year ? (
                <span className="ml-3 whitespace-nowrap tabular-nums text-stone-400">
                  {collection.year}
                </span>
              ) : null}
            </p>
          </div>

          {next && (
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                openItem(next);
              }}
              className={`group mt-6 flex min-h-[88px] w-full items-center gap-4 rounded-xl border-y border-stone-800 py-3 text-left ${focusRing}`}
            >
              <div className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-stone-900 ring-1 ring-stone-50/10">
                {nextPoster ? (
                  <LazyMediaImage
                    src={nextPoster}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="auto"
                    fallback={
                      <PosterPlaceholder title={next.title} type="movie" />
                    }
                  />
                ) : (
                  <PosterPlaceholder title={next.title} type="movie" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-label font-bold uppercase tracking-[0.22em] text-amber-400">
                  Next up
                </div>
                <div className="mt-1 truncate font-serif text-lg leading-snug text-stone-100">
                  {next.title}
                </div>
                {next.year && (
                  <div className="mt-0.5 whitespace-nowrap text-xs tabular-nums text-stone-400">
                    {next.year}
                  </div>
                )}
              </div>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950"
              >
                <Play className="h-4 w-4 fill-current" />
              </span>
            </button>
          )}

          <section aria-label="Films" className="mt-7">
            <h2 className={eyebrow}>
              {details.isAnthology ? 'Explore films' : 'Feature films'}
            </h2>
            <p className="mt-1 text-sm text-stone-400">{details.countLabel}</p>

            {hasSubCollections ? (
              <>
                {details.subCollections.map((subCollection) => (
                  <section
                    key={subCollection.id}
                    aria-label={stripCollectionSuffix(subCollection.name)}
                    className="mt-6"
                  >
                    <h3 className="font-serif text-xl leading-snug text-stone-100">
                      {stripCollectionSuffix(subCollection.name)}
                    </h3>
                    <PosterGrid items={subCollection.parts} onOpen={openItem} />
                  </section>
                ))}
                {details.ownedOutsideSubCollections.length > 0 && (
                  <section aria-label="More on your shelf" className="mt-6">
                    <h3 className="font-serif text-xl leading-snug text-stone-100">
                      More on your shelf
                    </h3>
                    <PosterGrid
                      items={details.ownedOutsideSubCollections}
                      onOpen={openItem}
                    />
                  </section>
                )}
                {details.unownedOutsideSubCollections.length > 0 && (
                  <section aria-label="Not on your shelf" className="mt-7">
                    <h3 className="font-serif text-xl leading-snug text-stone-100">
                      Not on your shelf
                    </h3>
                    <p className="mt-1 text-sm text-stone-400">
                      Listed by the provider. Open a film to see details or add
                      it.
                    </p>
                    <PosterGrid
                      items={details.unownedOutsideSubCollections}
                      onOpen={openItem}
                    />
                  </section>
                )}
              </>
            ) : (
              <>
                {details.ownedDisplay.length > 0 ? (
                  <PosterGrid items={details.ownedDisplay} onOpen={openItem} />
                ) : (
                  !isProviderLoading && (
                    <p className="mt-3 text-sm text-stone-400">
                      No feature films from this saga are on your shelf yet.
                    </p>
                  )
                )}

                {isProviderLoading ? (
                  <GridSkeleton />
                ) : (
                  details.unownedDisplay.length > 0 && (
                    <section aria-label="Not on your shelf" className="mt-7">
                      <h3 className="font-serif text-xl leading-snug text-stone-100">
                        Not on your shelf
                      </h3>
                      <p className="mt-1 text-sm text-stone-400">
                        Listed by the provider. Open a film to see details or
                        add it.
                      </p>
                      <PosterGrid
                        items={details.unownedDisplay}
                        onOpen={openItem}
                      />
                    </section>
                  )
                )}
              </>
            )}
          </section>

          {!isProviderLoading && details.shortItems.length > 0 && (
            <section aria-label="Shorts and specials" className="mt-8">
              <h2 className="font-serif text-xl leading-snug text-stone-100">
                Shorts &amp; specials
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                Separate from feature-film progress.
              </p>
              <PosterGrid items={details.shortItems} onOpen={openItem} />
            </section>
          )}

          {providerError && !isProviderLoading && (
            <p
              role="status"
              className="mt-8 border-t border-stone-800 pt-4 text-sm text-stone-400"
            >
              Full series details are unavailable right now.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default SagaPage;
