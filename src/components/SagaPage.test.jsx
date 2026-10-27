import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SagaPage from './SagaPage.jsx';

let providerState;
vi.mock('../hooks/useCollectionDetails.js', () => ({
  default: () => providerState,
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
const film = (id, title, status = 'unwatched', runtimeMinutes = 100) => ({
  id: `item-${id}`,
  type: 'movie',
  source: { provider: 'tmdb', providerId: id },
  providerId: id,
  title,
  status,
  runtimeMinutes,
  year: '2020',
});
const saga = (items, providerId = '86311') => ({
  id: `collection:tmdb:${providerId}`,
  collection: { provider: 'tmdb', providerId },
  title: providerId === '645' ? 'James Bond Collection' : 'Test Collection',
  items,
  totalCount: items.length,
  watchedCount: items.filter((item) => item.status === 'watched').length,
  nextItem: items.find((item) => item.status !== 'watched'),
});
const render = async (collection, props = {}) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      <SagaPage
        isOpen
        collection={collection}
        onClose={vi.fn()}
        onOpenItem={vi.fn()}
        {...props}
      />,
    ),
  );
};
const button = (label) =>
  [...host.querySelectorAll('button')].find(
    (b) => b.getAttribute('aria-label') === label,
  );
beforeEach(() => {
  providerState = { data: null, loading: false, error: null };
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
});
it('separates provider shorts from owned feature progress and keeps unowned films distinct', async () => {
  const feature = film('1', 'First feature', 'watched');
  const short = film('2', 'Seven-minute short', 'watched', 7);
  providerState.data = {
    parts: [feature, short, film('3', 'Unowned sequel', 'unwatched', 110)],
  };
  await render(saga([feature, short]));
  expect(host.textContent).toContain('1 of 1 watched');
  expect(host.textContent).toContain('2 films in the feature saga');
  expect(
    host.querySelector('[aria-label="Shorts and specials"]').textContent,
  ).toContain('Seven-minute short');
  expect(button('Add Unowned sequel to shelf')).toBeTruthy();
  expect(host.textContent).not.toContain('Next Up');
});
it('does not claim a verified feature total when provider classification is incomplete', async () => {
  providerState.data = {
    parts: [
      film('1', 'First feature'),
      { providerId: '4', title: 'Unknown format', runtimeMinutes: null },
    ],
  };
  await render(saga([film('1', 'First feature')]));
  expect(host.textContent).toContain('2 films listed by provider');
  expect(host.textContent).not.toContain('2 films in the feature saga');
});
it('retains owned features and meaningful fallback on provider failure', async () => {
  providerState.error = new Error('offline');
  await render(saga([film('1', 'Owned feature')]));
  expect(button('Open Owned feature')).toBeTruthy();
  expect(host.textContent).toContain('1 film on your shelf');
  expect(host.textContent).toContain('Full series details are unavailable');
});
it('treats James Bond as an explorable franchise without fabricated next-up sequence', async () => {
  await render(
    saga(
      [film('1', 'From one continuity'), film('2', 'From another continuity')],
      '645',
    ),
  );
  expect(host.textContent).toContain('Explore films');
  expect(host.textContent).not.toContain('Next Up');
  expect(host.querySelector('[aria-label*="in saga order"]')).toBeNull();
});
it('opens a shelf film while keeping the saga page mounted for focus return', async () => {
  const onClose = vi.fn();
  const onOpenItem = vi.fn();
  const item = film('1', 'Owned feature');
  await render(saga([item]), { onClose, onOpenItem });
  await act(async () => button('Open Owned feature').click());
  expect(onOpenItem).toHaveBeenCalledWith(item);
  expect(onClose).not.toHaveBeenCalled();
  expect(host.querySelector('[role="dialog"]')).not.toBeNull();
});

it('retains short ownership even when the saga rollup contains only features', async () => {
  const feature = film('1', 'Owned feature');
  const short = {
    ...film('2', 'Owned short', 'watched', 7),
    collection: { provider: 'tmdb', providerId: '86311' },
  };
  providerState.data = { parts: [feature, short] };
  await render(saga([feature]), { householdItems: [feature, short] });
  expect(button('Open Owned short')).toBeTruthy();
  expect(button('Add Owned short to shelf')).toBeFalsy();
  expect(host.textContent).toContain('0 of 1 watched');
});

