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
    { id: `w-${i}`, status: 'watched', markedWatchedAt: now - i * 1000 },
    { id: `u-${i}`, status: 'unwatched' },
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
it.each([0, 1, 25, 50])(
  'caps Tonight and opens full browser for %i sagas',
  async (size) => {
    const open = vi.fn();
    const browse = vi.fn();
    await mount(
      <CollectionsRail
        collections={Array.from({ length: size }, (_, i) => makeSaga(i))}
        onOpenCollection={open}
        onBrowse={browse}
      />,
    );
    expect(host.querySelectorAll('h3').length).toBe(Math.min(size, 2));
    await click(button(`Browse all ${size}`));
    expect(browse).toHaveBeenCalledOnce();
    if (size) {
      await click(button('Saga 00'));
      expect(open.mock.calls[0][0].id).toBe('saga-0');
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
it('opens Worlds, bypasses single-saga Worlds, and restores overview search/focus/scroll', async () => {
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
  expect(open.mock.calls[0][0].id).toBe('saga-2');
  const marvel = button('Marvel');
  marvel.focus();
  const scroller = host.querySelector('.overflow-y-auto');
  scroller.scrollTop = 180;
  await click(marvel);
  expect(host.querySelector('h1').textContent).toBe('Marvel');
  expect(host.textContent).toContain(
    '2 sagas · 4 films on your shelf · 2 unwatched',
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

it('removes an undone watch shortcut without replacing it or reordering its neighbor', async () => {
  const collections = [makeSaga(0), makeSaga(1), makeSaga(2)];
  await mount(
    <CollectionsRail
      collections={collections}
      onBrowse={vi.fn()}
      onOpenCollection={vi.fn()}
    />,
  );
  const changed = collections.map((saga, index) =>
    index === 0
      ? {
          ...saga,
          items: saga.items.map((item) => ({
            ...item,
            status: 'unwatched',
            markedWatchedAt: null,
          })),
        }
      : saga,
  );
  await act(async () =>
    root.render(
      <CollectionsRail
        collections={changed}
        onBrowse={vi.fn()}
        onOpenCollection={vi.fn()}
      />,
    ),
  );
  expect([...host.querySelectorAll('h3')].map((h) => h.textContent)).toEqual([
    'Saga 01',
  ]);
});
