import React from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

const ActionBar = ({ item, onToggleStatus, onDeleteTitle, isEditing }) => {
  return (
    <div className="p-4 bg-stone-950 border-t border-stone-900 grid gap-3">
      {isEditing && onDeleteTitle && (
        <button
          onClick={onDeleteTitle}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-800/60 bg-red-900/30 text-red-100 text-xs font-bold uppercase tracking-wider hover:bg-red-900/50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete This Title
        </button>
      )}
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
