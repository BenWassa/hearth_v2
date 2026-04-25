import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import { getCollectionDetails } from '../services/mediaApi/client.js';
import useCollectionSizes from './useCollectionSizes.js';

vi.mock('../services/mediaApi/client.js');

const originalFetch = global.fetch;

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

let latestHookValue;

const HookHarness = ({ collections }) => {
  latestHookValue = useCollectionSizes(collections);
  return null;
};

const renderHookHarness = async (props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<HookHarness {...props} />);
  });

  return {
    cleanup: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

const makeCollection = (providerId) => ({
  id: `collection:tmdb:${providerId}`,
  type: 'collection',
  collection: {
    provider: 'tmdb',
    providerId,
  },
});

describe('useCollectionSizes', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    getCollectionDetails.mockReset();
    latestHookValue = undefined;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns collection part counts keyed by rollup id', async () => {
    const collectionDetails = createDeferred();
    getCollectionDetails.mockReturnValueOnce(collectionDetails.promise);
    const mounted = await renderHookHarness({
      collections: [makeCollection('2002')],
    });

    expect(latestHookValue.get('collection:tmdb:2002')).toBeUndefined();
    await flushPromises();
    await act(async () => {
      collectionDetails.resolve({
        parts: [{ providerId: '1' }, { providerId: '2' }],
      });
      await collectionDetails.promise;
    });

    expect(getCollectionDetails).toHaveBeenCalledWith({
      provider: 'tmdb',
      providerId: '2002',
      locale: 'en-US',
    });
    expect(latestHookValue.get('collection:tmdb:2002')).toBe(2);

    await mounted.cleanup();
  });

  it('skips collection lookups when the local API is unavailable', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const mounted = await renderHookHarness({
      collections: [makeCollection('404')],
    });

    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith('/api/health', {
      cache: 'no-store',
    });
    expect(getCollectionDetails).not.toHaveBeenCalled();
    expect(latestHookValue.get('collection:tmdb:404')).toBeUndefined();

    await mounted.cleanup();
  });

  it('supports filtering out collections with fewer than three parts', async () => {
    getCollectionDetails
      .mockResolvedValueOnce({
        parts: [{ providerId: '1' }, { providerId: '2' }],
      })
      .mockResolvedValueOnce({
        parts: [{ providerId: '1' }, { providerId: '2' }, { providerId: '3' }],
      });
    const collections = [makeCollection('3002'), makeCollection('3003')];
    const mounted = await renderHookHarness({ collections });

    await flushPromises();

    const visibleCollections = collections.filter((collection) => {
      const size = latestHookValue.get(collection.id);
      return size === undefined || size >= 3;
    });
    expect(visibleCollections.map((collection) => collection.id)).toEqual([
      'collection:tmdb:3003',
    ]);

    await mounted.cleanup();
  });
});
