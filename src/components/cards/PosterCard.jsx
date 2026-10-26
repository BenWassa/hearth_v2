import React, { useEffect, useId, useMemo, useState } from 'react';
import { Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { ENERGIES } from '../../config/constants.js';
import { getPosterSrc } from '../../utils/poster.js';
import { getShowWatchProgress } from './showCardProgress.js';
import PosterPlaceholder from './PosterPlaceholder.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { ENERGY_STYLES } from '../../config/energyStyles.js';
import LazyMediaImage from '../media/LazyMediaImage.jsx';

const PosterCard = ({
  item,
  onToggle,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onSelect,
  onOpenDetails,
}) => {
  const [posterMissing, setPosterMissing] = useState(false);
  const progressDescriptionId = useId();
  const posterSrc = getPosterSrc(item);
  const isWatched = item.status === 'watched';
  const energyDef = ENERGIES.find((e) => e.id === item.energy);

  const showProgress = useMemo(() => getShowWatchProgress(item), [item]);
  const progressPercentage = showProgress.percent;

  const showProgressBar =
    !isWatched && progressPercentage > 0 && item.type === 'show';

  // No band or badge for an unknown energy, so index the map directly.
  const currentEnergyStyle = ENERGY_STYLES[item.energy];

  const progressBar = showProgressBar ? (
    <ProgressBar
      value={progressPercentage}
      min={2}
      square
      className="absolute bottom-0 left-0 right-0 z-10"
      trackClassName="bg-stone-950/90 backdrop-blur-md border-t border-stone-800"
      barClassName="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
    />
  ) : null;

  useEffect(() => {
    setPosterMissing(false);
  }, [item.id, posterSrc]);

  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect();
    } else if (onOpenDetails) {
      onOpenDetails(item);
    }
  };

  return (
    <div className="group flex flex-col h-full">
      {/* Poster Container with Energy Band */}
      <div className="relative flex-shrink-0 w-full">
        {/* Energy Color Band at Top */}
        {currentEnergyStyle && (
          <div className={`h-1 w-full ${currentEnergyStyle.bg}`} />
        )}

        {/* Poster Image - clickable for both selection and details */}
        {selectionMode || onOpenDetails ? (
          <button
            type="button"
            onClick={handleClick}
            className={`relative aspect-[2/3] w-full bg-stone-900/50 overflow-hidden border-b border-l border-r border-stone-800 shadow-lg shadow-stone-950/30 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 ${
              isSelected
                ? 'opacity-40 ring-2 ring-amber-500 ring-inset'
                : 'opacity-100'
            }`}
            aria-label={
              selectionMode
                ? `${isSelected ? 'Deselect' : 'Select'} ${item.title}`
                : `View details for ${item.title}`
            }
            aria-pressed={selectionMode ? isSelected : undefined}
            aria-describedby={
              showProgressBar ? progressDescriptionId : undefined
            }
          >
            {posterSrc && !posterMissing ? (
              <LazyMediaImage
                src={posterSrc}
                alt={`${item.title} poster`}
                onError={() => setPosterMissing(true)}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="auto"
                fallback={
                  <PosterPlaceholder title={item.title} type={item.type} />
                }
              />
            ) : (
              <PosterPlaceholder title={item.title} type={item.type} />
            )}
            {progressBar}
          </button>
        ) : (
          <div className="relative aspect-[2/3] w-full bg-stone-900/50 overflow-hidden border-b border-l border-r border-stone-800 shadow-lg shadow-stone-950/30">
            {posterSrc && !posterMissing ? (
              <LazyMediaImage
                src={posterSrc}
                alt={`${item.title} poster`}
                onError={() => setPosterMissing(true)}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="auto"
                fallback={
                  <PosterPlaceholder title={item.title} type={item.type} />
                }
              />
            ) : (
              <PosterPlaceholder title={item.title} type={item.type} />
            )}
            {progressBar}
          </div>
        )}

        {/* Selection indicator - checkmark badge when selected */}
        {selectionMode && isSelected && (
          <div className="absolute top-2 left-2 bg-amber-500 rounded-full p-0.5 shadow-lg z-10">
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
          </div>
        )}

        {/* Energy Label Badge - Top Right (always visible) */}
        {currentEnergyStyle && (
          <div
            className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-label font-bold ${currentEnergyStyle.bg} ${currentEnergyStyle.text} flex items-center gap-0.5`}
            title={`Energy: ${currentEnergyStyle.label}`}
          >
            {energyDef?.icon && (
              <energyDef.icon className="w-3 h-3" aria-hidden="true" />
            )}
            <span className="sr-only">{currentEnergyStyle.label} energy</span>
          </div>
        )}

        {/* Action Button - Mark Watched/Delete (hover on desktop, always on mobile) */}
        {!selectionMode && !onOpenDetails && (
          <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-center justify-between bg-gradient-to-t from-stone-950/80 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggle}
              className="min-h-11 min-w-11 flex items-center justify-center p-1.5 rounded-full text-stone-300 bg-stone-950/80 border border-stone-700 hover:text-amber-400 hover:border-amber-500/40 transition-opacity"
              title={isWatched ? 'Move back to shelf' : 'Mark Watched'}
            >
              {isWatched ? (
                <Plus className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="min-h-11 min-w-11 flex items-center justify-center p-1.5 rounded-full text-stone-400 bg-stone-950/80 border border-stone-700 hover:text-red-400 hover:border-red-700/40 transition-opacity"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
      {showProgressBar && (
        <span id={progressDescriptionId} className="sr-only">
          {item.title}:{' '}
          {showProgress.total > 0
            ? `${showProgress.watched} of ${showProgress.total} episodes watched`
            : `${showProgress.watched} ${
                showProgress.watched === 1 ? 'episode' : 'episodes'
              } watched`}
        </span>
      )}
    </div>
  );
};

export default React.memo(PosterCard);
