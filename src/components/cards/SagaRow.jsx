import React from 'react';
import LazyMediaImage from '../media/LazyMediaImage.jsx';
import { getBackdropSrc } from '../../utils/poster.js';
import { sagaName } from '../../domain/media/collectionActivity.js';

const SagaRow = ({ saga, onOpen, reason = false }) => (
  <button
    type="button"
    onClick={() => onOpen(saga)}
    className="flex w-full min-h-[88px] items-center gap-3 rounded-xl py-2 text-left hover:bg-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
  >
    <div className="w-24 shrink-0 aspect-video overflow-hidden rounded-lg bg-stone-800">
      {getBackdropSrc(saga) && (
        <LazyMediaImage
          src={getBackdropSrc(saga).replace('/w780/', '/w300/')}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
    <div className="min-w-0 flex-1 pr-2">
      <h3 className="font-serif text-lg leading-snug text-stone-100 break-words">
        {sagaName(saga.title)}
      </h3>
      {reason && saga.activity?.reason && (
        <p className="text-sm text-amber-300">{saga.activity.reason}</p>
      )}
      <p className="text-sm text-stone-400">
        {saga.watchedCount} of {saga.totalCount} watched on your shelf
      </p>
    </div>
  </button>
);
export default SagaRow;
