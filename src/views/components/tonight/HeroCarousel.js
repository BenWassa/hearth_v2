import React, { useEffect, useMemo, useState } from 'react';
import { getBackdropSrc, getPosterSrc } from '../../../utils/poster.js';

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

  useEffect(() => {
    setCurrentIndex(0);
  }, [safeItems.length]);

  useEffect(() => {
    setLogoFailed(false);
  }, [currentIndex]);

  useEffect(() => {
    if (safeItems.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeItems.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [safeItems.length]);

  if (!safeItems.length) return null;

  const currentItem = safeItems[currentIndex];
  const currentLogo = String(
    currentItem?.logo ||
      currentItem?.logoUrl ||
      currentItem?.media?.logo ||
      currentItem?.media?.logoUrl ||
      '',
  ).trim();

  return (
    <div
      className="relative w-full aspect-video bg-stone-900 overflow-hidden cursor-pointer rounded-2xl"
      onClick={() => onOpenDetails?.(currentItem)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails?.(currentItem);
        }
      }}
      aria-label={`Open details for ${currentItem?.title || 'featured title'}`}
    >
      {safeItems.map((item, index) => {
        const backdrop = getBackdropSrc(item) || getPosterSrc(item);
        return (
          <div
            key={getItemKey(item, index)}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: backdrop ? `url(${backdrop})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        );
      })}
      {/* Scrim: strong bottom-left gradient to stage the logo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-stone-950/80 via-stone-950/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

      {/* Logo + metadata — bottom-left, Netflix/Apple TV convention */}
      <div className="absolute bottom-7 left-5 right-16 z-10">
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

      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20">
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
