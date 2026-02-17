import React from 'react';

const PickForUsCard = ({ onPickRandom, onPickVibe, onPickEnergy }) => {
  return (
    <div>
      <div className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-2 backdrop-blur-sm">
        <div className="flex gap-2">
          <button
            onClick={onPickRandom}
            className="flex-1 min-h-[48px] rounded-lg border border-amber-600/50 bg-amber-600/15 px-3 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-600/25 active:scale-95"
            title="Pick a random item from all unwatched"
          >
            Random
          </button>

          <button
            onClick={onPickVibe}
            className="flex-1 min-h-[48px] rounded-lg border border-stone-700 bg-stone-900/50 px-3 text-xs font-medium text-stone-300 transition-colors hover:border-stone-600 hover:text-stone-200 active:scale-95"
            title="Pick by vibe preference"
          >
            Vibe
          </button>

          <button
            onClick={onPickEnergy}
            className="flex-1 min-h-[48px] rounded-lg border border-stone-700 bg-stone-900/50 px-3 text-xs font-medium text-stone-300 transition-colors hover:border-stone-600 hover:text-stone-200 active:scale-95"
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
