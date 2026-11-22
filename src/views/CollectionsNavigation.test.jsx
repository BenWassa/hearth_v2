import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { useViewHistory } from '../app/useViewHistory.js';
import TonightView from './TonightView.jsx';
import { buildCollectionFixture } from '../template/collectionFixtures.js';
vi.mock('../hooks/useCollectionPartCounts.js', () => ({
  default: () => new Map(),
}));
vi.mock('../hooks/useCollectionDetails.js', () => ({
  default: () => ({ data: null, loading: false, error: new Error('offline') }),
}));
vi.mock('./components/tonight/HeroCarousel.jsx', () => ({
  default: () => null,
}));
vi.mock('./components/tonight/SuggestionSection.jsx', () => ({
  default: () => null,
}));
vi.mock('./components/tonight/TonightHeaderMenu.jsx', () => ({
  default: () => null,
}));
vi.mock('./components/tonight/BottomNav.jsx', () => ({ default: () => null }));
vi.mock('../components/ItemDetailsModal.jsx', async () => {
  const { default: Dialog } = await import('../components/ui/Dialog.jsx');
  return {
    default: ({ isOpen, item, onClose }) =>
      isOpen ? (
        <Dialog onClose={onClose} aria-label="Film details">
          <button onClick={onClose}>Film details: {item.title}</button>
        </Dialog>
      ) : null,
  };
});
global.IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => window.history.replaceState(null, '', '/'));

