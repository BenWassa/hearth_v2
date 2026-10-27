import React, { useId, useState } from 'react';

const describeWorld = (world) => {
  if (world.sagas.length) {
    return `${world.sagas.length} ${
      world.sagas.length === 1 ? 'saga' : 'sagas'
    }`;
  }
  if (world.ownedTotal) {
    return `${world.ownedTotal} ${world.ownedTotal === 1 ? 'film' : 'films'}`;
  }
  if (world.shortCount) return `${world.shortCount} shorts & specials`;
  return `${world.showCount || 0} TV series`;
};

// Share of the tile width each wordmark occupies (the art pack's manifest
// `cover_wordmark_width_fraction`, tuned per logo aspect ratio).
const WORDMARK_WIDTH = {
  'disney-animation': 0.62,
  pixar: 0.73,
  marvel: 0.56,
  dc: 0.36,
  dreamworks: 0.88,
  'star-wars': 0.6,
  'wizarding-world': 0.82,
  'studio-ghibli': 0.74,
};

const tileSrc = (world) => world.tile ?? `/assets/worlds/${world.id}/tile.webp`;
const wordmarkSrc = (world) =>
  world.wordmark ?? `/assets/worlds/${world.id}/wordmark.svg`;

// Tonight World tile: a tonal gradient (tile.webp) with the World's wordmark
// centred on it. The button sits on warm stone, so navigation never waits on
// an image; if either image fails, the serif World name takes its place. The
// accessible name is the World name (the images are decorative).
const WorldCover = ({ world, onOpen, neutral = false, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const descriptionId = useId();
  const showArt = !neutral && !failed;
  const handleError = () => setFailed(true);
  return (
    <button
      type="button"
      data-world-id={neutral ? undefined : world.id}
      data-all-collections={neutral ? '' : undefined}
      aria-label={world.name}
      aria-describedby={descriptionId}
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        onOpen(event);
      }}
      className={`world-tile ${
        neutral ? 'world-tile-neutral' : ''
      } relative isolate flex min-h-[44px] w-full min-w-0 items-center justify-center overflow-hidden rounded-xl bg-stone-800 p-3 text-center shadow-[inset_0_0_0_1px_rgba(245,245,244,0.12)] transition-transform active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${className}`}
    >
      {showArt ? (
        <>
          <img
            src={tileSrc(world)}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={handleError}
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <img
            src={wordmarkSrc(world)}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={handleError}
            style={{
              width: `${
                Math.round((WORDMARK_WIDTH[world.id] ?? 0.5) * 1000) / 10
              }%`,
            }}
            className="pointer-events-none h-auto max-h-full object-contain"
          />
        </>
      ) : (
        <span
          aria-hidden="true"
          className="font-serif text-[1.0625rem] leading-tight text-stone-100 [overflow-wrap:anywhere] [text-wrap:balance]"
        >
          {world.name}
        </span>
      )}
      <span id={descriptionId} className="sr-only">
        {describeWorld(world)}
      </span>
    </button>
  );
};

export default WorldCover;
