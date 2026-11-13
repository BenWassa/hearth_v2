import React, { useEffect, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import FilmList from '../components/curated/FilmRail.jsx';
import FilmPreview from '../components/curated/FilmPreview.jsx';
import PackArt from '../components/curated/PackArt.jsx';
import ChapterHero from '../components/curated/ChapterHero.jsx';

const SlotPlaceholder = ({ label, className = '' }) => (
  <div
    aria-hidden="true"
    className={`flex items-center justify-center border border-dashed border-stone-700 text-center text-xs text-stone-500 ${className}`}
  >
    {label}
  </div>
);

export default function CuratedPackPage({
  pack,
  onClose,
  items,
  removedItems,
  onAddItem,
  onOpenItem,
  onOpenRemoved,
}) {
  const [activeFilm, setActiveFilm] = useState(null);
  const pendingBack = useRef(false);
  useEffect(() => {
    const onPop = (event) => {
      pendingBack.current = false;
      const id = event.state?.__hearthCuratedFilm;
      setActiveFilm(
        pack.chapters
          .flatMap((chapter) => chapter.films)
          .find((film) => film.id === id) || null,
      );
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [pack]);
  const openFilm = (film, opener) => {
    if (pendingBack.current) return;
    opener.focus({ preventScroll: true });
    window.history.pushState(
      { ...window.history.state, __hearthCuratedFilm: film.id },
      '',
    );
    setActiveFilm(film);
  };
  const closeFilm = () => {
    if (pendingBack.current) return;
    pendingBack.current = true;
    window.history.back();
  };
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
        <header className="pb-8">
          <div className="relative -mx-5 flex min-h-[13rem] items-end overflow-hidden bg-stone-900 px-5 pb-5 pt-6">
            <PackArt
              src={pack.art?.hero}
              className="absolute inset-0 h-full w-full object-cover"
              placeholder={
                pack.status === 'draft' ? (
                  <SlotPlaceholder
                    label="Hero artwork 1600×900"
                    className="absolute inset-y-4 right-4 w-1/3"
                  />
                ) : null
              }
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(12,10,9,0.9)_0%,rgba(12,10,9,0)_65%),linear-gradient(to_right,rgba(12,10,9,0.72)_0%,rgba(12,10,9,0)_72%)]"
            />
            <div className="relative max-w-[62%]">
              <p className="text-label font-bold uppercase tracking-widest text-stone-300">
                Curated collection
              </p>
              <h1
                id="curated-pack-heading"
                ref={heading}
                tabIndex={-1}
                className="mt-3 font-serif text-3xl leading-tight tracking-tight text-stone-100 focus:outline-none min-[360px]:text-4xl"
              >
                {pack.title}
              </h1>
            </div>
          </div>
          <p className="mt-5 max-w-prose text-sm leading-relaxed text-stone-300">
            {pack.description}
          </p>
          <p className="mt-3 text-xs text-stone-400">{pack.credit}</p>
          {pack.status === 'draft' && (
            <p className="mt-3 text-xs text-stone-400">
              Preview: selections are under review and saving isn't available
              yet.
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
          <FilmList
            onOpen={openFilm}
            films={featured}
            label="Start here films"
          />
        </section>
        <nav
          aria-label="Collection chapters"
          ref={(node) => {
            sectionRefs.current.themes = node;
          }}
          tabIndex={-1}
          className="my-8 scroll-mt-5 focus:outline-none"
        >
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
            <ChapterHero chapter={chapter} showSlot={pack.status === 'draft'} />
            <p className="mb-4 text-sm leading-relaxed text-stone-400">
              {chapter.description}
            </p>
            <FilmList
              onOpen={openFilm}
              films={chapter.films}
              label={`${chapter.title} films`}
            />
            <button
              onClick={() => goToSection('themes')}
              className="min-h-11 text-sm text-stone-400 underline underline-offset-4 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              Back to themes
            </button>
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
          {pack.chapters.map((chapter) => (
            <div key={chapter.id} className="mb-6">
              <h3 className="text-label font-bold uppercase tracking-widest text-stone-400">
                {chapter.title}
              </h3>
              <ul className="mt-1 divide-y divide-stone-800">
                {chapter.films.map((film) => (
                  <li key={film.id}>
                    <button
                      type="button"
                      aria-label={`${film.title} (${film.year})`}
                      onClick={(event) => openFilm(film, event.currentTarget)}
                      className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                    >
                      <span className="font-serif text-base leading-snug text-stone-100">
                        {film.title}
                      </span>
                      <span className="shrink-0 text-sm text-stone-400">
                        {film.year}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
          <p className="mt-4 text-xs leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center underline"
          >
            TMDB, movie metadata (opens in a new tab)
          </a>
        </details>
      </div>
      {activeFilm && (
        <FilmPreview
          key={activeFilm.id}
          film={activeFilm}
          items={items}
          removedItems={removedItems}
          onAddItem={onAddItem}
          onOpenItem={onOpenItem}
          onOpenRemoved={onOpenRemoved}
          onClose={closeFilm}
        />
      )}
    </Dialog>
  );
}
