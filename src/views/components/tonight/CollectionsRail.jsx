import React, { useState } from 'react';
import WorldCover from '../../../components/cards/WorldCover.jsx';
import { buildWorlds } from '../../../config/collectionWorlds.js';
import { rankSagas } from '../../../domain/media/collectionActivity.js';

const CollectionsRail = ({
  isLoading = false,
  collections = [],
  items = [],
  onOpenWorld,
  onBrowse,
  counts,
}) => {
  const [clock] = useState(Date.now);
  const worlds = buildWorlds(
    rankSagas(collections, { now: clock, counts }),
    items,
  );
  const [order] = useState(() => worlds.map((world) => world.id));
  worlds.sort(
    (a, b) =>
      (order.includes(a.id) ? order.indexOf(a.id) : Infinity) -
        (order.includes(b.id) ? order.indexOf(b.id) : Infinity) ||
      a.name.localeCompare(b.name),
  );
  return (
    <section aria-label="Collections" className="space-y-3 px-1">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h2 className="font-serif text-xl text-stone-100">Collections</h2>
        <button
          type="button"
          onClick={onBrowse}
          disabled={isLoading}
          className="min-h-[44px] py-2 text-sm text-amber-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {isLoading
            ? 'Loading collections…'
            : `Browse all ${collections.length} ${
                collections.length === 1 ? 'saga' : 'sagas'
              }`}
          <span className="ml-1" aria-hidden="true">
            →
          </span>
        </button>
      </div>
      {isLoading && (
        <p role="status" className="py-3 text-sm text-stone-400">
          Loading your household collections…
        </p>
      )}
      {!isLoading && worlds.length > 0 && (
        <div aria-label="Worlds" className="grid grid-cols-2 gap-3">
          {worlds.map((world) => (
            <WorldCover
              key={world.id}
              world={world}
              onOpen={(event) => onOpenWorld?.(world.id, event.currentTarget)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
export default React.memo(CollectionsRail);
