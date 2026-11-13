import React, { useEffect, useRef, useState } from 'react';
import PackArt from './PackArt.jsx';
import { loadFilms } from './filmMedia.js';

export default function FilmRail({ films, label, onOpen }) {
  const rail = useRef(null);
  const [media, setMedia] = useState([]);
  const [loadedPosters, setLoadedPosters] = useState({});
  useEffect(() => {
    let active = true;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      loadFilms(films).then((data) => {
        if (active) setMedia(data);
      });
    };
    // Without an observer retain the programme cards; opening one still loads details.
    if (!window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load();
          observer.disconnect();
        }
      },
      {
        root: rail.current.closest('[data-curated-scroller]'),
        rootMargin: '200px 0px',
      },
    );
    observer.observe(rail.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [films]);
  return (
    <ul
      ref={rail}
      aria-label={label}
      className="no-scrollbar -m-1 flex snap-x gap-3 overflow-x-auto p-1 pb-4"
    >
      {films.map((film, index) => (
        <li
          key={film.id}
          className="w-[clamp(7rem,38vw,8.5rem)] shrink-0 snap-start"
        >
          <button
            type="button"
            aria-label={`${film.title} (${film.year})`}
            onClick={(event) => onOpen(film, event.currentTarget)}
            className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <span className="relative flex aspect-[2/3] flex-col overflow-hidden rounded-lg border border-stone-800 bg-stone-900 p-3">
              <span className="text-label font-bold uppercase tracking-widest text-stone-400">
                {film.year}
              </span>
              <span className="mt-2 line-clamp-5 break-words font-serif text-base leading-snug text-stone-100">
                {film.title}
              </span>
              <PackArt
                key={media[index]?.posterUrl || 'fallback'}
                src={media[index]?.posterUrl}
                onLoad={() =>
                  setLoadedPosters((loaded) => ({
                    ...loaded,
                    [film.id]: media[index]?.posterUrl,
                  }))
                }
                onError={() =>
                  setLoadedPosters((loaded) => ({ ...loaded, [film.id]: null }))
                }
                className="absolute inset-0 h-full w-full object-cover"
              />
            </span>
            {media[index]?.posterUrl &&
              loadedPosters[film.id] === media[index].posterUrl && (
                <span
                  aria-hidden="true"
                  className="mt-2 line-clamp-2 block font-serif text-sm leading-snug text-stone-100"
                >
                  {film.title}
                </span>
              )}
          </button>
        </li>
      ))}
    </ul>
  );
}
