import React, { useState } from 'react';

const WorldCover = ({ world, onOpen }) => {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      data-world-id={world.id}
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        onOpen(event);
      }}
      className={`world-cover world-cover-${world.motif} relative min-h-[112px] overflow-hidden rounded-2xl border border-stone-700 text-left p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`}
    >
      {world.cover && !failed && (
        <img
          src={world.cover}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <span className="relative block font-serif text-xl text-stone-100">
        {world.name}
      </span>
      <span className="relative mt-2 block text-sm text-stone-300">
        {world.sagas.length
          ? `${world.sagas.length} ${
              world.sagas.length === 1 ? 'saga' : 'sagas'
            }`
          : world.ownedTotal
          ? `${world.ownedTotal} ${world.ownedTotal === 1 ? 'film' : 'films'}`
          : world.shortCount
          ? `${world.shortCount} shorts & specials`
          : `${world.showCount || 0} TV series`}
      </span>
    </button>
  );
};

export default WorldCover;
