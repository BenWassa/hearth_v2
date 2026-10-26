import React, { useState } from 'react';

// Portrait crop and viewport height can hide a title baked into the artwork.
// Keep one consistently readable, semantic live heading at the bottom; avoid
// adding separate PNG/SVG wordmarks on top of already-branded images.
const WorldHero = ({ world, headingRef }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const sagaCount = world.sagas?.length || 0;
  const filmCount = world.ownedTotal || 0;

  return (
    <section
      aria-label={`${world.name} artwork and overview`}
      data-world-hero={world.id}
      className="world-hero relative -mx-4 mb-3 flex flex-col justify-end overflow-hidden bg-stone-900 px-5 pb-6"
    >
      {world.hero && !imageFailed && (
        <img
          src={world.hero}
          alt=""
          decoding="async"
          fetchPriority="high"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="world-hero-shade absolute inset-0" aria-hidden="true" />
      <div className="relative z-10">
        <h1
          id="collections-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mb-2 font-serif text-3xl font-semibold leading-tight text-stone-50"
        >
          {world.name}
        </h1>
        <p className="text-sm leading-snug text-stone-200">
          {sagaCount} {sagaCount === 1 ? 'saga' : 'sagas'} · {filmCount}{' '}
          {filmCount === 1 ? 'feature film' : 'feature films'} on your shelf ·{' '}
          {world.unwatched || 0} unwatched
        </p>
      </div>
    </section>
  );
};

export default WorldHero;
