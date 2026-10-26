import React from 'react';
import { Check, ChevronDown, ChevronUp, Eye, EyeOff, Play } from 'lucide-react';
import { formatRuntime } from '../utils/formatters.js';
import {
  formatReleaseDate,
  isUpcomingDate,
} from '../../../utils/releaseDates.js';

const EpisodeItem = ({
  episode,
  isNextUp,
  isExpanded,
  isSpoilerRevealed,
  onToggleExpand,
  onToggleWatched,
  onToggleSpoiler,
}) => {
  const isWatched = episode.watched;
  const airYear = episode.airDate
    ? new Date(episode.airDate).getFullYear()
    : null;
  const runtimeLabel = formatRuntime(episode.runtimeMinutes);
  const releaseLabel = isUpcomingDate(episode.airDate)
    ? formatReleaseDate(episode.airDate)
    : '';
  const descriptionText =
    episode.description || releaseLabel || 'Description not available.';
  const canToggleSpoiler =
    !isWatched && !isNextUp && Boolean(episode.description);
  const isSpoilerHidden = canToggleSpoiler && !isSpoilerRevealed;

  const descriptionId = `episode-desc-${episode.id}`;

  return (
    <div
      data-episode-id={episode.id}
      className={`
        relative group rounded-xl border transition-opacity duration-200 overflow-hidden mb-2
        ${
          isNextUp
            ? 'bg-stone-800/60 border-amber-900/40 ring-1 ring-amber-500/20'
            : 'bg-transparent border-transparent active:bg-stone-900/40'
        }
      `}
    >
      <div className="flex items-center gap-2 p-4 pr-2 select-none">
        <div className="flex-shrink-0 relative z-10">
          <button
            type="button"
            onClick={onToggleWatched}
            className={`
              w-11 h-11 rounded-full flex items-center justify-center transition-[opacity,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              ${
                isWatched
                  ? 'bg-stone-800 text-stone-400 border border-stone-700 active:text-amber-400 active:border-amber-500/50'
                  : isNextUp
                  ? 'bg-amber-600 text-stone-950 motion-safe:active:scale-95'
                  : 'bg-stone-900/50 text-stone-400 border border-stone-700 active:border-stone-500 active:text-stone-300'
              }
            `}
            aria-label={
              isWatched
                ? `Mark ${episode.title} unwatched`
                : `Mark ${episode.title} watched`
            }
          >
            {isWatched ? (
              <Check className="w-5 h-5" aria-hidden="true" />
            ) : isNextUp ? (
              <Play
                className="w-4 h-4 ml-0.5 fill-current"
                aria-hidden="true"
              />
            ) : (
              <span className="text-xs font-bold font-mono">
                {episode.number}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-controls={descriptionId}
          className="flex-1 min-w-0 min-h-11 flex items-center gap-4 pl-2 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <span className="flex-1 min-w-0 block">
            <span className="flex items-center gap-2 mb-1">
              {isNextUp && (
                <span className="text-label font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Next
                </span>
              )}
              <span
                className={`font-medium text-base leading-tight truncate ${
                  isWatched ? 'text-stone-300' : 'text-stone-200'
                }`}
              >
                {episode.title}
              </span>
            </span>

            <span className="flex items-center gap-2 text-xs text-stone-400">
              {airYear ? <span>{airYear}</span> : null}
              {runtimeLabel ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{runtimeLabel}</span>
                </>
              ) : null}
            </span>
          </span>

          <span className="text-stone-400 px-1" aria-hidden="true">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        </button>
      </div>

      <div
        id={descriptionId}
        hidden={!isExpanded}
        className={`bg-stone-950/40 ${
          isExpanded ? 'border-t border-stone-800/30' : ''
        }`}
      >
        <div className="p-4">
          <p
            aria-hidden={isSpoilerHidden || undefined}
            className={`text-sm leading-relaxed transition-opacity duration-300 ${
              isSpoilerHidden
                ? 'blur-[3px] text-stone-400 select-none'
                : 'text-stone-400'
            }`}
          >
            {descriptionText}
          </p>
          {canToggleSpoiler ? (
            <button
              type="button"
              onClick={() => onToggleSpoiler?.()}
              aria-label={
                isSpoilerHidden ? 'Reveal description' : 'Hide description'
              }
              className="mt-1 min-h-11 text-label uppercase tracking-wider text-stone-400 flex items-center gap-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {isSpoilerHidden ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  Spoiler protected
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  Spoiler revealed
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EpisodeItem;
