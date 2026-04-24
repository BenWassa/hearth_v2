import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getBackdropSrc, getPosterSrc } from '../../../utils/poster.js';

const MIN_SWIPE_DISTANCE = 40;
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const touchStartXRef = useRef(null);
  const autoAdvanceRef = useRef(null);
  const containerRef = useRef(null);

  // Measure container width so pixel-perfect translation works on all screen sizes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    if (autoAdvanceRef.current) window.clearInterval(autoAdvanceRef.current);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (touchStartXRef.current === null) return;
      const delta = e.targetTouches[0].clientX - touchStartXRef.current;
      const isAtStart = currentIndex === 0;
      const isAtEnd = currentIndex === safeItems.length - 1;
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
      resetAutoAdvance();
    },
    [currentIndex, safeItems.length, resetAutoAdvance],
  );

  const handleClick = useCallback(() => {
    if (Math.abs(dragOffset) > 5) return;
    onOpenDetails?.(safeItems[currentIndex]);
  }, [dragOffset, currentIndex, safeItems, onOpenDetails]);

  if (!safeItems.length) return null;

  const currentItem = safeItems[currentIndex];
  const currentLogo = String(
    currentItem?.logo ||
      currentItem?.logoUrl ||
      currentItem?.media?.logo ||
      currentItem?.media?.logoUrl ||
      '',
  ).trim();

  // Each slide is absolutely positioned and translated by its offset from currentIndex.
  // Use measured pixel width for precise drag tracking; fall back to % on first paint.

  return (
    <div
      ref={containerRef}
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
      {/* Slides — each absolutely fills the container, translated by index */}
      {safeItems.map((item, index) => {
        const backdrop = getBackdropSrc(item) || getPosterSrc(item);
        // Offset from current: slide left of current is -1, right is +1, etc.
        const offset = index - currentIndex;
        // During drag, apply the live dragOffset on top of the slot position
        const translateX =
          containerWidth > 0
            ? `${offset * containerWidth + dragOffset}px`
            : `calc(${offset * 100}% + ${dragOffset}px)`;
        return (
          <div
            key={getItemKey(item, index)}
            className="absolute inset-0 overflow-hidden"
            style={{
              transform: `translateX(${translateX})`,
              transition: isDragging
                ? 'none'
                : 'transform 350ms cubic-bezier(0.25, 1, 0.5, 1)',
              willChange: 'transform',
            }}
          >
            {backdrop ? (
              <img
                src={backdrop}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
                draggable={false}
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 bg-stone-800" />
            )}
          </div>
        );
      })}

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
