import React from 'react';
import { Check, X, Zap } from 'lucide-react';
import { ENERGIES } from '../../../config/constants.js';

const EnergyPickModal = ({
  isOpen,
  selectedEnergy,
  onClose,
  onSelectEnergy,
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
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-serif text-amber-200">Choose Energy Level</h3>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-stone-400 -mt-2">How much attention do you want to give?</p>
          {localPickError && (
            <div className="text-xs text-amber-300 mt-1">{localPickError}</div>
          )}

          <div className="space-y-3">
            {ENERGIES.map((energy) => (
              <button
                key={energy.id}
                onClick={() => onSelectEnergy(energy.id)}
                className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                  selectedEnergy === energy.id
                    ? 'bg-amber-600/40 text-amber-50 border-2 border-amber-500/80 shadow-lg scale-[1.02]'
                    : 'bg-stone-800/60 text-stone-300 border-2 border-stone-700/50 hover:bg-stone-800 hover:border-amber-600/30 hover:text-amber-200'
                }`}
              >
                {energy.icon && <energy.icon className="w-6 h-6 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base">{energy.label}</div>
                  {energy.desc && (
                    <div className="text-xs opacity-80 mt-0.5">{energy.desc}</div>
                  )}
                </div>
                {selectedEnergy === energy.id && (
                  <Check className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default EnergyPickModal;
