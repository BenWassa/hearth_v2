import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { ENERGIES } from '../../config/constants.js';
import { getPosterSrc } from '../../utils/poster.js';
import PosterPlaceholder from './PosterPlaceholder.js';
import LazyMediaImage from '../media/LazyMediaImage.js';

const getEpisodeProgressKeys = (episode) => {
  if (!episode || typeof episode !== 'object') return [];
  const fallbackKey =
    Number.isFinite(episode.seasonNumber) && Number.isFinite(episode.number)
      ? `s${episode.seasonNumber}e${episode.number}`
      : null;
  return Array.from(
    new Set(
      [episode.id, ...(episode.progressKeys || []), fallbackKey]
        .filter(Boolean)
        .map((key) => `${key}`),
    ),
  );
};

const isEpisodeWatched = (episodeProgress, episode) =>
  getEpisodeProgressKeys(episode).some((key) => Boolean(episodeProgress?.[key]));

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
  const isWatching = item.status === 'watching';
  const energyDef = ENERGIES.find((e) => e.id === item.energy);

  const progressPercentage = useMemo(() => {
    if (item.type !== 'show') return 0;
    const progressObj = item.episodeProgress || {};
    const seasons = Array.isArray(item.seasons) ? item.seasons : [];

    if (seasons.length > 0) {
      let watchedEpisodes = 0;
      let totalEpisodes = 0;

      seasons.forEach((season) => {
        const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
        if (episodes.length > 0) {
          totalEpisodes += episodes.length;
          episodes.forEach((episode) => {
            if (isEpisodeWatched(progressObj, episode)) {
              watchedEpisodes += 1;
            }
          });
        } else if (Number.isFinite(season?.episodeCount) && season.episodeCount > 0) {
          totalEpisodes += season.episodeCount;
        }
      });

      if (totalEpisodes > 0) {
        return Math.min(
          Math.round((watchedEpisodes / totalEpisodes) * 100),
          100,
        );
      }
    }

    const watchedCount = Object.values(progressObj).filter(Boolean).length;
    return watchedCount > 0 ? 5 : 0;
  }, [item.type, item.episodeProgress, item.seasons]);

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
            className={`relative aspect-[2/3] w-full bg-stone-900/50 overflow-hidden border-b border-l border-r border-stone-800 shadow-lg shadow-black/30 transition-all ${
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
                fallback={
                  <PosterPlaceholder title={item.title} type={item.type} />
                }
              />
            ) : (
              <PosterPlaceholder title={item.title} type={item.type} />
            )}
            {isWatching && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-950/90 backdrop-blur-md z-10 border-t border-stone-800">
                <div
                  className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(progressPercentage, 2)}%` }}
                />
              </div>
            )}
          </button>
        ) : (
          <div className="relative aspect-[2/3] w-full bg-stone-900/50 overflow-hidden border-b border-l border-r border-stone-800 shadow-lg shadow-black/30">
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
            {isWatching && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-950/90 backdrop-blur-md z-10 border-t border-stone-800">
                <div
                  className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(progressPercentage, 2)}%` }}
                />
              </div>
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

    </div>
  );
};

export default PosterCard;
