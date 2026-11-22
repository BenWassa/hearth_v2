import React from 'react';
import PackArt from './PackArt.jsx';

function ThemeTile({ title, count, children, onClick }) {
  return (
    <li className="w-[min(80vw,20rem)] shrink-0 snap-start">
      <button
        type="button"
        onClick={onClick}
        className="relative flex aspect-[16/10] min-h-11 w-full items-end overflow-hidden rounded-md border border-stone-800 bg-stone-900 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/45 to-transparent"
        />
        <span className="relative">
          <span className="block font-serif text-2xl leading-tight text-stone-100">
            {title}
          </span>
          {count && (
            <span className="mt-2 block text-xs font-bold uppercase tracking-widest text-stone-300">
              {count}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

const artClass = 'absolute inset-0 h-full w-full object-cover';

export default function ThemeCarousel({ chapters, allFilmsLabel, onSelect }) {
  return (
    <nav aria-label="Collection chapters" className="my-8">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">
        Explore by theme
      </h2>
      <ul
        role="list"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-1 scroll-px-4"
      >
        {chapters.map((chapter) => (
          <ThemeTile
            key={chapter.id}
            title={chapter.title}
            count={`${chapter.films.length} films`}
            onClick={() => onSelect(chapter.id)}
          >
            <PackArt
              src={chapter.heroArt}
              className={artClass}
              placeholder={<PackArt src={chapter.art} className={artClass} />}
            />
          </ThemeTile>
        ))}
        <ThemeTile
          title={allFilmsLabel}
          onClick={() => onSelect('all-films')}
        />
      </ul>
    </nav>
  );
}
