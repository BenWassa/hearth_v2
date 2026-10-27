import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ world: null }));
vi.mock('../config/collectionWorlds.js', async (importOriginal) => ({
  ...(await importOriginal()),
  buildWorlds: () => [fixture.world],
}));

import CollectionsBrowseView from './CollectionsBrowseView.jsx';
global.IS_REACT_ACT_ENVIRONMENT = true;

const film = (id, title, status = 'unwatched') => ({
  id,
  title,
  type: 'movie',
  status,
});
const saga = (id, title, films, extra = {}) => ({
  id,
  title,
  totalCount: films.length,
  watchedCount: films.filter((f) => f.status === 'watched').length,
  items: films,
  activity: { tier: 0 },
  ...extra,
});
const railSaga = saga(
  'avengers',
  'Avengers Collection',
  [film('a1', 'Avengers'), film('a2', 'Age of Ultron')],
  {
    activity: { tier: 2, nextOwnedUnwatched: { title: 'Age of Ultron' } },
  },
);
const thor = saga('thor', 'Thor Collection', [
  film('t1', 'Thor'),
  film('t2', 'Dark World'),
]);
const tileA = saga('ant', 'Ant-Man Collection', [film('m1', 'Ant-Man')]);
const tileB = saga('cap', 'Captain America Collection', [
  film('c1', 'First Avenger'),
]);
const tileC = saga('bp', 'Black Panther Collection', [
  film('b1', 'Black Panther'),
]);

const makeWorld = (railSagas, tileSagas) => ({
  id: 'marvel',
  name: 'Marvel',
  cover: '/assets/worlds/marvel/cover.webp',
  sagas: [...railSagas, ...tileSagas],
  railSagas,
  tileSagas,
  otherFilms: [],
  shorts: [],
  shows: [],
  ownedTotal: 8,
  unwatched: 8,
});

let root, host;
const mount = async (props = {}) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      <CollectionsBrowseView
        initialWorldId="marvel"
        collections={[]}
        onClose={vi.fn()}
        onOpenCollection={vi.fn()}
        onOpenItem={vi.fn()}
        {...props}
      />,
    ),
  );
};
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
  fixture.world = null;
});
beforeEach(() => {
  fixture.world = makeWorld([railSaga, thor], [tileA, tileB, tileC]);
});

it('shows a plain serif rail per big saga with no chevron, then a More tile index', async () => {
  const open = vi.fn();
  await mount({ onOpenCollection: open });
  expect(host.querySelectorAll('[data-saga-shelf]')).toHaveLength(2);
  expect(host.textContent).not.toContain('›');
  const heading = host.querySelector('[data-saga-shelf] h2');
  expect(heading.textContent).toBe('Avengers');
  expect(heading.querySelector('button')).toBeNull();
  // Featured rail keeps its reason line and larger posters.
  expect(host.querySelector('[data-saga-shelf]').textContent).toContain(
    'Next up: Age of Ultron',
  );
  // Finite (owned films only); only the featured rail gets larger posters.
  const shelves = [...host.querySelectorAll('[data-saga-shelf]')];
  for (const shelf of shelves) {
    expect(shelf.querySelectorAll('li')).toHaveLength(2);
  }
  const widths = shelves.map((shelf) => shelf.querySelector('li').className);
  expect(widths.filter((name) => name.includes('w-[132px]'))).toHaveLength(1);
  const index = host.querySelector('[data-saga-index]');
  expect(index.querySelector('h2').textContent).toBe('More Marvel');
  const tiles = [...index.querySelectorAll('[data-saga-tile]')];
  expect(tiles.map((t) => t.getAttribute('aria-label'))).toEqual([
    'Ant-Man',
    'Captain America',
    'Black Panther',
  ]);
  expect(index.querySelector('ul').className).toContain('grid-cols-2');
  await act(async () => tiles[1].click());
  expect(open).toHaveBeenCalledWith(tileB);
});

it('keeps each big saga page reachable through a quiet Details button', async () => {
  const open = vi.fn();
  await mount({ onOpenCollection: open });
  const details = host.querySelector('button[aria-label="Thor details"]');
  expect(details.textContent).toBe('Details');
  expect(details.className).toContain('min-h-[44px]');
  await act(async () => details.click());
  expect(open).toHaveBeenCalledWith(thor);
});

it('shows a lone rail saga heading since the World title is no longer visible', async () => {
  fixture.world = makeWorld([thor], []);
  await mount();
  expect(host.querySelector('[data-saga-shelf] h2').textContent).toBe('Thor');
  expect(host.querySelector('h2.sr-only')).toBeNull();
  expect(host.querySelector('[data-saga-index]')).toBeNull();
});

it('headlines the tile index Sagas when there are no rails', async () => {
  fixture.world = makeWorld([], [tileA, tileB]);
  await mount();
  expect(host.querySelectorAll('[data-saga-shelf]')).toHaveLength(0);
  expect(host.querySelector('[data-saga-index] h2').textContent).toBe('Sagas');
  expect(host.querySelectorAll('[data-saga-tile]')).toHaveLength(2);
});

it('omits the tile index when every saga has a rail', async () => {
  fixture.world = makeWorld([railSaga, thor], []);
  await mount();
  expect(host.querySelector('[data-saga-index]')).toBeNull();
  expect(host.querySelectorAll('[data-saga-shelf]')).toHaveLength(2);
});

it('keeps standalone film rails after the tile index', async () => {
  fixture.world = {
    ...makeWorld([railSaga], [tileA]),
    otherFilms: [film('o1', 'Hulk')],
  };
  await mount();
  const index = host.querySelector('[data-saga-index]');
  const other = host.querySelector('[aria-label="Other films"]');
  expect(
    index.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});
