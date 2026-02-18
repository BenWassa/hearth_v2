import React, { useEffect, useMemo, useState } from 'react';
import { getBackdropSrc, getPosterSrc } from '../../../utils/poster.js';

const getItemKey = (item, index) =>
  item?.id || item?.mediaId || item?.providerId || `${item?.title || 'item'}-${index}`;

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
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent" />

      {currentLogo && !logoFailed && (
        <div className="absolute bottom-5 left-5">
          <img
            src={currentLogo}
            alt={`${currentItem?.title || 'Title'} logo`}
            className="max-h-16 sm:max-h-20 max-w-[55vw] sm:max-w-[38vw] object-contain object-left drop-shadow-[0_6px_18px_rgba(0,0,0,0.8)]"
            onError={() => setLogoFailed(true)}
            loading="eager"
          />
        </div>
      )}

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
        {safeItems.map((item, index) => (
          <div
            key={`${getItemKey(item, index)}-dot`}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-4 bg-amber-500' : 'w-1.5 bg-stone-500/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
