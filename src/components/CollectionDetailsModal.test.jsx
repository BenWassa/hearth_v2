import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CollectionDetailsModal from './CollectionDetailsModal.jsx';

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
      <CollectionDetailsModal
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
it('opens a shelf film while keeping saga navigation mounted for focus return', async () => {
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
