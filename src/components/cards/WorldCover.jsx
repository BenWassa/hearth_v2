import React, { useState } from 'react';

const describeWorld = (world) => {
  if (world.sagas.length) {
    return `${world.sagas.length} ${world.sagas.length === 1 ? 'saga' : 'sagas'}`;
  }
  if (world.ownedTotal) {
    return `${world.ownedTotal} ${world.ownedTotal === 1 ? 'film' : 'films'}`;
  }
  if (world.shortCount) return `${world.shortCount} shorts & specials`;
  return `${world.showCount || 0} TV series`;
};

const WorldCover = ({ world, onOpen }) => {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      data-world-id={world.id}
      aria-label={`Open ${world.name} World`}
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        onOpen(event);
      }}
      className={`world-cover ${world.cover && !failed ? 'world-cover-art' : `world-cover-${world.motif}`} relative block w-full min-w-0 aspect-video overflow-hidden rounded-xl border border-stone-700/70 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`}
    >
      {world.cover && !failed && (
        <img
          src={world.cover}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <span aria-hidden="true" className="world-cover-shade absolute inset-0" />
      <span className="world-cover-title absolute inset-x-2 bottom-2 z-10 block font-serif font-semibold leading-tight text-stone-50">
        {world.name}
      </span>
      <span className="sr-only">{describeWorld(world)}</span>
    </button>
  );
};

export default WorldCover;
