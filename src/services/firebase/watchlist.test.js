import { beforeEach, describe, expect, it, vi } from 'vitest';

const onSnapshotMock = vi.fn();
const getDocMock = vi.fn();
const writeBatchMock = vi.fn();
const queryMock = vi.fn((value) => value);
const collectionMock = vi.fn((...args) => ({ kind: 'collection', args }));
const docMock = vi.fn((...args) => ({ kind: 'doc', args }));
const serverTimestampMock = vi.fn(() => 'server-ts');

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  deleteDoc: vi.fn(),
  doc: docMock,
  getDoc: getDocMock,
  onSnapshot: onSnapshotMock,
  query: queryMock,
  serverTimestamp: serverTimestampMock,
  updateDoc: vi.fn(),
  writeBatch: writeBatchMock,
}));

const loadModule = async () => import('./watchlist.js');

describe('subscribeWatchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores stale snapshot resolutions and only emits the latest result', async () => {
    let snapshotHandler;
    onSnapshotMock.mockImplementation((_query, onNext) => {
      snapshotHandler = onNext;
      return vi.fn();
    });

    let resolveFirstCatalog;
    let resolveSecondCatalog;
    getDocMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstCatalog = () =>
              resolve({
                exists: () => true,
                data: () => ({ media: { title: 'First title' } }),
              });
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondCatalog = () =>
              resolve({
                exists: () => true,
                data: () => ({ media: { title: 'Second title' } }),
              });
          }),
      );

    const { subscribeWatchlist } = await loadModule();
    const onNext = vi.fn();

    subscribeWatchlist({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      onNext,
      onError: vi.fn(),
    });

    snapshotHandler({
      docs: [
        {
          id: 'item-1',
          data: () => ({ mediaId: 'media-1', title: 'watch title one' }),
        },
      ],
    });
    snapshotHandler({
      docs: [
        {
          id: 'item-2',
          data: () => ({ mediaId: 'media-2', title: 'watch title two' }),
        },
      ],
    });

    resolveSecondCatalog();
    await Promise.resolve();
    await Promise.resolve();

    resolveFirstCatalog();
    await Promise.resolve();
    await Promise.resolve();

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext.mock.calls[0][0].docs[0].id).toBe('item-2');
    expect(onNext.mock.calls[0][0].docs[0].data().title).toBe('Second title');
  });

  it('falls back to watchlist data when catalog lookup fails for one item', async () => {
    let snapshotHandler;
    onSnapshotMock.mockImplementation((_query, onNext) => {
      snapshotHandler = onNext;
      return vi.fn();
    });

    getDocMock.mockRejectedValueOnce(new Error('catalog unavailable'));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { subscribeWatchlist } = await loadModule();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeWatchlist({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      onNext,
      onError,
    });

    snapshotHandler({
      docs: [
        {
          id: 'item-1',
          data: () => ({ mediaId: 'media-1', title: 'Watchlist fallback' }),
        },
      ],
    });

    expect(onError).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(onNext).toHaveBeenCalledTimes(1);
    });
    expect(onNext.mock.calls[0][0].docs[0].data().title).toBe(
      'Watchlist fallback',
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});

describe('addWatchlistItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('overwrites the watchlist document instead of merge-writing stale progress back in', async () => {
    const set = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);
    writeBatchMock.mockReturnValue({ set, commit });

    const { addWatchlistItem } = await loadModule();

    await addWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      payload: {
        title: 'Invincible',
        type: 'show',
        provider: 'tmdb',
        providerId: '123',
      },
    });

    expect(set).toHaveBeenCalledTimes(2);
    expect(set.mock.calls[0][2]).toEqual({ merge: true });
    expect(set.mock.calls[1][2]).toBeUndefined();
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('persists collection metadata in the catalog document', async () => {
    const set = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);
    writeBatchMock.mockReturnValue({ set, commit });

    const { addWatchlistItem } = await loadModule();

    await addWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      payload: {
        title: 'Part One',
        type: 'movie',
        media: {
          title: 'Part One',
          type: 'movie',
          collection: {
            provider: 'tmdb',
            providerId: '42',
            name: 'The Saga',
            poster: '/collection-poster.jpg',
            backdrop: '/collection-backdrop.jpg',
          },
        },
        source: { provider: 'tmdb', providerId: '101' },
      },
    });

    expect(set.mock.calls[0][1].media.collection).toEqual({
      provider: 'tmdb',
      providerId: '42',
      name: 'The Saga',
      poster: '/collection-poster.jpg',
      backdrop: '/collection-backdrop.jpg',
    });
  });
});
