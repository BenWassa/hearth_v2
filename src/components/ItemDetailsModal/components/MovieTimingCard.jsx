import React from 'react';
import { Clock } from 'lucide-react';

const MovieTimingCard = ({
  hasRuntime,
  runtimeLabel,
  finishContext,
  finishLabel,
}) => {
  return (
    <div className="bg-stone-900/40 rounded-xl p-4 border border-stone-800/50 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
            Runtime
          </div>
          <div className="text-stone-200 font-medium">
            {hasRuntime ? runtimeLabel : 'Unknown'}
          </div>
        </div>
      </div>

      {hasRuntime && (
        <div className="text-right border-l border-stone-800 pl-4">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
            {finishContext}
          </div>
          <div className="text-amber-500 font-bold text-lg font-mono">
            {finishLabel}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieTimingCard;
