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
  layout = 'grid',
  hideDecide = false,
  cardWidthClassName = 'w-[clamp(3.75rem,10vh,6.25rem)]',
  className = '',
}) => {
  const isRail = layout === 'rail';

  return (
    <div className={`space-y-3 ${isRail ? 'h-full min-h-0 flex flex-col' : ''} ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
          {title}
        </h3>
        {!hideDecide && pool.length > 0 && onDecide && (
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
        isRail ? (
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar">
            <div className="flex gap-2 min-w-max">
              {suggestions.map((item) => (
                <div key={item.id} className={`${cardWidthClassName} shrink-0`}>
                  <ItemCard
                    item={item}
                    onToggle={() => onToggleStatus(item.id, item.status)}
                    minimal={false}
                    onOpenDetails={onOpenDetails}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
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
        )
      ) : (
        <div
          className={`text-center space-y-2 opacity-70 bg-stone-900/30 border border-stone-800 rounded-xl ${
            isRail ? 'flex-1 min-h-0 flex flex-col justify-center py-3' : 'py-6'
          }`}
        >
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
