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
    art: { hero: '/pack-hero.webp' },
    featuredIds: [films[0].id],
    chapters: [
      { id: 'one', title: 'One', films: films.slice(0, 3) },
      { id: 'two', title: 'Two', films: [films[0], ...films.slice(3)] },
    ],
  };
  await act(async () =>
    root.render(
      <CuratedPackPage pack={pack} onClose={vi.fn()} onAddItem={vi.fn()} />,
    ),
  );
  return films;
};
const observerFor = (target) =>
  observers.find((observer) =>
    observer.observe.mock.calls.some(([node]) => node === target),
  );
const intersect = async (target) =>
  act(async () =>
    observerFor(target).callback([{ isIntersecting: true, target }]),
  );
const filmList = (label) => host.querySelector(`ul[aria-label="${label}"]`);
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
  getMediaDetails.mockReset();
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
      unobserve = vi.fn();
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
  expect(observerFor(filmList('Start here films')).options.root).toBe(
    host.querySelector('[data-curated-scroller]'),
  );
  await intersect(filmList('Start here films'));
  expect(getMediaDetails).toHaveBeenCalledTimes(1);
  await intersect(filmList('One films'));
  expect(getMediaDetails).toHaveBeenCalledTimes(3);
  expect(host.querySelectorAll('ul[aria-label] img')).toHaveLength(4);
  expect(host.querySelector('ul[aria-label] img').alt).toBe('');
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
  await intersect(filmList('Start here films'));
  expect(filmList('Start here films').querySelector('img')).toBeNull();
  expect(host.querySelector('ul button').textContent).toContain('2000');
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
  }));
  await intersect(filmList('One films'));
  expect(host.querySelectorAll('ul[aria-label] img')).toHaveLength(0);
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
    posterUrl: '/broken',
  }));
  await intersect(filmList('Two films'));
  const image = filmList('Two films').querySelector('img');
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(image.isConnected).toBe(false);
});
it('opens from grid posters, traps focus, closes with Escape and Back, restores focus without closing the pack', async () => {
  await mount();
  const tile = host.querySelector(
    '[aria-labelledby="curated-all-heading"] button',
  );
  await click(tile);
  const close = host.querySelector('[aria-label="Close film details"]');
  expect(document.activeElement).toBe(close);
  const controls = host.querySelectorAll(
    '[aria-labelledby="curated-film-title"] button',
  );
  expect(controls).toHaveLength(2);
  const tab = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  await act(async () => {
    controls[1].focus();
    expect(document.activeElement).toBe(controls[1]);
    controls[1].dispatchEvent(tab);
  });
  expect(tab.defaultPrevented).toBe(true);
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
  expect(document.activeElement).toBe(tile);
  expect(host.querySelector('#curated-pack-heading')).not.toBeNull();
  await click(tile);
  await back();
  expect(document.activeElement).toBe(tile);
  expect(window.history.state.__hearthCuratedPack).toBe(
    'black-comedy-excellence',
  );
  expectNoWrites();
});

it('shows an unavailable detail state and closes using the named close button', async () => {
  getMediaDetails.mockRejectedValue(new Error('offline'));
  await mount();
  const tile = host.querySelector(
    '[aria-labelledby="curated-all-heading"] button',
  );
  await click(tile);
  expect(host.textContent).toContain('Film details are unavailable right now.');
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true }),
    );
    host.querySelector('[aria-label="Close film details"]').click();
    await popped;
  });
  expect(host.querySelector('#curated-film-title')).toBeNull();
  expect(document.activeElement).toBe(tile);
  expectNoWrites();
});

it('shows text only as a poster fallback and keeps each rail button focusable', async () => {
  await mount();
  const rails = host.querySelectorAll('ul[aria-label]');
  const grid = filmList('All 5 films');
  expect(grid.querySelectorAll('button')).toHaveLength(5);
  expect([...rails]).toContain(grid);
  const tile = filmList('One films').querySelector('button');
  tile.focus();
  await intersect(filmList('One films'));
  expect(document.activeElement).toBe(tile);
  expect(tile.textContent).toContain('Film 0');
  const image = tile.querySelector('img');
  await act(async () => image.dispatchEvent(new Event('load')));
  expect(tile.textContent).toBe('');
  expect(tile.getAttribute('aria-label')).toBe('Film 0 (2000)');
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(tile.textContent).toContain('2000');
  expect(tile.textContent.match(/Film 0/g)).toHaveLength(1);

  for (const rail of rails) {
    expect(rail.hasAttribute('tabindex')).toBe(false);
    expect(rail.getAttribute('aria-label')).toBeTruthy();
    for (const button of rail.querySelectorAll('button')) {
      expect(button.tabIndex).toBe(0);
      button.focus();
      expect(document.activeElement).toBe(button);
    }
  }
  expectNoWrites();
});

