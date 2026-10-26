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
      parts: [
        { providerId: '1', runtimeMinutes: 100 },
        { providerId: '2', runtimeMinutes: 100 },
        { providerId: '3', runtimeMinutes: 100 },
      ],
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

it('bounds 50 provider requests to three concurrent calls and tolerates failure', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
  let active = 0;
  let peak = 0;
  const pending = [];
  getCollectionDetails.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        active++;
        peak = Math.max(peak, active);
        pending.push(() => {
          active--;
          if (pending.length % 5 === 0) reject(new Error('offline'));
          else
            resolve({
              parts: [{ runtimeMinutes: 100 }, { runtimeMinutes: 100 }],
            });
        });
      }),
  );
  const mounted = await renderHookHarness({
    collections: Array.from({ length: 50 }, (_, i) =>
      makeCollection(`bounded-${i}`),
    ),
  });
  await flushPromises();
  expect(active).toBe(3);
  while (pending.length) {
    const batch = pending.splice(0);
    await act(async () => {
      batch.forEach((finish) => finish());
    });
    await flushPromises();
  }
  expect(
    getCollectionDetails.mock.calls.filter(([args]) =>
      args.providerId.startsWith('bounded-'),
    ),
  ).toHaveLength(50);
  expect(peak).toBe(3);
  await mounted.cleanup();
  global.fetch = originalFetch;
});

it('excludes explicitly identified shorts and specials from optional feature counts', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
  getCollectionDetails.mockResolvedValueOnce({
    parts: [
      { providerId: 'feature', runtimeMinutes: 100 },
      { providerId: 'short', runtimeMinutes: 7 },
      { providerId: 'special', contentKind: 'special', runtimeMinutes: 50 },
      { providerId: 'feature2', runtimeMinutes: 90 },
    ],
  });
  const mounted = await renderHookHarness({
    collections: [makeCollection('features-only-count')],
  });
  await flushPromises();
  expect(latestHookValue.get('collection:tmdb:features-only-count')).toBe(2);
  await mounted.cleanup();
  global.fetch = originalFetch;
});

it('leaves provider feature totals unknown when runtimes and format metadata are missing', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
  getCollectionDetails.mockResolvedValueOnce({
    parts: [
      { providerId: 'unknown' },
      { providerId: 'feature', runtimeMinutes: 100 },
    ],
  });
  const mounted = await renderHookHarness({
    collections: [makeCollection('unknown-feature-count')],
  });
  await flushPromises();
  expect(latestHookValue.has('collection:tmdb:unknown-feature-count')).toBe(
    false,
  );
  await mounted.cleanup();
  global.fetch = originalFetch;
});
