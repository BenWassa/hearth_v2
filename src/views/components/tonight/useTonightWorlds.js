import { useEffect, useState } from 'react';
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

// The Worlds Tonight shows right now: four fixed and two adaptive, with the
// adaptive pair held for a week in storage. The Worlds grid renders them and
// the Collections row leaves out their sagas, so both call this with the same
// inputs and agree on the pick.
const useTonightWorlds = ({ collections = [], items = [], counts } = {}) => {
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
  return worlds;
};

export default useTonightWorlds;
