import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import ItemCard from '../../../components/cards/ItemCard.js';

// How many cards to clone at the end to create the seamless loop illusion
const CLONE_COUNT = 6;

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
  const teleportFrameRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(Boolean(mq.matches));
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // For looping rails we clone the first N cards at the end.
  // When the user scrolls into the clone zone we silently jump back
  // to the equivalent real position — no visible snap, seamless loop.
  const loopEnabled = enableRewind && !prefersReducedMotion && suggestions.length > 2;
  const clones = loopEnabled ? suggestions.slice(0, CLONE_COUNT) : [];

  const updateEdgeState = () => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 2);
  };

  const handleScroll = () => {
    updateEdgeState();
    if (!loopEnabled) return;
    if (isPointerDownRef.current) return; // wait until finger lifts

    const rail = railRef.current;
    if (!rail) return;

    // The real content ends at scrollWidth - (clones * cardWidth).
    // We measure one card's rendered width from the first child.
    const firstCard = rail.querySelector('[data-rail-card]');
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth + 10; // +gap (gap-2.5 = 10px)
    const realContentWidth = cardWidth * suggestions.length;

    if (rail.scrollLeft >= realContentWidth) {
      // Cancel any pending frame so we don't double-fire
      if (teleportFrameRef.current) cancelAnimationFrame(teleportFrameRef.current);
      teleportFrameRef.current = requestAnimationFrame(() => {
        const overshoot = rail.scrollLeft - realContentWidth;
        // Disable scroll-snap temporarily so the instant jump doesn't animate
        rail.style.scrollSnapType = 'none';
        rail.scrollLeft = overshoot;
        // Re-enable on next frame
        requestAnimationFrame(() => {
          rail.style.scrollSnapType = '';
        });
      });
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    // Check loop condition once finger lifts (in case scroll settled in clone zone)
    handleScroll();
  };

  useEffect(() => {
    updateEdgeState();
  }, [suggestions.length]);

  useEffect(() => {
    return () => {
      if (teleportFrameRef.current) cancelAnimationFrame(teleportFrameRef.current);
    };
  }, []);

  return (
    <div className={`space-y-2 ${isRail ? 'flex flex-col' : ''} ${className}`}>
      <div className="flex items-center justify-between px-1">
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
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              onScroll={handleScroll}
              onPointerDown={() => { isPointerDownRef.current = true; }}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { isPointerDownRef.current = false; }}
            >
              <div className="flex gap-2.5 min-w-max">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    data-rail-card
                    className={`${cardWidthClassName} shrink-0`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ItemCard
                      item={item}
                      onToggle={() => onToggleStatus(item.id, item.status)}
                      minimal={false}
                      onOpenDetails={onOpenDetails}
                    />
                  </div>
                ))}
                {/* Clone zone — invisible to the user, triggers seamless teleport */}
                {clones.map((item, i) => (
                  <div
                    key={`clone-${item.id}-${i}`}
                    aria-hidden="true"
                    className={`${cardWidthClassName} shrink-0`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
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
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-stone-950/90 to-transparent transition-opacity duration-300"
                  style={{ opacity: atStart ? 0 : 1 }}
                />
                {/* Right fade always visible on looping rails — there's always more content */}
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-stone-950/90 to-transparent"
                />
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
