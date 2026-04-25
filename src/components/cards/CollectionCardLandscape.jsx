import React, { useEffect, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { getBackdropSrc, getPosterSrc } from '../../utils/poster.js';
import LazyMediaImage from '../media/LazyMediaImage.jsx';
import PosterPlaceholder from './PosterPlaceholder.jsx';

const CollectionCardLandscape = ({ collection, onOpenCollection }) => {
  const [backdropMissing, setBackdropMissing] = useState(false);
  const [posterMissing, setPosterMissing] = useState(false);

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
  const countLabel = totalCount === 1 ? '1 film' : `${totalCount} films`;

  useEffect(() => {
    setBackdropMissing(false);
    setPosterMissing(false);
  }, [collection?.id, backdropSrc, posterSrc]);

  return (
    <button
      type="button"
      onClick={() => onOpenCollection?.(collection)}
      className="group relative block aspect-[16/9] w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-900/70 text-left shadow-lg shadow-black/30 transition-transform duration-200 ease-out hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      aria-label={`Open ${collection?.title || 'collection'}`}
    >
      <div className="absolute inset-0">
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
            className="h-full w-full object-cover"
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
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-stone-950/0" />
      </div>

      <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-stone-950/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
        <Clapperboard className="h-3 w-3" />
        Collection
      </div>

      <div className="absolute inset-x-3 bottom-2.5 space-y-1">
        <div className="line-clamp-2 text-sm font-semibold leading-tight text-stone-100 drop-shadow sm:text-base">
          {collection?.title}
        </div>
        <div className="text-[11px] font-medium text-stone-300">
          {countLabel}
          {yearLabel ? ` · ${yearLabel}` : ''}
        </div>
        {watchedCount > 0 && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-stone-950/70">
            <div
              className="h-full bg-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progressPercentage, 3)}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
};

export default CollectionCardLandscape;
