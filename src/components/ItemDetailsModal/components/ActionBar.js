import React from 'react';
import { Check, Plus, RefreshCw } from 'lucide-react';

const ActionBar = ({
  item,
  onToggleStatus,
  onRefreshMetadata,
  isRefreshing,
}) => {
  const canRefresh = Boolean(
    item?.source?.provider && item?.source?.providerId,
  );

  return (
    <div className="p-4 bg-stone-950 border-t border-stone-900 grid gap-3">
      <button
        onClick={() => onRefreshMetadata?.(item.id)}
        disabled={!canRefresh || isRefreshing}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-stone-700 text-stone-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RefreshCw
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        {isRefreshing ? 'Refreshing...' : 'Refresh Metadata'}
      </button>
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
