import React from 'react';
import { Check, ChevronDown, ChevronUp, Eye, EyeOff, Play } from 'lucide-react';
import { formatRuntime } from '../utils/formatters.js';

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
  const canToggleSpoiler =
    !isWatched && !isNextUp && Boolean(episode.description);
  const isSpoilerHidden = canToggleSpoiler && !isSpoilerRevealed;

  return (
    <div
      className={`
        relative group rounded-xl border transition-all duration-200 overflow-hidden mb-2
        ${
          isNextUp
            ? 'bg-stone-800/60 border-amber-900/40 ring-1 ring-amber-500/20 shadow-lg shadow-black/20'
            : 'bg-transparent border-transparent active:bg-stone-900/40'
        }
      `}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex-shrink-0 relative z-10">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleWatched();
            }}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
              ${
                isWatched
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 active:text-amber-500 active:border-amber-500/50'
                  : isNextUp
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 active:scale-95'
                  : 'bg-stone-900/50 text-stone-600 border border-stone-800 active:border-stone-500 active:text-stone-400'
              }
            `}
            aria-label={isWatched ? 'Mark unwatched' : 'Mark watched'}
          >
            {isWatched ? (
              <Check className="w-5 h-5" />
            ) : isNextUp ? (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            ) : (
              <span className="text-xs font-bold font-mono">
                {episode.number}
              </span>
            )}
          </button>
        </div>

        <div
          className={`flex-1 min-w-0 transition-opacity ${
            isWatched ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isNextUp && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                Next
              </span>
            )}
            <h3
              className={`font-medium text-base leading-tight truncate ${
                isWatched ? 'decoration-stone-700' : 'text-stone-200'
              }`}
            >
              {episode.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            {airYear ? <span>{airYear}</span> : null}
            {runtimeLabel ? (
              <>
                <span className="text-stone-600">·</span>
                <span>{runtimeLabel}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="text-stone-600 px-1">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </div>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out bg-stone-950/40
          ${isExpanded ? 'max-h-48 border-t border-stone-800/30' : 'max-h-0'}
        `}
      >
        <div
          className={`p-4 pl-4 pr-4 ${
            canToggleSpoiler ? 'cursor-pointer' : ''
          }`}
          onClick={() => {
            if (!canToggleSpoiler) return;
            onToggleSpoiler?.();
          }}
          role={canToggleSpoiler ? 'button' : undefined}
          tabIndex={canToggleSpoiler ? 0 : undefined}
          onKeyDown={(event) => {
            if (!canToggleSpoiler) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggleSpoiler?.();
            }
          }}
          aria-label={
            canToggleSpoiler
              ? isSpoilerHidden
                ? 'Reveal description'
                : 'Hide description'
              : undefined
          }
          aria-pressed={canToggleSpoiler ? !isSpoilerHidden : undefined}
        >
          <p
            className={`text-sm leading-relaxed transition-[filter,opacity] duration-300 ${
              isSpoilerHidden
                ? 'blur-[3px] text-stone-500 select-none'
                : 'text-stone-400'
            }`}
          >
            {episode.description || 'No description yet.'}
          </p>
          {canToggleSpoiler ? (
            <div className="mt-3 text-[10px] uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              {isSpoilerHidden ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Spoiler Protected
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Spoiler Revealed
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EpisodeItem;
