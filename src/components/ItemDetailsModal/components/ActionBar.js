import React from 'react';
import { Check, Plus } from 'lucide-react';

const ActionBar = ({ item, onToggleStatus }) => {
  if (item?.type === 'show') return null;

  return (
    <div className="p-4 bg-stone-950 border-t border-stone-900 grid gap-3">
      <button
        onClick={() => onToggleStatus?.(item.id, item.status)}
        className={`w-full h-14 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
          item.status === 'watched'
            ? 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            : 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/20'
        }`}
      >
        {item.status === 'watched' ? (
          <>
            <Plus className="w-5 h-5" /> Back to Shelf
          </>
        ) : (
          <>
            <Check className="w-5 h-5" /> Mark Watched
          </>
        )}
      </button>
    </div>
  );
};

export default ActionBar;
