import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Moon } from 'lucide-react';
import ItemCard from '../../../components/cards/ItemCard.jsx';

const SuggestionSection = ({
  title,
  suggestions,
  emptyLabel,
  onOpenDetails,
  onToggleStatus,
  layout = 'grid',
  hideScrollbar = false,
  showEdgeFade = false,
  railPaddingClassName = '',
  className = '',
  Icon,
  size = 'md',
}) => {
  const isRail = layout === 'rail';
  const railRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Map sizes to specific width clamps
  const sizeStyles = {
    sm: 'w-[clamp(5.5rem,13vw,7.5rem)]', // Tighter, smaller
    md: 'w-[clamp(6.53rem,14.4vw,8.55rem)]', // Standard
    lg: 'w-[clamp(8.5rem,18vw,12rem)]', // Wider, feature size
  };
  const activeWidthClass = sizeStyles[size] || sizeStyles.md;

  const itemsWithPickCard = suggestions;
  const toggleActions = useMemo(
    () =>
      new Map(
        suggestions.map((item) => [
          item.id,
          () => onToggleStatus(item.id, item.status),
        ]),
      ),
    [suggestions, onToggleStatus],
  );

  const updateEdgeState = () => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2);
  };

  const handleScroll = () => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateEdgeState();
    });
  };

  useEffect(() => {
    updateEdgeState();
  }, [suggestions.length]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

  return (
    <div className={`space-y-2 ${isRail ? 'flex flex-col' : ''} ${className}`}>
      <div className="flex items-center gap-1.5 px-1">
        {Icon && <Icon className="w-4 h-4 text-stone-400" />}
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">
          {title}
        </h3>
      </div>
      {suggestions.length > 0 ? (
        isRail ? (
          <div className={`relative ${railPaddingClassName}`}>
            <div
              ref={railRef}
              tabIndex={0}
              role="region"
              aria-label={title}
              className={`pb-1 overflow-x-auto overflow-y-hidden ${
                hideScrollbar ? 'no-scrollbar' : 'custom-scrollbar'
              }`}
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
              }}
              onScroll={handleScroll}
            >
              <div className="flex gap-2.5 min-w-max">
                {itemsWithPickCard.map((item) => (
                  <div
                    key={item.id}
                    className={`${activeWidthClass} shrink-0`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ItemCard
                      item={item}
                      onToggle={toggleActions.get(item.id)}
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
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-stone-950/90 to-transparent"
                  style={{ opacity: atEnd ? 0 : 1 }}
                />
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {itemsWithPickCard.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={toggleActions.get(item.id)}
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

export default React.memo(SuggestionSection);
