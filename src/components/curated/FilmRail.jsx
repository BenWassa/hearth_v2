import React, { useEffect, useRef, useState } from 'react';
import { keepCardInView } from './keepCardInView.js';
import PackArt from './PackArt.jsx';
import { loadFilms, retryWhenOnline } from './filmMedia.js';

function FilmPoster({ film, posterUrl, onOpen, onFocus }) {
  const [loadedUrl, setLoadedUrl] = useState(null);
  const loaded = Boolean(posterUrl && loadedUrl === posterUrl);

  return (
    <button
      type="button"
      aria-label={`${film.title} (${film.year})`}
      onFocus={onFocus}
      onClick={(event) => onOpen(film, event.currentTarget)}
      className="relative flex aspect-[2/3] min-h-11 min-w-11 w-full flex-col overflow-hidden rounded-md border border-stone-800 bg-stone-900 p-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      {!loaded && (
        <>
          <span className="text-label font-bold uppercase tracking-widest text-stone-400">
            {film.year}
          </span>
          <span className="mt-2 line-clamp-5 break-words font-serif text-base leading-snug text-stone-100">
            {film.title}
          </span>
        </>
      )}
      <PackArt
        key={posterUrl}
        src={posterUrl}
        onLoad={() => setLoadedUrl(posterUrl)}
        onError={() => setLoadedUrl(null)}
        className={`absolute inset-0 h-full w-full object-cover ${
          loaded ? '' : 'opacity-0'
        }`}
      />
    </button>
  );
}

export default function FilmRail({ films, label, onOpen, grid = false }) {
  const list = useRef(null);
  const [media, setMedia] = useState({});
  useEffect(() => {
    // Without an observer retain the programme cards; opening one still loads details.
    if (!window.IntersectionObserver) return undefined;

    const container = list.current;
    let active = true;
    const pendingRetries = new Set();
    let reconnects = 0;
    const onOnline = () => {
      reconnects += 1;
    };
    window.addEventListener('online', onOnline);
    const fetchBatch = async (batch) => {
      const reconnectsAtStart = reconnects;
      const data = await loadFilms(batch);
      if (!active) return;
      setMedia((previous) => ({
        ...previous,
        ...Object.fromEntries(
          batch.map((film, index) => [film.id, data[index]]),
        ),
      }));

      const missing = batch.filter((_, index) => !data[index]);
      if (!missing.length) return;
      if (reconnects > reconnectsAtStart) {
        void fetchBatch(missing);
      } else {
        const stopRetry = retryWhenOnline(() => {
          pendingRetries.delete(stopRetry);
          fetchBatch(missing);
        });
        pendingRetries.add(stopRetry);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        if (!grid) {
          observer.disconnect();
          fetchBatch(films);
          return;
        }

        // Load nearby grid rows as they come into view.
        fetchBatch(
          visible.map(({ target }) => {
            observer.unobserve(target);
            return films[Number(target.dataset.filmIndex)];
          }),
        );
      },
      {
        root: container.closest('[data-curated-scroller]'),
        rootMargin: '200px 0px',
      },
    );
    if (grid) {
      Array.from(container.children).forEach((card) => observer.observe(card));
    } else {
      observer.observe(container);
    }
    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
      pendingRetries.forEach((stopRetry) => stopRetry());
      observer.disconnect();
    };
  }, [films, grid]);

  return (
    <ul
      ref={list}
      role="list"
      aria-label={label}
      className={
        grid
          ? 'grid grid-cols-3 gap-2.5'
          : 'no-scrollbar -mx-4 flex snap-x snap-proximity gap-2.5 overflow-x-auto px-4 py-1 scroll-px-4'
      }
    >
      {films.map((film, index) => {
        const posterUrl = media[film.id]?.posterUrl;
        return (
          <li
            key={film.id}
            data-film-index={grid ? index : undefined}
            className={
              grid
                ? 'min-w-0'
                : 'w-[clamp(6.53rem,26.8vw,8.55rem)] shrink-0 snap-start'
            }
          >
            <FilmPoster
              film={film}
              posterUrl={posterUrl}
              onOpen={onOpen}
              onFocus={grid ? undefined : keepCardInView}
            />
          </li>
        );
      })}
    </ul>
  );
}
