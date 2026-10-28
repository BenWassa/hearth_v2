import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import AddView from './AddView';
import { useAppState } from '../app/useAppState.js';
import {
  subscribeWatchlist,
  addWatchlistItem,
} from '../services/firebase/watchlist.js';

vi.mock('../services/firebase/client.js', () => ({
  getAppId: () => 'test',
  initializeFirebase: (onReady) => {
    const client = { auth: { app: {} }, db: {} };
    onReady(client);
    return client;
  },
}));
vi.mock('../config/access.js', () => ({ isWhitelistedUid: () => true }));
vi.mock('../services/firebase/auth.js', () => ({
  subscribeToAuth: (_auth, callback) => {
    callback({ uid: 'test' });
    return () => {};
  },
  isAnonymousAuthUser: () => false,
  signInUser: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));
vi.mock('../services/firebase/watchlist.js');
vi.mock('../services/firebase/spaces.js', () => ({
  fetchUserSpaces: async () => [],
  fetchSpace: async () => ({ name: 'Test' }),
  joinSpace: vi.fn(),
  createOrJoinSpaceByName: vi.fn(),
}));
vi.mock('../services/mediaApi/classificationQueue.js', () => ({
  startClassificationBackfill: () => () => {},
}));
import { useMediaSearch } from './hooks/useMediaSearch';
import { getMediaDetails } from '../services/mediaApi/client';

vi.mock('./hooks/useMediaSearch');
vi.mock('../services/mediaApi/client');

const makeSearchResult = (providerId, title = `Title ${providerId}`) => ({
  provider: 'tmdb',
  providerId,
  type: 'movie',
  title,
  year: '2001',
});

const makeSearchState = (overrides = {}) => ({
  results: [],
  loading: false,
  loadingInitial: false,
  loadingMore: false,
  error: '',
  hasQuery: false,
  hasMore: false,
  loadMore: vi.fn(),
  ...overrides,
});

const renderIntoDom = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
};

const cleanupDom = async ({ container, root }) => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

