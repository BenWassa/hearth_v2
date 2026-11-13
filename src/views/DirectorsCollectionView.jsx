import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import useDirectorsHistory from '../app/useDirectorsHistory.js';
import Dialog from '../components/ui/Dialog.jsx';
import {
  providerIdFor,
  findByFilmId,
  toWatchlistPayload,
} from '../components/curated/watchlistFilm.js';
import catalog from '../config/directorEssentials.json';
import { loadFilm } from '../components/directors/filmMedia.js';
import { getMediaDetails } from '../services/mediaApi/client.js';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

const OptionalArt = ({ src, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    !failed && (
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? '' : 'hidden'}`}
      />
    )
  );
};

const FilmPoster = ({ film }) => {
  const ref = useRef(null);
  const [poster, setPoster] = useState('');
  useEffect(() => {
    let active = true;
    const load = () =>
      loadFilm(film).then((data) => {
        if (active) setPoster(data?.posterUrl || data?.poster || '');
      });
    if (!window.IntersectionObserver) load();
    const observer =
      window.IntersectionObserver &&
      new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            load();
            observer.disconnect();
          }
        },
        { rootMargin: '150px' },
      );
    if (observer && ref.current) observer.observe(ref.current);
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [film]);
  return (
    <span
      ref={ref}
      className="block aspect-[2/3] w-full overflow-hidden rounded bg-stone-800"
    >
      {poster && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setPoster('')}
        />
      )}
    </span>
  );
};

const Scores = ({ film }) => {
  const imdb = film.imdb?.rating;
  const rt = film.rt?.tomatometer;
  return (
    <span
      className="ml-auto shrink-0 text-right text-xs leading-relaxed text-stone-300"
      aria-label={`IMDb ${imdb ?? 'n/a'}, Rotten Tomatoes ${
        rt == null ? 'n/a' : `${rt} percent`
      }`}
    >
      <span aria-hidden="true" className="block">
        IMDb {imdb == null ? 'n/a' : imdb.toFixed(1)}
      </span>
      <span aria-hidden="true" className="block">
        RT {rt == null ? 'n/a' : `${rt}%`}
      </span>
    </span>
  );
};

const DirectorsCollectionView = ({
  items = [],
  removedItems = [],
  onClose,
  onAddItem,
  onOpenRemoved,
}) => {
  const { stage, navigate, back } = useDirectorsHistory(onClose);
  const selected = stage.director;
  const activeFilm = stage.film;
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [retry, setRetry] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const scrollRef = useRef(null);
  const headingRef = useRef(null);
  const directoryScroll = useRef(0);
  const directoryRail = useRef(null);
  const directoryRailScroll = useRef(0);
  const openerRef = useRef(null);

  const selectedDirector = catalog.directors.find(
    (entry) => entry.id === selected,
  );
  const ownedIds = useMemo(
    () => new Set(items.map(providerIdFor).filter(Boolean)),
    [items],
  );
  const removedIds = useMemo(
    () => new Set(removedItems.map(providerIdFor).filter(Boolean)),
    [removedItems],
  );

  useEffect(() => {
    if (!activeFilm) {
      setPreview(null);
      setPreviewError('');
      return undefined;
    }
    let active = true;
    setPreview(null);
    setPreviewError('');
    setPreviewLoading(true);
    setPosterFailed(false);
    getMediaDetails({
      provider: 'tmdb',
      providerId: activeFilm.providerId,
      type: 'movie',
    })
      .then((data) => {
        if (!active) return;
        if (
          data?.provider !== 'tmdb' ||
          String(data.providerId) !== String(activeFilm.providerId) ||
          (data.type && data.type !== 'movie')
        ) {
          throw new Error('Provider identity mismatch');
        }
        setPreview(data);
      })
      .catch(() => {
        if (active)
          setPreviewError('Film details could not be verified. Try again.');
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeFilm?.providerId, retry]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = selected ? 0 : directoryScroll.current;
    if (!selected && directoryRail.current)
      directoryRail.current.scrollLeft = directoryRailScroll.current;
    if (!selected && openerRef.current) {
      requestAnimationFrame(() =>
        document
          .querySelector(`[data-director-card="${openerRef.current}"]`)
          ?.focus({ preventScroll: true }),
      );
    } else headingRef.current?.focus({ preventScroll: true });
  }, [selected]);

  const openDirector = (entry) => {
    directoryScroll.current = scrollRef.current?.scrollTop || 0;
    directoryRailScroll.current = directoryRail.current?.scrollLeft || 0;
    openerRef.current = entry.id;
    setExpanded(false);
    navigate({ director: entry.id, film: null });
  };
  const openFilm = (film) => {
    navigate({ director: selected, film });
    setSaveNotice('');
  };
  const saveFilm = async () => {
    if (!preview || saving || !activeFilm) return;
    if (removedIds.has(activeFilm.providerId)) return;
    if (ownedIds.has(activeFilm.providerId)) return;
    setSaving(true);
    setSaveNotice('');
    try {
      if (typeof onAddItem !== 'function')
        throw new Error('Saving is unavailable.');
      const outcome = await onAddItem(toWatchlistPayload(preview), {
        allowRestore: false,
      });
      if (outcome?.status === 'added') {
        setSaveNotice('Added to your shared shelf.');
      } else if (outcome?.status === 'restored') {
        setSaveNotice('Restored to your shared shelf.');
      } else if (outcome?.status === 'exists') {
        setSaveNotice('Already on your shared shelf.');
      } else if (outcome?.status === 'removed') {
        setSaveNotice('This title is in Recently removed. Restore it there.');
      } else {
        setSaveNotice(
          'Could not confirm the save. Check your shelf and try again.',
        );
      }
    } catch {
      setSaveNotice('Could not save this title. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const heading = selectedDirector?.name || catalog.title;
  const films = useMemo(
    () =>
      (selectedDirector?.films || []).map((film) => ({
        ...film,
        providerId: String(film.tmdbId),
      })),
    [selectedDirector],
  );
  const watchNext = films
    .filter((film) => {
      const item = findByFilmId(items, film.providerId);
      return (item?.userState?.status || item?.status) !== 'watched';
    })
    .slice(0, 3);

  return (
    <Dialog
      onClose={back}
      aria-labelledby="directors-page-heading"
      className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-stone-950 pt-[var(--safe-top)] pb-[var(--safe-bottom)]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-800/80 px-3 py-2">
        <button
          type="button"
          aria-label={
            activeFilm
              ? 'Back to director'
              : selected
              ? 'Back to directors'
              : 'Back to Tonight'
          }
          onClick={back}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-200 ${focusRing}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="min-w-0 truncate font-serif text-lg text-stone-100">
          {activeFilm
            ? selectedDirector?.name
            : selected
            ? 'The Directors'
            : 'Collections'}
        </span>
      </header>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-12"
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          id="directors-page-heading"
          className="sr-only"
        >
          {heading}
        </h1>
        {!selected && (
          <>
            <div className="border-b border-stone-800/80 pb-6 pt-9">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Curated collection
              </p>
              <h2 className="max-w-[18rem] font-serif text-4xl leading-tight tracking-tight text-stone-100">
                The Directors
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">
                Twelve filmmakers. A considered selection of their essential
                films.
              </p>
            </div>
            <section aria-label="Explore directors" className="pt-6">
              <div className="mb-4 flex items-end justify-between">
                <h3 className="font-serif text-2xl text-stone-100">
                  Explore filmmakers
                </h3>
                <span className="text-xs text-stone-400">12 profiles</span>
              </div>
              <div
                ref={directoryRail}
                className="-m-1 flex snap-x snap-mandatory gap-3 overflow-x-auto p-1 pb-5"
                onKeyDown={(event) => {
                  if (
                    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                      event.key,
                    )
                  )
                    return;
                  const cards = [
                    ...event.currentTarget.querySelectorAll('button'),
                  ];
                  const index = cards.indexOf(document.activeElement);
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                      ? cards.length - 1
                      : Math.max(
                          0,
                          Math.min(
                            cards.length - 1,
                            index + (event.key === 'ArrowRight' ? 1 : -1),
                          ),
                        );
                  event.preventDefault();
                  cards[next]?.focus();
                }}
              >
                {catalog.directors.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    data-director-card={entry.id}
                    onClick={(event) =>
                      openDirector(entry, event.currentTarget)
                    }
                    className={`group flex w-[75%] shrink-0 snap-start min-h-[10rem] flex-col justify-between rounded-xl border border-stone-800 bg-stone-900/65 p-3 text-left transition-colors hover:border-stone-600 ${focusRing}`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[11px] tabular-nums tracking-widest text-stone-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-amber-300/70"
                        aria-hidden="true"
                      />
                    </span>
                    <span>
                      <span className="mb-2 block font-serif text-xl leading-tight text-stone-100">
                        {entry.name}
                      </span>
                      {entry.description && (
                        <span className="block text-xs leading-snug text-stone-400">
                          {entry.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {selected && (
          <>
            <div className="pb-7 pt-7">
              <OptionalArt
                key={`${selected}-portrait`}
                src={`/assets/collections/legendary-directors/directors/${selected}/portrait.webp`}
                className="mb-5 max-h-72 w-full rounded-xl object-cover"
              />
              <h2 className="font-serif text-3xl leading-tight text-stone-100">
                {selectedDirector.name}
              </h2>
              <OptionalArt
                key={`${selected}-signature`}
                src={`/assets/collections/legendary-directors/directors/${selected}/signature.svg`}
                className="mt-3 h-16 max-w-full object-contain"
              />
            </div>
            {watchNext.length > 0 && (
              <section aria-label="Watch Next">
                <h3 className="font-serif text-2xl text-stone-100">
                  Watch Next
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  Not marked watched on your shared shelf.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {watchNext.map((film) => (
                    <button
                      key={film.tmdbId}
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.focus({ preventScroll: true });
                        openFilm(film);
                      }}
                      className={`min-w-0 text-left ${focusRing}`}
                    >
                      <FilmPoster film={film} />
                      <span
                        title={film.title}
                        className="mt-2 line-clamp-3 font-serif text-sm text-stone-100"
                      >
                        {film.title}
                      </span>
                      <span className="text-xs text-stone-400">
                        {film.year}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section
              aria-label={`Essential ${films.length}`}
              className="mt-8 border-t border-stone-800 pt-6"
            >
              <h3 className="font-serif text-2xl text-stone-100">
                Essential {films.length}
              </h3>
              <ol
                id="director-essentials"
                className="mt-4 divide-y divide-stone-800"
              >
                {films.slice(0, expanded ? films.length : 5).map((film) => (
                  <li
                    key={film.tmdbId}
                    value={film.rank}
                    data-essential-rank={film.rank}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.focus({ preventScroll: true });
                        openFilm(film);
                      }}
                      className={`flex min-h-20 w-full items-center gap-2 py-3 text-left ${focusRing}`}
                    >
                      <span className="w-9 shrink-0">
                        <FilmPoster film={film} />
                      </span>
                      <span
                        className={`w-5 shrink-0 text-center tabular-nums ${
                          film.rank <= 3
                            ? 'font-semibold text-amber-200'
                            : 'text-stone-400'
                        }`}
                      >
                        {film.rank}
                        <span className="sr-only">
                          {film.rank <= 3 ? ', signature film' : ''}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-serif text-base text-stone-100">
                          {film.title}
                        </span>
                        <span className="text-xs text-stone-400">
                          {film.year}
                        </span>
                      </span>
                      <Scores film={film} />
                    </button>
                  </li>
                ))}
              </ol>
              {films.length > 5 && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls="director-essentials"
                  onClick={() => setExpanded((value) => !value)}
                  className={`mt-2 min-h-11 text-sm text-amber-200 ${focusRing}`}
                >
                  {expanded ? 'Show fewer' : `View all ${films.length}`}
                </button>
              )}
              <p className="mt-5 text-xs text-stone-400">
                Scores from IMDb and Rotten Tomatoes, read 13 Nov 2026
              </p>
            </section>
          </>
        )}
        {selected && activeFilm && (
          <Dialog
            onClose={back}
            aria-labelledby="director-film-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4"
          >
            <section
              className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-700 bg-stone-900 p-5"
              aria-label="Film details"
            >
              <button
                type="button"
                onClick={back}
                className={`mb-4 min-h-11 text-sm text-stone-300 ${focusRing}`}
              >
                Close film details
              </button>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Directed by {selectedDirector?.name}
              </p>
              <h2
                id="director-film-title"
                className="font-serif text-3xl text-stone-100"
              >
                {activeFilm.title}
              </h2>
              <p className="mt-2 text-sm text-stone-400">{activeFilm.year}</p>
              {previewLoading && (
                <p role="status" className="mt-6 text-sm text-stone-400">
                  Verifying film details…
                </p>
              )}
              {previewError && (
                <p role="alert" className="mt-6 text-sm text-stone-300">
                  {previewError}
                  <button
                    type="button"
                    onClick={() => setRetry((value) => value + 1)}
                    className={`mt-2 block min-h-11 text-sm text-amber-200 ${focusRing}`}
                  >
                    Try again
                  </button>
                </p>
              )}
              {preview && (
                <>
                  <div className="mt-5 flex items-start gap-4">
                    {preview.posterUrl && !posterFailed && (
                      <img
                        src={preview.posterUrl}
                        onError={() => setPosterFailed(true)}
                        alt=""
                        className="w-28 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <p className="text-sm leading-relaxed text-stone-300">
                      {preview.overview || 'No synopsis available.'}
                    </p>
                  </div>
                  {ownedIds.has(activeFilm.providerId) ? (
                    <p className="mt-6 text-sm text-amber-200">On your shelf</p>
                  ) : removedIds.has(activeFilm.providerId) ? (
                    <div className="mt-6 rounded-xl border border-stone-800 bg-stone-900 p-3">
                      <p className="text-sm text-stone-300">
                        This title is in Recently removed. Restore it there to
                        preserve your previous details.
                      </p>
                      {onOpenRemoved && (
                        <button
                          type="button"
                          onClick={onOpenRemoved}
                          className={`mt-2 min-h-11 text-sm text-amber-300 ${focusRing}`}
                        >
                          Open Recently removed
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={saving || typeof onAddItem !== 'function'}
                      onClick={saveFilm}
                      className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-stone-950 disabled:opacity-50 ${focusRing}`}
                    >
                      <Plus className="h-4 w-4" />
                      {saving ? 'Saving…' : 'Add to shelf'}
                    </button>
                  )}
                  {saveNotice && (
                    <p role="status" className="mt-3 text-xs text-stone-400">
                      {saveNotice}
                    </p>
                  )}
                </>
              )}
            </section>
          </Dialog>
        )}
        <footer className="mt-10 flex items-start gap-3 border-t border-stone-800/60 pt-5 text-xs leading-relaxed text-stone-400">
          <img src="/tmdb-logo.svg" alt="TMDB" className="mt-1 w-11 shrink-0" />
          <span>
            <span className="block font-semibold text-stone-400">Credits</span>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </span>
        </footer>
      </div>
    </Dialog>
  );
};

export default DirectorsCollectionView;
