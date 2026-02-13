import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { ENERGIES } from '../../config/constants.js';
import { getPosterSrc } from '../../utils/poster.js';
import PosterPlaceholder from './PosterPlaceholder.js';
import LazyMediaImage from '../media/LazyMediaImage.js';

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
  const posterSrc = getPosterSrc(item);
  const isWatched = item.status === 'watched';
  const energyDef = ENERGIES.find((e) => e.id === item.energy);

  // Energy-based styling tokens
  const energyStyles = {
    light: {
      bg: 'bg-sky-400',
      text: 'text-sky-950',
      label: 'Light',
    },
    balanced: {
      bg: 'bg-amber-400',
      text: 'text-amber-950',
      label: 'Balanced',
    },
    focused: {
      bg: 'bg-red-400',
      text: 'text-red-950',
      label: 'Focused',
    },
  };

  const currentEnergyStyle = energyStyles[item.energy] || energyStyles.balanced;

  useEffect(() => {
    setPosterMissing(false);
  }, [posterSrc]);

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
        <div className={`h-1 w-full ${currentEnergyStyle.bg}`} />

        {/* Poster Image - clickable for both selection and details */}
        {selectionMode || onOpenDetails ? (
          <button
            type="button"
            onClick={handleClick}
            className={`aspect-[2/3] w-full bg-stone-900/50 overflow-hidden border-b border-l border-r border-stone-800 shadow-lg shadow-black/30 transition-all ${
              isSelected
                ? 'opacity-40 ring-2 ring-amber-500 ring-inset'
                : 'opacity-100'
            }`}
            aria-label={
              selectionMode
                ? `${isSelected ? 'Deselect' : 'Select'} ${item.title}`
                : `View details for ${item.title}`
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
                fallback={<PosterPlaceholder title={item.title} type={item.type} />}
              />
            ) : (
              <PosterPlaceholder title={item.title} type={item.type} />
            )}
          </button>
        ) : (
          <div className="aspect-[2/3] w-full bg-stone-900/50 overflow-hidden border-b border-l border-r border-stone-800 shadow-lg shadow-black/30">
            {posterSrc && !posterMissing ? (
              <LazyMediaImage
                src={posterSrc}
                alt={`${item.title} poster`}
                onError={() => setPosterMissing(true)}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="auto"
                fallback={<PosterPlaceholder title={item.title} type={item.type} />}
              />
            ) : (
              <PosterPlaceholder title={item.title} type={item.type} />
            )}
          </div>
        )}

        {/* Selection indicator - checkmark badge when selected */}
        {selectionMode && isSelected && (
          <div className="absolute top-2 left-2 bg-amber-500 rounded-full p-0.5 shadow-lg z-10">
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
          </div>
        )}

        {/* Energy Label Badge - Top Right (always visible) */}
        <div
          className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${currentEnergyStyle.bg} ${currentEnergyStyle.text} flex items-center gap-0.5`}
          title={`Energy: ${currentEnergyStyle.label}`}
        >
          {energyDef?.icon && <energyDef.icon className="w-3 h-3" />}
        </div>

        {/* Action Button - Mark Watched/Delete (hover on desktop, always on mobile) */}
        {!selectionMode && !onOpenDetails && (
          <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-center justify-between bg-gradient-to-t from-stone-950/80 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-full text-stone-300 bg-stone-950/80 border border-stone-700 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
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
                className="p-1.5 rounded-full text-stone-400 bg-stone-950/80 border border-stone-700 hover:text-red-400 hover:border-red-700/40 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title Only - No Vibe (it's already grouped by vibe on library page) */}
      <div className="flex flex-col gap-1 flex-1 px-1 py-2 min-h-0">
        {selectionMode || onOpenDetails ? (
          <button
            type="button"
            onClick={handleClick}
            className={`text-left text-[11px] leading-tight font-serif line-clamp-2 flex-shrink-0 transition-colors ${
              isSelected
                ? 'text-stone-500'
                : 'text-stone-200 hover:text-amber-200'
            }`}
            aria-label={
              selectionMode
                ? `${isSelected ? 'Deselect' : 'Select'} ${item.title}`
                : `View details for ${item.title}`
            }
          >
            {item.title}
          </button>
        ) : (
          <div className="text-[11px] leading-tight text-stone-200 font-serif line-clamp-2 flex-shrink-0">
            {item.title}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosterCard;
