import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import DirectorsCollectionView from './DirectorsCollectionView.jsx';
import catalog from '../config/directorEssentials.json';
import { getMediaDetails } from '../services/mediaApi/client.js';
vi.mock('../services/mediaApi/client.js', () => ({ getMediaDetails: vi.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
const director = catalog.directors[0];
const first = director.films[0];
let root, host;
beforeEach(() => {
  window.history.replaceState({}, '');
  getMediaDetails.mockImplementation(async ({ providerId }) => ({
    provider: 'tmdb',
    providerId,
    type: 'movie',
    title: 'Verified film',
  }));
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  vi.clearAllMocks();
});
const mount = async (props) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<DirectorsCollectionView {...props} />));
};
const click = async (el) => {
  expect(el).toBeTruthy();
  await act(async () => el.click());
};
const button = (text) =>
  [...host.querySelectorAll('button')].find((el) =>
    el.textContent.includes(text),
  );
const open = async () =>
  click(host.querySelector(`[data-director-card="${director.id}"]`));
const section = (name) => host.querySelector(`section[aria-label="${name}"]`);
const owned = (film, status = 'watched') => ({
  type: 'movie',
  source: { provider: 'tmdb', providerId: String(film.tmdbId) },
  userState: { status },
});
const pop = async (state) =>
  act(async () => {
    window.history.replaceState(state, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  });
it('shows exactly the approved twelve in an accessible swipeable directory without writes', async () => {
  const onAddItem = vi.fn();
  await mount({ onAddItem });
  expect(
    [...host.querySelectorAll('[data-director-card]')].map(
      (el) => el.dataset.directorCard,
    ),
  ).toEqual(catalog.directors.map((d) => d.id));
  expect(host.textContent).not.toMatch(
    /Nolan|Tarantino|Campion|Coppola|Anderson|Spike Lee/,
  );
  const cards = host.querySelectorAll('[data-director-card]');
  cards[0].focus();
  await act(async () =>
    cards[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    ),
  );
  expect(document.activeElement).toBe(cards[1]);
  expect(getMediaDetails).not.toHaveBeenCalled();
  expect(onAddItem).not.toHaveBeenCalled();
});
it('skips watched films, caps Watch Next at three, and preserves fixed ranks through View all and household changes', async () => {
  await mount({ items: [owned(first)] });
  await open();
  expect(
    [...section('Watch Next').querySelectorAll('button')].map(
      (el) => el.textContent,
    ),
  ).toEqual(director.films.slice(1, 4).map((f) => `${f.title}${f.year}`));
  expect(section('Essential 10').querySelectorAll('li')).toHaveLength(5);
  await click(button('View all'));
  const titles = () =>
    [...section('Essential 10').querySelectorAll('li')].map(
      (el) => el.querySelector('button').textContent,
    );
  director.films.forEach((f, i) =>
    expect(titles()[i]).toContain(
      `${f.rank}${f.rank <= 3 ? ', signature film' : ''}${f.title}${f.year}`,
    ),
  );
  await act(async () =>
    root.render(
      <DirectorsCollectionView items={director.films.map((f) => owned(f))} />,
    ),
  );
  expect(section('Watch Next')).toBeNull();
  expect(titles()).toHaveLength(director.films.length);
  await click(button('Show fewer'));
  expect(section('Essential 10').querySelectorAll('li')).toHaveLength(5);
});
it('shows fewer available Watch Next choices and includes absent films without claiming unseen', async () => {
  await mount({ items: director.films.slice(0, -1).map((f) => owned(f)) });
  await open();
  expect(section('Watch Next').querySelectorAll('button')).toHaveLength(1);
  expect(section('Watch Next').textContent).toContain('Not marked watched');
});
it('renders text scores, null fallback, dates and attribution', async () => {
  await mount();
  const d = catalog.directors.find((d) =>
    d.films.some((f) => f.rt.tomatometer == null || f.imdb.rating == null),
  );
  await click(host.querySelector(`[data-director-card="${d.id}"]`));
  if (button('View all')) await click(button('View all'));
  expect(section('Essential 10').textContent).toContain('n/a');
  expect(
    section('Essential 10').querySelector('[aria-label^="IMDb"]'),
  ).toBeTruthy();
  expect(host.textContent).toContain(
    'Scores from IMDb and Rotten Tomatoes, read 13 Nov 2026',
  );
  expect(host.textContent).toContain('not endorsed or certified by TMDB');
});
it('opens a nested modal, Escape closes only it, returns focus and retains profile scroll', async () => {
  await mount();
  await open();
  const state = window.history.state;
  const scroller = host.querySelector('.overflow-y-auto');
  scroller.scrollTop = 123;
  const opener = section('Essential 10').querySelector('button');
  await click(opener);
  expect(host.querySelectorAll('[role="dialog"]')).toHaveLength(2);
  const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  );
  expect(back).toHaveBeenCalledTimes(1);
  back.mockRestore();
  await pop(state);
  expect(host.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(document.activeElement).toBe(opener);
  expect(scroller.scrollTop).toBe(123);
});
it.each(['added', 'exists', 'restored', 'removed', undefined])(
  'adds explicitly with exact identity and reports %s honestly',
  async (status) => {
    const onAddItem = vi.fn().mockResolvedValue({ status });
    await mount({ onAddItem });
    await open();
    await click(section('Essential 10').querySelector('button'));
    expect(onAddItem).not.toHaveBeenCalled();
    await click(button('Add to shelf'));
    expect(onAddItem).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        source: expect.objectContaining({
          provider: 'tmdb',
          providerId: String(first.tmdbId),
        }),
      }),
      { allowRestore: false },
    );
    const messages = {
      added: 'Added to your shared shelf.',
      exists: 'Already on your shared shelf.',
      restored: 'Restored to your shared shelf.',
      removed: 'This title is in Recently removed.',
      undefined: 'Could not confirm the save.',
    };
    expect(host.textContent).toContain(messages[status]);
  },
);
it.each(['owned', 'removed', 'mismatch', 'failure'])(
  'guards Add for %s',
  async (scenario) => {
    if (scenario === 'mismatch')
      getMediaDetails.mockResolvedValue({
        provider: 'tmdb',
        providerId: 'wrong',
      });
    if (scenario === 'failure')
      getMediaDetails.mockRejectedValue(new Error('offline'));
    const onAddItem = vi.fn();
    await mount({
      onAddItem,
      items: scenario === 'owned' ? [owned(first)] : [],
      removedItems: scenario === 'removed' ? [owned(first)] : [],
    });
    await open();
    await click(section('Essential 10').querySelector('button'));
    expect(button('Add to shelf')).toBeUndefined();
    expect(onAddItem).not.toHaveBeenCalled();
  },
);
it('falls back gracefully when optional portrait/signature fail', async () => {
  await mount();
  await open();
  const images = [...host.querySelectorAll('img')].filter((el) =>
    el.src.includes('/directors/'),
  );
  await act(async () =>
    images.forEach((el) => el.dispatchEvent(new Event('error'))),
  );
  expect(host.querySelector('h2').textContent).toBe(director.name);
  expect(host.querySelector('img[src$="signature.svg"]')).toBeNull();
});

