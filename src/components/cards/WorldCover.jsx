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

const cardSrc = (world) => world.card ?? `/assets/worlds/${world.id}/card.webp`;

// Tonight World tile: a designer banner card (card.webp) with the World's logo
// baked into it, so nothing is overlaid. The button sits on warm stone, so
// navigation never waits on an image; if the image fails, the serif World name
// takes its place. The accessible name is the World name (the image is
// decorative).
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
        <img
          src={cardSrc(world)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={handleError}
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
        />
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
