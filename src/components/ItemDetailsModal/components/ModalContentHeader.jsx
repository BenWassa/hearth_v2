import React from 'react';
import { X } from 'lucide-react';
import IconButton from '../../ui/IconButton.jsx';
import { getEnergyStyle } from '../../../config/energyStyles.js';

const chipClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-label font-bold text-stone-300 uppercase tracking-wider border border-stone-700';

const ModalContentHeader = ({ vibeDef, energyDef, onClose }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* Vibe & Energy Tags */}
      <div className="flex flex-wrap gap-2">
        {vibeDef && (
          <span className={chipClass}>
            <vibeDef.icon
              className="w-3.5 h-3.5 text-amber-400"
              aria-hidden="true"
            />
            {vibeDef.label}
          </span>
        )}
        {energyDef && (
          <span className={chipClass}>
            <energyDef.icon
              className={`w-3.5 h-3.5 ${getEnergyStyle(energyDef.id).icon}`}
              aria-hidden="true"
            />
            {energyDef.label}
          </span>
        )}
      </div>

      {/* Right: Close Button */}
      <IconButton
        label="Close details"
        onClick={onClose}
        className="hidden sm:flex flex-shrink-0 -mt-2 -mr-2"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </IconButton>
    </div>
  );
};

export default ModalContentHeader;
