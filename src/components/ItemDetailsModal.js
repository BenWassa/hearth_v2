import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Calendar, Film, Tv } from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import { getBackdropSrc } from '../utils/poster.js';
import { getMediaDetailsByTitle } from '../utils/media-details.js';
import { getEpisodeSeasons } from '../utils/episode-map.js';
import {
  formatRuntime,
  formatFinishTime,
  formatStartTime,
} from './ItemDetailsModal/utils/formatters.js';
import {
  normalizeGenres,
  normalizeSeasons,
} from './ItemDetailsModal/utils/normalizers.js';
import MovieTimingCard from './ItemDetailsModal/components/MovieTimingCard.js';
import CastSection from './ItemDetailsModal/components/CastSection.js';
import ActionBar from './ItemDetailsModal/components/ActionBar.js';
import TitleBlock from './ItemDetailsModal/components/TitleBlock.js';
import ModalHeader from './ItemDetailsModal/components/ModalHeader.js';
import ModalContentHeader from './ItemDetailsModal/components/ModalContentHeader.js';
import ShowSeasonsSection from './ItemDetailsModal/components/ShowSeasonsSection.js';

const ItemDetailsModal = ({
  isOpen,
  item: rawItem,
  onClose,
  onToggleStatus,
  onUpdate,
}) => {
  const [backdropMissing, setBackdropMissing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [activeSeasonNum, setActiveSeasonNum] = useState(null);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState(null);
  const [localEpisodeProgress, setLocalEpisodeProgress] = useState({});
  const [episodeMapSeasons, setEpisodeMapSeasons] = useState(null);
  const [episodeMapStatus, setEpisodeMapStatus] = useState('idle');
  const [episodeFetchSeed, setEpisodeFetchSeed] = useState(0);
  const [revealedEpisodeIds, setRevealedEpisodeIds] = useState({});
  const [isSeasonResetConfirmOpen, setIsSeasonResetConfirmOpen] =
    useState(false);
  const seasonScrollRef = useRef(null);
  const [seasonScrollState, setSeasonScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    if (isOpen) {
      setBackdropMissing(false);
      setIsEditing(false);
      setEditedTitle(rawItem?.title || '');
    }
  }, [isOpen, rawItem?.id, rawItem?.title]);

  useEffect(() => {
    if (!isOpen) return undefined;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    setBackdropMissing(false);
  }, [rawItem?.backdrop, rawItem?.backdrop_path, rawItem?.backdropPath]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  const mediaDetails = useMemo(
    () => getMediaDetailsByTitle(rawItem?.title),
    [rawItem?.title],
  );

  const item = rawItem
    ? {
        ...mediaDetails,
        ...rawItem,
        title: rawItem.title?.trim() || '[add title]',
        year:
          rawItem.year?.toString().trim() ||
          mediaDetails?.year?.toString().trim() ||
          '[add year]',
        director:
          rawItem.director?.toString().trim() ||
          mediaDetails?.director?.toString().trim() ||
          '[add director]',
        note: rawItem.note?.toString().trim() || '',
        actors: rawItem.actors ?? rawItem.cast ?? mediaDetails?.actors ?? [],
        genres: rawItem.genres ?? mediaDetails?.genres ?? [],
        runtimeMinutes:
          rawItem.runtimeMinutes ?? mediaDetails?.runtimeMinutes ?? '',
        type: rawItem.type ?? mediaDetails?.type,
        backdrop:
          rawItem.backdrop ??
          rawItem.backdropPath ??
          rawItem.backdrop_path ??
          mediaDetails?.backdrop,
        poster: rawItem.poster ?? mediaDetails?.poster,
      }
    : null;

  useEffect(() => {
    setExpandedEpisodeId(null);
    setLocalEpisodeProgress(item?.episodeProgress ?? {});
  }, [item?.id, item?.episodeProgress]);

  const spoilerStorageKey = useMemo(() => {
    if (!item?.id && !item?.title) return null;
    const keyBase = item?.id ?? item?.title;
    return `hearth-spoilers-${keyBase}`;
  }, [item?.id, item?.title]);

  useEffect(() => {
    if (!spoilerStorageKey || typeof window === 'undefined') {
      setRevealedEpisodeIds({});
      return;
    }
    try {
      const stored = window.sessionStorage.getItem(spoilerStorageKey);
      setRevealedEpisodeIds(stored ? JSON.parse(stored) : {});
    } catch {
      setRevealedEpisodeIds({});
    }
  }, [spoilerStorageKey]);

  useEffect(() => {
    if (!spoilerStorageKey || typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        spoilerStorageKey,
        JSON.stringify(revealedEpisodeIds),
      );
    } catch {
      // Ignore storage failures (private mode, blocked storage).
    }
  }, [spoilerStorageKey, revealedEpisodeIds]);

  const genres = useMemo(() => normalizeGenres(item?.genres), [item?.genres]);
  const isShow = item?.type === 'show';
  const seasons = useMemo(
    () => normalizeSeasons(episodeMapSeasons ?? item?.seasons),
    [episodeMapSeasons, item?.seasons],
  );
  const hasInlineEpisodes = useMemo(() => {
    return (
      Array.isArray(item?.seasons) &&
      item.seasons.some(
        (season) => Array.isArray(season?.episodes) && season.episodes.length,
      )
    );
  }, [item?.seasons]);
  const totalSeasons =
    item?.totalSeasons ??
    (seasons.length ? seasons.length : item?.seasonCount ?? null);

  useEffect(() => {
    let isActive = true;
    if (!isShow) {
      setEpisodeMapSeasons(null);
      setEpisodeMapStatus('idle');
      return undefined;
    }

    if (hasInlineEpisodes) {
      setEpisodeMapSeasons(null);
      setEpisodeMapStatus('ready');
      return undefined;
    }

    setEpisodeMapStatus('loading');
    const timeoutId = setTimeout(() => {
      if (isActive) setEpisodeMapStatus('timeout');
    }, 10000);

    getEpisodeSeasons(item)
      .then((seasonsData) => {
        if (!isActive) return;
        if (Array.isArray(seasonsData) && seasonsData.length) {
          setEpisodeMapSeasons(seasonsData);
          setEpisodeMapStatus('ready');
        } else {
          setEpisodeMapSeasons(null);
          setEpisodeMapStatus('not_found');
        }
      })
      .catch((error) => {
        if (!isActive) return;
        setEpisodeMapSeasons(null);
        console.warn('Episode data fetch failed:', error);
        setEpisodeMapStatus('error');
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [
    isShow,
    item?.seasons,
    item?.title,
    item?.tmdb_id,
    item?.tmdbId,
    hasInlineEpisodes,
    episodeFetchSeed,
  ]);

  useEffect(() => {
    if (!item?.id) return;
    if (!seasons.length) {
      setActiveSeasonNum(null);
      return;
    }
    setActiveSeasonNum((prev) => {
      if (prev && seasons.some((season) => season.number === prev)) return prev;
      return seasons[0].number;
    });
  }, [item?.id, seasons]);

  const activeSeason = useMemo(() => {
    if (!seasons.length) return null;
    if (activeSeasonNum === null) return seasons[0];
    return (
      seasons.find((season) => season.number === activeSeasonNum) || seasons[0]
    );
  }, [seasons, activeSeasonNum]);

  const episodesWithState = useMemo(() => {
    if (!activeSeason?.episodes?.length) return [];
    return activeSeason.episodes.map((episode) => ({
      ...episode,
      watched: Boolean(localEpisodeProgress?.[episode.id]),
    }));
  }, [activeSeason, localEpisodeProgress]);

  const episodeStats = useMemo(() => {
    if (!activeSeason) {
      return { total: 0, watched: 0, progress: 0, nextUpId: null };
    }
    const total =
      activeSeason.episodes.length ||
      (Number.isFinite(activeSeason.episodeCount)
        ? activeSeason.episodeCount
        : 0);
    const watched = episodesWithState.filter((ep) => ep.watched).length;
    const progress = total === 0 ? 0 : Math.round((watched / total) * 100);
    const nextUp = episodesWithState.find((ep) => !ep.watched);
    return { total, watched, progress, nextUpId: nextUp?.id ?? null };
  }, [activeSeason, episodesWithState]);
  const isActiveSeasonWatched = useMemo(() => {
    if (!activeSeason?.episodes?.length) return false;
    return activeSeason.episodes.every((episode) =>
      Boolean(localEpisodeProgress?.[episode.id]),
    );
  }, [activeSeason, localEpisodeProgress]);
  const seasonProgress = useMemo(() => {
    return seasons.map((season) => {
      const total = season.episodes.length
        ? season.episodes.length
        : Number.isFinite(season.episodeCount)
        ? season.episodeCount
        : 0;
      const watched = season.episodes.length
        ? season.episodes.filter(
            (episode) => localEpisodeProgress?.[episode.id],
          ).length
        : 0;
      const progress = total === 0 ? 0 : Math.round((watched / total) * 100);
      return { season, total, watched, progress };
    });
  }, [seasons, localEpisodeProgress]);
  const actors = useMemo(() => {
    if (!item?.actors) return [];
    if (Array.isArray(item.actors))
      return item.actors.map((actor) => `${actor}`.trim()).filter(Boolean);
    if (typeof item.actors === 'string') {
      return item.actors
        .split(',')
        .map((actor) => actor.trim())
        .filter(Boolean);
    }
    return [];
  }, [item?.actors]);

  useEffect(() => {
    const scrollEl = seasonScrollRef.current;
    if (!scrollEl) return undefined;
    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
      const maxScrollLeft = scrollWidth - clientWidth;
      setSeasonScrollState({
        canScrollLeft: scrollLeft > 4,
        canScrollRight: maxScrollLeft - scrollLeft > 4,
      });
    };
    updateScrollState();
    scrollEl.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      scrollEl.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [seasons.length, activeSeason?.number]);

  const scrollToSeason = useCallback((seasonNumber) => {
    const scrollEl = seasonScrollRef.current;
    if (!scrollEl || !seasonNumber) return;
    const targetButton = scrollEl.querySelector(
      `[data-season-number="${seasonNumber}"]`,
    );
    targetButton?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, []);

  useEffect(() => {
    if (!activeSeason?.number) return;
    scrollToSeason(activeSeason.number);
  }, [activeSeason?.number, scrollToSeason]);

  if (!isOpen || !item) return null;

  const backdropSrc = getBackdropSrc(item);
  const runtimeMinutes = Number(item.runtimeMinutes);
  const runtimeLabel = formatRuntime(runtimeMinutes);
  const finishLabel = formatFinishTime({
    runtimeMinutes,
    startedAt: item.startedAt ?? now,
  });
  const startedAtLabel = formatStartTime(item.startedAt);
  const hasRuntime = Boolean(runtimeLabel);

  const vibeDef = VIBES.find((v) => v.id === item.vibe);
  const energyDef = ENERGIES.find((e) => e.id === item.energy);
  const typeLabel = item.type === 'show' ? 'Show' : 'Movie';
  const TypeIcon = item.type === 'show' ? Tv : Film;

  const isShowComplete = (progress) => {
    if (!seasons.length) return false;
    return seasons.every(
      (season) =>
        Array.isArray(season.episodes) &&
        season.episodes.length > 0 &&
        season.episodes.every((episode) => Boolean(progress?.[episode.id])),
    );
  };

  const handleToggleEpisode = (episodeId) => {
    if (!item?.id || !episodeId) return;
    const nextSeasonNumber = (() => {
      const currentIndex = seasons.findIndex(
        (season) => season.number === activeSeason?.number,
      );
      if (currentIndex === -1 || currentIndex === seasons.length - 1)
        return null;
      return seasons[currentIndex + 1]?.number ?? null;
    })();
    setLocalEpisodeProgress((prev) => {
      const next = { ...(prev || {}) };
      if (next[episodeId]) {
        delete next[episodeId];
      } else {
        next[episodeId] = true;
      }
      const isSeasonComplete = Boolean(
        activeSeason?.episodes?.length &&
          activeSeason.episodes.every((episode) => next[episode.id]),
      );
      const showComplete = isShowComplete(next);
      const statusUpdate =
        showComplete && item.status !== 'watched'
          ? 'watched'
          : !showComplete && item.status === 'watched'
          ? 'unwatched'
          : null;
      const updatePayload = statusUpdate
        ? { episodeProgress: next, status: statusUpdate }
        : { episodeProgress: next };
      onUpdate?.(item.id, updatePayload);
      if (isSeasonComplete && nextSeasonNumber) {
        setActiveSeasonNum(nextSeasonNumber);
        scrollToSeason(nextSeasonNumber);
      }
      return next;
    });
  };

  const handleToggleSeasonWatched = () => {
    if (!item?.id || !activeSeason?.episodes?.length) return;
    if (isActiveSeasonWatched) {
      setIsSeasonResetConfirmOpen(true);
      return;
    }
    setLocalEpisodeProgress((prev) => {
      const next = { ...(prev || {}) };
      activeSeason.episodes.forEach((episode) => {
        next[episode.id] = true;
      });
      const currentIndex = seasons.findIndex(
        (season) => season.number === activeSeason?.number,
      );
      const nextSeasonNumber =
        currentIndex !== -1 && currentIndex < seasons.length - 1
          ? seasons[currentIndex + 1]?.number
          : null;
      const showComplete = isShowComplete(next);
      const statusUpdate =
        showComplete && item.status !== 'watched'
          ? 'watched'
          : !showComplete && item.status === 'watched'
          ? 'unwatched'
          : null;
      const updatePayload = statusUpdate
        ? { episodeProgress: next, status: statusUpdate }
        : { episodeProgress: next };
      onUpdate?.(item.id, updatePayload);
      if (nextSeasonNumber) {
        setActiveSeasonNum(nextSeasonNumber);
        scrollToSeason(nextSeasonNumber);
      }
      return next;
    });
  };

  const handleConfirmSeasonReset = () => {
    if (!item?.id || !activeSeason?.episodes?.length) return;
    setIsSeasonResetConfirmOpen(false);
    setLocalEpisodeProgress((prev) => {
      const next = { ...(prev || {}) };
      activeSeason.episodes.forEach((episode) => {
        delete next[episode.id];
      });
      const showComplete = isShowComplete(next);
      const statusUpdate =
        showComplete && item.status !== 'watched'
          ? 'watched'
          : !showComplete && item.status === 'watched'
          ? 'unwatched'
          : null;
      const updatePayload = statusUpdate
        ? { episodeProgress: next, status: statusUpdate }
        : { episodeProgress: next };
      onUpdate?.(item.id, updatePayload);
      return next;
    });
  };

  const handleSaveEdit = async () => {
    if (!editedTitle.trim() || !onUpdate) return;
    try {
      await onUpdate(item.id, { title: editedTitle.trim() });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(item.title);
    setIsEditing(false);
  };

  const handleRetryEpisodeFetch = () => {
    setEpisodeFetchSeed((seed) => seed + 1);
  };

  const handleSeasonKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const currentIndex = seasons.findIndex(
      (season) => season.number === activeSeason?.number,
    );
    if (currentIndex === -1) return;
    const nextIndex =
      event.key === 'ArrowRight'
        ? Math.min(currentIndex + 1, seasons.length - 1)
        : Math.max(currentIndex - 1, 0);
    const nextSeason = seasons[nextIndex];
    if (!nextSeason) return;
    setActiveSeasonNum(nextSeason.number);
    scrollToSeason(nextSeason.number);
  };

  const metadataChips = [
    {
      label: 'Year',
      value: item.year,
      isPlaceholder: item.year === '[add year]',
      icon: Calendar,
    },
    {
      label: 'Director',
      value: item.director,
      isPlaceholder: item.director === '[add director]',
      icon: Film,
    },
  ];

  const finishContext = startedAtLabel
    ? `Started ${startedAtLabel}`
    : 'If started now';
  const mobileBackdropStyle =
    backdropSrc && !backdropMissing
      ? {
          backgroundImage: `linear-gradient(to top, rgba(12, 10, 9, 1), rgba(12, 10, 9, 0)), url(${backdropSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }
      : {
          backgroundImage:
            'linear-gradient(to top, rgba(12, 10, 9, 1), rgba(12, 10, 9, 0))',
        };

  // Mobile-first design updates
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close details"
      />

      <div
        className="relative w-full max-w-3xl bg-stone-950 sm:border border-stone-800 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row h-[100dvh] sm:h-auto sm:max-h-[85vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalHeader
          backdropSrc={backdropSrc}
          backdropMissing={backdropMissing}
          setBackdropMissing={setBackdropMissing}
          item={item}
          mobileBackdropStyle={mobileBackdropStyle}
          onClose={onClose}
        />

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-w-0 bg-stone-950/95 relative -mt-12 sm:mt-0 z-10 rounded-t-3xl sm:rounded-none overflow-hidden">
          {/* Scrollable Content */}
          <div className="relative flex-1 overflow-y-auto no-scrollbar">
            <div className="p-5 sm:p-8 space-y-6">
              {/* Header: Vibe/Energy & Close (Desktop) */}
              <ModalContentHeader
                vibeDef={vibeDef}
                energyDef={energyDef}
                onClose={onClose}
              />

              {/* Title Block */}
              <TitleBlock
                item={item}
                TypeIcon={TypeIcon}
                typeLabel={typeLabel}
                isEditing={isEditing}
                editedTitle={editedTitle}
                setEditedTitle={setEditedTitle}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
                setIsEditing={setIsEditing}
                onUpdate={onUpdate}
                metadataChips={metadataChips}
                genres={genres}
              />

              {/* Timing Card (Movies) */}
              {!isShow && (
                <MovieTimingCard
                  hasRuntime={hasRuntime}
                  runtimeLabel={runtimeLabel}
                  finishContext={finishContext}
                  finishLabel={finishLabel}
                />
              )}

              {/* Season Tracker (Shows) */}
              {isShow && (
                <ShowSeasonsSection
                  seasons={seasons}
                  totalSeasons={totalSeasons}
                  seasonScrollRef={seasonScrollRef}
                  handleSeasonKeyDown={handleSeasonKeyDown}
                  seasonProgress={seasonProgress}
                  activeSeason={activeSeason}
                  setActiveSeasonNum={setActiveSeasonNum}
                  scrollToSeason={scrollToSeason}
                  seasonScrollState={seasonScrollState}
                  handleToggleSeasonWatched={handleToggleSeasonWatched}
                  isActiveSeasonWatched={isActiveSeasonWatched}
                  episodesWithState={episodesWithState}
                  episodeStats={episodeStats}
                  expandedEpisodeId={expandedEpisodeId}
                  setExpandedEpisodeId={setExpandedEpisodeId}
                  revealedEpisodeIds={revealedEpisodeIds}
                  handleToggleEpisode={handleToggleEpisode}
                  setRevealedEpisodeIds={setRevealedEpisodeIds}
                  episodeMapStatus={episodeMapStatus}
                  handleRetryEpisodeFetch={handleRetryEpisodeFetch}
                  isSeasonResetConfirmOpen={isSeasonResetConfirmOpen}
                  setIsSeasonResetConfirmOpen={setIsSeasonResetConfirmOpen}
                  handleConfirmSeasonReset={handleConfirmSeasonReset}
                />
              )}

              {/* Notes */}
              {item.note ? (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Notes
                  </div>
                  <p className="text-base text-stone-300 italic leading-relaxed">
                    "{item.note}"
                  </p>
                </div>
              ) : null}

              {/* Cast */}
              <CastSection actors={actors} />
            </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <ActionBar
            item={item}
            onToggleStatus={onToggleStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
