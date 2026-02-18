import React, { useEffect, useRef, useState } from 'react';
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
  hideScrollbar = false,
  showEdgeFade = false,
  railPaddingClassName = '',
  cardWidthClassName = 'w-[clamp(6.53rem,14.4vw,8.55rem)]',
  enableRewind = false,
  className = '',
}) => {
  const isRail = layout === 'rail';
  const railRef = useRef(null);
  const rewindTimeoutRef = useRef(null);
  const rewindLockedRef = useRef(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(Boolean(mediaQuery.matches));
    sync();
    mediaQuery.addEventListener?.('change', sync);
    return () => mediaQuery.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    return () => {
      if (rewindTimeoutRef.current) {
        clearTimeout(rewindTimeoutRef.current);
      }
    };
  }, []);

  const maybeRewind = () => {
    if (!isRail || !enableRewind || isPointerDown) return;
    if (rewindLockedRef.current) return;
    const rail = railRef.current;
    if (!rail) return;
    if (rail.scrollWidth <= rail.clientWidth + 1) return;

    const threshold = 32;
    const distanceToEnd = rail.scrollWidth - rail.clientWidth - rail.scrollLeft;
    if (distanceToEnd > threshold) return;

    rewindLockedRef.current = true;
    rail.scrollTo({
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    rewindTimeoutRef.current = setTimeout(() => {
      rewindLockedRef.current = false;
    }, 1200);
  };

  return (
    <div className={`space-y-1.5 ${isRail ? 'flex flex-col' : ''} ${className}`}>
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
          <div className={`relative ${railPaddingClassName}`}>
            <div
              ref={railRef}
              className={`pb-1 overflow-x-auto overflow-y-hidden ${
                hideScrollbar ? 'no-scrollbar' : 'custom-scrollbar'
              }`}
              onScroll={maybeRewind}
              onPointerDown={() => setIsPointerDown(true)}
              onPointerUp={() => setIsPointerDown(false)}
              onPointerCancel={() => setIsPointerDown(false)}
            >
              <div className="flex gap-1.5 min-w-max">
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
            {showEdgeFade && (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-stone-950/85 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-stone-950/85 to-transparent" />
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
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