describe('AddView integration', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    useMediaSearch.mockReturnValue(makeSearchState());
    getMediaDetails.mockReset();
  });

  it('submits enriched v2 payload when a search result is selected', async () => {
    useMediaSearch.mockReturnValue(
      makeSearchState({
        results: [
          {
            provider: 'tmdb',
            providerId: '123',
            type: 'movie',
            title: 'Spirited Away',
            year: '2001',
          },
        ],
        loading: false,
        error: '',
        hasQuery: true,
      }),
    );
    getMediaDetails.mockResolvedValue({
      provider: 'tmdb',
      providerId: '123',
      type: 'movie',
      title: 'Spirited Away',
      year: '2001',
      runtimeMinutes: 125,
      posterUrl: '/poster.jpg',
      backdropUrl: '/backdrop.jpg',
      genres: ['Animation'],
      cast: ['Actor A'],
    });

    const onSubmit = vi.fn();
    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={onSubmit} />,
    );

    const searchInput = mounted.container.querySelector(
      '[data-testid="live-search-input"]',
    );
    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      ).set;
      valueSetter.call(searchInput, 'Spirited Away');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const resultButton = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Spirited Away'));

    await act(async () => {
      resultButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    const enabledSubmitButton = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Add to Shelf'));
    expect(enabledSubmitButton.disabled).toBe(false);
    await act(async () => {
      enabledSubmitButton.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.schemaVersion).toBe(2);
    expect(payload.source.provider).toBe('tmdb');
    expect(payload.media.title).toBe('Spirited Away');
    expect(payload.userState.status).toBe('unwatched');
    expect(payload.userState.tagProvenance).toEqual({
      vibe: 'automatic',
      energy: 'automatic',
    });
    expect(payload.userState).not.toHaveProperty('vibe');
    expect(mounted.container.textContent).not.toContain('Vibe');
    expect(mounted.container.textContent).not.toContain('Energy');

    await cleanupDom(mounted);
  });

  it.each([
    { source: { provider: 'TMDB', providerId: 123 } },
    { mediaId: 'tmdb:123' },
  ])('marks and disables an owned result by identity: %j', async (owned) => {
    const result = makeSearchResult('123', 'Spirited Away');
    useMediaSearch.mockReturnValue(
      makeSearchState({ results: [result], hasQuery: true }),
    );
    getMediaDetails.mockResolvedValue(result);
    const onSubmit = vi.fn();
    const mounted = await renderIntoDom(
      <AddView items={[owned]} onSubmit={onSubmit} />,
    );
    const resultButton = [...mounted.container.querySelectorAll('button')].find(
      (button) => button.textContent.includes(result.title),
    );
    expect(resultButton.textContent).toContain('On your shelf');
    await act(async () => {
      resultButton.click();
    });
    const note = mounted.container.querySelector('#add-owned-note');
    expect(note.textContent).toBe('This title is already on your shelf.');
    const submit = [...mounted.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'On your shelf',
    );
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('aria-describedby')).toBe(note.id);
    await act(async () => {
      submit.click();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    await cleanupDom(mounted);
  });

  it.each(['A different title', 'Spirited Away'])(
    'adds an unowned identity with title %s',
    async (title) => {
      const result = makeSearchResult('456', title);
      useMediaSearch.mockReturnValue(
        makeSearchState({ results: [result], hasQuery: true }),
      );
      getMediaDetails.mockResolvedValue(result);
      const onSubmit = vi.fn();
      const mounted = await renderIntoDom(
        <AddView
          items={[
            {
              source: { provider: 'tmdb', providerId: '123' },
              title: 'Spirited Away',
            },
          ]}
          onSubmit={onSubmit}
        />,
      );
      await act(async () => {
        [...mounted.container.querySelectorAll('button')]
          .find((button) => button.textContent.includes(title))
          .click();
      });
      // The mocked search state supplies results without typing into the input.
      await act(async () => {
        const input = mounted.container.querySelector('input');
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        ).set.call(input, title);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => {
        [...mounted.container.querySelectorAll('button')]
          .find((button) => button.textContent.includes(title))
          .click();
      });
      const submit = [...mounted.container.querySelectorAll('button')].find(
        (button) => button.textContent === 'Add to Shelf',
      );
      expect(submit.disabled).toBe(false);
      await act(async () => {
        submit.click();
      });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0][0].source.providerId).toBe('456');
      await cleanupDom(mounted);
    },
  );

  it('keeps the save-time guard when view feedback has a stale shelf', async () => {
    localStorage.setItem('hearth_space_id', 'test-space');
    subscribeWatchlist.mockImplementation(({ onNext }) => {
      onNext({
        docs: [
          {
            id: 'owned',
            data: () => ({
              source: { provider: 'tmdb', providerId: '123' },
              title: 'Spirited Away',
              type: 'movie',
            }),
          },
        ],
      });
      return () => {};
    });
    addWatchlistItem.mockClear();
    let state;
    const Harness = () => {
      state = useAppState();
      return null;
    };
    const mounted = await renderIntoDom(<Harness />);
    await act(async () => {
      await state.handleAddItem({
        source: { provider: 'tmdb', providerId: '123' },
        media: { type: 'movie', title: 'Spirited Away' },
      });
    });
    expect(addWatchlistItem).not.toHaveBeenCalled();
    expect(JSON.stringify(state)).toContain('already on your shelf');
    await cleanupDom(mounted);
    localStorage.clear();
  });

  it('renders all loaded search results in the scroll list', async () => {
    useMediaSearch.mockReturnValue(
      makeSearchState({
        results: Array.from({ length: 7 }).map((_, index) =>
          makeSearchResult(String(index + 1)),
        ),
        hasQuery: true,
      }),
    );

    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={() => {}} />,
    );

    for (let index = 1; index <= 7; index += 1) {
      expect(mounted.container.textContent).toContain(`Title ${index}`);
    }

    await cleanupDom(mounted);
  });

  it('renders skeleton rows during the initial search load', async () => {
    useMediaSearch.mockReturnValue(
      makeSearchState({
        loading: true,
        loadingInitial: true,
        hasQuery: true,
      }),
    );

    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={() => {}} />,
    );

    expect(
      mounted.container.querySelectorAll(
        '[data-testid="search-result-skeleton"]',
      ),
    ).toHaveLength(3);

    await cleanupDom(mounted);
  });

  it('renders bottom skeleton rows while loading more results', async () => {
    useMediaSearch.mockReturnValue(
      makeSearchState({
        results: [makeSearchResult('1')],
        loadingMore: true,
        hasQuery: true,
        hasMore: true,
      }),
    );

    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={() => {}} />,
    );

    expect(
      mounted.container.querySelectorAll(
        '[data-testid="search-result-skeleton"]',
      ),
    ).toHaveLength(2);
    const loadMoreButton = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Loading more'));
    expect(loadMoreButton.disabled).toBe(true);

    await cleanupDom(mounted);
  });

  it('calls loadMore from the fallback load more button', async () => {
    const loadMore = vi.fn();
    useMediaSearch.mockReturnValue(
      makeSearchState({
        results: [makeSearchResult('1')],
        hasQuery: true,
        hasMore: true,
        loadMore,
      }),
    );

    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={() => {}} />,
    );

    const loadMoreButton = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Load more'));

    await act(async () => {
      loadMoreButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(loadMore).toHaveBeenCalledTimes(1);

    await cleanupDom(mounted);
  });

  it('labels the search input and marks only the first result as top match', async () => {
    useMediaSearch.mockReturnValue(
      makeSearchState({
        results: [makeSearchResult('1'), makeSearchResult('2')],
        hasQuery: true,
      }),
    );

    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={() => {}} />,
    );

    const input = mounted.container.querySelector(
      '[data-testid="live-search-input"]',
    );
    expect(
      mounted.container.querySelector(`label[for="${input.id}"]`),
    ).not.toBeNull();
    const matches = mounted.container.textContent.match(/Top match/g) || [];
    expect(matches).toHaveLength(1);

    await cleanupDom(mounted);
  });

  it('explains why Add to Shelf is disabled', async () => {
    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={() => {}} />,
    );

    const submit = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Add to Shelf'));
    expect(submit.disabled).toBe(true);
    const hint = mounted.container.querySelector(
      `#${submit.getAttribute('aria-describedby')}`,
    );
    expect(hint.textContent).toContain('Pick a title');

    await cleanupDom(mounted);
  });
});
