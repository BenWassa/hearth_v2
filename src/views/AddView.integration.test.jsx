import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import AddView from './AddView';
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
    ).find((button) => button.textContent.includes('Put on Shelf'));
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

    await cleanupDom(mounted);
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
});
