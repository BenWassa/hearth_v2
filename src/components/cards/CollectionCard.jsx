import React, { useEffect, useMemo, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { getPosterSrc } from '../../utils/poster.js';
import LazyMediaImage from '../media/LazyMediaImage.jsx';
import PosterPlaceholder from './PosterPlaceholder.jsx';

const CollectionCard = ({ collection, onOpenCollection }) => {
  const [posterMissing, setPosterMissing] = useState(false);
  const posterSrc = getPosterSrc(collection);
  const parts = Array.isArray(collection?.items) ? collection.items : [];
  const previewItems = parts.slice(0, 3);
  const watchedCount = Number(collection?.watchedCount || 0);
  const totalCount = Number(collection?.totalCount || parts.length || 0);
  const progressPercentage =
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

  const previewPosters = useMemo(
    () => previewItems.map((item) => getPosterSrc(item)).filter(Boolean),
    [previewItems],
  );

  useEffect(() => {
    setPosterMissing(false);
  }, [collection?.id, posterSrc]);

  return (
    <div className="group flex flex-col h-full">
      <div className="relative flex-shrink-0 w-full">
        <div className="h-1 w-full bg-stone-500" />
        <button
          type="button"
          onClick={() => onOpenCollection?.(collection)}
          className="relative aspect-[2/3] w-full overflow-hidden border-b border-l border-r border-stone-800 bg-stone-900/70 text-left shadow-lg shadow-black/30 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label={`Open ${collection?.title || 'collection'}`}
        >
          <div className="absolute inset-0">
            {posterSrc && !posterMissing ? (
              <LazyMediaImage
                src={posterSrc}
                alt=""
                onError={() => setPosterMissing(true)}
                className="h-full w-full object-cover opacity-80"
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
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/45 to-stone-950/10" />
          </div>

          {previewPosters.length > 1 && (
            <div className="absolute left-2 right-2 top-3 flex justify-center">
              {previewPosters.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="aspect-[2/3] w-[28%] overflow-hidden border border-stone-950/70 bg-stone-900 shadow-md"
                  style={{
                    transform: `translateX(${(index - 1) * -7}px) rotate(${
                      (index - 1) * 4
                    }deg)`,
                    zIndex: previewPosters.length - index,
                  }}
                >
                  <LazyMediaImage
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="auto"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="absolute inset-x-2 bottom-2 space-y-2">
            <div className="inline-flex items-center gap-1 rounded bg-stone-950/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              <Clapperboard className="h-3 w-3" />
              Collection
            </div>
            <div>
              <div className="line-clamp-2 text-sm font-semibold leading-tight text-stone-100 drop-shadow">
                {collection?.title}
              </div>
              <div className="mt-1 text-[11px] font-medium text-stone-300">
                {watchedCount}/{totalCount} watched
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-950/80">
              <div
                className="h-full bg-amber-500 transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(progressPercentage, totalCount ? 3 : 0)}%`,
                }}
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CollectionCard;