const afterBack = async (trigger) => {
  await act(async () => {
    await new Promise((resolve) => {
      window.addEventListener('popstate', resolve, { once: true });
      trigger();
    });
  });
  await act(
    async () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
};

it.each(['system Back', 'in-app Back'])(
  'returns from the Collections index to Tonight with %s',
  async (method) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    function Harness() {
      const { view } = useViewHistory('tonight');
      return (
        <div data-view={view}>
          <TonightView items={buildCollectionFixture({ count: 25 })} />
        </div>
      );
    }

    try {
      await act(async () => root.render(<Harness />));
      const tile = host.querySelector('[data-all-collections]');
      await act(async () => tile.click());
      expect(window.history.state.__hearthNavigation).toEqual({
        view: 'tonight',
        depth: 1,
      });
      expect(host.querySelector('#collections-heading').textContent).toBe(
        'Collections',
      );
      await afterBack(() => {
        if (method === 'system Back') window.history.back();
        else host.querySelector('[aria-label="Back to Tonight"]').click();
      });
      expect(window.history.state.__hearthNavigation.depth).toBe(0);
      expect(host.querySelector('#collections-heading')).toBeNull();
      expect(host.querySelector('[data-view]').dataset.view).toBe('tonight');
      expect(document.activeElement).toBe(tile);
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  },
);

it('opens any saga, preserves search and scroll through details, and reaches its next film', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const button = (text) =>
    [...host.querySelectorAll('button')].find(
      (node) =>
        !node.closest('[inert]') &&
        (node.textContent.toLowerCase().includes(text.toLowerCase()) ||
          node
            .getAttribute('aria-label')
            ?.toLowerCase()
            .includes(text.toLowerCase())),
    );
  const click = async (node) => {
    await act(async () => {
      node.focus();
      node.click();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });
  };
  try {
    await act(async () =>
      root.render(
        <TonightView items={buildCollectionFixture({ count: 25 })} />,
      ),
    );
    await click(button('All collections'));
    expect(
      host.querySelector('[aria-labelledby="collections-heading"]'),
    ).not.toBeNull();
    const browserScroller = host.querySelector(
      '[aria-labelledby="collections-heading"] .overflow-y-auto',
    );
    expect(host.querySelector('#saga-search')).toBeNull();
    browserScroller.scrollTop = 52;
    await click(button('The Avengers'));
    expect(host.textContent).toMatch(/\d+ of \d+ watched/);
    expect(host.textContent).toContain('Full series details are unavailable');
    expect(window.history.state.__hearthNavigation.depth).toBe(2);
    await afterBack(() => window.history.back());
    expect(window.history.state.__hearthNavigation.depth).toBe(1);
    expect(browserScroller.isConnected).toBe(true);
    expect(host.textContent).not.toContain(
      'Full series details are unavailable',
    );
    expect(browserScroller.scrollTop).toBe(52);
    expect(document.activeElement.textContent).toContain('The Avengers');
    await click(button('The Avengers'));
    await click(button('Next up'));
    expect(host.textContent).toContain('Film details: Avengers: Age of Ultron');
    expect(window.history.state.__hearthNavigation.depth).toBe(3);
    await afterBack(() => window.history.back());
    expect(host.textContent).not.toContain('Film details:');
    expect(host.textContent).toContain('Full series details are unavailable');
    expect(window.history.state.__hearthNavigation.depth).toBe(2);
    expect(document.activeElement.textContent.toLowerCase()).toContain(
      'next up',
    );
    await afterBack(() => window.history.forward());
    expect(host.textContent).toContain('Film details: Avengers: Age of Ultron');
    await afterBack(() => button('Film details:').click());
    expect(host.textContent).not.toContain('Film details:');
    expect(window.history.state.__hearthNavigation.depth).toBe(2);
    const closeSaga = [...host.querySelectorAll('button')].find(
      (node) => node.getAttribute('aria-label') === 'Close collection',
    );
    expect(closeSaga).toBeDefined();
    await afterBack(() => closeSaga.click());
    await afterBack(() => window.history.back());
    expect(
      host.querySelector('[aria-labelledby="collections-heading"]'),
    ).toBeNull();
    expect(document.activeElement.textContent).toContain('All collections');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('uses Tonight World tiles as direct entry points even when there is one saga', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const items = buildCollectionFixture({ count: 1 });
  try {
    await act(async () => root.render(<TonightView items={items} />));
    const marvel = host.querySelector('[data-world-id="marvel"]');
    expect(marvel).not.toBeNull();
    await act(async () => {
      marvel.focus();
      marvel.click();
    });
    expect(host.querySelector('#collections-heading').textContent).toBe(
      'Marvel',
    );
    expect(host.querySelector('[data-saga-shelf] h2').textContent).toContain(
      'Avengers',
    );
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      ),
    );
    expect(host.querySelector('#collections-heading')).toBeNull();
    expect(document.activeElement).toBe(marvel);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('restores the index on Forward while a rail World is open', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(<TonightView items={buildCollectionFixture({ count: 1 })} />),
    );
    await act(async () => host.querySelector('[data-all-collections]').click());
    await afterBack(() => window.history.back());
    await act(async () =>
      host.querySelector('[data-world-id="marvel"]').click(),
    );
    expect(host.querySelector('#collections-heading').textContent).toBe(
      'Marvel',
    );
    await afterBack(() => window.history.forward());
    expect(host.querySelector('#collections-heading').textContent).toBe(
      'Collections',
    );
    await afterBack(() =>
      host.querySelector('[aria-label="Back to Tonight"]').click(),
    );
    expect(host.querySelector('#collections-heading')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('skips a restored saga that is no longer eligible', async () => {
  window.history.replaceState(
    { __hearthNavigation: { view: 'tonight', depth: 0 } },
    '',
  );
  window.history.pushState(
    {
      __hearthNavigation: { view: 'tonight', depth: 1 },
      __hearthCollectionsIndex: { collectionId: null },
    },
    '',
  );
  window.history.pushState(
    {
      __hearthNavigation: { view: 'tonight', depth: 2 },
      __hearthCollectionsIndex: { collectionId: 'missing-saga' },
    },
    '',
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const skipped = new Promise((resolve) => {
      window.addEventListener('popstate', resolve, { once: true });
    });
    await act(async () => root.render(<TonightView items={[]} />));
    await act(async () => {
      await skipped;
    });
    expect(host.querySelector('#collections-heading').textContent).toBe(
      'Collections',
    );
    expect(window.history.state.__hearthNavigation.depth).toBe(1);
    await afterBack(() => window.history.back());
    expect(host.querySelector('#collections-heading')).toBeNull();
    expect(window.history.state.__hearthNavigation.depth).toBe(0);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('keeps fifty editorially eligible fixture sagas reachable without a World limit', async () => {
  const { buildCollectionRollups } = await import(
    '../domain/media/collections.js'
  );
  const { distinctShelfItems, isFeatureFilm, filterEligibleCollections } =
    await import('../domain/media/collectionEligibility.js');
  const candidates = buildCollectionRollups(
    distinctShelfItems(buildCollectionFixture({ count: 50 })).filter(
      isFeatureFilm,
    ),
  ).filter((entry) => entry.type === 'collection');
  expect(filterEligibleCollections(candidates)).toHaveLength(50);
});

it('renders Tonight and the Collections index without reading household preferences', async () => {
  const prefs = await import('../services/firebase/collectionPreferences.js');
  const subscribe = vi
    .spyOn(prefs, 'subscribeCollectionPreferences')
    .mockImplementation(({ onError }) => {
      onError?.(new Error('Missing or insufficient permissions.'));
      return () => {};
    });
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <TonightView
          items={buildCollectionFixture({ count: 25 })}
          spaceId="space-1"
        />,
      ),
    );
    // Worlds are there immediately: no spinner, empty state or error.
    expect(host.querySelectorAll('[data-world-id]').length).toBeGreaterThan(0);
    expect(host.textContent).not.toContain('Could not load');
    expect(host.textContent).not.toContain('Loading your household');
    const all = host.querySelector('[data-all-collections]');
    await act(async () => {
      all.focus();
      all.click();
    });
    expect(host.querySelectorAll('[aria-label="All sagas"] h3')).toHaveLength(
      25,
    );
    expect(host.textContent).not.toContain('Manage sagas');
    expect(host.textContent).not.toContain('Could not load');
    expect(subscribe).not.toHaveBeenCalled();
  } finally {
    subscribe.mockRestore();
    await act(async () => root.unmount());
    host.remove();
  }
});

it('opens a saga from the Tonight Collections row and returns focus to the same card', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <TonightView items={buildCollectionFixture({ count: 25 })} />,
      ),
    );
    const card = host.querySelector('[data-saga-card]');
    expect(card).not.toBeNull();
    await act(async () => {
      card.focus();
      card.click();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });
    expect(host.textContent).toMatch(/\d+ of \d+ watched/);
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(document.activeElement).toBe(card);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
