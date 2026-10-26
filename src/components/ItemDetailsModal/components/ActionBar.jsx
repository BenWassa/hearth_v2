import React from 'react';
import { Check, Loader2, Plus } from 'lucide-react';

const ActionBar = ({ item, onToggleStatus, onAddItem, isAdding = false }) => {
  if (item?.type === 'show') return null;

  const isSaved = Boolean(item?.id);

  return (
    <div className="p-4 bg-stone-950 border-t border-stone-900 grid gap-3">
      <button
        type="button"
        onClick={() => {
          if (isSaved) {
            onToggleStatus?.(item.id, item.status);
          } else {
            onAddItem?.(item);
          }
        }}
        disabled={!isSaved && isAdding}
        className={`w-full h-14 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-[opacity,transform] motion-safe:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          !isSaved
            ? 'bg-amber-600 text-stone-950 hover:bg-amber-500 disabled:cursor-wait disabled:opacity-70'
            : item.status === 'watched'
            ? 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            : 'bg-amber-600 text-stone-950 hover:bg-amber-500'
        }`}
      >
        {!isSaved ? (
          <>
            {isAdding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add to shelf
          </>
        ) : item.status === 'watched' ? (
          <>
            <Plus className="w-5 h-5" /> Back to shelf
          </>
        ) : (
          <>
            <Check className="w-5 h-5" /> Mark watched
          </>
        )}
      </button>
    </div>
  );
};

export default ActionBar;
