import React from 'react';
import { X } from 'lucide-react';

const ModalContentHeader = ({ vibeDef, energyDef, onClose }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* Vibe & Energy Tags */}
      <div className="flex flex-wrap gap-2">
        {vibeDef && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-stone-800/90 to-stone-900/90 text-[11px] font-bold text-stone-300 uppercase tracking-wider border border-stone-700/50 shadow-sm">
            <vibeDef.icon className="w-3.5 h-3.5 text-amber-500/90" />
            {vibeDef.label}
          </span>
        )}
        {energyDef && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-stone-800/90 to-stone-900/90 text-[11px] font-bold text-stone-300 uppercase tracking-wider border border-stone-700/50 shadow-sm">
            <energyDef.icon className="w-3.5 h-3.5 text-sky-500/90" />
            {energyDef.label}
          </span>
        )}
      </div>

      {/* Right: Close Button */}
      <button
        onClick={onClose}
        className="hidden sm:flex flex-shrink-0 items-center justify-center w-8 h-8 text-stone-500 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-all"
        aria-label="Close details"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ModalContentHeader;
