import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import ItemCard from '../../../components/cards/ItemCard.jsx';

// How many cards to clone at the end to create the seamless loop illusion
const CLONE_COUNT = 6;

const PickActionCard = ({ title, pool, onOpenDetails, prefersReducedMotion }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    // Prevent double clicks while animating
    if (!pool || pool.length === 0 || !onOpenDetails || isAnimating) return;

    setIsAnimating(true);

    // Skip the delay entirely if the user has requested reduced motion at the OS level
    const delay = prefersReducedMotion ? 0 : 600;

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      onOpenDetails(pool[randomIndex]);
      setIsAnimating(false);
    }, delay);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full aspect-[2/3] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500 relative overflow-hidden ${
        isAnimating
          ? 'border-amber-500/80 bg-stone-800/80 scale-[0.97] shadow-inner shadow-black'
          : 'border-stone-800/80 bg-stone-900/20 hover:bg-stone-800/60 hover:border-amber-500/50'
      }`}
      aria-label={`Pick a random title from ${title}`}
    >
      {/* Subtle sweeping glow effect while animating */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/10 to-amber-500/0 transition-opacity duration-500 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`w-10 h-10 rounded-full bg-stone-900 shadow-inner shadow-black/50 flex items-center justify-center transition-all duration-300 relative z-10 ${
          isAnimating
            ? 'scale-110 bg-amber-500/30'
            : 'group-hover:scale-110 group-hover:bg-amber-500/20'
        }`}
      >
        <Sparkles className={`w-4 h-4 transition-all duration-300 ${
          isAnimating
            ? 'text-amber-300 animate-spin scale-125'
            : 'text-stone-500 group-hover:text-amber-400'
        }`} />
      </div>

      <span
        className={`text-[10px] font-bold uppercase tracking-widest px-2 text-center leading-tight transition-all duration-300 relative z-10 ${
          isAnimating
            ? 'text-amber-400 animate-pulse'
            : 'text-stone-500 group-hover:text-amber-400'
        }`}
      >
        {isAnimating ? 'Shuffling...' : 'Pick for us'}
      </span>
    </button>
  );
};

const SuggestionSection = ({
  title,
  pool,
  suggestions,
  emptyLabel,
  onOpenDetails,
  onToggleStatus,
  layout = 'grid',
  hideDecide = false,
  hideScrollbar = false,
  showEdgeFade = false,
  railPaddingClassName = '',
  enableRewind = false,
  className = '',
  Icon,
  size = 'md',
}) => {
  const isRail = layout === 'rail';
  const railRef = useRef(null);
  const teleportFrameRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Map sizes to specific width clamps
  const sizeStyles = {
    sm: 'w-[clamp(5.5rem,13vw,7.5rem)]', // Tighter, smaller
    md: 'w-[clamp(6.53rem,14.4vw,8.55rem)]', // Standard
    lg: 'w-[clamp(8.5rem,18vw,12rem)]', // Wider, feature size
  };
  const activeWidthClass = sizeStyles[size] || sizeStyles.md;

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(Boolean(mq.matches));
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // Construct the array of items to render, injecting the action card if enabled
  const showPickCard = !hideDecide && pool.length > 0 && onOpenDetails;
  const itemsWithPickCard = showPickCard
    ? [{ isPickAction: true, id: `pick-${title}` }, ...suggestions]
    : suggestions;

  // For looping rails we clone the first N cards at the end.
  // When the user scrolls into the clone zone we silently jump back
  // to the equivalent real position — no visible snap, seamless loop.
  const loopEnabled =
    enableRewind && !prefersReducedMotion && itemsWithPickCard.length > 2;
  const clones = loopEnabled ? itemsWithPickCard.slice(0, CLONE_COUNT) : [];

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
    const realContentWidth = cardWidth * itemsWithPickCard.length;

    if (rail.scrollLeft >= realContentWidth) {
      // Cancel any pending frame so we don't double-fire
      if (teleportFrameRef.current)
        cancelAnimationFrame(teleportFrameRef.current);
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
      if (teleportFrameRef.current)
        cancelAnimationFrame(teleportFrameRef.current);
    };
  }, []);

  return (
    <div className={`space-y-2 ${isRail ? 'flex flex-col' : ''} ${className}`}>
      <div className="flex items-center gap-1.5 px-1">
        {Icon && <Icon className="w-4 h-4 text-stone-500" />}
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
          {title}
        </h3>
      </div>
      {suggestions.length > 0 ? (
        isRail ? (
          <div className={`relative ${railPaddingClassName}`}>
            <div
              ref={railRef}
              className={`pb-1 overflow-x-auto overflow-y-hidden ${
                hideScrollbar ? 'no-scrollbar' : 'custom-scrollbar'
              }`}
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
              }}
              onScroll={handleScroll}
              onPointerDown={() => {
                isPointerDownRef.current = true;
              }}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                isPointerDownRef.current = false;
              }}
            >
              <div className="flex gap-2.5 min-w-max">
                {itemsWithPickCard.map((item, index) => (
                  <div
                    key={item.id}
                    data-rail-card={index === 0 ? 'true' : undefined}
                    className={`${activeWidthClass} shrink-0`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {item.isPickAction ? (
                      <PickActionCard
                        title={title}
                        pool={pool}
                        onOpenDetails={onOpenDetails}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ) : (
                      <ItemCard
                        item={item}
                        onToggle={() => onToggleStatus(item.id, item.status)}
                        minimal={false}
                        onOpenDetails={onOpenDetails}
                      />
                    )}
                  </div>
                ))}
                {/* Clone zone — invisible to the user, triggers seamless teleport */}
                {clones.map((item, i) => (
                  <div
                    key={`clone-${item.id}-${i}`}
                    aria-hidden="true"
                    className={`${activeWidthClass} shrink-0`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {item.isPickAction ? (
                      <PickActionCard
                        title={title}
                        pool={pool}
                        onOpenDetails={onOpenDetails}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ) : (
                      <ItemCard
                        item={item}
                        onToggle={() => onToggleStatus(item.id, item.status)}
                        minimal={false}
                        onOpenDetails={onOpenDetails}
                      />
                    )}
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
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-stone-950/90 to-transparent" />
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {itemsWithPickCard.map((item) => (
              <React.Fragment key={item.id}>
                {item.isPickAction ? (
                  <PickActionCard
                    title={title}
                    pool={pool}
                    onOpenDetails={onOpenDetails}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ) : (
                  <ItemCard
                    item={item}
                    onToggle={() => onToggleStatus(item.id, item.status)}
                    minimal={false}
                    onOpenDetails={onOpenDetails}
                  />
                )}
              </React.Fragment>
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
