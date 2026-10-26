import React, { useState } from 'react';

const WorldHero = ({ world, headingRef }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [signatureFailed, setSignatureFailed] = useState(false);
  const [signatureReady, setSignatureReady] = useState(false);
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
        <div className="relative flex h-16 items-center">
          {world.wordmark && !signatureFailed && (
            <img
              src={world.wordmark}
              alt=""
              decoding="async"
              onLoad={() => setSignatureReady(true)}
              onError={() => {
                setSignatureFailed(true);
                setSignatureReady(false);
              }}
              className="absolute inset-0 h-full w-[80%] object-contain object-left"
            />
          )}
          <h1
            id="collections-heading"
            ref={headingRef}
            tabIndex={-1}
            className={
              signatureReady
                ? 'sr-only'
                : 'font-serif text-3xl font-semibold leading-tight text-stone-50'
            }
          >
            {world.name}
          </h1>
        </div>
        <p className="mt-2 text-sm leading-snug text-stone-200">
          {sagaCount} {sagaCount === 1 ? 'saga' : 'sagas'} · {filmCount}{' '}
          {filmCount === 1 ? 'feature film' : 'feature films'} on your shelf ·{' '}
          {world.unwatched || 0} unwatched
        </p>
      </div>
    </section>
  );
};

export default WorldHero;
