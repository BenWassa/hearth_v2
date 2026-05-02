import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import LazyMediaImage from '../../../components/media/LazyMediaImage.jsx';
import PosterPlaceholder from '../../../components/cards/PosterPlaceholder.jsx';
import { resolvePosterSrc } from '../../../utils/poster.js';
import { formatReleaseDate } from '../../../utils/releaseDates.js';

const ComingSoonRail = ({ releases, onOpenDetails }) => {
  const railRef = useRef(null);
  const [atStart, setAtStart] = useState(true);

  const updateEdgeState = () => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 2);
  };

  useEffect(() => {
    updateEdgeState();
  }, [releases.length]);

  if (!releases.length) return null;

  return (
    <section className="space-y-2 shrink-0" aria-label="Coming Soon">
      <div className="flex items-center gap-1.5 px-1">
        <CalendarDays className="w-4 h-4 text-stone-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
          Coming Soon
        </h3>
      </div>

      <div className="relative px-1">
        <div
          ref={railRef}
          className="pb-1 overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={updateEdgeState}
        >
          <div className="flex gap-2.5 min-w-max">
            {releases.map((release) => {
              const posterSrc = release.poster
                ? resolvePosterSrc(release.poster)
                : '';
              return (
                <button
                  type="button"
                  key={`${release.showId}-${release.seasonNumber}`}
                  className="group relative w-[clamp(17rem,42vw,24rem)] shrink-0 overflow-hidden rounded-xl border border-stone-800/70 bg-stone-900/70 text-left shadow-lg shadow-black/20 transition-colors duration-200 hover:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  style={{ scrollSnapAlign: 'start' }}
                  onClick={() => onOpenDetails?.(release.item)}
                  aria-label={`View details for ${release.showTitle}`}
                >
                  <div className="grid grid-cols-[5.25rem_1fr] min-h-[7.75rem]">
                    <div className="relative bg-stone-950">
                      {posterSrc ? (
                        <LazyMediaImage
                          src={posterSrc}
                          alt={`${release.showTitle} season poster`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="auto"
                          fallback={
                            <PosterPlaceholder
                              title={release.showTitle}
                              type="show"
                            />
                          }
                        />
                      ) : (
                        <PosterPlaceholder
                          title={release.showTitle}
                          type="show"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-stone-950/90 to-transparent" />
                    </div>

                    <div className="min-w-0 p-3 flex flex-col justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                          <span>{formatReleaseDate(release.airDate)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-tight text-stone-100 truncate">
                            {release.showTitle}
                          </div>
                          <div className="mt-1 text-xs leading-tight text-stone-400 truncate">
                            {release.seasonName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-stone-500">
                            Next episode
                          </div>
                          <div className="mt-0.5 text-xs font-medium leading-snug text-stone-300 line-clamp-2">
                            {release.episodeTitle}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 text-stone-600 transition-colors group-hover:text-stone-400" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-stone-950/90 to-transparent transition-opacity duration-300"
          style={{ opacity: atStart ? 0 : 1 }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-stone-950/90 to-transparent" />
      </div>
    </section>
  );
};

export default ComingSoonRail;
