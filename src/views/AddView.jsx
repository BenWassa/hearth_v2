import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Film,
  Loader2,
  MessageSquare,
  Search,
  Tv,
  X,
} from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import TextArea from '../components/ui/TextArea.jsx';
import { getMediaDetails } from '../services/mediaApi/client.js';
import { hydrateShowData } from '../services/mediaApi/showData.js';
import { useMediaSearch } from './hooks/useMediaSearch.js';

const SectionLabel = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
    {Icon ? <Icon className="h-3 w-3 text-amber-500/70" /> : null}
    {children}
  </div>
);

const getMediaTypeMeta = (mediaType) => {
  if (mediaType === 'show') {
    return {
      icon: Tv,
      label: 'TV show',
    };
  }
  return {
    icon: Film,
    label: 'Movie',
  };
};

const MediaTypeBadge = ({ type: mediaType, selected = false }) => {
  const { icon: Icon, label } = getMediaTypeMeta(mediaType);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        selected
          ? 'border-amber-500/30 bg-amber-400/10 text-amber-200'
          : 'border-stone-700/80 bg-stone-950/50 text-stone-400'
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const SearchResultSkeleton = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`search-skeleton-${index}`}
        className="px-3 py-3"
        data-testid="search-result-skeleton"
      >
        <div className="flex items-center gap-4">
          <div className="h-[4.5rem] w-12 shrink-0 animate-pulse rounded-md border border-stone-800 bg-stone-800/80" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-800/90" />
            <div className="h-3 w-28 animate-pulse rounded bg-stone-800/70" />
          </div>
          <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-stone-800/80" />
        </div>
      </div>
    ))}
  </>
);

