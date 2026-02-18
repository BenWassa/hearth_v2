import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import EpisodeItem from './EpisodeItem.js';

const ShowSeasonsSection = ({
  seasons,
  totalSeasons,
  seasonScrollRef,
  handleSeasonKeyDown,
  seasonProgress,
  activeSeason,
  setActiveSeasonNum,
  scrollToSeason,
  seasonScrollState,
  handleToggleSeasonWatched,
  isActiveSeasonWatched,
  episodesWithState,
  episodeStats,
  expandedEpisodeId,
  setExpandedEpisodeId,
  revealedEpisodeIds,
  handleToggleEpisode,
  setRevealedEpisodeIds,
  episodeMapStatus,
  handleRetryEpisodeFetch,
  isSeasonResetConfirmOpen,
  setIsSeasonResetConfirmOpen,
  handleConfirmSeasonReset,
}) => {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
            Seasons & Episodes
          </div>
          {totalSeasons ? (
            <div className="text-xs text-stone-500">{totalSeasons} seasons</div>
          ) : null}
        </div>

        {seasons.length ? (
          <>
            <div className="bg-stone-900/40 rounded-2xl p-4 border border-stone-800/50 backdrop-blur-sm shadow-xl shadow-stone-950/50">
              <div className="relative -mx-1 px-1">
                <div
                  className="flex overflow-x-auto no-scrollbar gap-2 pb-3 border-b border-stone-800/50 focus:outline-none scroll-smooth shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]"
                  ref={seasonScrollRef}
                  onKeyDown={handleSeasonKeyDown}
                  tabIndex={0}
                  aria-label="Season selector"
                >
                  {seasonProgress.map(({ season, progress, total }) => (
                    <div
                      key={season.id}
                      className="flex-shrink-0 flex flex-col gap-2"
                    >
                      <button
                        data-season-number={season.number}
                        onClick={() => {
                          setActiveSeasonNum(season.number);
                          scrollToSeason(season.number);
                        }}
                        className={`
                          w-full px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border
                          ${
                            activeSeason?.number === season.number
                              ? 'bg-stone-800 text-stone-100 border-stone-700 shadow-sm'
                              : 'bg-transparent text-stone-500 border-transparent hover:bg-stone-800/30'
                          }
                        `}
                      >
                        Season {season.number}
                      </button>
                      <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            total > 0 ? 'bg-amber-600/80' : 'bg-stone-700/60'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-stone-900/90 via-stone-900/50 to-transparent transition-opacity ${
                    seasonScrollState.canScrollLeft
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-stone-900/90 via-stone-900/50 to-transparent transition-opacity ${
                    seasonScrollState.canScrollRight
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                />
                {/* Chevron indicators */}
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-0.5 transition-opacity ${
                    seasonScrollState.canScrollLeft
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                >
                  <ChevronLeft
                    className="w-4 h-4 text-stone-400"
                    strokeWidth={2.5}
                  />
                </div>
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-0.5 transition-opacity ${
                    seasonScrollState.canScrollRight
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                >
                  <ChevronRight
                    className="w-4 h-4 text-stone-400"
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleToggleSeasonWatched}
                  disabled={!activeSeason?.episodes?.length}
                  className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 disabled:text-stone-600"
                >
                  {isActiveSeasonWatched
                    ? 'Mark season unwatched'
                    : 'Mark season watched'}
                </button>
              </div>
            </div>

            {activeSeason?.episodes?.length ? (
              <div className="space-y-1 min-h-[200px]">
                {episodesWithState.map((episode) => (
                  <EpisodeItem
                    key={episode.id}
                    episode={episode}
                    isNextUp={episode.id === episodeStats.nextUpId}
                    isExpanded={expandedEpisodeId === episode.id}
                    isSpoilerRevealed={
                      Boolean(revealedEpisodeIds?.[episode.id]) ||
                      episode.watched ||
                      episode.id === episodeStats.nextUpId
                    }
                    onToggleExpand={() =>
                      setExpandedEpisodeId(
                        expandedEpisodeId === episode.id ? null : episode.id,
                      )
                    }
                    onToggleWatched={() => handleToggleEpisode(episode)}
                    onToggleSpoiler={() =>
                      setRevealedEpisodeIds((prev) => ({
                        ...(prev || {}),
                        [episode.id]: !prev?.[episode.id],
                      }))
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-stone-500 italic flex items-center gap-2">
                {episodeMapStatus === 'loading' && (
                  <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
                )}
                {episodeMapStatus === 'loading' && 'Loading episodes...'}
                {episodeMapStatus === 'timeout' &&
                  'Still fetching episode details...'}
                {episodeMapStatus === 'error' &&
                  'Unable to load episodes right now.'}
                {episodeMapStatus !== 'loading' &&
                  episodeMapStatus !== 'timeout' &&
                  episodeMapStatus !== 'error' &&
                  'No episodes available for this season yet.'}
                {(episodeMapStatus === 'timeout' ||
                  episodeMapStatus === 'error') && (
                  <button
                    type="button"
                    onClick={handleRetryEpisodeFetch}
                    className="text-xs font-bold uppercase tracking-wider text-amber-500/80 hover:text-amber-400"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-stone-500 italic flex items-center gap-2">
            {episodeMapStatus === 'loading' && (
              <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
            )}
            {episodeMapStatus === 'loading' && 'Loading episode details...'}
            {episodeMapStatus === 'timeout' &&
              'Episode data is taking longer than expected.'}
            {episodeMapStatus === 'error' &&
              'Unable to load episode details right now.'}
            {episodeMapStatus === 'not_found' &&
              'We could not find episodes for this show yet.'}
            {episodeMapStatus !== 'loading' &&
              episodeMapStatus !== 'timeout' &&
              episodeMapStatus !== 'error' &&
              episodeMapStatus !== 'not_found' &&
              'No episodes available yet.'}
            {(episodeMapStatus === 'timeout' ||
              episodeMapStatus === 'error') && (
              <button
                type="button"
                onClick={handleRetryEpisodeFetch}
                className="text-xs font-bold uppercase tracking-wider text-amber-500/80 hover:text-amber-400"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Season Reset Confirmation Dialog */}
      {isSeasonResetConfirmOpen && (
        <>
          <button
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm cursor-default"
            onClick={() => setIsSeasonResetConfirmOpen(false)}
            aria-label="Close confirmation"
          />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif text-stone-100">
                  Mark season unwatched?
                </h3>
                <button
                  onClick={() => setIsSeasonResetConfirmOpen(false)}
                  className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
                  aria-label="Close confirmation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-stone-400">
                This will clear watched progress for every episode in the
                season.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={() => setIsSeasonResetConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
                >
                  Keep watched
                </button>
                <button
                  onClick={handleConfirmSeasonReset}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors"
                >
                  Mark unwatched
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ShowSeasonsSection;
