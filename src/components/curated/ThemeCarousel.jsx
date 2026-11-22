import React, { useEffect, useMemo, useRef, useState } from 'react';
import PackArt from './PackArt.jsx';
import { loadFilms } from './filmMedia.js';
import { keepCardInView } from './keepCardInView.js';

const artClass =
  'absolute inset-0 h-full w-full scale-110 object-cover blur-[2px] brightness-50';
const coverPositions = [
  'right-[30%] top-[9%] -rotate-12',
  'right-[17%] top-[5%] rotate-0',
  'right-[5%] top-[9%] rotate-12',
];

function ThemeTile({ tile, posters, onSelect }) {
  return (
    <li className="w-[min(80vw,20rem)] shrink-0 snap-start">
      <button
        type="button"
        data-theme={tile.id}
        onClick={() => onSelect(tile.id)}
        onFocus={keepCardInView}
        className="relative flex aspect-[4/3] min-h-11 w-full items-end overflow-hidden rounded-md border border-stone-800 bg-stone-900 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        <PackArt
          key={tile.backdrop}
          src={tile.backdrop}
          className={artClass}
          placeholder={<PackArt src={tile.fallback} className={artClass} />}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {tile.films.map((film, index) => (
            <PackArt
              key={film.id}
              src={posters[film.id]}
              className={`absolute aspect-[2/3] w-[22%] rounded-sm object-cover shadow-lg shadow-stone-950/80 ${coverPositions[index]}`}
            />
          ))}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent"
        />
        <span className="relative">
          <span className="block font-serif text-2xl leading-tight text-stone-100">
            {tile.title}
          </span>
          {tile.count && (
            <span className="mt-2 block text-xs font-bold uppercase tracking-widest text-stone-300">
              {tile.count}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

export default function ThemeCarousel({
  chapters,
  featured,
  heroArt,
  allFilmsLabel,
  onSelect,
  navRef,
}) {
  const list = useRef(null);
  const [posters, setPosters] = useState({});
  const tiles = useMemo(
    () => [
      ...chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        count: `${chapter.films.length} films`,
        backdrop: chapter.heroArt,
        fallback: chapter.art,
        films: chapter.films.slice(0, 3),
      })),
      {
        id: 'all-films',
        title: allFilmsLabel,
        backdrop: heroArt,
        films: featured.slice(0, 3),
      },
    ],
    [chapters, featured, heroArt, allFilmsLabel],
  );

  useEffect(() => {
    if (!window.IntersectionObserver) return undefined;
    const container = list.current;
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const films = tiles.flatMap((tile) => tile.films);
        loadFilms(films).then((data) => {
          if (active) {
            setPosters(
              Object.fromEntries(
                films.map((film, index) => [film.id, data[index]?.posterUrl]),
              ),
            );
          }
        });
      },
      {
        root: container.closest('[data-curated-scroller]'),
        rootMargin: '200px 0px',
      },
    );
    observer.observe(container);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [tiles]);

  return (
    <nav
      ref={navRef}
      aria-label="Collection chapters"
      className="my-8 scroll-mt-[calc(var(--safe-top)+4.5rem)]"
    >
      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">
        Explore by theme
      </h2>
      <ul
        ref={list}
        role="list"
        className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-3 overflow-x-auto px-4 py-1 scroll-px-4"
      >
        {tiles.map((tile) => (
          <ThemeTile
            key={tile.id}
            tile={tile}
            posters={posters}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  );
}
