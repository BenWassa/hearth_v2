import React, { useState } from 'react';

// The art runs edge to edge from the very top of the screen (behind the status
// bar and the floating back controls) at its natural 16:9, so it is not zoomed
// into a strip, then fades into Shell Black. The artwork may carry its own
// title, so the live heading sits on the faded bottom rather than over it. If
// the image fails, the heading and counts remain.
const WorldHero = ({ world, headingRef }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const sagaCount = world.sagas?.length || 0;
  const filmCount = world.ownedTotal || 0;

  return (
    <section
      aria-label={`${world.name} artwork and overview`}
      data-world-hero={world.id}
      style={{ '--world-accent': world.accent }}
      className="world-hero -mx-4"
    >
      <div className="world-hero-art relative w-full overflow-hidden bg-stone-900">
        {world.cover && !imageFailed && (
          <img
            src={world.cover}
            alt=""
            decoding="async"
            // React 18 warns on camelCase fetchPriority; the attribute is lowercase.
            // eslint-disable-next-line react/no-unknown-property
            fetchpriority="high"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="world-hero-scrim absolute inset-0" aria-hidden="true" />
      </div>
      <div className="world-hero-body relative z-10 mx-4 -mt-14">
        <span
          aria-hidden="true"
          className="world-hero-rule mb-2 block h-[3px] w-10 rounded-full"
        />
        <h1
          id="collections-heading"
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-3xl leading-tight text-stone-100"
        >
          {world.name}
        </h1>
        <p className="sr-only">
          {sagaCount} {sagaCount === 1 ? 'saga' : 'sagas'} · {filmCount}{' '}
          {filmCount === 1 ? 'feature film' : 'feature films'} on your shelf ·{' '}
          {world.unwatched || 0} unwatched
        </p>
      </div>
    </section>
  );
};

export default WorldHero;
