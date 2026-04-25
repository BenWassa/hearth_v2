import React, { useEffect, useState } from 'react';
import { getBackdropSrc, getPosterSrc } from '../../utils/poster.js';
import LazyMediaImage from '../media/LazyMediaImage.jsx';
import PosterPlaceholder from './PosterPlaceholder.jsx';

const stripCollectionSuffix = (title = '') =>
  title.replace(/\s+Collection$/i, '').trim();

const CollectionCardLandscape = ({ collection, onOpenCollection }) => {
  const [backdropMissing, setBackdropMissing] = useState(false);
  const [posterMissing, setPosterMissing] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const firstItem = Array.isArray(collection?.items)
    ? collection.items[0]
    : null;
  const logoSrc = String(
    firstItem?.logo ||
      firstItem?.logoUrl ||
      firstItem?.media?.logo ||
      firstItem?.media?.logoUrl ||
      '',
  ).trim();
  const displayTitle = stripCollectionSuffix(collection?.title || '');

  const backdropSrc = getBackdropSrc(collection);
  const posterSrc = getPosterSrc(collection);
  const heroSrc =
    backdropSrc && !backdropMissing
      ? backdropSrc
      : posterSrc && !posterMissing
      ? posterSrc
      : '';

  const totalCount = Number(
    collection?.totalCount ||
      (Array.isArray(collection?.items) ? collection.items.length : 0),
  );
  const watchedCount = Number(collection?.watchedCount || 0);
  const progressPercentage =
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;
  const yearLabel = collection?.year || '';
  const isComplete = totalCount > 0 && watchedCount >= totalCount;

  const watchedFragment =
    watchedCount > 0
      ? isComplete
        ? 'All watched'
        : `${watchedCount} of ${totalCount} watched`
      : `${totalCount} ${totalCount === 1 ? 'film' : 'films'}`;

  useEffect(() => {
    setBackdropMissing(false);
    setPosterMissing(false);
    setLogoFailed(false);
  }, [collection?.id, backdropSrc, posterSrc, logoSrc]);

  return (
    <button
      type="button"
      onClick={() => onOpenCollection?.(collection)}
      className="group relative block aspect-[16/9] w-full overflow-hidden rounded-xl bg-stone-900 text-left ring-1 ring-white/5 shadow-lg shadow-black/30 transition-[transform,box-shadow,--tw-ring-color] duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:ring-amber-400/40 hover:shadow-2xl hover:shadow-black/50 motion-safe:hover:-translate-y-0.5 active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      aria-label={`Open ${collection?.title || 'collection'}`}
    >
      {/* Hero image with subtle zoom on hover */}
      <div className="absolute inset-0 overflow-hidden">
        {heroSrc ? (
          <LazyMediaImage
            src={heroSrc}
            alt=""
            onError={() => {
              if (backdropSrc && !backdropMissing) {
                setBackdropMissing(true);
              } else {
                setPosterMissing(true);
              }
            }}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            fetchPriority="auto"
            fallback={
              <PosterPlaceholder title={collection?.title} type="movie" />
            }
          />
        ) : (
          <PosterPlaceholder title={collection?.title} type="movie" />
        )}

        {/* Top vignette — gives the badge a quiet shelf to sit on */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-stone-950/70 via-stone-950/25 to-transparent" />

        {/* Bottom gradient — anchored at 70% for the title block */}
        <div className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent transition-opacity duration-[400ms] group-hover:from-stone-950 group-hover:via-stone-950/85" />
      </div>

      {/* Progress accent — top architectural line, mirrors PosterCard energy band */}
      {watchedCount > 0 && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-stone-950/40">
          <div
            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.55)] transition-[width] duration-[600ms] ease-out"
            style={{ width: `${Math.max(progressPercentage, 4)}%` }}
          />
        </div>
      )}

      {isComplete && (
        <div className="absolute right-3 top-3 inline-flex items-center rounded-lg bg-amber-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-950 ring-1 ring-amber-300/40">
          Complete
        </div>
      )}

      {/* Title block — marquee feel */}
      <div className="absolute inset-x-4 bottom-3.5 space-y-1.5">
        {logoSrc && !logoFailed ? (
          <img
            src={logoSrc}
            alt={displayTitle}
            className="max-h-10 sm:max-h-12 max-w-[60%] object-contain object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-0.5"
            onError={() => setLogoFailed(true)}
            loading="lazy"
          />
        ) : (
          <h4 className="line-clamp-2 font-serif text-base leading-snug text-stone-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:text-lg">
            {displayTitle}
          </h4>
        )}
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-300/90">
          <span>{watchedFragment}</span>
          {yearLabel && (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-stone-400/70" />
              <span className="text-stone-400">{yearLabel}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default CollectionCardLandscape;
