import React from 'react';

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

// Text-only tile: identical type, size and placement for every World. Only the
// accent (rule and faint wash) changes, supplied by the World's own colour.
const WorldCover = ({ world, onOpen, neutral = false, className = '' }) => (
  <button
    type="button"
    data-world-id={neutral ? undefined : world.id}
    data-all-collections={neutral ? '' : undefined}
    style={{ '--world-accent': world.accent }}
    onClick={(event) => {
      event.currentTarget.focus({ preventScroll: true });
      onOpen(event);
    }}
    className={`world-tile ${
      neutral ? 'world-tile-neutral' : ''
    } flex w-full min-w-0 items-center rounded-xl py-3 pl-4 pr-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${className}`}
  >
    <span className="world-tile-name font-serif text-stone-100">
      {world.name}
    </span>
    <span className="sr-only">{describeWorld(world)}</span>
  </button>
);

export default WorldCover;
