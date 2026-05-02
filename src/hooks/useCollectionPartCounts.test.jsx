import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import { getCollectionDetails } from '../services/mediaApi/client.js';
import useCollectionPartCounts from './useCollectionPartCounts.js';

vi.mock('../services/mediaApi/client.js');

const originalFetch = global.fetch;

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const makeCollection = (providerId, totalCount = 1) => ({
  id: `collection:tmdb:${providerId}`,
  type: 'collection',
  totalCount,
  collection: {
    provider: 'tmdb',
    providerId,
  },
});

let latestHookValue;

const HookHarness = ({ collections }) => {
  latestHookValue = useCollectionPartCounts(collections);
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

describe('useCollectionPartCounts', () => {
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

  it('loads overall provider part counts without hydrated details', async () => {
    getCollectionDetails.mockResolvedValueOnce({
      parts: [{ providerId: '1' }, { providerId: '2' }, { providerId: '3' }],
    });
    const mounted = await renderHookHarness({
      collections: [makeCollection('2002')],
    });

    await flushPromises();

    expect(getCollectionDetails).toHaveBeenCalledWith({
      provider: 'tmdb',
      providerId: '2002',
      locale: 'en-US',
      optional: true,
      details: false,
    });
    expect(latestHookValue.get('collection:tmdb:2002')).toBe(3);

    await mounted.cleanup();
  });

  it('skips provider lookups when the local collection already has three movies', async () => {
    const mounted = await renderHookHarness({
      collections: [makeCollection('3003', 3)],
    });

    await flushPromises();

    expect(getCollectionDetails).not.toHaveBeenCalled();
    expect(latestHookValue.size).toBe(0);

    await mounted.cleanup();
  });

  it('skips provider lookups when the local API is unavailable', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const mounted = await renderHookHarness({
      collections: [makeCollection('404')],
    });

    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith('/api/health', {
      cache: 'no-store',
    });
    expect(getCollectionDetails).not.toHaveBeenCalled();

    await mounted.cleanup();
  });
});