it('keeps provider-listed films not on the shelf apart from owned films', async () => {
  const owned = film('1', 'Owned feature', 'watched');
  providerState.data = {
    parts: [owned, film('3', 'Unowned sequel', 'unwatched', 110)],
  };
  const onOpenItem = vi.fn();
  await render(saga([owned]), { onOpenItem });
  const unowned = host.querySelector('[aria-label="Not on your shelf"]');
  expect(unowned.textContent).toContain('Unowned sequel');
  expect(unowned.textContent).not.toContain('Owned feature');
  expect(unowned.textContent).toContain('Not on your shelf');
  await act(async () => button('Add Unowned sequel to shelf').click());
  expect(onOpenItem).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Unowned sequel', owned: false }),
  );
});

it('shows owned films in release order with a watched check and no numbering', async () => {
  const later = film('2', 'Later film', 'unwatched');
  later.year = '2022';
  const first = film('1', 'Earlier film', 'watched');
  first.year = '2018';
  await render(saga([later, first]));
  const titles = [...host.querySelectorAll('button[aria-label^="Open "]')].map(
    (node) => node.getAttribute('aria-label'),
  );
  expect(titles).toEqual(['Open Earlier film', 'Open Later film']);
  expect(host.textContent).toContain('1 of 2 watched');
  expect(
    button('Open Earlier film').getAttribute('aria-describedby'),
  ).toBeTruthy();
  expect(host.querySelector('[aria-label*="in saga order"]')).toBeNull();
});

it('offers the next unwatched owned film for ordered sagas', async () => {
  const onOpenItem = vi.fn();
  const next = film('2', 'Second film');
  next.year = '2021';
  await render(saga([film('1', 'First film', 'watched'), next]), {
    onOpenItem,
  });
  const nextUp = [...host.querySelectorAll('button')].find((b) =>
    b.textContent.includes('Next up'),
  );
  expect(nextUp.textContent).toContain('Second film');
  await act(async () => nextUp.click());
  expect(onOpenItem).toHaveBeenCalledWith(next);
});

it('shows a skeleton, not previous parts, while provider data loads', async () => {
  providerState = { data: null, loading: true, error: null };
  await render(saga([film('1', 'Owned feature')]));
  expect(host.querySelector('[role="status"]').textContent).toContain(
    'Loading films',
  );
  expect(host.querySelector('[aria-label="Not on your shelf"]')).toBeNull();
  expect(host.querySelector('[aria-label="Shorts and specials"]')).toBeNull();
  expect(button('Open Owned feature')).toBeTruthy();
  expect(host.querySelector('.animate-pulse')).not.toBeNull();
});

it('is a labelled dialog with a visible serif title and a close control', async () => {
  const onClose = vi.fn();
  await render(saga([film('1', 'Owned feature')]), { onClose });
  const dialog = host.querySelector('[role="dialog"]');
  const title = host.querySelector(
    `#${dialog.getAttribute('aria-labelledby')}`,
  );
  expect(title.tagName).toBe('H1');
  expect(title.textContent).toBe('Test');
  await act(async () => button('Close collection').click());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('renders nothing when closed', async () => {
  await render(saga([film('1', 'Owned feature')]), { isOpen: false });
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});

it('groups provider sub-collections and keeps unlisted owned films', async () => {
  const owned = film('1', 'Owned feature');
  const stray = film('9', 'Stray owned feature');
  providerState.data = {
    parts: [owned],
    subCollections: [
      {
        id: 'sub-1',
        name: 'First Trilogy Collection',
        parts: [owned, film('3', 'Unowned sequel', 'unwatched', 110)],
      },
    ],
  };
  await render(saga([owned, stray]));
  expect(host.querySelector('[aria-label="First Trilogy"]')).not.toBeNull();
  expect(button('Add Unowned sequel to shelf')).toBeTruthy();
  expect(
    host.querySelector('[aria-label="More on your shelf"]').textContent,
  ).toContain('Stray owned feature');
});

it('lists provider films outside every sub-collection as not on the shelf', async () => {
  const owned = film('1', 'Owned feature');
  const grouped = film('3', 'Grouped unowned', 'unwatched', 110);
  const loose = film('4', 'Loose unowned', 'unwatched', 120);
  providerState.data = {
    parts: [owned, grouped, loose],
    subCollections: [
      {
        id: 'sub-1',
        name: 'First Trilogy Collection',
        parts: [owned, grouped],
      },
    ],
  };
  await render(saga([owned]));
  const section = host.querySelector('[aria-label="Not on your shelf"]');
  expect(section).not.toBeNull();
  expect(section.textContent).toContain('Loose unowned');
  expect(section.textContent).not.toContain('Grouped unowned');
});
