import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBackdropSrc, getPosterSrc } from '../../../utils/poster.js';

const MIN_SWIPE_DISTANCE = 40;
// Resistance factor when dragging past the first/last slide
const EDGE_RESISTANCE = 0.25;

const getItemKey = (item, index) =>
  item?.id ||
  item?.mediaId ||
  item?.providerId ||
  `${item?.title || 'item'}-${index}`;

const HeroCarousel = ({ items = [], onOpenDetails }) => {
  const safeItems = useMemo(
    () => (Array.isArray(items) ? items.filter(Boolean) : []),
    [items],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);
  // dragOffset is the live pixel delta while the finger is down (0 when idle)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef(null);
  const autoAdvanceRef = useRef(null);

  const resetAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) window.clearInterval(autoAdvanceRef.current);
    if (safeItems.length <= 1) return;
    autoAdvanceRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeItems.length);
    }, 6000);
  }, [safeItems.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [safeItems.length]);

  useEffect(() => {
    setLogoFailed(false);
  }, [currentIndex]);

  useEffect(() => {
    resetAutoAdvance();
    return () => window.clearInterval(autoAdvanceRef.current);
  }, [resetAutoAdvance]);

  const handleTouchStart = useCallback((e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
    // Pause auto-advance while user is touching
    if (autoAdvanceRef.current) window.clearInterval(autoAdvanceRef.current);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (touchStartXRef.current === null) return;
      const delta = e.targetTouches[0].clientX - touchStartXRef.current;
      const isAtStart = currentIndex === 0;
      const isAtEnd = currentIndex === safeItems.length - 1;
      // Apply rubber-band resistance at the edges
      let clamped = delta;
      if ((isAtStart && delta > 0) || (isAtEnd && delta < 0)) {
        clamped = delta * EDGE_RESISTANCE;
      }
      setDragOffset(clamped);
    },
    [currentIndex, safeItems.length],
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartXRef.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;
      setIsDragging(false);
      setDragOffset(0);

      if (Math.abs(delta) >= MIN_SWIPE_DISTANCE) {
        if (delta < 0 && currentIndex < safeItems.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else if (delta > 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
      // Restart auto-advance after interaction
      resetAutoAdvance();
    },
    [currentIndex, safeItems.length, resetAutoAdvance],
  );

  const handleClick = useCallback(
    (e) => {
      // Suppress click if the touch was actually a swipe
      if (Math.abs(dragOffset) > 5) return;
      onOpenDetails?.(safeItems[currentIndex]);
    },
    [dragOffset, currentIndex, safeItems, onOpenDetails],
  );

  if (!safeItems.length) return null;

  const currentItem = safeItems[currentIndex];
  const currentLogo = String(
    currentItem?.logo ||
      currentItem?.logoUrl ||
      currentItem?.media?.logo ||
      currentItem?.media?.logoUrl ||
      '',
  ).trim();

  // The slide strip translates by: (-currentIndex * 100%) + dragOffset px
  const stripTransform = `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`;
  const stripTransition = isDragging ? 'none' : 'transform 350ms cubic-bezier(0.25, 1, 0.5, 1)';

  return (
    <div
      className="relative w-full aspect-video bg-stone-900 overflow-hidden rounded-2xl select-none"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails?.(currentItem);
        }
        if (event.key === 'ArrowLeft') {
          setCurrentIndex((prev) => Math.max(prev - 1, 0));
        }
        if (event.key === 'ArrowRight') {
          setCurrentIndex((prev) => Math.min(prev + 1, safeItems.length - 1));
        }
      }}
      aria-label={`Open details for ${currentItem?.title || 'featured title'}`}
    >
      {/* Sliding strip — all slides laid out horizontally */}
      <div
        className="absolute inset-0 flex"
        style={{
          width: `${safeItems.length * 100}%`,
          transform: stripTransform,
          transition: stripTransition,
          willChange: 'transform',
        }}
      >
        {safeItems.map((item, index) => {
          const backdrop = getBackdropSrc(item) || getPosterSrc(item);
          return (
            <div
              key={getItemKey(item, index)}
              className="relative h-full flex-shrink-0"
              style={{
                width: `${100 / safeItems.length}%`,
                backgroundImage: backdrop ? `url(${backdrop})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          );
        })}
      </div>

      {/* Scrim: strong bottom-left gradient to stage the logo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-stone-950/80 via-stone-950/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />

      {/* Logo + metadata — bottom-left, Netflix/Apple TV convention */}
      <div className="absolute bottom-7 left-5 right-16 z-10 pointer-events-none">
        {currentLogo && !logoFailed ? (
          <img
            src={currentLogo}
            alt={`${currentItem?.title || 'Title'} logo`}
            className="max-h-14 sm:max-h-18 max-w-[52vw] sm:max-w-[36vw] object-contain object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-1.5"
            onError={() => setLogoFailed(true)}
            loading="eager"
          />
        ) : null}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-stone-300/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {currentItem?.type === 'movie' ? 'Film' : 'Series'}
          {currentItem?.year && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-stone-400/60" />
              <span>{currentItem.year}</span>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
        {safeItems.map((item, index) => (
          <div
            key={`${getItemKey(item, index)}-dot`}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-4 bg-amber-500'
                : 'w-1.5 bg-stone-500/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
