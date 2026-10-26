import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import EpisodeItem from './EpisodeItem.jsx';
import Dialog from '../../ui/Dialog.jsx';
import Button from '../../ui/Button.jsx';
import IconButton from '../../ui/IconButton.jsx';
import ProgressBar from '../../ui/ProgressBar.jsx';

const ShowSeasonsSection = ({
  seasons,
  totalSeasons,
  seasonScrollRef,
  handleSeasonKeyDown,
  seasonProgress,
  entireShowProgress,
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
  const retryButton = (
    <button
      type="button"
      onClick={handleRetryEpisodeFetch}
      className="inline-flex min-h-11 items-center px-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      Retry
    </button>
  );

  return (
    <>
      <section className="space-y-4" aria-label="Seasons and episodes">
        <div className="flex items-center justify-between">
          <div className="text-label uppercase tracking-widest text-stone-400 font-bold">
            Seasons & episodes
          </div>
          {totalSeasons ? (
            <div className="text-xs text-stone-400">{totalSeasons} seasons</div>
          ) : null}
        </div>

        {/* Series Progress Bar */}
        {entireShowProgress.percent > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-label font-bold text-stone-400 uppercase tracking-wider">
                Series progress
              </div>
              <div className="text-label font-mono text-amber-400 font-bold">
                {entireShowProgress.watched} / {entireShowProgress.total || '?'}{' '}
                episodes ({entireShowProgress.percent}%)
              </div>
            </div>
            <ProgressBar
              value={entireShowProgress.percent}
              label="Series progress"
            />
          </div>
        )}

        {seasons.length ? (
          <>
            <div className="border-t border-stone-800/60 pt-4">
              <div className="relative -mx-1 px-1">
                <div
                  className="flex overflow-x-auto no-scrollbar gap-2 pb-3 border-b border-stone-800/50 scroll-smooth"
                  ref={seasonScrollRef}
                  onKeyDown={handleSeasonKeyDown}
                  role="group"
                  aria-label="Season selector"
                >
                  {seasonProgress.map(({ season, progress, total }) => {
                    const isActive = activeSeason?.number === season.number;
                    return (
                      <div
                        key={season.id}
                        className="flex-shrink-0 flex flex-col gap-2"
                      >
                        <button
                          type="button"
                          data-season-number={season.number}
                          aria-pressed={isActive}
                          onClick={() => {
                            setActiveSeasonNum(season.number);
                            scrollToSeason(season.number);
                          }}
                          className={`
                            w-full min-h-11 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-opacity border focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                            ${
                              isActive
                                ? 'bg-stone-800 text-stone-100 border-stone-700'
                                : 'bg-transparent text-stone-400 border-transparent hover:bg-stone-800/30'
                            }
                          `}
                        >
                          Season {season.number}
                        </button>
                        <ProgressBar
                          value={progress}
                          heightClassName="h-1"
                          barClassName={
                            total > 0 ? 'bg-amber-500' : 'bg-stone-700'
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-stone-950 via-stone-950/50 to-transparent transition-opacity ${
                    seasonScrollState.canScrollLeft
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-stone-950 via-stone-950/50 to-transparent transition-opacity ${
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
                    aria-hidden="true"
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
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleToggleSeasonWatched}
                  disabled={!activeSeason?.episodes?.length}
                  className="min-h-11 -ml-1 px-1 rounded-lg text-label font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 disabled:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
              <div className="text-sm text-stone-400 italic flex items-center gap-2">
                {episodeMapStatus === 'loading' && (
                  <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin motion-reduce:animate-none" />
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
                  episodeMapStatus === 'error') &&
                  retryButton}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-stone-400 italic flex items-center gap-2">
            {episodeMapStatus === 'loading' && (
              <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin motion-reduce:animate-none" />
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
            {(episodeMapStatus === 'timeout' || episodeMapStatus === 'error') &&
              retryButton}
          </div>
        )}
      </section>

      {/* Season Reset Confirmation Dialog */}
      {isSeasonResetConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-950/85"
            onClick={() => setIsSeasonResetConfirmOpen(false)}
            aria-hidden="true"
            tabIndex={-1}
          />
          <Dialog
            onClose={() => setIsSeasonResetConfirmOpen(false)}
            aria-labelledby="season-reset-title"
            className="relative bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3
                id="season-reset-title"
                className="text-lg font-serif text-stone-100"
              >
                Mark season unwatched?
              </h3>
              <IconButton
                label="Close confirmation"
                onClick={() => setIsSeasonResetConfirmOpen(false)}
                className="-mr-2"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>
            <p className="text-sm text-stone-400">
              This will clear watched progress for every episode in the season.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSeasonResetConfirmOpen(false)}
                className="min-h-11 px-4 py-2 text-sm"
              >
                Keep watched
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmSeasonReset}
                className="min-h-11 px-4 py-2 text-sm"
              >
                Mark unwatched
              </Button>
            </div>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default ShowSeasonsSection;
