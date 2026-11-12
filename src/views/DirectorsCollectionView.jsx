import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import Dialog from '../components/ui/Dialog.jsx';
import catalog from '../config/directorCatalog.json';
import {
  getDirectorDetails,
  getMediaDetails,
} from '../services/mediaApi/client.js';

const directorCache = new Map();
const CACHE_MS = 30 * 60 * 1000;
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

const providerIdFor = (item) => {
  const source = item?.source || {};
  const provider = String(
    source.provider || item?.media?.provider || item?.provider || '',
  ).toLowerCase();
  const id = String(
    source.providerId || item?.media?.providerId || item?.providerId || '',
  ).trim();
  if (provider === 'tmdb' && id) return id;
  const mediaId = String(item?.mediaId || item?.id || '');
  return mediaId.startsWith('tmdb:') ? mediaId.slice(5) : '';
};

const findByFilmId = (items, id) =>
  (items || []).find(
    (item) => providerIdFor(item) === String(id) && item?.type !== 'show',
  );

const toWatchlistPayload = (film) => {
  if (
    film?.provider !== 'tmdb' ||
    !/^\d+$/.test(String(film?.providerId || ''))
  ) {
    throw new Error('Film identity could not be verified.');
  }
  return {
    schemaVersion: 2,
    title: film.title,
    type: 'movie',
    status: 'unwatched',
    source: {
      provider: 'tmdb',
      providerId: String(film.providerId),
      fetchedAt: Date.now(),
      locale: 'en-US',
    },
    media: {
      ...film,
      type: 'movie',
      provider: 'tmdb',
      providerId: String(film.providerId),
      title: film.title,
      poster: film.posterUrl || film.poster || '',
      backdrop: film.backdropUrl || film.backdrop || '',
      logo: film.logoUrl || film.logo || '',
      directors: Array.isArray(film.directors) ? film.directors : [],
    },
    userState: {
      status: 'unwatched',
      note: '',
      episodeProgress: {},
      tagProvenance: { vibe: 'automatic', energy: 'automatic' },
    },
  };
};

