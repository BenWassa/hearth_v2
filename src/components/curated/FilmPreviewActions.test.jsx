import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import FilmPreview from './FilmPreview.jsx';
import { getMediaDetails } from '../../services/mediaApi/client.js';
vi.mock('../../services/mediaApi/client.js', () => ({
  getMediaDetails: vi.fn(),
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, host;
const film = { id: 'test', tmdbId: 1234567, title: 'Film', year: 2000 };
const mount = async (props = {}) => {
  getMediaDetails.mockResolvedValue({
    provider: 'tmdb',
    providerId: String(film.tmdbId),
    type: 'movie',
    title: 'Verified film',
  });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () =>
    root.render(<FilmPreview film={film} onClose={() => {}} {...props} />),
  );
};
const button = (text) =>
  [...host.querySelectorAll('button')].find((el) =>
    el.textContent.includes(text),
  );
const click = async (el) => act(async () => el.click());
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  vi.clearAllMocks();
});
it('requires an explicit Add and sends the exact verified movie identity without silent restore', async () => {
  const onAddItem = vi.fn().mockResolvedValue({ status: 'added' });
  await mount({
    onAddItem,
    items: [
      {
        title: film.title,
        type: 'movie',
        source: { provider: 'tmdb', providerId: '999' },
      },
    ],
  });
  await act(async () =>
    host.querySelector('section').dispatchEvent(new Event('scroll')),
  );
  expect(onAddItem).not.toHaveBeenCalled();
  await click(button('Add to Library'));
  expect(onAddItem).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      type: 'movie',
      source: expect.objectContaining({
        provider: 'tmdb',
        providerId: String(film.tmdbId),
      }),
      media: expect.objectContaining({ title: 'Verified film' }),
    }),
    { allowRestore: false },
  );
  expect(host.textContent).toContain('Added to your Library.');
  expect(button('Add to Library')).toBeUndefined();
});
it.each(['exists', 'restored', 'failed'])(
  'reports %s accurately',
  async (status) => {
    const onAddItem = vi.fn().mockResolvedValue({ status });
    await mount({ onAddItem });
    await click(button('Add to Library'));
    expect(host.textContent).toContain(
      {
        exists: 'Already in your Library.',
        restored: 'Restored to your Library.',
        failed: 'Could not confirm the save.',
      }[status],
    );
    if (status === 'failed') {
      onAddItem.mockResolvedValue({ status: 'added' });
      await click(button('Retry'));
      expect(onAddItem).toHaveBeenCalledTimes(2);
    }
  },
);
it('blocks double submit while saving and supports retry after rejection', async () => {
  let reject;
  const onAddItem = vi.fn(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  await mount({ onAddItem });
  await click(button('Add to Library'));
  expect(button('Saving').disabled).toBe(true);
  await click(button('Saving'));
  expect(onAddItem).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  expect(button('Retry')).toBeTruthy();
});
it.each(['watched', 'unwatched'])(
  'shows real saved %s state without an Add',
  async (status) => {
    const onAddItem = vi.fn();
    const owned = {
      type: 'movie',
      source: { provider: 'tmdb', providerId: String(film.tmdbId) },
      userState: { status },
    };
    const onOpenItem = vi.fn();
    await mount({ items: [owned], onAddItem, onOpenItem });
    expect(host.textContent).toContain(
      status === 'watched' ? 'Watched' : 'In Library',
    );
    expect(button('Add to Library')).toBeUndefined();
    await click(button('Open Hearth details'));
    expect(onOpenItem).toHaveBeenCalledWith(owned);
    expect(onAddItem).not.toHaveBeenCalled();
  },
);
it('opens Recently removed without writing or silently restoring', async () => {
  const onAddItem = vi.fn(),
    onOpenRemoved = vi.fn();
  await mount({
    removedItems: [{ type: 'movie', mediaId: `tmdb:${film.tmdbId}` }],
    onAddItem,
    onOpenRemoved,
  });
  expect(button('Add to Library')).toBeUndefined();
  await click(button('Open Recently removed'));
  expect(onOpenRemoved).toHaveBeenCalledTimes(1);
  expect(onAddItem).not.toHaveBeenCalled();
});
it('handles a recently removed race without offering another add', async () => {
  const onAddItem = vi.fn().mockResolvedValue({ status: 'removed' });
  await mount({ onAddItem });
  await click(button('Add to Library'));
  expect(host.textContent).toContain('Restore it there');
  expect(button('Add to Library')).toBeUndefined();
});
