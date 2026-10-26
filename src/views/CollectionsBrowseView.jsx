import React, { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import SagaRow from '../components/cards/SagaRow.jsx';
import { buildWorlds } from '../config/collectionWorlds.js';
import {
  preserveSagaOrder,
  rankSagas,
  searchSagaName,
} from '../domain/media/collectionActivity.js';

const control =
  'min-h-[44px] rounded-xl px-3 text-sm text-stone-300 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400';
const WorldCover = ({ world, onOpen }) => {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      data-world-id={world.id}
      onClick={onOpen}
      className={`world-cover world-cover-${world.motif} relative min-h-[112px] overflow-hidden rounded-2xl border border-stone-700 text-left p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`}
    >
      {world.cover && !failed && (
        <img
          src={world.cover}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <span className="relative block font-serif text-xl text-stone-100">
        {world.name}
      </span>
      <span className="relative mt-2 block text-sm text-stone-300">
        {world.sagas.length} {world.sagas.length === 1 ? 'saga' : 'sagas'}
      </span>
    </button>
  );
};

const CollectionsBrowseView = ({
  collections,
  counts,
  onClose,
  onOpenCollection,
}) => {
  const [clock, setClock] = useState(Date.now);
  const [order, setOrder] = useState(() =>
    rankSagas(collections, { now: clock }).map((saga) => saga.id),
  );
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');
  const [worldId, setWorldId] = useState(null);
  const [worldQuery, setWorldQuery] = useState('');
  const scroller = useRef(null);
  const heading = useRef(null);
  useEffect(() => {
    if (worldId) heading.current?.focus({ preventScroll: true });
  }, [worldId]);
  const savedScroll = useRef(0);
  const worldButton = useRef(null);
  const ranked = useMemo(
    () =>
      preserveSagaOrder(rankSagas(collections, { now: clock, counts }), order),
    [collections, clock, counts, order],
  );
  const worlds = buildWorlds(ranked);
  const [worldOrder, setWorldOrder] = useState(() =>
    buildWorlds(rankSagas(collections, { now: clock })).map(
      (world) => world.id,
    ),
  );
  worlds.sort(
    (a, b) =>
      (worldOrder.includes(a.id) ? worldOrder.indexOf(a.id) : Infinity) -
        (worldOrder.includes(b.id) ? worldOrder.indexOf(b.id) : Infinity) ||
      a.name.localeCompare(b.name),
  );
  const world = worlds.find((entry) => entry.id === worldId);
  const activeQuery = worldId ? worldQuery : query;
  const source = worldId ? world?.sagas || [] : ranked;
  const visible = (
    sort === 'az' ? rankSagas(source, { now: clock, sort: 'az' }) : source
  ).filter((saga) =>
    searchSagaName(saga.title).includes(searchSagaName(activeQuery)),
  );
  const [recentIds, setRecentIds] = useState(
    () =>
      new Set(
        rankSagas(collections, { now: clock })
          .filter(
            (saga) => saga.activity.lastActivityAt > clock - 14 * 86400000,
          )
          .slice(0, 2)
          .map((saga) => saga.id),
      ),
  );
  const recent =
    !worldId && !query && sort === 'recent'
      ? visible.filter((saga) => recentIds.has(saga.id))
      : [];
  const all = recent.length
    ? visible.filter((saga) => !recentIds.has(saga.id))
    : visible;
  const back = () => {
    if (!worldId) {
      onClose();
      return;
    }
    setWorldId(null);
    requestAnimationFrame(() => {
      if (scroller.current) scroller.current.scrollTop = savedScroll.current;
      document
        .querySelector(`[data-world-id="${worldButton.current}"]`)
        ?.focus({ preventScroll: true });
    });
  };
  return (
    <Dialog
      onClose={back}
      aria-labelledby="collections-heading"
      className="fixed inset-0 z-40 bg-stone-950 flex flex-col max-w-md mx-auto pt-[var(--safe-top)] pb-[var(--safe-bottom)]"
    >
      <header className="px-4 pt-3 pb-2 border-b border-stone-800">
        <button type="button" onClick={back} className={control}>
          ← {worldId ? 'All collections' : 'Tonight'}
        </button>
        <h1
          id="collections-heading"
          ref={heading}
          tabIndex={-1}
          className="mt-3 font-serif text-3xl text-stone-100"
        >
          {worldId ? world?.name || 'World' : 'Collections'}
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          {worldId
            ? `${source.length} sagas · ${
                world?.ownedTotal || 0
              } films on your shelf · ${world?.unwatched || 0} unwatched`
            : `${collections.length} sagas on your shelf`}
        </p>
      </header>
      <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
        <div className="sticky top-0 z-10 bg-stone-950 py-3 space-y-2">
          <label htmlFor="saga-search" className="sr-only">
            Search sagas
          </label>
          <div className="flex gap-2">
            <input
              id="saga-search"
              type="search"
              value={activeQuery}
              onChange={(event) =>
                worldId
                  ? setWorldQuery(event.target.value)
                  : setQuery(event.target.value)
              }
              placeholder="Find a saga…"
              className="min-w-0 w-full min-h-[48px] rounded-xl border border-stone-700 bg-stone-900 px-3 font-serif text-lg text-stone-100 placeholder:text-stone-400 focus:outline focus:outline-2 focus:outline-amber-400"
            />
            {activeQuery && (
              <button
                type="button"
                className={control}
                onClick={() => (worldId ? setWorldQuery('') : setQuery(''))}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label className="sr-only" htmlFor="saga-sort">
              Sort sagas
            </label>
            <select
              id="saga-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className={`${control} bg-stone-900`}
            >
              <option value="recent">Recently active</option>
              <option value="az">A–Z</option>
            </select>
            <button
              type="button"
              className={control}
              onClick={() => {
                const now = Date.now();
                setClock(now);
                setWorldOrder(
                  buildWorlds(rankSagas(collections, { now })).map(
                    (world) => world.id,
                  ),
                );
                setRecentIds(
                  new Set(
                    rankSagas(collections, { now })
                      .filter(
                        (saga) =>
                          saga.activity.lastActivityAt > now - 14 * 86400000,
                      )
                      .slice(0, 2)
                      .map((saga) => saga.id),
                  ),
                );
                setOrder(
                  rankSagas(collections, { now }).map((saga) => saga.id),
                );
              }}
            >
              Refresh order
            </button>
          </div>
        </div>
        {!worldId && !query && collections.length > 5 && worlds.length > 0 && (
          <section aria-label="Worlds" className="mb-6">
            <h2 className="mb-3 font-serif text-xl text-stone-100">Worlds</h2>
            <div className="grid grid-cols-2 gap-3">
              {worlds.map((entry) => (
                <WorldCover
                  key={entry.id}
                  world={entry}
                  onOpen={() => {
                    if (entry.sagas.length === 1) {
                      onOpenCollection(entry.sagas[0]);
                      return;
                    }
                    savedScroll.current = scroller.current?.scrollTop || 0;
                    worldButton.current = entry.id;
                    setWorldId(entry.id);
                    setWorldQuery('');
                    if (scroller.current) scroller.current.scrollTop = 0;
                  }}
                />
              ))}
            </div>
          </section>
        )}
        {recent.length > 0 && (
          <section aria-label="Recently active" className="mb-5">
            <h2 className="font-serif text-xl text-stone-100">
              Recently active
            </h2>
            {recent.map((saga) => (
              <SagaRow
                key={saga.id}
                saga={saga}
                onOpen={onOpenCollection}
                reason
              />
            ))}
          </section>
        )}
        <section aria-label="All sagas">
          <h2 className="font-serif text-xl text-stone-100">
            {activeQuery
              ? `${visible.length} ${
                  visible.length === 1 ? 'result' : 'results'
                }`
              : worldId
              ? 'Sagas in this World'
              : recent.length
              ? 'More sagas'
              : 'All sagas'}
          </h2>
          <div aria-live="polite">
            {!visible.length && (
              <p className="py-6 text-sm text-stone-400">
                {collections.length
                  ? 'No sagas found. Try another name.'
                  : 'Add films from a saga to your shelf and find them together here.'}
              </p>
            )}
          </div>
          <div className="divide-y divide-stone-800">
            {all.map((saga) => (
              <SagaRow key={saga.id} saga={saga} onOpen={onOpenCollection} />
            ))}
          </div>
        </section>
      </div>
    </Dialog>
  );
};
export default CollectionsBrowseView;