it('deduplicates grid posters in chapter order and retries nearby cards online', async () => {
  getMediaDetails.mockRejectedValueOnce(new Error('offline'));
  const films = await mount();
  const cards = [
    ...host.querySelectorAll('[aria-labelledby="curated-all-heading"] li'),
  ];
  expect(cards.map((card) => card.querySelector('button').ariaLabel)).toEqual(
    films.map((film) => `${film.title} (${film.year})`),
  );
  const card = cards[3];
  expect(observerFor(card).observe).toHaveBeenCalledTimes(films.length);
  await intersect(card);
  expect(observerFor(card).unobserve).toHaveBeenCalledWith(card);
  expect(getMediaDetails).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ providerId: String(films[3].tmdbId) }),
  );
  expect(card.querySelector('img')).toBeNull();
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(getMediaDetails).toHaveBeenCalledTimes(2);
  const image = card.querySelector('img');
  expect(image.alt).toBe('');
  expect(cards[0].querySelector('img')).toBeNull();
  await act(async () => image.dispatchEvent(new Event('load')));
  expect(card.querySelector('button').textContent).toBe('');
  expectNoWrites();
});

it('refetches unavailable details on Try again without household writes', async () => {
  getMediaDetails.mockRejectedValue(new Error('offline'));
  await mount();
  await click(host.querySelector('ul button'));
  expect(host.textContent).toContain('Film details are unavailable right now.');
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
    type: 'movie',
    overview: 'Recovered synopsis',
  }));
  const calls = getMediaDetails.mock.calls.length;
  await click(
    [...host.querySelectorAll('button')].find(
      (el) => el.textContent === 'Try again',
    ),
  );
  expect(getMediaDetails).toHaveBeenCalledTimes(calls + 1);
  expect(host.textContent).toContain('Recovered synopsis');
  expectNoWrites();
  await back();
});

it('retries grid failures when the connection returns before the batch settles', async () => {
  let finishRequest;
  getMediaDetails.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRequest = resolve;
      }),
  );
  const films = await mount();
  const [failedCard, pendingCard] = filmList('All 5 films').children;
  await act(async () => {
    observerFor(failedCard).callback([
      { isIntersecting: true, target: failedCard },
      { isIntersecting: true, target: pendingCard },
    ]);
  });
  expect(getMediaDetails).toHaveBeenCalledTimes(2);
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(getMediaDetails).toHaveBeenCalledTimes(2);
  await act(async () => finishRequest(null));
  expect(
    getMediaDetails.mock.calls.map(([request]) => request.providerId),
  ).toEqual([films[0], films[1], films[0]].map((film) => String(film.tmdbId)));
  expect(failedCard.querySelector('img')).not.toBeNull();
});

it('loads decorative theme covers near the carousel and preserves the all-films backdrop', async () => {
  const films = await mount();
  const carousel = host.querySelector('nav ul');
  const [firstTile, , allTile] = carousel.querySelectorAll('button');
  expect(observerFor(carousel).options.root).toBe(
    host.querySelector('[data-curated-scroller]'),
  );
  expect(firstTile.querySelector('img')).toBeNull();
  expect(allTile.querySelector('img').getAttribute('src')).toBe(
    '/pack-hero.webp',
  );
  expect(getMediaDetails).not.toHaveBeenCalled();
  await intersect(carousel);
  expect(
    getMediaDetails.mock.calls.map(([request]) => request.providerId),
  ).toEqual(films.map((film) => String(film.tmdbId)));
  const covers = firstTile.querySelectorAll('[aria-hidden="true"] img');
  expect(covers).toHaveLength(3);
  expect([...covers].every((image) => image.alt === '')).toBe(true);
  expect(allTile.querySelectorAll('[aria-hidden="true"] img')).toHaveLength(1);
  await act(async () => covers[0].dispatchEvent(new Event('error')));
  expect(covers[0].isConnected).toBe(false);
  expect(firstTile.textContent).toBe('One3 films');
});
