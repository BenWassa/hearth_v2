import React, { useState } from 'react';
import { Battery, ChevronLeft, Film, Sparkles, Tv } from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import { getPosterSrc } from '../utils/poster.js';
import Button from '../components/ui/Button.js';
import PosterPlaceholder from '../components/cards/PosterPlaceholder.js';
import LazyMediaImage from '../components/media/LazyMediaImage.js';

const DecisionView = ({
  isDeciding,
  result,
  onClose,
  onReroll,
  decisionContext,
}) => {
  const energyDef = result
    ? ENERGIES.find((e) => e.id === result.energy)
    : null;
  const vibeDef = result ? VIBES.find((v) => v.id === result.vibe) : null;
  const EnergyIcon = energyDef ? energyDef.icon : Battery;
  const [posterMissing, setPosterMissing] = useState(false);
  const posterSrc = result ? getPosterSrc(result) : null;
  const decisionTag = (() => {
    if (!decisionContext) return null;
    const { filterType, filterId } = decisionContext;
    if (filterType === 'energy') {
      const def = ENERGIES.find((energy) => energy.id === filterId);
      return def ? `Energy: ${def.label}` : 'Energy Pick';
    }
    if (filterType === 'vibe') {
      const def = VIBES.find((vibe) => vibe.id === filterId);
      return def ? `Vibe: ${def.label}` : 'Vibe Pick';
    }
    if (filterType === 'type') {
      if (filterId === 'movie') return 'Movies';
      if (filterId === 'show') return 'TV Shows';
    }
    return null;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center p-6 sm:p-8 animate-in fade-in duration-300">
      {!isDeciding && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {isDeciding ? (
        <div className="text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-amber-600/20 rounded-full animate-ping duration-[3000ms]"></div>
            <div className="absolute inset-4 bg-stone-900 rounded-full flex items-center justify-center border border-stone-800">
              <Sparkles className="w-8 h-8 text-amber-600/50 animate-spin-slow" />
            </div>
          </div>
          <p className="text-stone-500 font-serif text-lg animate-pulse">
            Checking the mood...
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-6 animate-in zoom-in-95 duration-500">
          {decisionTag && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-700/40 bg-amber-900/20 text-amber-300 text-[11px] uppercase tracking-wider font-semibold">
                <Sparkles className="w-3 h-3" />
                {decisionTag}
              </div>
            </div>
          )}
          {/* Large Poster Image */}
          {result && (
            <div className="mx-auto w-64 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="aspect-[2/3] w-full bg-stone-900/50 overflow-hidden">
                {posterSrc && !posterMissing ? (
                  <LazyMediaImage
                    src={posterSrc}
                    alt={`${result.title} poster`}
                    onError={() => setPosterMissing(true)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    fallback={
                      <PosterPlaceholder
                        title={result.title}
                        type={result.type}
                      />
                    }
                  />
                ) : (
                  <PosterPlaceholder title={result.title} type={result.type} />
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-amber-600/80 text-xs uppercase tracking-widest font-bold">
              <Sparkles className="w-3 h-3" />
              It's Time For
            </div>

            <h1 className="text-4xl font-serif text-stone-100 leading-tight py-2">
              {result.title}
            </h1>

            <div className="flex items-center justify-center gap-4 text-stone-500">
              {result.type === 'movie' ? (
                <Film className="w-4 h-4" />
              ) : (
                <Tv className="w-4 h-4" />
              )}
              <span className="w-1 h-1 bg-stone-800 rounded-full" />
              <span className="">{vibeDef?.label}</span>
              {energyDef && (
                <>
                  <span className="w-1 h-1 bg-stone-800 rounded-full" />
                  <div className="flex items-center gap-1">
                    <EnergyIcon className="w-3 h-3" />
                    <span>{energyDef.label}</span>
                  </div>
                </>
              )}
            </div>

            {result.note && (
              <div className="bg-stone-900/50 p-4 rounded-xl text-stone-400 italic text-sm mt-6">
                "{result.note}"
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={onClose} className="w-full">
              Let's Watch It
            </Button>
            <Button variant="ghost" onClick={onReroll} className="w-full">
              Spin Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionView;
