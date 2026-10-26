import React, { useState } from 'react';
import { Orbit } from 'lucide-react';
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
    <section aria-label="Worlds" className="space-y-2 shrink-0">
      <div className="flex items-center gap-1.5 px-1">
        <Orbit className="w-4 h-4 text-stone-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">
          Worlds
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 px-1">
        {worlds.map((world, index) => (
          <WorldCover
            key={world.id}
            world={world}
            // An odd last tile spans both columns rather than leaving a hole.
            className={
              worlds.length % 2 === 1 && index === worlds.length - 1
                ? 'col-span-2'
                : ''
            }
            onOpen={(event) => onOpenWorld?.(world.id, event.currentTarget)}
          />
        ))}
      </div>
    </section>
  );
};
export default React.memo(WorldsGrid);
