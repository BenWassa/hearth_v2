import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { VIBES } from '../../../config/constants.js';

const VibePickModal = ({
  isOpen,
  selectedVibe,
  onClose,
  onSelectVibe,
  localPickError,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/30 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-serif text-amber-200">
                Choose a Vibe
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-stone-400 -mt-2">
            Pick the mood you're in for tonight
          </p>
          {localPickError && (
            <div className="text-xs text-amber-300 mt-1">{localPickError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {VIBES.map((vibe, idx) => (
              <button
                key={vibe.id}
                onClick={() => onSelectVibe(vibe.id)}
                className={`p-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                  selectedVibe === vibe.id
                    ? 'bg-amber-600/40 text-amber-50 border-2 border-amber-500/80 shadow-lg scale-105'
                    : 'bg-stone-800/60 text-stone-300 border-2 border-stone-700/50 hover:bg-stone-800 hover:border-amber-600/30 hover:text-amber-200'
                } ${
                  idx === VIBES.length - 1 && VIBES.length % 2 === 1
                    ? 'col-span-2'
                    : ''
                }`}
              >
                {vibe.icon && <vibe.icon className="w-6 h-6" />}
                <span>{vibe.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default VibePickModal;
