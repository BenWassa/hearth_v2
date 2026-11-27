import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import useDirectorsHistory from '../app/useDirectorsHistory.js';
import Dialog from '../components/ui/Dialog.jsx';
import {
  providerIdFor,
  findByFilmId,
  toWatchlistPayload,
} from '../components/curated/watchlistFilm.js';
import catalog from '../config/directorEssentials.json';
import { loadFilm, retryWhenOnline } from '../components/curated/filmMedia.js';
import { getMediaDetails } from '../services/mediaApi/client.js';
import DepthCarousel from '../components/directors/DepthCarousel.jsx';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

const OptionalArt = ({ src, className, filter, children }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    !failed && (
      <>
        <img
          src={src}
          alt=""
          style={filter ? { filter } : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`${className} ${loaded ? '' : 'hidden'}`}
        />
        {loaded && children}
      </>
    )
  );
};

// Directors whose signature is a PNG rather than an SVG.
const SIGNATURE_FILE = {
  'ingmar-bergman': 'signature.png',
  'wong-kar-wai': 'signature.png',
};
// Signatures that need a credit (Creative Commons, from Wikimedia Commons).
const SIGNATURE_CREDIT = {
  'ingmar-bergman': {
    by: 'Excreto',
    licence: 'CC BY-SA 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:Ingmar_Bergman_Signature.png',
  },
  'martin-scorsese': {
    by: 'Machete kills',
    licence: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Scorsese-signature_2.svg',
  },
};

const signatureStyle =
  'mt-2 object-contain object-left opacity-95 mix-blend-screen [filter:invert(1)_drop-shadow(0_0_0.6px_rgb(255_255_255))]';
const landingPortraitFilter =
  'grayscale(1) sepia(0.32) contrast(1.1) brightness(0.92)';

const renderDirectorCard = (entry) => {
  const base = `/assets/collections/legendary-directors/directors/${entry.id}`;
  return (
    <>
      <OptionalArt
        src={`${base}/portrait.webp`}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_20%]"
        filter={landingPortraitFilter}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 from-10% via-stone-950/80 via-35% to-transparent to-75%" />
      </OptionalArt>
      <span className="absolute inset-x-0 bottom-0 block p-5">
        <span className="block font-serif text-3xl leading-tight tracking-tight text-stone-100">
          {entry.name}
        </span>
        <OptionalArt
          src={`${base}/${SIGNATURE_FILE[entry.id] || 'signature.svg'}`}
          className={`h-12 max-w-[65%] ${signatureStyle}`}
        />
        {entry.description && (
          <span className="mt-2 block text-xs leading-snug text-stone-300">
            {entry.description}
          </span>
        )}
      </span>
    </>
  );
};

const portraitMask =
  'linear-gradient(to right, transparent, black 7%, black 93%, transparent), linear-gradient(to bottom, transparent, black 14%, black 52%, transparent 98%)';

const DirectorHero = ({ id, name }) => {
  const [portrait, setPortrait] = useState('pending');
  const base = `/assets/collections/legendary-directors/directors/${id}`;
  const portraitSrc = `${base}/portrait.webp`;
  const hasPortrait = portrait === 'loaded';
  return (
    <div className={hasPortrait ? 'pb-7' : 'pb-7 pt-5'}>
      <div
        className={`relative overflow-hidden ${
          hasPortrait ? '-mx-4' : 'rounded-2xl bg-stone-900'
        }`}
      >
        {hasPortrait && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse,black_30%,transparent_72%)]"
          >
            <span
              className="absolute inset-0 scale-110 bg-cover bg-top opacity-40 blur-[48px] brightness-50"
              style={{ backgroundImage: `url(${portraitSrc})` }}
            />
          </span>
        )}
        {portrait !== 'failed' && (
          <img
            src={portraitSrc}
            alt=""
            onLoad={() => setPortrait('loaded')}
            onError={() => setPortrait('failed')}
            style={{
              WebkitMaskImage: portraitMask,
              WebkitMaskComposite: 'source-in',
              maskImage: portraitMask,
              maskComposite: 'intersect',
            }}
            className={`pointer-events-none relative aspect-[4/5] w-full object-cover object-top ${
              hasPortrait ? '' : 'hidden'
            }`}
          />
        )}
        {hasPortrait && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-stone-950 via-stone-950/65 to-transparent" />
        )}
        <div
          className={hasPortrait ? 'absolute inset-x-4 bottom-0 p-5' : 'p-5'}
        >
          <h2 className="font-serif text-3xl leading-tight text-stone-100">
            {name}
          </h2>
          <OptionalArt
            src={`${base}/${SIGNATURE_FILE[id] || 'signature.svg'}`}
            className={`h-16 max-w-[65%] ${signatureStyle}`}
          />
        </div>
      </div>
    </div>
  );
};

