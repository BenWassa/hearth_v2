import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CuratedPackPage from '../../views/CuratedPackPage.jsx';
import { getMediaDetails } from '../../services/mediaApi/client.js';

vi.mock('../../services/mediaApi/client.js', () => ({
  getMediaDetails: vi.fn(),
}));
vi.mock('../../services/firebase/watchlist.js', () => {
  const names = [
    'addWatchlistItem',
    'updateWatchlistStatus',
    'updateWatchlistItem',
    'deleteWatchlistItem',
    'bulkDeleteWatchlistItems',
    'removeWatchlistItems',
    'restoreWatchlistItems',
    'purgeRemovedWatchlistItems',
    'persistCatalogClassification',
    'wipeWatchlist',
  ];
  return Object.fromEntries(
    names.map((name) => [
      name,
      vi.fn(() => {
        throw new Error('Unexpected household write');
      }),
    ]),
  );
});
import * as householdWrites from '../../services/firebase/watchlist.js';
const expectNoWrites = () =>
  Object.values(householdWrites).forEach((write) =>
    expect(write).not.toHaveBeenCalled(),
  );
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root,
  host,
  observers,
  id = 800000;
const mount = async () => {
  const films = Array.from({ length: 5 }, (_, i) => ({
    id: `film-${i}`,
    title: `Film ${i}`,
    year: 2000 + i,
    tmdbId: ++id,
  }));
  const pack = {
    title: 'Black Comedy Excellence',
    featuredIds: [films[0].id],
    chapters: [
      { id: 'one', title: 'One', films: films.slice(0, 3) },
      { id: 'two', title: 'Two', films: films.slice(3) },
    ],
  };
  await act(async () =>
    root.render(<CuratedPackPage pack={pack} onClose={vi.fn()} />),
  );
  return films;
};
const intersect = async (index) =>
  act(async () => observers[index].callback([{ isIntersecting: true }]));
const click = async (node) =>
  act(async () => {
    node.focus();
    node.click();
  });
const back = async () =>
  act(async () => {
    await new Promise((resolve) => {
      window.addEventListener('popstate', resolve, { once: true });
      window.history.back();
    });
  });
beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        observers.push(this);
      }
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
    posterUrl: 'https://image.tmdb.org/t/p/w500/example.jpg',
    overview: 'Provider synopsis',
    runtimeMinutes: 90,
    genres: ['Comedy'],
  }));
  window.history.replaceState(
    {
      __hearthCuratedPack: 'black-comedy-excellence',
      __hearthNavigation: { view: 'tonight', depth: 1 },
    },
    '',
  );
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
it('loads only near rails, deduplicates featured films and caches preview requests', async () => {
  await mount();
  expect(getMediaDetails).not.toHaveBeenCalled();
  expect(observers).toHaveLength(3);
  expect(observers[0].options.root).toBe(
    host.querySelector('[data-curated-scroller]'),
  );
  await intersect(0);
  expect(getMediaDetails).toHaveBeenCalledTimes(1);
  await intersect(1);
  expect(getMediaDetails).toHaveBeenCalledTimes(3);
  expect(host.querySelectorAll('img')).toHaveLength(4);
  expect(host.querySelector('img').alt).toBe('');
  await click(host.querySelector('ul button'));
  expect(getMediaDetails).toHaveBeenCalledTimes(3);
  expect(host.querySelector('#curated-film-title').textContent).toBe('Film 0');
  expect(host.textContent).toContain('Provider synopsis');
  expect(host.textContent).toContain('90 min');
  expect(host.textContent).toContain('Comedy');
  expect(host.textContent).toContain('Add to Library');
  await act(async () =>
    host
      .querySelector('[data-curated-scroller]')
      .dispatchEvent(new Event('scroll')),
  );
  expectNoWrites();
  await back();
});
it('retains programme cards on failure, missing posters and image errors', async () => {
  getMediaDetails.mockRejectedValueOnce(new Error('offline'));
  await mount();
  await intersect(0);
  expect(host.querySelector('ul img')).toBeNull();
  expect(host.querySelector('ul button').textContent).toContain('2000');
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
  }));
  await intersect(1);
  expect(host.querySelectorAll('img')).toHaveLength(0);
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
    posterUrl: '/broken',
  }));
  await intersect(2);
  const image = host.querySelector('img');
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(image.isConnected).toBe(false);
});
it('opens from rows, traps focus, closes with Escape and Back, restores focus without closing the pack', async () => {
  await mount();
  const row = host.querySelector(
    '[aria-labelledby="curated-all-heading"] button',
  );
  await click(row);
  const close = host.querySelector('[aria-label="Close film details"]');
  expect(document.activeElement).toBe(close);
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  expect(document.activeElement).toBe(close);
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true }),
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await popped;
  });
  expect(host.querySelector('#curated-film-title')).toBeNull();
  expect(document.activeElement).toBe(row);
  expect(host.querySelector('#curated-pack-heading')).not.toBeNull();
  await click(row);
  await back();
  expect(document.activeElement).toBe(row);
  expect(window.history.state.__hearthCuratedPack).toBe(
    'black-comedy-excellence',
  );
  expectNoWrites();
});

it('shows an unavailable detail state and closes using the named close button', async () => {
  getMediaDetails.mockRejectedValue(new Error('offline'));
  await mount();
  const row = host.querySelector(
    '[aria-labelledby="curated-all-heading"] button',
  );
  await click(row);
  expect(host.textContent).toContain('Film details are unavailable right now.');
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true }),
    );
    host.querySelector('[aria-label="Close film details"]').click();
    await popped;
  });
  expect(host.querySelector('#curated-film-title')).toBeNull();
  expect(document.activeElement).toBe(row);
  expectNoWrites();
});