const AddView = ({ onBack, onSubmit, allowManualEntry = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [type, setType] = useState('movie');
  const [vibe, setVibe] = useState('');
  const [energy, setEnergy] = useState('');
  const [note, setNote] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [enrichedPayload, setEnrichedPayload] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    results,
    loading,
    loadingInitial,
    loadingMore,
    error,
    hasQuery,
    hasMore,
    loadMore,
  } = useMediaSearch({
    query: searchQuery,
    type: 'all',
  });
  const resultsScrollRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);
  const loadMoreRef = useRef(loadMore);

  const selectedPoster =
    enrichedPayload?.media?.poster ||
    enrichedPayload?.media?.posterUrl ||
    selectedResult?.posterUrl ||
    '';
  const selectedYear = enrichedPayload?.media?.year || selectedResult?.year;
  const selectedTitle =
    enrichedPayload?.media?.title || selectedResult?.title || '';

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    if (
      selectedResult ||
      !hasQuery ||
      !hasMore ||
      loading ||
      loadingMore ||
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window)
    ) {
      return undefined;
    }

    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreRef.current();
        }
      },
      {
        root: resultsScrollRef.current,
        rootMargin: '120px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, hasQuery, loading, loadingMore, results.length, selectedResult]);

  const handleSelectResult = async (result) => {
    setSelectedResult(result);
    setSubmitError('');
    setType(result.type === 'show' ? 'show' : 'movie');
    setEnrichError('');
    setIsEnriching(true);

    try {
      const details = await getMediaDetails({
        provider: result.provider,
        providerId: result.providerId,
        type: result.type,
      });

      const nextType = details.type === 'show' ? 'show' : 'movie';
      setType(nextType);

      const showData =
        nextType === 'show'
          ? await hydrateShowData({
              provider: result.provider,
              providerId: result.providerId,
            })
          : null;

      setEnrichedPayload({
        source: {
          provider: result.provider,
          providerId: result.providerId,
          fetchedAt: Date.now(),
          locale: 'en-US',
        },
        media: {
          ...details,
          poster: details.posterUrl || '',
          backdrop: details.backdropUrl || '',
          logo: details.logoUrl || '',
        },
        showData,
      });
    } catch (err) {
      setEnrichedPayload(null);
      setEnrichError(err?.message || 'Could not load metadata right now.');
    } finally {
      setIsEnriching(false);
    }
  };

  const clearSelectedResult = () => {
    setSelectedResult(null);
    setEnrichedPayload(null);
    setEnrichError('');
    setSubmitError('');
  };

  const handleSubmit = () => {
    if (!selectedResult) {
      setSubmitError('Select a movie or show from Live Search before saving.');
      return;
    }
    if (isEnriching) {
      setSubmitError('Wait for metadata to finish loading before saving.');
      return;
    }
    if (!enrichedPayload?.source?.providerId || !enrichedPayload?.media) {
      setSubmitError(
        'Could not verify this title metadata. Re-select the title and try again.',
      );
      return;
    }
    setSubmitError('');

    const payload = {
      title: String(
        enrichedPayload?.media?.title || selectedResult?.title || searchQuery,
      ).trim(),
      type,
      vibe,
      energy,
      note: note.trim(),
      status: 'unwatched',
    };

    if (enrichedPayload?.media) {
      payload.schemaVersion = 2;
      payload.source = {
        ...enrichedPayload.source,
      };
      payload.media = {
        ...enrichedPayload.media,
        type,
        title: payload.title,
        runtimeMinutes: Number.isFinite(enrichedPayload.media.runtimeMinutes)
          ? enrichedPayload.media.runtimeMinutes
          : null,
        poster: enrichedPayload.media.poster || '',
        backdrop: enrichedPayload.media.backdrop || '',
        logo: enrichedPayload.media.logo || '',
      };
      payload.showData =
        type === 'show'
          ? enrichedPayload.showData || { seasonCount: 0, seasons: [] }
          : { seasonCount: null, seasons: [] };
      payload.userState = {
        status: 'unwatched',
        vibe,
        energy,
        note: payload.note,
        episodeProgress: {},
      };
      payload.poster = payload.media.poster;
      payload.backdrop = payload.media.backdrop;
      payload.logo = payload.media.logo;
      if (payload.media.year) payload.year = payload.media.year;
      if (Array.isArray(payload.media.genres) && payload.media.genres.length) {
        payload.genres = payload.media.genres;
      }
      if (Array.isArray(payload.media.cast) && payload.media.cast.length) {
        payload.actors = payload.media.cast;
      }
      if (Number.isFinite(payload.media.runtimeMinutes)) {
        payload.runtimeMinutes = payload.media.runtimeMinutes;
      }
      if (type === 'show' && payload.showData?.seasonCount) {
        payload.totalSeasons = payload.showData.seasonCount;
      }
      if (type === 'show' && Array.isArray(payload.showData?.seasons)) {
        payload.seasons = payload.showData.seasons;
      }
    }

    onSubmit(payload);
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-950 animate-in slide-in-from-bottom duration-300 w-full">
      <div className="px-5 py-4 sm:px-6 flex items-center justify-between border-b border-stone-900/80 bg-stone-950/95">
        <button
          onClick={onBack}
          className="rounded-lg px-2 py-1.5 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/40"
          type="button"
        >
          Cancel
        </button>
        <div className="text-center">
          <h1 className="font-serif text-base text-stone-100">Save for Us</h1>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Add a title to the shared shelf
          </p>
        </div>
        <div className="w-[4.25rem]" aria-hidden="true" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        {/* Live Search */}
        <div className="space-y-7">
          <section className="space-y-3">
            <SectionLabel icon={Search}>Title</SectionLabel>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedResult) clearSelectedResult();
                }}
                placeholder="Search movie or show title"
                data-testid="live-search-input"
                autoComplete="off"
                className="pr-11"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    clearSelectedResult();
                  }}
                  className="absolute right-3 top-1/2 rounded-full p-1 text-stone-500 transition-colors -translate-y-1/2 hover:bg-stone-700/70 hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/40"
                  title="Clear search"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {error && <div className="text-xs text-red-400">{error}</div>}
            {!selectedResult &&
              hasQuery &&
              (loadingInitial || results.length > 0) && (
                <div className="overflow-hidden rounded-xl border border-stone-800 bg-stone-900/60 shadow-lg shadow-stone-950/30">
                  <div
                    ref={resultsScrollRef}
                    className="max-h-[22rem] overflow-y-auto divide-y divide-stone-800/80"
                    aria-busy={loadingInitial || loadingMore}
                    aria-live="polite"
                  >
                    {loadingInitial ? (
                      <SearchResultSkeleton />
                    ) : (
                      <>
                        {results.map((result) => (
                          <button
                            key={`${result.provider}-${result.providerId}`}
                            onClick={() => handleSelectResult(result)}
                            className="w-full px-3 py-3 text-left transition-colors hover:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-700/40"
                            type="button"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-md border border-stone-700 bg-stone-800">
                                <div className="absolute inset-0 flex items-center justify-center text-stone-500">
                                  {result.type === 'show' ? (
                                    <Tv className="h-4 w-4" />
                                  ) : (
                                    <Film className="h-4 w-4" />
                                  )}
                                </div>
                                {result.posterUrl ? (
                                  <img
                                    src={result.posterUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loading="lazy"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        'none';
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <div className="min-w-0 flex-1 truncate text-[15px] font-medium text-stone-100">
                                    {result.title}
                                  </div>
                                  <MediaTypeBadge type={result.type} />
                                </div>
                                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                  Top match{' '}
                                  {result.year ? `• ${result.year}` : ''}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {loadingMore ? (
                          <SearchResultSkeleton count={2} />
                        ) : null}
                        <div
                          ref={loadMoreSentinelRef}
                          className="h-px"
                          aria-hidden="true"
                          data-testid="search-load-more-sentinel"
                        />
                        {hasMore ? (
                          <div className="px-3 py-3">
                            <button
                              className="w-full rounded-lg border border-stone-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 transition-colors hover:bg-stone-800/70 hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/40 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={loadingMore}
                              onClick={loadMore}
                              type="button"
                            >
                              {loadingMore ? 'Loading more' : 'Load more'}
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              )}
            {!selectedResult &&
            hasQuery &&
            !loading &&
            results.length === 0 &&
            !error ? (
              <div className="rounded-xl border border-stone-800 bg-stone-900/35 px-4 py-6 text-center">
                <p className="text-sm text-stone-300">
                  No catalog matches yet.
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Try the exact title or a related keyword.
                </p>
              </div>
            ) : null}
            {selectedResult && (
              <div className="rounded-xl border border-amber-700/30 bg-amber-500/10 p-3 shadow-lg shadow-stone-950/30">
                <div className="flex items-center gap-3">
                  <div className="relative h-[4.75rem] w-[3.25rem] shrink-0 overflow-hidden rounded-md border border-amber-600/20 bg-stone-900">
                    <div className="absolute inset-0 flex items-center justify-center text-amber-500/60">
                      {type === 'show' ? (
                        <Tv className="h-4 w-4" />
                      ) : (
                        <Film className="h-4 w-4" />
                      )}
                    </div>
                    {selectedPoster ? (
                      <img
                        src={selectedPoster}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                      {isEnriching ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      {isEnriching ? 'Loading metadata' : 'Selected'}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium text-stone-100">
                      {selectedTitle}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <MediaTypeBadge type={type} selected />
                      {selectedYear ? (
                        <span className="text-xs text-stone-500">
                          {selectedYear}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/10 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-700/40"
                    onClick={clearSelectedResult}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            {enrichError && (
              <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                {enrichError}
              </div>
            )}
            {submitError && (
              <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                {submitError}
              </div>
            )}
            {allowManualEntry && (
              <div className="text-xs text-stone-500">
                Choose the official title from search before saving.
              </div>
            )}
          </section>

          {/* Vibe */}
          <section className="space-y-2.5">
            <SectionLabel>Vibe</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => {
                const isSelected = vibe === v.id;
                const VibeIcon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all focus:outline-none focus:ring-2 focus:ring-amber-700/40 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-200'
                        : 'border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-300'
                    }`}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <VibeIcon className="w-3.5 h-3.5" />
                      {v.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Energy */}
          <section className="space-y-2.5">
            <SectionLabel>Energy</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {ENERGIES.map((e) => {
                const isSelected = energy === e.id;
                const EnergyIcon = e.icon;
                return (
                  <button
                    key={e.id}
                    onClick={() => setEnergy(e.id)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all focus:outline-none focus:ring-2 focus:ring-amber-700/40 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-200'
                        : 'border-stone-800 text-stone-500 hover:bg-stone-900 hover:text-stone-300'
                    }`}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <EnergyIcon className="w-3.5 h-3.5" />
                      {e.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Note */}
          <section className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              <MessageSquare className="w-3 h-3 text-amber-500/70" />
              Why this?{' '}
              <span className="text-stone-600 font-normal normal-case tracking-normal">
                (Optional)
              </span>
            </label>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Heard it is funny, good for a rainy day..."
            />
          </section>
        </div>
      </div>

      <div className="border-t border-stone-900/80 bg-stone-950/95 px-5 py-4 sm:px-6 backdrop-blur">
        <Button
          onClick={handleSubmit}
          disabled={
            !searchQuery.trim() ||
            isEnriching ||
            !selectedResult ||
            !enrichedPayload?.source?.providerId
          }
          className="w-full"
        >
          {isEnriching ? 'Loading Metadata...' : 'Put on Shelf'}
        </Button>
      </div>
    </div>
  );
};

export default AddView;