const FilmCard = ({ film, owned, onOpen, compact = false }) => (
  <button
    type="button"
    onClick={() => onOpen(film)}
    className={`group flex min-w-0 flex-col gap-1.5 text-left ${focusRing}`}
    aria-label={`${film.title} (${film.year || 'year unknown'})${
      owned ? ', on your shelf' : ''
    }`}
  >
    <span className="relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-800">
      {film.poster ? (
        <img
          src={film.poster}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full items-center justify-center p-2 text-center font-serif text-sm text-stone-300"
        >
          {film.title}
        </span>
      )}
      {owned && (
        <span className="absolute bottom-1.5 left-1.5 rounded bg-stone-950/90 px-1.5 py-1 text-[10px] font-semibold text-amber-200">
          On shelf
        </span>
      )}
    </span>
    <span
      className={`line-clamp-2 font-medium text-stone-200 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      {film.title}
    </span>
    <span className="text-xs text-stone-400">{film.year}</span>
  </button>
);

const DirectorsCollectionView = ({
  items = [],
  removedItems = [],
  onClose,
  onOpenItem,
  onAddItem,
  onOpenRemoved,
}) => {
  const [selected, setSelected] = useState(null);
  const [directorData, setDirectorData] = useState(null);
  const [directorError, setDirectorError] = useState('');
  const [directorLoading, setDirectorLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeFilm, setActiveFilm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const scrollRef = useRef(null);
  const headingRef = useRef(null);
  const directoryScroll = useRef(0);
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
    if (!selectedDirector) {
      setDirectorData(null);
      setDirectorError('');
      setDirectorLoading(false);
      return undefined;
    }
    let active = true;
    const key = String(selectedDirector.personId);
    const cached = directorCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      setDirectorData(cached.data);
      setDirectorError('');
      setDirectorLoading(false);
      return undefined;
    }
    setDirectorData(null);
    setDirectorError('');
    setDirectorLoading(true);
    getDirectorDetails(key)
      .then((data) => {
        if (!active) return;
        directorCache.set(key, { data, at: Date.now() });
        setDirectorData(data);
      })
      .catch(() => {
        if (active)
          setDirectorError(
            'Film credits are unavailable right now. Try again.',
          );
      })
      .finally(() => {
        if (active) setDirectorLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDirector?.personId, retry]);

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
    getMediaDetails({
      provider: 'tmdb',
      providerId: activeFilm.providerId,
      type: 'movie',
    })
      .then((data) => {
        if (!active) return;
        if (
          data?.provider !== 'tmdb' ||
          String(data.providerId) !== String(activeFilm.providerId)
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
  }, [activeFilm?.providerId]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = selected ? 0 : directoryScroll.current;
    headingRef.current?.focus({ preventScroll: true });
  }, [selected, activeFilm?.providerId]);

  const openDirector = (entry, opener) => {
    directoryScroll.current = scrollRef.current?.scrollTop || 0;
    openerRef.current = opener;
    setSelected(entry.id);
    setActiveFilm(null);
  };
  const back = () => {
    if (activeFilm) {
      setActiveFilm(null);
      setSaveNotice('');
    } else if (selected) {
      setSelected(null);
      setDirectorData(null);
      requestAnimationFrame(() => {
        if (openerRef.current?.isConnected)
          openerRef.current.focus({ preventScroll: true });
      });
    } else {
      onClose?.();
    }
  };
  const openFilm = (film) => {
    const owned = findByFilmId(items, film.providerId);
    if (owned) {
      onOpenItem?.(owned);
      return;
    }
    setActiveFilm(film);
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
      await onAddItem(toWatchlistPayload(preview));
      // The Firebase watchlist listener, not this callback, confirms a save.
      setSaveNotice(
        'Save requested. Your shelf will show the result once synced.',
      );
    } catch {
      setSaveNotice('Could not save this title. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const heading = activeFilm?.title || selectedDirector?.name || catalog.title;

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
                {catalog.subtitle}
              </p>
              <p className="mt-3 text-xs text-stone-500">
                A small, considered introduction to twelve filmmakers.
              </p>
            </div>
            <section aria-label="Explore directors" className="pt-6">
              <div className="mb-4 flex items-end justify-between">
                <h3 className="font-serif text-2xl text-stone-100">
                  Explore filmmakers
                </h3>
                <span className="text-xs text-stone-500">12 profiles</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {catalog.directors.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    data-director-card={entry.id}
                    onClick={(event) =>
                      openDirector(entry, event.currentTarget)
                    }
                    className={`group flex min-h-[10rem] flex-col justify-between rounded-xl border border-stone-800 bg-stone-900/65 p-3 text-left transition-colors hover:border-stone-600 ${focusRing}`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[10px] tabular-nums tracking-widest text-stone-500">
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
                      <span className="block text-xs leading-snug text-stone-400">
                        {entry.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {selected && !activeFilm && (
          <>
            <div className="pb-7 pt-7">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Filmmaker
              </p>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-3xl leading-tight text-stone-100">
                    {selectedDirector?.name}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">
                    {selectedDirector?.description}
                  </p>
                </div>
                {directorData?.portrait && (
                  <img
                    src={directorData.portrait}
                    alt=""
                    className="h-28 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
            {directorLoading && (
              <p role="status" className="py-6 text-sm text-stone-400">
                Loading directed film credits…
              </p>
            )}
            {directorError && (
              <div
                role="alert"
                className="rounded-xl border border-stone-800 p-4"
              >
                <p className="text-sm text-stone-300">{directorError}</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                  className={`mt-3 min-h-11 text-sm text-amber-300 ${focusRing}`}
                >
                  Retry
                </button>
              </div>
            )}
            {directorData && (
              <>
                {directorData.startHere.length > 0 && (
                  <section
                    aria-label="Start here"
                    className="border-t border-stone-800/80 pt-6"
                  >
                    <h3 className="font-serif text-2xl text-stone-100">
                      Start here
                    </h3>
                    <p className="mt-1 text-sm text-stone-400">
                      A few selected entry points.
                    </p>
                    <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 no-scrollbar">
                      {directorData.startHere.map((film) => (
                        <div
                          key={film.providerId}
                          className="w-[8.4rem] shrink-0 snap-start"
                        >
                          <FilmCard
                            film={film}
                            owned={ownedIds.has(film.providerId)}
                            onOpen={openFilm}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section
                  aria-label="Directed film credits"
                  className="mt-8 border-t border-stone-800/80 pt-6"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-2xl text-stone-100">
                      Directed films
                    </h3>
                    <span className="text-xs text-stone-500">
                      {directorData.films.length} credits
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-400">
                    Released titles in chronological order, from TMDB director
                    credits. Includes shorts where credited.
                  </p>
                  {directorData.films.length ? (
                    <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5">
                      {directorData.films.map((film) => (
                        <FilmCard
                          key={film.providerId}
                          film={film}
                          owned={ownedIds.has(film.providerId)}
                          onOpen={openFilm}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-stone-400">
                      No released director credits found.
                    </p>
                  )}
                </section>
              </>
            )}
          </>
        )}
        {selected && activeFilm && (
          <section className="pt-7" aria-label="Film details">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Directed by {selectedDirector?.name}
            </p>
            <h2 className="font-serif text-3xl text-stone-100">
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
              </p>
            )}
            {preview && (
              <>
                <div className="mt-5 flex items-start gap-4">
                  {preview.posterUrl && (
                    <img
                      src={preview.posterUrl}
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
        )}
        <footer className="mt-10 flex items-start gap-3 border-t border-stone-800/60 pt-5 text-xs leading-relaxed text-stone-500">
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
