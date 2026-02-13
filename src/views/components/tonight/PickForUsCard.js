import React from 'react';
import { Sparkles } from 'lucide-react';

const PickForUsCard = ({ onPickRandom, onPickVibe, onPickEnergy }) => {
  return (
    <div className="space-y-0 -mt-2">
      <div className="flex items-center justify-center gap-2 px-2 py-1">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h4 className="text-sm font-serif text-amber-200">Pick for us</h4>
      </div>

      <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/10 border border-amber-500/30 rounded-2xl p-2 space-y-2">
        <div className="flex gap-4">
          <button
            onClick={onPickRandom}
            className="flex-1 min-h-[56px] py-0 px-5 rounded-lg bg-amber-600/20 border border-amber-600/40 text-amber-300 hover:bg-amber-600/30 text-sm font-semibold uppercase tracking-wide transition-colors active:scale-95"
            title="Pick a random item from all unwatched"
          >
            Random
          </button>

          <button
            onClick={onPickVibe}
            className="flex-1 min-h-[56px] py-0 px-5 rounded-lg bg-stone-900/40 border border-stone-700 text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 text-sm font-semibold uppercase tracking-wide transition-colors active:scale-95"
            title="Pick by vibe preference"
          >
            Vibe
          </button>

          <button
            onClick={onPickEnergy}
            className="flex-1 min-h-[56px] py-0 px-5 rounded-lg bg-stone-900/40 border border-stone-700 text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 text-sm font-semibold uppercase tracking-wide transition-colors active:scale-95"
            title="Pick by energy level"
          >
            Energy
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickForUsCard;
