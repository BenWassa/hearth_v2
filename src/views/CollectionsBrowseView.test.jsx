import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import CollectionsBrowseView from './CollectionsBrowseView.jsx';
import CollectionsRail from './components/tonight/CollectionsRail.jsx';
import WorldsRail from './components/tonight/WorldsRail.jsx';
import {
  TONIGHT_WORLD_ORDER,
  worldForSaga,
} from '../config/collectionWorlds.js';
global.IS_REACT_ACT_ENVIRONMENT = true;
const now = Date.now();
const makeSaga = (i, providerId = `other-${i}`) => ({
  id: `saga-${i}`,
  title: `Saga ${String(i).padStart(2, '0')} Collection`,
  collection: { provider: 'tmdb', providerId },
  totalCount: 2,
  watchedCount: 1,
  items: [
    {
      id: `w-${i}`,
      type: 'movie',
      status: 'watched',
      markedWatchedAt: now - i * 1000,
    },
    { id: `u-${i}`, type: 'movie', status: 'unwatched' },
  ],
});
let root, host;
const mount = async (element) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(element));
};
const click = async (button) => {
  await act(async () => button.click());
};
const button = (text) =>
  [...host.querySelectorAll('button')].find(
    (b) =>
      b.textContent.includes(text) ||
      b.getAttribute('aria-label')?.includes(text),
  );
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
});
it.each([0, 1, 3, 25, 50])(
  'shows every represented World as one finite row for %i sagas',
  async (size) => {
    const openWorld = vi.fn();
    const browse = vi.fn();
    const ids = ['86311', '1241', '10', '10194', '386382', '263', '2150'];
    const collections = Array.from({ length: size }, (_, i) =>
      makeSaga(i, ids[i % ids.length]),
    );
    await mount(
      <WorldsRail
        collections={collections}
        onOpenWorld={openWorld}
        onBrowse={browse}
      />,
    );
    const expected = TONIGHT_WORLD_ORDER.filter((id) =>
      collections.some((saga) => worldForSaga(saga)?.id === id),
    );
    const tiles = [...host.querySelectorAll('[data-world-id]')];
    expect(tiles.map((tile) => tile.dataset.worldId)).toEqual(expected);
    expect(tiles).toHaveLength(Math.min(size, ids.length));
    // One finite single-row list: one cell per World, no clones.
    if (size) {
      const list = host.querySelector('ul[role="list"]');
      expect(list.children).toHaveLength(tiles.length);
      expect(list.className).toContain('flex');
    } else {
      expect(host.querySelector('section')).toBeNull();
    }
    // The rail is only Worlds: no All collections tile and no Browse-all link.
    expect(button('All collections')).toBeUndefined();
    expect(host.textContent).not.toContain('Browse all');
    expect(browse).not.toHaveBeenCalled();
    if (size) {
      await click(button('Marvel'));
      expect(openWorld).toHaveBeenCalledWith('marvel', button('Marvel'));
    }
  },
);
it('lists Worlds in the fixed brand order whatever the saga activity', async () => {
  const ids = ['2150', '263', '386382', '10194', '10', '1241', '86311'];
  const collections = ids.map((id, i) => makeSaga(i, id));
  await mount(<WorldsRail collections={collections} onOpenWorld={vi.fn()} />);
  expect(
    [...host.querySelectorAll('[data-world-id]')].map(
      (el) => el.dataset.worldId,
    ),
  ).toEqual([
    'pixar',
    'marvel',
    'star-wars',
    'wizarding-world',
    'disney-animation',
    'dreamworks',
    'dc',
  ]);
  const cell = host.querySelector('ul[role="list"] > li');
  expect(cell.className).toContain('w-[clamp(11rem,56vw,15rem)]');
  expect(cell.style.scrollSnapAlign).toBe('start');
});
it('lists every saga plainly: no search, sort, refresh, count or Worlds rail', async () => {
  await mount(
    <CollectionsBrowseView
      collections={Array.from({ length: 50 }, (_, i) => makeSaga(i))}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  expect(host.querySelectorAll('h3')).toHaveLength(50);
  expect(host.querySelector('h1').textContent).toBe('Collections');
  expect(host.querySelector('input')).toBeNull();
  expect(host.querySelector('select')).toBeNull();
  expect(host.textContent).not.toContain('Refresh order');
  expect(host.textContent).not.toContain('on your shelf');
  expect(host.querySelector('[data-world-id]')).toBeNull();
  // Rows carry a short progress line that cannot wrap to three lines.
  expect(host.querySelector('h3 + p').textContent).toBe('1 of 2 watched');
});
it('keeps the index order stable through live activity and provider enrichment', async () => {
  const collections = [makeSaga(0), makeSaga(1), makeSaga(2)];
  const render = (items, counts) => (
    <CollectionsBrowseView
      collections={items}
      counts={counts}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />
  );
  await mount(render(collections));
  const before = [...host.querySelectorAll('h3')].map((h) => h.textContent);
  const changed = collections.map((s, i) =>
    i === 2
      ? {
          ...s,
          items: [
            {
              id: 'new',
              status: 'unwatched',
              additionOrigin: 'manual',
              createdAt: Date.now(),
            },
          ],
        }
      : s,
  );
  await act(async () => root.render(render(changed, new Map([['saga-2', 9]]))));
  expect([...host.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(
    before,
  );
  expect(host.textContent).not.toContain('Refresh order');
});
it('small libraries skip Worlds and have an accessible empty state and Escape', async () => {
  const close = vi.fn();
  await mount(
    <CollectionsBrowseView
      collections={[]}
      onClose={close}
      onOpenCollection={vi.fn()}
    />,
  );
  expect(host.querySelector('[role="dialog"]').getAttribute('aria-modal')).toBe(
    'true',
  );
  expect(host.textContent).toContain('Add films from a saga');
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  );
  expect(close).toHaveBeenCalledOnce();
});

it('keeps all World entry points when watch activity is undone or dormant', async () => {
  const collections = [
    makeSaga(0, '86311'),
    makeSaga(1, '1241'),
    makeSaga(2, '263'),
  ];
  await mount(
    <WorldsRail
      collections={collections}
      onBrowse={vi.fn()}
      onOpenWorld={vi.fn()}
    />,
  );
  const before = [...host.querySelectorAll('[data-world-id]')].map(
    (node) => node.dataset.worldId,
  );
  const changed = collections.map((saga) => ({
    ...saga,
    items: saga.items.map((item) => ({
      ...item,
      status: 'unwatched',
      markedWatchedAt: null,
    })),
  }));
  await act(async () =>
    root.render(
      <WorldsRail
        collections={changed}
        onBrowse={vi.fn()}
        onOpenWorld={vi.fn()}
      />,
    ),
  );
  expect(
    [...host.querySelectorAll('[data-world-id]')].map(
      (node) => node.dataset.worldId,
    ),
  ).toEqual(before);
});

it('opens a World directly from Tonight and returns there without an extra overview step', async () => {
  const close = vi.fn();
  await mount(
    <CollectionsBrowseView
      initialWorldId="star-wars"
      collections={[makeSaga(0, '10')]}
      onClose={close}
      onOpenCollection={vi.fn()}
    />,
  );
  expect(host.querySelector('h1').textContent).toBe('Star Wars');
  await click(button('Tonight'));
  expect(close).toHaveBeenCalledOnce();
});

it('keeps standalone films, shorts and TV in separate World sections without fake sagas', async () => {
  const openItem = vi.fn();
  const items = [
    {
      id: 'up',
      type: 'movie',
      title: 'Up',
      worldId: 'pixar',
      runtimeMinutes: 96,
    },
    {
      id: 'short',
      type: 'movie',
      title: 'A short',
      worldId: 'pixar',
      runtimeMinutes: 7,
    },
    { id: 'show', type: 'show', title: 'A show', worldId: 'pixar' },
  ];
  await mount(
    <CollectionsBrowseView
      initialWorldId="pixar"
      collections={[]}
      items={items}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
      onOpenItem={openItem}
    />,
  );
  expect(host.querySelector('h1').textContent).toBe('Pixar');
  expect(host.querySelectorAll('[data-saga-shelf]')).toHaveLength(0);
  expect(host.textContent).toContain('1 feature film on your shelf');
  expect(
    host.querySelector('[aria-label="Other films"]').textContent,
  ).toContain('Up');
  expect(
    [...host.querySelectorAll('section')].find(
      (node) => node.getAttribute('aria-label') === 'Shorts & specials',
    ).textContent,
  ).toContain('A short');
  expect(host.querySelector('[aria-label="TV series"]').textContent).toContain(
    'A show',
  );
  await click(button('Up'));
  expect(openItem).toHaveBeenCalledWith(items[0]);
});

it('offers only Back on a World page opened from Tonight, with no All collections shortcut', async () => {
  await mount(
    <CollectionsBrowseView
      initialWorldId="marvel"
      collections={[makeSaga(0, '86311')]}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  expect(button('Back to Tonight')).toBeDefined();
  expect(button('All collections')).toBeUndefined();
});

it('renders natural-ratio artwork on the first World page', async () => {
  await mount(
    <CollectionsBrowseView
      initialWorldId="marvel"
      collections={[makeSaga(0, '86311')]}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  const hero = host.querySelector('[data-world-hero="marvel"]');
  expect(hero).not.toBeNull();
  const art = hero.querySelector('img[src="/assets/worlds/marvel/cover.webp"]');
  expect(art).not.toBeNull();
  // Full 16:9 composition rather than a portrait cropped into a short strip.
  expect(art.parentElement.className).toContain('world-hero-art');
  expect(hero.querySelector('img[src$="/hero.webp"]')).toBeNull();
  expect(host.textContent).not.toContain('Explore Marvel');
});

it('keeps a title when artwork fails, including a World with no sagas', async () => {
  await mount(
    <CollectionsBrowseView
      initialWorldId="pixar"
      collections={[]}
      items={[
        {
          id: 'up',
          type: 'movie',
          title: 'Up',
          worldId: 'pixar',
          runtimeMinutes: 96,
        },
      ]}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  await act(async () => {
    host
      .querySelector('[data-world-hero] img')
      .dispatchEvent(new Event('error'));
  });
  expect(host.querySelector('#collections-heading').textContent).toBe('Pixar');
  expect(
    host.querySelector('[aria-label="Other films"]').textContent,
  ).toContain('Up');
});

it('renders World tiles as one banner card, named by the World', async () => {
  const openWorld = vi.fn();
  await mount(
    <WorldsRail
      collections={[makeSaga(0, '86311')]}
      onOpenWorld={openWorld}
      onBrowse={vi.fn()}
    />,
  );
  const tile = host.querySelector('[data-world-id="marvel"]');
  const images = tile.querySelectorAll('img');
  expect(images).toHaveLength(1);
  expect(images[0].getAttribute('src')).toMatch(/marvel\/card\.webp$/);
  expect(tile.getAttribute('aria-label')).toBe('Marvel');
  expect(tile.textContent).toMatch(/1 saga/);
  await click(tile);
  expect(openWorld).toHaveBeenCalledWith('marvel', tile);
});

it.each([
  ['marvel', 'Marvel'],
  ['dc', 'DC'],
  ['pixar', 'Pixar'],
  ['wizarding-world', 'Wizarding World'],
])(
  'keeps the %s title as screen-reader text over art, visible if the art fails',
  async (id, name) => {
    await mount(
      <CollectionsBrowseView
        initialWorldId={id}
        collections={[]}
        items={[
          {
            id: 'only-film',
            type: 'movie',
            title: 'Standalone',
            worldId: id,
            runtimeMinutes: 90,
          },
        ]}
        onClose={vi.fn()}
        onOpenCollection={vi.fn()}
      />,
    );
    const hero = host.querySelector(`[data-world-hero="${id}"]`);
    const heading = hero.querySelector('h1');
    expect(heading.textContent).toBe(name);
    // The art carries the name; the live heading is hidden but still named.
    expect(heading.classList.contains('sr-only')).toBe(true);
    expect(heading.id).toBe('collections-heading');
    expect(hero.querySelector('.world-hero-rule')).toBeNull();
    // The source can already contain typography; do not stack a wordmark image.
    expect(hero.querySelector('img[src*="wordmark."]')).toBeNull();
    const image = hero.querySelector('img[src$="/cover.webp"]');
    expect(image).not.toBeNull();
    await act(async () => image.dispatchEvent(new Event('error')));
    expect(hero.querySelector('h1').classList.contains('sr-only')).toBe(false);
  },
);

it('shows eligible sagas outside the hidden Worlds in a finite Collections row ordered by activity, ending with a neutral All collections tile', async () => {
  const browse = vi.fn();
  const openCollection = vi.fn();
  const older = {
    ...makeSaga(0, '10'),
    items: [
      {
        id: 'o1',
        type: 'movie',
        status: 'watched',
        markedWatchedAt: now - 5e8,
      },
      { id: 'o2', type: 'movie', status: 'unwatched' },
    ],
  };
  const newer = makeSaga(1, 'other-1');
  const ungrouped = makeSaga(2, 'other-2');
  await mount(
    <CollectionsRail
      collections={[older, ungrouped, newer, makeSaga(3, 'other-3')]}
      onOpenCollection={openCollection}
      onBrowse={browse}
    />,
  );
  const rail = host.querySelector('ul[aria-label="All collections"]');
  const cells = [...rail.querySelectorAll('li')];
  // One card per saga outside the hidden Worlds (including those in no World)
  // plus the neutral tile, which also shows because the Star Wars saga is left
  // out of the row.
  expect(cells).toHaveLength(4);
  expect(rail.getAttribute('role')).toBe('list');
  const order = cells
    .slice(0, 3)
    .map((cell) => cell.querySelector('button').dataset.sagaCard);
  expect(order[0]).toBe('saga-1');
  expect(order).toContain('saga-2');
  expect(order).not.toContain('saga-0');
  // Finite and plain scroll-snap: no cloned cards, no looping hooks.
  expect(new Set(order).size).toBe(3);
  expect(host.querySelectorAll('[data-rail-card]')).toHaveLength(0);
  // No count text on the cards.
  const visibleRail = rail.cloneNode(true);
  visibleRail.querySelectorAll('.sr-only').forEach((node) => node.remove());
  expect(visibleRail.textContent).not.toMatch(
    /\d+ of \d+|\d+ sagas?|\d+ films?/,
  );
  await click(cells[0].querySelector('button'));
  expect(openCollection).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'saga-1' }),
    cells[0].querySelector('button'),
  );
  const tile = cells[3].querySelector('button');
  expect(tile.hasAttribute('data-all-collections')).toBe(true);
  expect(tile.hasAttribute('data-world-id')).toBe(false);
  expect(tile.className).toContain('world-tile-neutral');
  expect(tile.textContent).toContain('All collections');
  await click(tile);
  expect(browse).toHaveBeenCalledOnce();
});

it('leaves out exactly the sagas whose World is a tile in the Worlds rail', async () => {
  // Pixar (0), Marvel (1) and DC (2) are tiles. Saga 3 has no World.
  const collections = [
    makeSaga(0, '10194'),
    makeSaga(1, '86311'),
    makeSaga(2, '263'),
    makeSaga(3),
  ];
  await mount(
    <div>
      <WorldsRail collections={collections} onOpenWorld={vi.fn()} />
      <CollectionsRail
        collections={collections}
        onOpenCollection={vi.fn()}
        onBrowse={vi.fn()}
      />
    </div>,
  );
  const railIds = [...host.querySelectorAll('[data-world-id]')].map(
    (tile) => tile.dataset.worldId,
  );
  expect(railIds).toEqual(['pixar', 'marvel', 'dc']);
  const cardIds = [...host.querySelectorAll('[data-saga-card]')].map(
    (card) => card.dataset.sagaCard,
  );
  expect(cardIds).toEqual(['saga-3']);
  expect(host.querySelector('[data-all-collections]')).not.toBeNull();
});

it('keeps the All collections tile when every saga belongs to a hidden World', async () => {
  const browse = vi.fn();
  // Skywalker Saga (Star Wars) and The Avengers (Marvel) are both hidden.
  await mount(
    <CollectionsRail
      collections={[makeSaga(0, '10'), makeSaga(1, '86311')]}
      onOpenCollection={vi.fn()}
      onBrowse={browse}
    />,
  );
  const rail = host.querySelector('ul[aria-label="All collections"]');
  expect(rail.querySelectorAll('[data-saga-card]')).toHaveLength(0);
  const tile = rail.querySelector('[data-all-collections]');
  expect(tile).not.toBeNull();
  await click(tile);
  expect(browse).toHaveBeenCalledOnce();
});

it('leaves out the All collections tile when the row already shows three or fewer sagas', async () => {
  await mount(
    <CollectionsRail
      collections={[makeSaga(0), makeSaga(1), makeSaga(2)]}
      onBrowse={vi.fn()}
    />,
  );
  expect(host.querySelectorAll('[data-saga-card]')).toHaveLength(3);
  expect(host.querySelector('[data-all-collections]')).toBeNull();
});

it('puts the Worlds rail under a Tonight-style eyebrow', async () => {
  await mount(
    <WorldsRail
      collections={[
        makeSaga(0, '86311'),
        makeSaga(1, '10'),
        makeSaga(2, '1241'),
      ]}
      onOpenWorld={vi.fn()}
    />,
  );
  expect(host.querySelectorAll('[data-world-id]')).toHaveLength(3);
  const eyebrow = host.querySelector('h3');
  expect(eyebrow.textContent).toBe('Worlds');
  expect(eyebrow.className).toContain('uppercase');
  expect(host.querySelector('h2')).toBeNull();
});

it('hides the Collections row when there are no sagas', async () => {
  await mount(<CollectionsRail collections={[]} onBrowse={vi.fn()} />);
  expect(host.querySelector('[aria-label="Collections"]')).toBeNull();
});

it('keeps World pages to the title and shelves: no search, sort, chips or visible counts', async () => {
  await mount(
    <CollectionsBrowseView
      initialWorldId="marvel"
      collections={[makeSaga(0, '86311'), makeSaga(1, '131292')]}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  expect(host.querySelector('#saga-search')).toBeNull();
  expect(host.querySelector('#saga-sort')).toBeNull();
  expect(host.querySelector('nav[aria-label="Jump to a saga"]')).toBeNull();
  const visible = host.querySelector('[data-saga-shelf]').cloneNode(true);
  visible.querySelectorAll('.sr-only').forEach((node) => node.remove());
  const visibleText = visible.textContent;
  expect(visibleText).not.toMatch(/\d+ of \d+/);
  const shelfContext = host.querySelector('[data-saga-shelf] .sr-only');
  expect(shelfContext.textContent).toContain('1 of 2 watched on your shelf');
});

it('renders Tonight tiles and a World page without React warnings', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await mount(
      <>
        <WorldsRail
          collections={[makeSaga(0, '86311')]}
          onOpenWorld={vi.fn()}
        />
        <CollectionsRail
          collections={[makeSaga(0, '86311')]}
          onBrowse={vi.fn()}
        />
      </>,
    );
    await act(async () => root.unmount());
    host.remove();
    await mount(
      <CollectionsBrowseView
        initialWorldId="marvel"
        collections={[makeSaga(0, '86311')]}
        onClose={vi.fn()}
        onOpenCollection={vi.fn()}
      />,
    );
    expect(errors).not.toHaveBeenCalled();
  } finally {
    errors.mockRestore();
  }
});
