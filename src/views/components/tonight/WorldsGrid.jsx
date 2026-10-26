import React, { useEffect, useState } from 'react';
import { Orbit } from 'lucide-react';
import WorldCover from '../../../components/cards/WorldCover.jsx';
import {
  buildWorlds,
  selectTonightWorlds,
} from '../../../config/collectionWorlds.js';
import { rankSagas } from '../../../domain/media/collectionActivity.js';

const PICK_KEY = 'hearth:tonight-worlds';
const readPick = () => {
  try {
    return JSON.parse(localStorage.getItem(PICK_KEY));
  } catch {
    return null;
  }
};
const writePick = (pick) => {
  try {
    localStorage.setItem(PICK_KEY, JSON.stringify(pick));
  } catch {
    // Storage can be blocked; the pick is then recomputed each visit.
  }
};

// Six text-only tiles in a finite two-column grid: four fixed Worlds and two
// that follow household activity (see selectTonightWorlds). Every other World
// and saga is reached from the Collections row further down Tonight.
const WorldsGrid = ({ collections = [], items = [], onOpenWorld, counts }) => {
  const [clock] = useState(Date.now);
  const [stored] = useState(readPick);
  const { worlds, pick } = selectTonightWorlds(
    buildWorlds(rankSagas(collections, { now: clock, counts }), items),
    { now: clock, stored },
  );
  const pickKey = JSON.stringify(pick);
  useEffect(() => {
    if (pickKey !== JSON.stringify(stored)) writePick(JSON.parse(pickKey));
  }, [pickKey, stored]);
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
