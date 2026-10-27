import { useMemo, useState } from 'react';
import {
  buildWorlds,
  selectTonightWorlds,
} from '../../../config/collectionWorlds.js';
import { rankSagas } from '../../../domain/media/collectionActivity.js';

// The Worlds Tonight shows right now: every represented World in the fixed
// TONIGHT_WORLD_ORDER. The Worlds rail renders them and the Collections row
// leaves out their sagas, so both call this with the same inputs and agree.
const useTonightWorlds = ({ collections = [], items = [], counts } = {}) => {
  const [clock] = useState(Date.now);
  return useMemo(
    () =>
      selectTonightWorlds(
        buildWorlds(rankSagas(collections, { now: clock, counts }), items),
      ).worlds,
    [collections, items, counts, clock],
  );
};

export default useTonightWorlds;
