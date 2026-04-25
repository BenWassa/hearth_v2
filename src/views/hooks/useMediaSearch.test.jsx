import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import { searchMedia } from '../../services/mediaApi/client.js';
import { useMediaSearch } from './useMediaSearch.js';

vi.mock('../../services/mediaApi/client.js');

const makeResult = (providerId, title = `Title ${providerId}`) => ({
  provider: 'tmdb',
  providerId,
  type: 'movie',
  title,
});

const makeSearchResponse = ({ results, page = 1, totalPages = 1 }) => ({
  results,
  page,
  totalPages,
  totalResults: results.length,
});

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

let latestHookValue;

const HookHarness = ({ query, type = 'all' }) => {
  latestHookValue = useMediaSearch({ query, type });
  return null;
};

const renderHookHarness = async (props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const render = async (nextProps) => {
    await act(async () => {
      root.render(<HookHarness {...nextProps} />);
    });
  };

  await render(props);

  return {
    render,
    cleanup: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

describe('useMediaSearch', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    searchMedia.mockReset();
    latestHookValue = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the first page after debounce', async () => {
    searchMedia.mockResolvedValue(
      makeSearchResponse({
        results: [makeResult('1', 'Spirited Away')],
        page: 1,
        totalPages: 2,
      }),
    );
    const mounted = await renderHookHarness({ query: 'Spirited Away' });

    expect(searchMedia).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await flushPromises();

    expect(searchMedia).toHaveBeenCalledWith({
      q: 'Spirited Away',
      type: 'all',
      page: 1,
    });
    expect(latestHookValue.results).toHaveLength(1);
    expect(latestHookValue.results[0].title).toBe('Spirited Away');
    expect(latestHookValue.hasMore).toBe(true);

    await mounted.cleanup();
  });

  it('appends page 2 results when loadMore is called', async () => {
    searchMedia
      .mockResolvedValueOnce(
        makeSearchResponse({
          results: [makeResult('1')],
          page: 1,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(
        makeSearchResponse({
          results: [makeResult('2')],
          page: 2,
          totalPages: 2,
        }),
      );
    const mounted = await renderHookHarness({ query: 'Matrix' });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await flushPromises();
    await act(async () => {
      await latestHookValue.loadMore();
    });

    expect(searchMedia).toHaveBeenLastCalledWith({
      q: 'Matrix',
      type: 'all',
      page: 2,
    });
    expect(latestHookValue.results.map((result) => result.providerId)).toEqual([
      '1',
      '2',
    ]);
    expect(latestHookValue.hasMore).toBe(false);

    await mounted.cleanup();
  });

  it('resets accumulated results when the query changes', async () => {
    searchMedia.mockResolvedValue(
      makeSearchResponse({
        results: [makeResult('1')],
        page: 1,
        totalPages: 1,
      }),
    );
    const mounted = await renderHookHarness({ query: 'Alien' });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await flushPromises();
    expect(latestHookValue.results).toHaveLength(1);

    await mounted.render({ query: 'Aliens' });

    expect(latestHookValue.results).toEqual([]);
    expect(latestHookValue.hasMore).toBe(false);

    await mounted.cleanup();
  });

  it('ignores stale earlier responses after a newer query starts', async () => {
    const firstSearch = createDeferred();
    const secondSearch = createDeferred();
    searchMedia
      .mockReturnValueOnce(firstSearch.promise)
      .mockReturnValueOnce(secondSearch.promise);

    const mounted = await renderHookHarness({ query: 'Star' });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await mounted.render({ query: 'Stargate' });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      secondSearch.resolve(
        makeSearchResponse({
          results: [makeResult('2', 'Stargate')],
          page: 1,
          totalPages: 1,
        }),
      );
      await secondSearch.promise;
    });
    await act(async () => {
      firstSearch.resolve(
        makeSearchResponse({
          results: [makeResult('1', 'Star')],
          page: 1,
          totalPages: 1,
        }),
      );
      await firstSearch.promise;
    });

    expect(latestHookValue.results).toEqual([makeResult('2', 'Stargate')]);

    await mounted.cleanup();
  });

  it('sets hasMore false when the loaded page reaches totalPages', async () => {
    searchMedia.mockResolvedValue(
      makeSearchResponse({
        results: [makeResult('1')],
        page: 1,
        totalPages: 1,
      }),
    );
    const mounted = await renderHookHarness({ query: 'Arrival' });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await flushPromises();

    expect(latestHookValue.hasMore).toBe(false);

    await mounted.cleanup();
  });
});
