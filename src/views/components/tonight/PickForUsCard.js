import React from 'react';
import { Moon, Sparkles, Zap } from 'lucide-react';

const PickForUsCard = ({ onPickVibe, onPickEnergy }) => {
  return (
    <div>
      <div className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-1.5 backdrop-blur-sm">
        <div className="flex gap-2">
          <div className="flex-1 min-h-[40px] px-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500 flex items-center justify-center gap-1.5 select-none">
            <Sparkles className="w-3.5 h-3.5" />
            Pick for us
          </div>

          <button
            onClick={onPickVibe}
            className="flex-1 min-h-[40px] rounded-lg border border-stone-700 bg-stone-900/50 px-2.5 text-xs font-medium text-stone-300 transition-colors hover:border-stone-600 hover:text-stone-200 active:scale-95 flex items-center justify-center gap-1.5"
            title="Pick by vibe preference"
          >
            <Moon className="w-3.5 h-3.5" />
            Vibe
          </button>

          <button
            onClick={onPickEnergy}
            className="flex-1 min-h-[40px] rounded-lg border border-stone-700 bg-stone-900/50 px-2.5 text-xs font-medium text-stone-300 transition-colors hover:border-stone-600 hover:text-stone-200 active:scale-95 flex items-center justify-center gap-1.5"
            title="Pick by energy level"
          >
            <Zap className="w-3.5 h-3.5" />
            Energy
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickForUsCard;
