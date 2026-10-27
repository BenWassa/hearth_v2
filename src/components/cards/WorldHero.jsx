import React, { useState } from 'react';

// The art runs edge to edge from the very top of the screen (behind the status
// bar and the floating back controls) at its natural 16:9, so it is not zoomed
// into a strip, then fades into Shell Black. The artwork carries the World name
// itself, so the live h1 is screen-reader text (it keeps focus and names the
// dialog). If the image is missing or fails, the h1 shows on the faded bottom so
// the page never has no title.
const WorldHero = ({ world, headingRef }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const sagaCount = world.sagas?.length || 0;
  const filmCount = world.ownedTotal || 0;
  const showTitle = !world.cover || imageFailed;

  return (
    <section
      aria-label={`${world.name} artwork and overview`}
      data-world-hero={world.id}
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
      <div
        className={`world-hero-body relative z-10 ${
          showTitle ? 'mx-4 -mt-14' : ''
        }`}
      >
        <h1
          id="collections-heading"
          ref={headingRef}
          tabIndex={-1}
          className={
            showTitle
              ? 'font-serif text-3xl leading-tight text-stone-100'
              : 'sr-only'
          }
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
