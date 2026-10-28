import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getBackdropSrc, getPosterSrc } from '../../../utils/poster.js';

const MIN_SWIPE_DISTANCE = 40;
const GESTURE_LOCK_DISTANCE = 8;
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
  // Retain revealed sources so outgoing slides keep their art during transitions.
  const [revealedBackdrops, setRevealedBackdrops] = useState(() => new Set());
  useEffect(() => {
    setRevealedBackdrops((previous) => {
      const sources = safeItems
        .filter((_, index) => Math.abs(index - currentIndex) <= 1)
        .map((item) => getBackdropSrc(item) || getPosterSrc(item))
        .filter(Boolean);
      if (sources.every((src) => previous.has(src))) return previous;
      return new Set([...previous, ...sources]);
    });
  }, [safeItems, currentIndex]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const [logoFailed, setLogoFailed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const gestureAxisRef = useRef(null);
  const suppressNextClickRef = useRef(false);
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

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [safeItems.length]);

  useEffect(() => {
    setLogoFailed(false);
  }, [currentIndex]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.targetTouches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    gestureAxisRef.current = null;
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) {
        return;
      }
      const touch = e.targetTouches[0];
      const delta = touch.clientX - touchStartXRef.current;
      const verticalDelta = touch.clientY - touchStartYRef.current;
      const absDelta = Math.abs(delta);
      const absVerticalDelta = Math.abs(verticalDelta);

      if (gestureAxisRef.current === null) {
        if (
          absDelta < GESTURE_LOCK_DISTANCE &&
          absVerticalDelta < GESTURE_LOCK_DISTANCE
        ) {
          return;
        }
        gestureAxisRef.current =
          absDelta > absVerticalDelta * 1.2 ? 'horizontal' : 'vertical';
      }

      if (gestureAxisRef.current !== 'horizontal') return;

      setIsDragging(true);
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
      const touch = e.changedTouches[0];
      const delta = touch.clientX - touchStartXRef.current;
      const wasHorizontalSwipe = gestureAxisRef.current === 'horizontal';
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      gestureAxisRef.current = null;
      setIsDragging(false);
      setDragOffset(0);

      if (wasHorizontalSwipe && Math.abs(delta) >= GESTURE_LOCK_DISTANCE) {
        suppressNextClickRef.current = true;
      }

      if (wasHorizontalSwipe && Math.abs(delta) >= MIN_SWIPE_DISTANCE) {
        if (delta < 0 && currentIndex < safeItems.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else if (delta > 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    },
    [currentIndex, safeItems.length],
  );

  const handleTouchCancel = useCallback(() => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    gestureAxisRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  const handleClick = useCallback(() => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    onOpenDetails?.(safeItems[currentIndex]);
  }, [currentIndex, safeItems, onOpenDetails]);

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
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      role="group"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setCurrentIndex((prev) => Math.max(prev - 1, 0));
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setCurrentIndex((prev) => Math.min(prev + 1, safeItems.length - 1));
        }
      }}
      aria-label="Featured titles"
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
              transition:
                isDragging || prefersReducedMotion
                  ? 'none'
                  : 'transform 350ms cubic-bezier(0.25, 1, 0.5, 1)',
              willChange: 'transform',
            }}
          >
            {backdrop &&
            (Math.abs(offset) <= 1 || revealedBackdrops.has(backdrop)) ? (
              <img
                src={backdrop}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
                draggable={false}
                loading="eager"
                decoding="async"
                {...{ fetchpriority: index === 0 ? 'high' : 'auto' }}
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
        <div className="flex items-center gap-2 text-label font-semibold uppercase tracking-widest text-stone-300/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {currentItem?.type === 'movie' ? 'Film' : 'Series'}
          {currentItem?.year && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-stone-400/60" />
              <span>{currentItem.year}</span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/60"
        onClick={handleClick}
        aria-label={`Open details for ${
          currentItem?.title || 'featured title'
        }`}
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
        {safeItems.map((item, index) => (
          <button
            type="button"
            key={`${getItemKey(item, index)}-dot`}
            aria-label={`Show slide ${index + 1} of ${safeItems.length}`}
            aria-current={index === currentIndex ? 'true' : undefined}
            className="min-h-11 min-w-11 flex items-center justify-center pointer-events-auto rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            onClick={() => setCurrentIndex(index)}
          >
            <span
              className={`h-1 rounded-full ${
                index === currentIndex
                  ? 'w-4 bg-amber-500'
                  : 'w-1.5 bg-stone-400/50'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(HeroCarousel);
