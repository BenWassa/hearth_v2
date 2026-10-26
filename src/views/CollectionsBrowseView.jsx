import React, { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';
import SagaRow from '../components/cards/SagaRow.jsx';
import WorldHero from '../components/cards/WorldHero.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import { PosterShelf } from '../components/cards/WorldShelves.jsx';
import { buildWorlds } from '../config/collectionWorlds.js';
import {
  preserveSagaOrder,
  sagaName,
  rankSagas,
} from '../domain/media/collectionActivity.js';

// Two destinations share this dialog. With no World it is the plain index of
// every eligible saga (most recently active first, fixed for the visit). With a
// World it is that World's page: artwork, then poster shelves.
const CollectionsBrowseView = ({
  collections,
  items = [],
  initialWorldId = null,
  onOpenItem,
  counts,
  onClose,
  onOpenCollection,
}) => {
  const worldId = initialWorldId;
  const [clock] = useState(Date.now);
  const [order] = useState(() =>
    rankSagas(collections, { now: clock }).map((saga) => saga.id),
  );
  const [pastHero, setPastHero] = useState(false);
  const scroller = useRef(null);
  const heading = useRef(null);
  useEffect(() => {
    if (worldId) heading.current?.focus({ preventScroll: true });
  }, [worldId]);
  const ranked = useMemo(
    () =>
      preserveSagaOrder(rankSagas(collections, { now: clock, counts }), order),
    [collections, clock, counts, order],
  );
  const world = worldId
    ? buildWorlds(ranked, items).find((entry) => entry.id === worldId)
    : null;
  // World shelves: one per saga, owned films only (nothing is fetched).
  const sagaShelves = world
    ? world.sagas
        .map((saga) => ({ saga, films: saga.items || [] }))
        .filter(({ films }) => films.length)
    : [];
  const featuredSagaId = sagaShelves.find(({ saga }) => saga.activity?.tier > 0)
    ?.saga.id;
  const mediaGroups = world
    ? [
        ['Other films', world.otherFilms || []],
        ['Shorts & specials', world.shorts || []],
        ['TV series', world.shows || []],
      ]
    : [];
  return (
    <Dialog
      onClose={onClose}
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
            label="Back to Tonight"
            onClick={onClose}
          >
            <span aria-hidden="true">←</span>
          </IconButton>
        </header>
      ) : (
        <header className="flex items-center gap-2 border-b border-stone-800 px-3 py-2">
          <IconButton label="Back to Tonight" onClick={onClose}>
            <span aria-hidden="true">←</span>
          </IconButton>
          <h1
            id="collections-heading"
            ref={heading}
            tabIndex={-1}
            className="font-serif text-2xl text-stone-100"
          >
            Collections
          </h1>
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
          <section aria-label="All sagas" className="pt-2">
            <h2 className="sr-only">All sagas</h2>
            {!ranked.length && (
              <p className="py-6 text-sm text-stone-400">
                Add films from a saga to your shelf and find them together here.
              </p>
            )}
            <div className="divide-y divide-stone-800">
              {ranked.map((saga) => (
                <SagaRow key={saga.id} saga={saga} onOpen={onOpenCollection} />
              ))}
            </div>
          </section>
        )}
        {worldId && world && (
          <div>
            {sagaShelves.map(({ saga, films }) => {
              const featured = saga.id === featuredSagaId;
              const nextTitle = featured
                ? saga.activity?.nextOwnedUnwatched?.title
                : '';
              return (
                <div key={saga.id} data-saga-shelf={saga.id}>
                  <PosterShelf
                    id={saga.id}
                    title={sagaName(saga.title)}
                    // The World title already names a lone saga; keep a quiet
                    // Details control so its page is still reachable.
                    headingHidden={sagaShelves.length === 1}
                    reason={nextTitle ? `Next up: ${nextTitle}` : ''}
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
