import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import CollectionsBrowseView from './CollectionsBrowseView.jsx';
import CollectionsRail from './components/tonight/CollectionsRail.jsx';
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
  [...host.querySelectorAll('button')].find((b) =>
    b.textContent.includes(text),
  );
const search = async (value) => {
  const input = host.querySelector('input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    ).set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
});
it.each([0, 1, 3, 25, 50])(
  'shows every represented World directly on Tonight for %i sagas',
  async (size) => {
    const openWorld = vi.fn();
    const browse = vi.fn();
    const ids = ['86311', '1241', '10', '10194', '386382', '263', '2150'];
    const collections = Array.from({ length: size }, (_, i) =>
      makeSaga(i, ids[i % ids.length]),
    );
    await mount(
      <CollectionsRail
        collections={collections}
        onOpenWorld={openWorld}
        onBrowse={browse}
      />,
    );
    expect(host.querySelectorAll('[data-world-id]')).toHaveLength(
      Math.min(size, ids.length),
    );
    await click(button(`Browse all ${size}`));
    expect(browse).toHaveBeenCalledOnce();
    if (size) {
      await click(button('Marvel'));
      expect(openWorld).toHaveBeenCalledWith('marvel', button('Marvel'));
    }
  },
);
it('makes 50 sagas searchable, handles no results, clear and A–Z', async () => {
  await mount(
    <CollectionsBrowseView
      collections={Array.from({ length: 50 }, (_, i) => makeSaga(i))}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  expect(host.querySelectorAll('h3')).toHaveLength(50);
  await search('SAGA 49 collection');
  expect(host.querySelectorAll('h3')).toHaveLength(1);
  expect(host.querySelector('h3').textContent).toBe('Saga 49');
  await search('nothing matches');
  expect(host.textContent).toContain('No sagas found');
  await click(button('Clear'));
  expect(host.querySelectorAll('h3')).toHaveLength(50);
  await act(async () => {
    const select = host.querySelector('select');
    select.value = 'az';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(
    [...host.querySelectorAll('h3')].slice(0, 2).map((h) => h.textContent),
  ).toEqual(['Saga 00', 'Saga 01']);
});
it('opens every World including singletons and restores overview focus and scroll', async () => {
  const open = vi.fn();
  const collections = [
    makeSaga(0, '86311'),
    makeSaga(1, '131292'),
    makeSaga(2, '10'),
    ...Array.from({ length: 4 }, (_, i) => makeSaga(i + 3)),
  ];
  await mount(
    <CollectionsBrowseView
      collections={collections}
      onClose={vi.fn()}
      onOpenCollection={open}
    />,
  );
  await click(button('Star Wars'));
  expect(host.querySelector('h1').textContent).toBe('Star Wars');
  expect(open).not.toHaveBeenCalled();
  await click(button('All collections'));
  await act(
    async () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  const marvel = button('Marvel');
  marvel.focus();
  const scroller = host.querySelector('.overflow-y-auto');
  scroller.scrollTop = 180;
  await click(marvel);
  expect(host.querySelector('h1').textContent).toBe('Marvel');
  expect(host.textContent).toContain(
    '2 sagas · 4 feature films on your shelf · 2 unwatched',
  );
  expect(host.querySelectorAll('h3')).toHaveLength(2);
  await click(button('All collections'));
  await act(
    async () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  expect(host.querySelector('h1').textContent).toBe('Collections');
  expect(document.activeElement).toBe(button('Marvel'));
  expect(scroller.scrollTop).toBe(180);
});
it('keeps order during live activity and provider enrichment; explicit refresh incorporates changes', async () => {
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
  await click(button('Refresh order'));
  expect(host.querySelector('h3').textContent).toBe('Saga 02');
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
    <CollectionsRail
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
      <CollectionsRail
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
  expect(host.querySelectorAll('h3')).toHaveLength(1);
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
  expect(host.querySelectorAll('h3')).toHaveLength(0);
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

it('exposes shared Show/Hide/Default controls including excluded metadata candidates', async () => {
  const change = vi.fn();
  const hidden = makeSaga(0, '488924');
  hidden.title = 'Paddington Collection';
  await mount(
    <CollectionsBrowseView
      collections={[]}
      allCollections={[hidden]}
      preferences={{ 'tmdb:488924': false }}
      onPreferenceChange={change}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  await click(button('Manage sagas'));
  const select = host.querySelector(
    '[aria-label="Visibility for Paddington Collection"]',
  );
  expect(select.value).toBe('false');
  await act(async () => {
    select.value = 'true';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(change).toHaveBeenLastCalledWith('tmdb:488924', true);
  await act(async () => {
    select.value = 'default';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(change).toHaveBeenLastCalledWith('tmdb:488924', null);
});

it('moves direct World navigation to the full overview with restored focus and a reset scroll', async () => {
  await mount(
    <CollectionsBrowseView
      initialWorldId="marvel"
      collections={[makeSaga(0, '86311')]}
      onClose={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  const scroller = host.querySelector('.overflow-y-auto');
  scroller.scrollTop = 130;
  await click(button('All collections'));
  await act(
    async () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  expect(scroller.scrollTop).toBe(0);
  expect(document.activeElement).toBe(
    host.querySelector('#collections-heading'),
  );
});

it('renders a bounded portrait hero and already-accessible saga on the first World page', async () => {
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
  expect(
    hero.querySelector('img[src="/assets/worlds/marvel/hero.webp"]'),
  ).not.toBeNull();
  expect(
    host.querySelector('[aria-label="All sagas"] h3').textContent,
  ).toContain('Saga 00');
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

it('retains readable landscape World cover labels when an image is corrupt', async () => {
  const openWorld = vi.fn();
  await mount(
    <CollectionsRail
      collections={[makeSaga(0, '86311')]}
      onOpenWorld={openWorld}
      onBrowse={vi.fn()}
    />,
  );
  const cover = host.querySelector('[data-world-id="marvel"]');
  expect(cover.className).toContain('aspect-video');
  expect(cover.querySelector('img').getAttribute('src')).toBe(
    '/assets/worlds/marvel/cover.webp',
  );
  await act(async () =>
    cover.querySelector('img').dispatchEvent(new Event('error')),
  );
  expect(cover.querySelector('img')).toBeNull();
  expect(cover.textContent).toContain('Marvel');
  await click(cover);
  expect(openWorld).toHaveBeenCalledWith('marvel', cover);
});

it.each([
  ['marvel', 'Marvel', true],
  ['dc', 'DC', true],
  ['pixar', 'Pixar', false],
  ['wizarding-world', 'Wizarding World', false],
])(
  'uses a readable heading without stacking logos in %s artwork',
  async (id, name, visible) => {
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
    // The image already contains typography; don't overlay PNG/SVG wordmarks.
    expect(hero.querySelector('img[src*="wordmark."]')).toBeNull();
    const image = hero.querySelector('img[src$="/hero.webp"]');
    expect(image).not.toBeNull();
    await act(async () => image.dispatchEvent(new Event('load')));
    expect(heading.classList.contains('sr-only')).toBe(!visible);
  },
);
