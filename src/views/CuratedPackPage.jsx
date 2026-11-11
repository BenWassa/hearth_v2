import React, { useEffect, useRef } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import IconButton from '../components/ui/IconButton.jsx';

const FilmList = ({ films, rail = false }) => (
  <ul
    className={
      rail
        ? 'flex gap-3 overflow-x-auto pb-3'
        : 'grid grid-cols-2 gap-x-4 gap-y-5'
    }
  >
    {films.map((film) => (
      <li key={film.id} className={rail ? 'w-32 shrink-0' : 'min-w-0'}>
        <div className="flex aspect-[2/3] items-end rounded-lg bg-stone-900 p-3">
          <span className="break-words font-serif text-lg leading-snug text-stone-200">
            {film.title}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-400">{film.year}</p>
      </li>
    ))}
  </ul>
);

export default function CuratedPackPage({ pack, onClose }) {
  const heading = useRef(null);
  const sectionRefs = useRef({});
  const films = pack.chapters.flatMap((chapter) => chapter.films);
  const featured = pack.featuredIds
    .map((id) => films.find((film) => film.id === id))
    .filter(Boolean);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  const goToSection = (id) => {
    const section = sectionRefs.current[id];
    section?.scrollIntoView?.({ block: 'start' });
    section?.focus({ preventScroll: true });
  };
  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="curated-pack-heading"
      className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-stone-950 pt-[var(--safe-top)] pb-[var(--safe-bottom)]"
    >
      <header className="shrink-0 border-b border-stone-800 px-3 py-2">
        <IconButton label="Back to collections" onClick={onClose}>
          <span aria-hidden="true">←</span>
        </IconButton>
      </header>
      <div
        data-curated-scroller
        className="min-h-0 flex-1 overflow-y-auto px-5 pb-10"
      >
        <header className="pb-8 pt-6">
          <p className="text-label font-bold uppercase tracking-widest text-stone-400">
            Curated collection
          </p>
          <h1
            id="curated-pack-heading"
            ref={heading}
            tabIndex={-1}
            className="mt-3 max-w-xs font-serif text-4xl leading-tight tracking-tight text-stone-100 focus:outline-none"
          >
            {pack.title}
          </h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-stone-300">
            {pack.description}
          </p>
          <p className="mt-3 text-xs text-stone-400">{pack.credit}</p>
          {pack.status === 'draft' && (
            <p className="mt-5 border-t border-stone-800 pt-4 text-sm leading-relaxed text-stone-400">
              Collection preview. Film selections and chapters are still being
              reviewed. Saving films will be available when the collection is
              ready.
            </p>
          )}
        </header>
        <section aria-labelledby="curated-start-heading">
          <h2
            id="curated-start-heading"
            className="mb-3 font-serif text-2xl text-stone-100"
          >
            Start here
          </h2>
          <FilmList films={featured} rail />
        </section>
        <nav aria-label="Collection chapters" className="my-8">
          <h2 className="font-serif text-2xl text-stone-100">
            Explore by theme
          </h2>
          <ul className="mt-3 divide-y divide-stone-800">
            {pack.chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  className="flex min-h-11 w-full items-center justify-between gap-4 py-3 text-left text-sm text-stone-300 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  onClick={() => goToSection(chapter.id)}
                >
                  {chapter.title}
                  <span aria-hidden="true">↓</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => goToSection('all-films')}
            className="mt-2 min-h-11 text-sm text-stone-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Browse all films
          </button>
        </nav>
        {pack.chapters.map((chapter) => (
          <section
            key={chapter.id}
            ref={(node) => {
              sectionRefs.current[chapter.id] = node;
            }}
            tabIndex={-1}
            aria-labelledby={`chapter-${chapter.id}`}
            className="mb-9 scroll-mt-5 focus:outline-none"
          >
            <h2
              id={`chapter-${chapter.id}`}
              className="font-serif text-2xl text-stone-100"
            >
              {chapter.title}
            </h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-stone-400">
              {chapter.description}
            </p>
            <FilmList films={chapter.films} rail />
          </section>
        ))}
        <section
          ref={(node) => {
            sectionRefs.current['all-films'] = node;
          }}
          tabIndex={-1}
          aria-labelledby="curated-all-heading"
          className="scroll-mt-5 focus:outline-none"
        >
          <h2
            id="curated-all-heading"
            className="mb-4 font-serif text-2xl text-stone-100"
          >
            All films
          </h2>
          <FilmList films={films} />
        </section>
        <details className="mt-10 border-t border-stone-800 pt-4 text-sm text-stone-400">
          <summary className="min-h-11 cursor-pointer py-3 text-stone-300">
            About this collection
          </summary>
          <p className="leading-relaxed">
            This working selection comes from Black Comedy Excellence. It
            includes comedies and comedy-adjacent stories. Chapters and starting
            points are editorial suggestions, not rankings.
          </p>
        </details>
      </div>
    </Dialog>
  );
}
