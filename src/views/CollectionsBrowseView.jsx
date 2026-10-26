import React, { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import SagaRow from '../components/cards/SagaRow.jsx';
import WorldCover from '../components/cards/WorldCover.jsx';
import WorldHero from '../components/cards/WorldHero.jsx';
import { getPosterSrc } from '../utils/poster.js';
import { buildWorlds } from '../config/collectionWorlds.js';
import {
  preserveSagaOrder,
  rankSagas,
  searchSagaName,
} from '../domain/media/collectionActivity.js';

const control =
  'min-h-[44px] rounded-xl px-3 text-sm text-stone-300 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400';

const CollectionsBrowseView = ({
  collections,
  items = [],
  allCollections = collections,
  preferences = {},
  onPreferenceChange,
  preferenceSaving = false,
  preferenceLoading = false,
  preferenceError = null,
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
  const [isManaging, setIsManaging] = useState(false);
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
  const mediaGroups = world
    ? [
        ['Other films', world.otherFilms || []],
        ['Shorts & specials', world.shorts || []],
        ['TV series', world.shows || []],
      ].map(([title, films]) => [
        title,
        films.filter((film) =>
          searchSagaName(film.title).includes(searchSagaName(activeQuery)),
        ),
      ])
    : [];
  const resultCount =
    visible.length +
    mediaGroups.reduce((total, [, films]) => total + films.length, 0);
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
      className="fixed inset-0 z-40 bg-stone-950 flex flex-col max-w-md mx-auto pt-[var(--safe-top)] pb-[var(--safe-bottom)]"
    >
      <header className="px-4 pt-3 pb-2 border-b border-stone-800">
        <button type="button" onClick={back} className={control}>
          ←{' '}
          {worldId && worldReturn !== 'tonight' ? 'All collections' : 'Tonight'}
        </button>
        {worldId && worldReturn === 'tonight' && (
          <button
            type="button"
            className={control}
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
        {!worldId && (
          <>
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
          </>
        )}
      </header>
      <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
        {worldId && world && (
          <WorldHero key={world.id} world={world} headingRef={heading} />
        )}
        <div className="sticky top-0 z-10 bg-stone-950 py-3 space-y-2">
          <label htmlFor="saga-search" className="sr-only">
            {worldId ? 'Search this World' : 'Search sagas'}
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
              placeholder={worldId ? 'Find a film or saga…' : 'Find a saga…'}
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
        {!worldId && !query && worlds.length > 0 && (
          <section aria-label="Worlds" className="mb-6">
            <h2 className="mb-3 font-serif text-xl text-stone-100">Worlds</h2>
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
        <div role="status" className="sr-only">
          {activeQuery
            ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
            : ''}
        </div>
        <section aria-label="All sagas">
          <h2 className="font-serif text-xl text-stone-100">
            {activeQuery
              ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
              : worldId
              ? 'Sagas in this World'
              : recent.length
              ? 'More sagas'
              : 'All sagas'}
          </h2>
          <div aria-live="polite">
            {!resultCount && (
              <p className="py-6 text-sm text-stone-400">
                {worldId && !activeQuery
                  ? 'This World has no visible sagas. Other shelf titles are shown in their own sections.'
                  : collections.length
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
        {world &&
          mediaGroups.map(
            ([title, films]) =>
              films.length > 0 && (
                <section key={title} aria-label={title} className="mt-6">
                  <h2 className="font-serif text-xl text-stone-100">{title}</h2>
                  <div className="divide-y divide-stone-800">
                    {films.map((film) => (
                      <button
                        key={film.id || film.mediaId}
                        type="button"
                        onClick={() => onOpenItem?.(film)}
                        className="flex items-center gap-3 min-h-[76px] w-full py-2 text-left rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                      >
                        {getPosterSrc(film) && (
                          <img
                            src={getPosterSrc(film)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-14 object-cover rounded bg-stone-800"
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block font-serif text-lg text-stone-100">
                            {film.title}
                          </span>
                          <span className="block text-sm text-stone-400">
                            {film.status === 'watched'
                              ? 'Watched on your shelf'
                              : 'On your shelf'}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ),
          )}
        {onPreferenceChange && (
          <section
            className="mt-6 border-t border-stone-800 pt-3"
            aria-label="Collection preferences"
          >
            <button
              type="button"
              className={control}
              aria-expanded={isManaging}
              onClick={() => setIsManaging((value) => !value)}
            >
              Manage sagas
            </button>
            {preferenceError && (
              <p role="alert" className="text-sm text-red-300">
                {String(preferenceError)}
              </p>
            )}
            {isManaging && (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-stone-400">
                  Choose which sagas appear in Collections for everyone in this
                  household. Films stay on your shelf.
                </p>
                {allCollections.map((saga) => {
                  const key = `${saga.collection.provider || 'tmdb'}:${
                    saga.collection.providerId
                  }`;
                  return (
                    <label
                      key={saga.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-stone-100"
                    >
                      <span className="font-serif text-lg">
                        {saga.title.replace(/\s+Collection$/i, '')}
                      </span>
                      <select
                        aria-label={`Visibility for ${saga.title}`}
                        disabled={preferenceSaving || preferenceLoading}
                        value={
                          Object.prototype.hasOwnProperty.call(preferences, key)
                            ? String(preferences[key])
                            : 'default'
                        }
                        className={`${control} bg-stone-900`}
                        onChange={(event) => {
                          const value = event.target.value;
                          void onPreferenceChange(
                            key,
                            value === 'default' ? null : value === 'true',
                          );
                        }}
                      >
                        <option value="default">Use default</option>
                        <option value="true">Show in Collections</option>
                        <option value="false">Hide from Collections</option>
                      </select>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </Dialog>
  );
};
export default CollectionsBrowseView;