it('restores directory focus and both scroll positions after profile Back', async () => {
  await mount();
  const directoryState = window.history.state;
  const card = host.querySelector(`[data-director-card="${director.id}"]`);
  const rail = card.parentElement;
  rail.scrollLeft = 240;
  host.querySelector('.overflow-y-auto').scrollTop = 50;
  await click(card);
  const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  await click(host.querySelector('button[aria-label="Back to directors"]'));
  expect(back).toHaveBeenCalledOnce();
  back.mockRestore();
  await pop(directoryState);
  await act(
    async () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  const restored = host.querySelector(`[data-director-card="${director.id}"]`);
  expect(document.activeElement).toBe(restored);
  expect(restored.parentElement.scrollLeft).toBe(240);
  expect(host.querySelector('.overflow-y-auto').scrollTop).toBe(50);
});

it('pushes one directory history entry under StrictMode and closes on directory Back', async () => {
  const onClose = vi.fn();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const push = vi.spyOn(window.history, 'pushState');
  const baseline = window.history.state;
  await act(async () =>
    root.render(
      <React.StrictMode>
        <DirectorsCollectionView onClose={onClose} />
      </React.StrictMode>,
    ),
  );
  expect(push).toHaveBeenCalledOnce();
  push.mockRestore();
  await pop(baseline);
  expect(onClose).toHaveBeenCalledOnce();
});
