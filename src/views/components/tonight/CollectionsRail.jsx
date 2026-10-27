import React, { useState } from 'react';
import { Library } from 'lucide-react';
import LazyMediaImage from '../../../components/media/LazyMediaImage.jsx';
import WorldCover from '../../../components/cards/WorldCover.jsx';
import useTonightWorlds from './useTonightWorlds.js';
import { getPosterSrc } from '../../../utils/poster.js';
import { worldForSaga } from '../../../config/collectionWorlds.js';
import {
  preserveSagaOrder,
  rankSagas,
  sagaName,
} from '../../../domain/media/collectionActivity.js';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

// Every eligible saga, most recently active first, as one finite rail in the
// same vocabulary as the other Tonight rails. It is a plain scroll-snap row:
// no cloned cards, no auto-advance, no looping. The last tile is the neutral
// All collections tile that opens the full index (shown past three sagas, or
// whenever some sagas are left out of the row). Sagas whose World is already a
// tile in the Worlds grid are left out here. Cards carry no counts.
// Order is fixed for the visit (like Worlds); nothing is fetched for it.
const CollectionsRail = ({
  collections = [],
  items = [],
  onOpenCollection,
  onBrowse,
  counts,
}) => {
  const [clock] = useState(Date.now);
  const gridWorldIds = useTonightWorlds({ collections, items, counts }).map(
    (world) => world.id,
  );
  const [order] = useState(() =>
    rankSagas(collections, { now: clock, counts }).map((saga) => saga.id),
  );
  if (!collections.length) return null;
  const ranked = preserveSagaOrder(
    rankSagas(collections, { now: clock, counts }),
    order,
  );
  const sagas = ranked.filter(
    (saga) => !gridWorldIds.includes(worldForSaga(saga)?.id),
  );
  const hasHiddenSagas = sagas.length < ranked.length;
  const cell = 'w-[clamp(7rem,32vw,9rem)] shrink-0';
  return (
    <section aria-label="Collections" className="space-y-2 shrink-0">
      <div className="flex items-center gap-1.5 px-1">
        <Library className="w-4 h-4 text-stone-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">
          Collections
        </h3>
      </div>
      <div className="relative px-1">
        <div
          className="pb-1 overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <ul
            role="list"
            aria-label="All collections"
            className="flex gap-2.5 min-w-max"
          >
            {sagas.map((saga) => (
              <li
                key={saga.id}
                className={cell}
                style={{ scrollSnapAlign: 'start' }}
              >
                <button
                  type="button"
                  data-saga-card={saga.id}
                  onClick={(event) => {
                    event.currentTarget.focus({ preventScroll: true });
                    onOpenCollection?.(saga, event.currentTarget);
                  }}
                  className={`relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-800 shadow-lg shadow-black/20 ${focusRing}`}
                >
                  <LazyMediaImage
                    src={getPosterSrc(saga)}
                    alt=""
                    className="h-full w-full object-cover"
                    fallback={
                      <span
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center p-2 text-center font-serif text-sm leading-snug text-stone-300"
                      >
                        {sagaName(saga.title)}
                      </span>
                    }
                  />
                  <span className="sr-only">{sagaName(saga.title)}</span>
                </button>
              </li>
            ))}
            {/* The row already shows everything when there are only a few. */}
            {(sagas.length > 3 || hasHiddenSagas) && (
              <li className={cell} style={{ scrollSnapAlign: 'start' }}>
                <WorldCover
                  neutral
                  className="aspect-[2/3] !min-h-0"
                  world={{
                    id: 'all-collections',
                    name: 'All collections',
                    sagas: ranked,
                  }}
                  onOpen={onBrowse}
                />
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};
export default React.memo(CollectionsRail);
