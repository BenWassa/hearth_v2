import React from 'react';

const CuratedPackCard = ({ pack, onOpen }) => (
  <button
    type="button"
    data-curated-pack={pack.id}
    onClick={(event) => onOpen(pack, event.currentTarget)}
    className="flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-lg border border-stone-700 bg-stone-900 p-3 text-left hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
  >
    <span className="text-label font-bold uppercase tracking-widest text-stone-400">
      Curated
    </span>
    <span className="font-serif text-base leading-tight text-stone-100 [overflow-wrap:normal] min-[360px]:text-lg min-[400px]:text-xl">
      {pack.title}
    </span>
    <span className="text-xs text-stone-400">Explore the collection →</span>
  </button>
);

export default CuratedPackCard;
