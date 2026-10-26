import React, { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import SagaRow from '../components/cards/SagaRow.jsx';
import WorldCover from '../components/cards/WorldCover.jsx';
import WorldHero from '../components/cards/WorldHero.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import { PosterShelf } from '../components/cards/WorldShelves.jsx';
import { buildWorlds } from '../config/collectionWorlds.js';
import {
  preserveSagaOrder,
  sagaName,
  rankSagas,
  searchSagaName,
} from '../domain/media/collectionActivity.js';

const control =
  'min-h-[44px] rounded-xl px-3 text-sm text-stone-300 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400';

const CollectionsBrowseView = ({
  collections,
  items = [],
  initialWorldId = null,
  onOpenItem,
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
  const [worldId, setWorldId] = useState(initialWorldId);
  const [worldReturn, setWorldReturn] = useState(
    initialWorldId ? 'tonight' : 'overview',
  );
  const [pastHero, setPastHero] = useState(false);
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
  const worlds = buildWorlds(ranked, items);
  const [worldOrder, setWorldOrder] = useState(() =>
    buildWorlds(rankSagas(collections, { now: clock }), items).map(
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
  const source = worldId ? world?.sagas || [] : ranked;
  const visible = (
    sort === 'az' && !worldId
      ? rankSagas(source, { now: clock, sort: 'az' })
      : source
  ).filter((saga) =>
    searchSagaName(saga.title).includes(searchSagaName(query)),
  );
  // World shelves: one per saga, owned films only (nothing is fetched).
  const sagaShelves = worldId
    ? source
        .map((saga) => ({ saga, films: saga.items || [] }))
        .filter(({ films }) => films.length)
    : [];
  const featuredSagaId = sagaShelves.find(({ saga }) => saga.activity?.tier > 0)
    ?.saga.id;
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
  const mediaGroups = world
    ? [
        ['Other films', world.otherFilms || []],
        ['Shorts & specials', world.shorts || []],
        ['TV series', world.shows || []],
      ]
    : [];
  const resultCount = visible.length;
  const back = () => {
    if (!worldId || worldReturn === 'tonight') {
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
      className={`fixed inset-0 z-40 bg-stone-950 flex flex-col max-w-md mx-auto pb-[var(--safe-bottom)] ${
        worldId ? '' : 'pt-[var(--safe-top)]'
      }`}
    >
      {worldId ? (
        <header
          className={`absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pb-2 pt-[calc(var(--safe-top)+8px)] ${
            pastHero ? 'border-b border-stone-800 bg-stone-950' : ''
          }`}
        >
          <IconButton
            variant="overlay"
            label={
              worldReturn === 'tonight'
                ? 'Back to Tonight'
                : 'Back to All collections'
            }
            onClick={back}
          >
            <span aria-hidden="true">←</span>
          </IconButton>
          {worldReturn === 'tonight' && (
            <button
              type="button"
              className="min-h-11 rounded-full border border-stone-700 bg-stone-950/90 px-4 text-sm text-stone-100 hover:bg-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              onClick={() => {
                setWorldId(null);
                setWorldReturn('overview');
                if (scroller.current) scroller.current.scrollTop = 0;
                requestAnimationFrame(() =>
                  heading.current?.focus({ preventScroll: true }),
                );
              }}
            >
              All collections
            </button>
          )}
        </header>
      ) : (
        <header className="px-4 pt-3 pb-2 border-b border-stone-800">
          <button type="button" onClick={back} className={control}>
            ← Tonight
          </button>
          <h1
            id="collections-heading"
            ref={heading}
            tabIndex={-1}
            className="mt-3 font-serif text-3xl text-stone-100"
          >
            Collections
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            {collections.length} sagas on your shelf
          </p>
        </header>
      )}
      <div
        ref={scroller}
        onScroll={(event) => setPastHero(event.currentTarget.scrollTop > 120)}
        className="flex-1 min-h-0 overflow-y-auto px-4 pb-8"
      >
        {worldId && world && (
          <WorldHero key={world.id} world={world} headingRef={heading} />
        )}
        {worldId && !world && (
          <h1
            id="collections-heading"
            ref={heading}
            tabIndex={-1}
            className="pt-[calc(var(--safe-top)+64px)] font-serif text-3xl text-stone-100"
          >
            World
          </h1>
        )}
        {!worldId && (
          <div className="sticky top-0 z-10 bg-stone-950 py-3 space-y-2">
            <label htmlFor="saga-search" className="sr-only">
              Search sagas
            </label>
            <div className="flex gap-2">
              <input
                id="saga-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a saga…"
                className="min-w-0 w-full min-h-[48px] rounded-xl border border-stone-700 bg-stone-900 px-3 font-serif text-lg text-stone-100 placeholder:text-stone-400 focus:outline focus:outline-2 focus:outline-amber-400"
              />
              {query && (
                <button
                  type="button"
                  className={control}
                  onClick={() => setQuery('')}
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
                    buildWorlds(rankSagas(collections, { now }), items).map(
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
        )}
        {!worldId && (
          <>
            {!query && worlds.length > 0 && (
              <section aria-label="Worlds" className="mb-6">
                <h2 className="mb-3 font-serif text-xl text-stone-100">
                  Worlds
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {worlds.map((entry) => (
                    <WorldCover
                      key={entry.id}
                      world={entry}
                      onOpen={() => {
                        savedScroll.current = scroller.current?.scrollTop || 0;
                        worldButton.current = entry.id;
                        setWorldReturn('overview');
                        setWorldId(entry.id);
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
            <div role="status" className="sr-only">
              {query
                ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
                : ''}
            </div>
            <section aria-label="All sagas">
              <h2 className="font-serif text-xl text-stone-100">
                {query
                  ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
                  : recent.length
                  ? 'More sagas'
                  : 'All sagas'}
              </h2>
              <div aria-live="polite">
                {!resultCount && (
                  <p className="py-6 text-sm text-stone-400">
                    {collections.length
                      ? 'No sagas found. Try another name.'
                      : 'Add films from a saga to your shelf and find them together here.'}
                  </p>
                )}
              </div>
              <div className="divide-y divide-stone-800">
                {all.map((saga) => (
                  <SagaRow
                    key={saga.id}
                    saga={saga}
                    onOpen={onOpenCollection}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {worldId && world && (
          <div>
            {sagaShelves.map(({ saga, films }) => {
              const featured = saga.id === featuredSagaId;
              return (
                <div key={saga.id} data-saga-shelf={saga.id}>
                  <PosterShelf
                    id={saga.id}
                    title={sagaName(saga.title)}
                    srDetail={`${saga.watchedCount} of ${saga.totalCount} watched on your shelf`}
                    films={films}
                    size={featured ? 'large' : 'regular'}
                    onOpenHeading={() => onOpenCollection(saga)}
                    onOpenFilm={onOpenItem}
                  />
                </div>
              );
            })}
            {mediaGroups.map(
              ([title, films]) =>
                films.length > 0 && (
                  <PosterShelf
                    key={title}
                    id={title}
                    title={title}
                    films={films}
                    onOpenFilm={onOpenItem}
                  />
                ),
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
export default CollectionsBrowseView;
