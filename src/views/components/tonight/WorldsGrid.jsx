import React from 'react';
import WorldCover from '../../../components/cards/WorldCover.jsx';
import useTonightWorlds from './useTonightWorlds.js';

// Six art tiles in a finite two-column grid: four fixed Worlds and two
// that follow household activity (see selectTonightWorlds). Every other World
// and saga is reached from the Collections row further down Tonight.
const WorldsGrid = ({ collections = [], items = [], onOpenWorld, counts }) => {
  const worlds = useTonightWorlds({ collections, items, counts });
  if (!worlds.length) return null;
  return (
    <section aria-label="Worlds" className="space-y-2 shrink-0">
      <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-stone-400">
        Worlds
      </h3>
      <div className="grid grid-cols-2 gap-3 px-1">
        {worlds.map((world, index) => (
          <WorldCover
            key={world.id}
            world={world}
            // An odd last tile spans both columns rather than leaving a hole.
            className={
              worlds.length % 2 === 1 && index === worlds.length - 1
                ? 'col-span-2 min-h-[72px]'
                : 'aspect-[16/9]'
            }
            onOpen={(event) => onOpenWorld?.(world.id, event.currentTarget)}
          />
        ))}
      </div>
    </section>
  );
};
export default React.memo(WorldsGrid);
