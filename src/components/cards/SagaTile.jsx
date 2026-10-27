import React, { useState } from 'react';
import LazyMediaImage from '../media/LazyMediaImage.jsx';
import { getBackdropSrc } from '../../utils/poster.js';
import { sagaName } from '../../domain/media/collectionActivity.js';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

const nameClass =
  'line-clamp-2 break-words font-serif text-base leading-snug text-stone-100';

// A 16:9 index tile for a saga without its own shelf: backdrop art with a
// neutral bottom scrim and the name set in serif. With no art, or if it fails,
// the same name sits on warm stone. The saga name is the accessible name.
const SagaTile = ({ saga, onOpen, className = '' }) => {
  const [artFailed, setArtFailed] = useState(false);
  const name = sagaName(saga.title);
  const backdrop = getBackdropSrc(saga);
  const hasArt = Boolean(backdrop) && !artFailed;

  return (
    <button
      type="button"
      data-saga-tile={saga.id}
      aria-label={name}
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        onOpen?.(saga);
      }}
      className={`relative block aspect-video min-h-[44px] w-full overflow-hidden rounded-lg bg-stone-800 text-left ${focusRing} ${className}`.trim()}
    >
      {hasArt && (
        <LazyMediaImage
          src={backdrop.replace('/w780/', '/w300/')}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setArtFailed(true)}
        />
      )}
      {hasArt && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/55 to-stone-950/10"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 p-2.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
      >
        <span className={nameClass}>{name}</span>
      </span>
    </button>
  );
};

export default SagaTile;
