import React, { useState } from 'react';
import WorldCover from '../../../components/cards/WorldCover.jsx';
import { buildWorlds } from '../../../config/collectionWorlds.js';
import { rankSagas } from '../../../domain/media/collectionActivity.js';

// Compact, finite two-column grid of every represented World: text-only tiles,
// no artwork requests. Sagas outside any World are reached from the Collections
// row further down Tonight.
const WorldsGrid = ({ collections = [], items = [], onOpenWorld, counts }) => {
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
  if (!worlds.length) return null;
  return (
    <section aria-label="Worlds" className="space-y-3 px-1">
      <h2 className="font-serif text-xl text-stone-100">Worlds</h2>
      <div className="grid grid-cols-2 gap-3">
        {worlds.map((world) => (
          <WorldCover
            key={world.id}
            world={world}
            onOpen={(event) => onOpenWorld?.(world.id, event.currentTarget)}
          />
        ))}
      </div>
    </section>
  );
};
export default React.memo(WorldsGrid);
