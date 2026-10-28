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
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import TextArea from '../components/ui/TextArea.jsx';
import { buildMediaId } from '../domain/media/schema.js';
import { getMediaDetails } from '../services/mediaApi/client.js';
import { useMediaSearch } from './hooks/useMediaSearch.js';

const SectionLabel = ({ children, icon: Icon, htmlFor }) => {
  const Tag = htmlFor ? 'label' : 'div';
  return (
    <Tag
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-label font-semibold uppercase tracking-[0.16em] text-stone-400"
    >
      {Icon ? <Icon className="h-3 w-3 text-amber-500/70" /> : null}
      {children}
    </Tag>
  );
};

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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-label font-semibold uppercase tracking-[0.12em] ${
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

const AddView = ({ onBack, onSubmit, items = [] }) => {
  // Mirror the save guard: provider identity only, never title similarity.
  const isOnShelf = (result) => {
    if (!result?.provider || !result?.providerId) return false;
    const mediaId = buildMediaId(result);
    return items.some(
      (item) =>
        item.mediaId === mediaId ||
        (String(item.source?.provider || '').toLowerCase() ===
          String(result.provider).toLowerCase() &&
          String(item.source?.providerId || '') === String(result.providerId)),
    );
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [type, setType] = useState('movie');
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

  const selectedOnShelf = isOnShelf(selectedResult);

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

      // Save once title facts are available. Episode hydration belongs to the
      // existing post-save refresh path and must not block Add to Shelf.
      const showData =
        nextType === 'show'
          ? {
              seasonCount: details.seasonCount || 0,
              seasons: (details.seasonSummaries || []).map((season) => ({
                ...season,
                number: season.seasonNumber,
                episodes: [],
              })),
            }
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
    if (selectedOnShelf) return;
    if (!selectedResult) {
      setSubmitError(
        'Pick a movie or show from the search results before saving.',
      );
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
        tagProvenance: { vibe: 'automatic', energy: 'automatic' },
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
    <div className="flex-1 flex flex-col bg-stone-950 w-full">
      <div className="px-5 pt-[calc(1rem+var(--safe-top))] pb-4 sm:px-6 flex items-center justify-between border-b border-stone-900/80 bg-stone-950/95">
        <button
          onClick={onBack}
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-stone-400 transition-opacity hover:bg-stone-900 hover:text-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
          type="button"
        >
          Cancel
        </button>
        <div className="text-center">
          <h1 className="font-serif text-base text-stone-100">Save for Us</h1>
          <p className="mt-0.5 text-label text-stone-400">
            Add a title to the shared shelf
          </p>
        </div>
        <div className="w-[4.5rem]" aria-hidden="true" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        {/* Title search */}
        <div className="space-y-7">
          <section className="space-y-3">
            <SectionLabel icon={Search} htmlFor="add-title-search">
              Title
            </SectionLabel>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedResult) clearSelectedResult();
                }}
                id="add-title-search"
                placeholder="Search movie or show title"
                data-testid="live-search-input"
                autoComplete="off"
                className="pr-14"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    clearSelectedResult();
                  }}
                  className="absolute right-1 top-1/2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-stone-400 transition-opacity -translate-y-1/2 hover:bg-stone-700/70 hover:text-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                  aria-label="Clear search"
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
                        {results.map((result, index) => (
                          <button
                            key={`${result.provider}-${result.providerId}`}
                            onClick={() => handleSelectResult(result)}
                            className="w-full min-h-11 px-3 py-3 text-left transition-opacity hover:bg-stone-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/60"
                            type="button"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-md border border-stone-700 bg-stone-800">
                                <div className="absolute inset-0 flex items-center justify-center text-stone-400">
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
                                  <div className="min-w-0 flex-1 truncate text-base font-medium text-stone-100">
                                    {result.title}
                                  </div>
                                  <MediaTypeBadge type={result.type} />
                                </div>
                                {isOnShelf(result) && (
                                  <p className="mt-1 text-sm text-stone-300">
                                    On your shelf
                                  </p>
                                )}
                                {index === 0 || result.year ? (
                                  <div className="mt-1 text-label font-semibold uppercase tracking-[0.14em] text-stone-400">
                                    {[
                                      index === 0 ? 'Top match' : '',
                                      result.year,
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </div>
                                ) : null}
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
                              className="w-full min-h-11 rounded-lg border border-stone-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 transition-opacity hover:bg-stone-800/70 hover:text-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:cursor-not-allowed disabled:opacity-50"
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
                <p className="mt-1 text-xs text-stone-400">
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
                    <div className="flex items-center gap-1.5 text-label font-semibold uppercase tracking-[0.14em] text-amber-300">
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
                    {selectedOnShelf && (
                      <p
                        id="add-owned-note"
                        role="status"
                        className="mt-2 text-sm text-stone-300"
                      >
                        This title is already on your shelf.
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <MediaTypeBadge type={type} selected />
                      {selectedYear ? (
                        <span className="text-xs text-stone-400">
                          {selectedYear}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    className="min-h-11 min-w-11 rounded-lg px-3 text-xs font-semibold text-amber-300 transition-opacity hover:bg-amber-500/10 hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
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
          </section>

          {/* Note */}
          <section className="space-y-3">
            <label
              htmlFor="add-note"
              className="flex items-center gap-2 text-label font-semibold uppercase tracking-[0.16em] text-stone-400"
            >
              <MessageSquare className="w-3 h-3 text-amber-500/70" />
              Why this?{' '}
              <span className="text-stone-400 font-normal normal-case tracking-normal">
                (Optional)
              </span>
            </label>
            <TextArea
              id="add-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Heard it is funny, good for a rainy day..."
            />
          </section>
        </div>
      </div>

      <div className="border-t border-stone-900/80 bg-stone-950 px-5 pt-4 pb-[calc(1rem+var(--safe-bottom))] sm:px-6">
        {!selectedResult && (
          <p
            id="add-submit-hint"
            className="mb-3 text-center text-xs text-stone-400"
          >
            Pick a title from the search results to put it on the shelf.
          </p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={
            selectedOnShelf ||
            !searchQuery.trim() ||
            isEnriching ||
            !selectedResult ||
            !enrichedPayload?.source?.providerId
          }
          className="w-full"
          aria-describedby={
            selectedOnShelf
              ? 'add-owned-note'
              : !selectedResult
              ? 'add-submit-hint'
              : undefined
          }
        >
          {selectedOnShelf
            ? 'On your shelf'
            : isEnriching
            ? 'Loading Metadata...'
            : 'Add to Shelf'}
        </Button>
      </div>
    </div>
  );
};

export default AddView;
