import React, { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import FilmRail from '../components/curated/FilmRail.jsx';
import FilmPreview from '../components/curated/FilmPreview.jsx';
import PackArt from '../components/curated/PackArt.jsx';
import ChapterHero from '../components/curated/ChapterHero.jsx';
import ThemeCarousel from '../components/curated/ThemeCarousel.jsx';

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
  const films = useMemo(() => {
    const byId = new Map();
    for (const chapter of pack.chapters) {
      for (const film of chapter.films) {
        if (!byId.has(film.id)) byId.set(film.id, film);
      }
    }
    return byId;
  }, [pack.chapters]);
  const featured = useMemo(
    () => pack.featuredIds.map((id) => films.get(id)).filter(Boolean),
    [pack.featuredIds, films],
  );
  const allFilms = useMemo(() => [...films.values()], [films]);
  const allFilmsLabel = `All ${allFilms.length} films`;
  useEffect(() => {
    const onPop = (event) => {
      pendingBack.current = false;
      const id = event.state?.__hearthCuratedFilm;
      setActiveFilm(films.get(id) || null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [films]);
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
      className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-stone-950 pb-[var(--safe-bottom)]"
    >
      <IconButton
        label="Back to collections"
        onClick={onClose}
        className="absolute left-3 top-[calc(var(--safe-top)+0.75rem)] z-20 size-11 bg-stone-950/55 text-stone-100 ring-1 ring-stone-100/15 backdrop-blur"
      >
        <span aria-hidden="true">←</span>
      </IconButton>
      <div
        data-curated-scroller
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-10"
      >
        <header className="pb-6">
          <div className="relative -mx-4 flex h-[min(70svh,36rem)] min-h-[20rem] items-end overflow-hidden bg-stone-900 px-4 pb-6">
            <PackArt
              src={pack.art?.hero}
              className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
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
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent"
            />
            <div className="relative w-full">
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
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-300">
                {pack.description}
              </p>
            </div>
          </div>
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
            className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400"
          >
            Start here
          </h2>
          <FilmRail
            onOpen={openFilm}
            films={featured}
            label="Start here films"
          />
        </section>
        <ThemeCarousel
          chapters={pack.chapters}
          allFilmsLabel={allFilmsLabel}
          onSelect={goToSection}
        />
        {pack.chapters.map((chapter) => (
          <section
            key={chapter.id}
            ref={(node) => {
              sectionRefs.current[chapter.id] = node;
            }}
            tabIndex={-1}
            aria-labelledby={`chapter-${chapter.id}`}
            className="mb-9 scroll-mt-[calc(var(--safe-top)+4.25rem)] focus:outline-none"
          >
            <ChapterHero chapter={chapter} showSlot={pack.status === 'draft'} />
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-stone-400">
              {chapter.description}
            </p>
            <FilmRail
              onOpen={openFilm}
              films={chapter.films}
              label={`${chapter.title} films`}
            />
          </section>
        ))}
        <section
          ref={(node) => {
            sectionRefs.current['all-films'] = node;
          }}
          tabIndex={-1}
          aria-labelledby="curated-all-heading"
          className="scroll-mt-[calc(var(--safe-top)+4.25rem)] focus:outline-none"
        >
          <h2
            id="curated-all-heading"
            className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400"
          >
            {allFilmsLabel}
          </h2>
          <FilmRail films={allFilms} onOpen={openFilm} grid />
        </section>
        <details className="mt-10 border-t border-stone-800 pt-4 text-sm text-stone-400">
          <summary className="min-h-11 cursor-pointer py-3 text-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
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
            className="flex min-h-11 items-center underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
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
