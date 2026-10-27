import React from 'react';
import WorldCover from '../../../components/cards/WorldCover.jsx';
import useTonightWorlds from './useTonightWorlds.js';

// Every represented World as one finite brand rail, in the fixed
// TONIGHT_WORLD_ORDER. It is a plain scroll-snap row in the same vocabulary as
// the Collections rail: no cloned tiles, no auto-advance, no looping. The tiles
// are wide 7:2 banner cards, so at phone widths one shows in full with a clear
// peek of the next. Sagas outside these Worlds
// are reached from the Collections row further down Tonight.
const WorldsRail = ({ collections = [], items = [], onOpenWorld, counts }) => {
  const worlds = useTonightWorlds({ collections, items, counts });
  if (!worlds.length) return null;
  return (
    <section aria-label="Worlds" className="space-y-2 shrink-0">
      <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-stone-400">
        Worlds
      </h3>
      <div className="relative px-1">
        <div
          className="pb-1 overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <ul role="list" className="flex gap-3 min-w-max">
            {worlds.map((world) => (
              <li
                key={world.id}
                className="w-[clamp(11rem,56vw,15rem)] shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <WorldCover
                  world={world}
                  className="aspect-[7/2] w-full"
                  onOpen={(event) =>
                    onOpenWorld?.(world.id, event.currentTarget)
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
export default React.memo(WorldsRail);