const FilmPoster = ({ film }) => {
  const ref = useRef(null);
  const [poster, setPoster] = useState('');
  useEffect(() => {
    let active = true;
    let stopRetry = () => {};
    const load = () =>
      loadFilm(film).then((data) => {
        if (!active) return;
        setPoster(data?.posterUrl || data?.poster || '');
        if (!data) stopRetry = retryWhenOnline(load);
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
      stopRetry();
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

const RATINGS_PATH = '/assets/collections/legendary-directors/ratings';
// Rotten Tomatoes' own rule: 60% or higher is Fresh, below 60% is Rotten.
const FRESH_THRESHOLD = 60;

const Scores = ({ film }) => {
  const imdb = film.imdb?.rating;
  const rt = film.rt?.tomatometer;
  return (
    <span className="ml-auto flex shrink-0 flex-col items-end gap-2 text-sm font-semibold tabular-nums text-stone-100">
      <span className="sr-only">
        {`IMDb ${imdb ?? 'n/a'}, Rotten Tomatoes ${
          rt == null ? 'n/a' : `${rt} percent`
        }`}
      </span>
      <span aria-hidden="true" className="flex items-center gap-2">
        <img
          src={`${RATINGS_PATH}/imdb.svg`}
          alt=""
          className="h-4 w-auto rounded-[2px]"
        />
        {imdb == null ? 'n/a' : imdb.toFixed(1)}
      </span>
      <span aria-hidden="true" className="flex items-center gap-2">
        {rt != null && (
          <img
            src={`${RATINGS_PATH}/${
              rt >= FRESH_THRESHOLD ? 'fresh' : 'rotten'
            }.svg`}
            alt=""
            className="h-4 w-4"
          />
        )}
        {rt == null ? 'n/a' : `${rt}%`}
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
  const carouselIndex = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const focusFirstRevealed = useRef(false);
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
        if (active) setPreviewError('Film details could not be verified.');
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
    if (!selected && openerRef.current) {
      requestAnimationFrame(() =>
        document
          .querySelector(`[data-director-card="${openerRef.current}"]`)
          ?.focus({ preventScroll: true }),
      );
    } else headingRef.current?.focus({ preventScroll: true });
  }, [selected]);

  useEffect(() => {
    if (!expanded || !focusFirstRevealed.current) return;
    focusFirstRevealed.current = false;
    // Keep the keyboard user's place: the toggle has just moved below the new rows.
    document
      .querySelector('[data-essential-rank="6"] button')
      ?.focus({ preventScroll: true });
  }, [expanded]);

  const openDirector = (entry) => {
    carouselIndex.current = catalog.directors.indexOf(entry);
    directoryScroll.current = scrollRef.current?.scrollTop || 0;
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
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 ${
          selected ? 'pb-12' : ''
        }`}
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
          <div className="flex h-full min-h-min flex-col">
            <div className="shrink-0 border-b border-stone-800/80 pb-6 pt-9 [@media(max-height:720px)]:pb-3 [@media(max-height:720px)]:pt-4">
              <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-amber-300">
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
            <section
              aria-label="Explore directors"
              className="flex flex-1 flex-col pt-6 [@media(max-height:720px)]:pt-3"
            >
              <div className="mb-4 flex shrink-0 items-end justify-between [@media(max-height:720px)]:mb-2">
                <h3 className="font-serif text-2xl text-stone-100">
                  Explore filmmakers
                </h3>
                <span className="text-xs text-stone-400">12 profiles</span>
              </div>
              <DepthCarousel
                items={catalog.directors}
                initialIndex={carouselIndex.current}
                onOpen={openDirector}
                renderItem={renderDirectorCard}
              />
            </section>
          </div>
        )}
        {selected && (
          <>
            <DirectorHero
              key={selected}
              id={selected}
              name={selectedDirector.name}
            />
            {watchNext.length > 0 && (
              <section aria-label="Watch Next">
                <h3 className="font-serif text-2xl text-stone-100">
                  Watch Next
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  Essentials you haven't watched yet.
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
                      className={`flex min-w-0 flex-col justify-start text-left ${focusRing}`}
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
              aria-label="Essentials"
              className="mt-8 border-t border-stone-800 pt-6"
            >
              <h3 className="font-serif text-2xl text-stone-100">Essentials</h3>
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
                      className={`flex w-full items-center gap-3 py-2 text-left ${focusRing}`}
                    >
                      <span className="w-11 shrink-0 text-center font-serif text-5xl font-semibold leading-none tabular-nums text-amber-300">
                        {film.rank}
                        <span className="sr-only">
                          {film.rank <= 3 ? ', signature film' : ''}
                        </span>
                      </span>
                      <span className="w-20 shrink-0">
                        <FilmPoster film={film} />
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
                  onClick={() => {
                    focusFirstRevealed.current = !expanded;
                    setExpanded((value) => !value);
                  }}
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
              <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-amber-300">
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
        <footer
          className={`mt-10 flex items-start gap-3 border-t border-stone-800/60 pt-5 text-xs leading-relaxed text-stone-400 ${
            selected ? '' : 'pb-12'
          }`}
        >
          <img src="/tmdb-logo.svg" alt="TMDB" className="mt-1 w-11 shrink-0" />
          <span>
            <span className="block font-semibold text-stone-400">Credits</span>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
            {SIGNATURE_CREDIT[selected] && (
              <span className="mt-2 block text-[0.6875rem]">
                Signature:{' '}
                <a
                  href={SIGNATURE_CREDIT[selected].url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {SIGNATURE_CREDIT[selected].by}
                </a>
                , {SIGNATURE_CREDIT[selected].licence}, via Wikimedia Commons
              </span>
            )}
          </span>
        </footer>
      </div>
    </Dialog>
  );
};

export default DirectorsCollectionView;
