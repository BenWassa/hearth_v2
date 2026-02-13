import React from 'react';
import { Moon, Sparkles } from 'lucide-react';
import ItemCard from '../../../components/cards/ItemCard.js';

const SuggestionSection = ({
  title,
  pool,
  suggestions,
  emptyLabel,
  onDecide,
  onToggleStatus,
  onOpenDetails,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
          {title}
        </h3>
        {pool.length > 0 && (
          <button
            onClick={() => onDecide(pool)}
            className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Pick for us
          </button>
        )}
      </div>
      {suggestions.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {suggestions.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onToggle={() => onToggleStatus(item.id, item.status)}
              minimal={false}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 space-y-3 opacity-70 bg-stone-900/30 border border-stone-800 rounded-xl">
          <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Moon className="w-5 h-5" />
          </div>
          <p className="text-xs text-stone-400">{emptyLabel}</p>
        </div>
      )}
    </div>
  );
};

export default SuggestionSection;
