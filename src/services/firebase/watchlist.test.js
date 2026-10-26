import { beforeEach, describe, expect, it, vi } from 'vitest';

const runTransactionMock = vi.fn();
const onSnapshotMock = vi.fn();
const getDocMock = vi.fn();
const writeBatchMock = vi.fn();
const queryMock = vi.fn((value) => value);
const collectionMock = vi.fn((...args) => ({ kind: 'collection', args }));
const docMock = vi.fn((...args) => ({ kind: 'doc', args }));
const serverTimestampMock = vi.fn(() => 'server-ts');

vi.mock('firebase/firestore', () => ({
  runTransaction: runTransactionMock,
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

describe('meaningful shared movie activity', () => {
  const update = vi.fn();
  let record;
  beforeEach(() => {
    update.mockClear();
    record = {
      type: 'movie',
      status: 'unwatched',
      userState: { status: 'unwatched' },
    };
    runTransactionMock.mockImplementation(async (_db, operation) =>
      operation({
        get: async () => ({ data: () => record }),
        update,
        set: vi.fn(),
      }),
    );
  });
  it('timestamps a deliberate watch atomically and clears it on undo', async () => {
    const { updateWatchlistStatus } = await loadModule();
    const args = { db: 'db', appId: 'app', spaceId: 'shared', itemId: 'movie' };
    await updateWatchlistStatus({ ...args, status: 'watched' });
    expect(update.mock.calls[0][1]).toMatchObject({
      'userState.markedWatchedAt': 'server-ts',
      status: 'watched',
    });
    record = {
      type: 'movie',
      userState: { status: 'watched', markedWatchedAt: 'original' },
    };
    await updateWatchlistStatus({ ...args, status: 'unwatched' });
    expect(update.mock.calls[1][1]['userState.markedWatchedAt']).toBeNull();
  });
  it('does not reset a date when another member repeats the same status', async () => {
    const { updateWatchlistStatus } = await loadModule();
    record = { type: 'movie', userState: { status: 'watched' } };
    await updateWatchlistStatus({
      db: 'db',
      appId: 'app',
      spaceId: 'shared',
      itemId: 'movie',
      status: 'watched',
    });
    expect(update.mock.calls[0][1]).not.toHaveProperty(
      'userState.markedWatchedAt',
    );
  });
  it('supports status writes from details and excludes TV activity', async () => {
    const { updateWatchlistItem } = await loadModule();
    const args = {
      db: 'db',
      appId: 'app',
      spaceId: 'shared',
      itemId: 'movie',
      updates: { 'userState.status': 'watched' },
    };
    await updateWatchlistItem(args);
    expect(update.mock.calls[0][1]['userState.markedWatchedAt']).toBe(
      'server-ts',
    );
    record = { type: 'show', status: 'unwatched' };
    await updateWatchlistItem(args);
    expect(update.mock.calls[1][1]).not.toHaveProperty(
      'userState.markedWatchedAt',
    );
  });
});

it.each(['manual', 'import'])(
  'persists %s origin without inventing watched history',
  async (additionOrigin) => {
    const set = vi.fn();
    writeBatchMock.mockReturnValue({
      set,
      commit: vi.fn().mockResolvedValue(),
    });
    const { addWatchlistItem } = await loadModule();
    await addWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      payload: {
        type: 'movie',
        provider: 'tmdb',
        providerId: '42',
        status: 'watched',
        additionOrigin,
      },
    });
    expect(set.mock.calls[1][1]).toMatchObject({
      additionOrigin,
      createdAt: 'server-ts',
      status: 'watched',
    });
    expect(set.mock.calls[1][1].userState).not.toHaveProperty(
      'markedWatchedAt',
    );
  },
);

describe('explicit optional World metadata storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocMock.mockReset();
    onSnapshotMock.mockReset();
    writeBatchMock.mockReset();
  });
  it('writes validated canonical World metadata to the catalog and reads it back for TV', async () => {
    const { buildWatchlistPayload } = await import(
      '../../domain/media/schema.js'
    );
    const { adaptWatchlistItem } = await import(
      '../../domain/media/adapters.js'
    );
    const { worldForItem } = await import('../../config/collectionWorlds.js');
    const { addWatchlistItem, subscribeWatchlist } = await loadModule();
    const set = vi.fn();
    writeBatchMock.mockReturnValue({
      set,
      commit: vi.fn().mockResolvedValue(undefined),
    });
    const payload = buildWatchlistPayload(
      {
        type: 'show',
        title: 'Synthetic World TV',
        source: { provider: 'tmdb', providerId: 'synthetic-world-tv' },
        media: { type: 'show', title: 'Synthetic World TV' },
        worldIds: ['wizarding-world', 'invalid', 'wizarding-world'],
      },
      'synthetic-user',
    );
    await addWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'shared',
      payload,
    });
    const catalog = set.mock.calls[0][1];
    const watch = set.mock.calls[1][1];
    expect(catalog.media.worldIds).toEqual(['wizarding-world']);
    expect(watch).not.toHaveProperty('worldIds');
    let emit;
    onSnapshotMock.mockImplementation((_query, onNext) => {
      emit = onNext;
      return vi.fn();
    });
    getDocMock.mockResolvedValue({ exists: () => true, data: () => catalog });
    const onNext = vi.fn();
    subscribeWatchlist({ db: 'db', appId: 'app', spaceId: 'shared', onNext });
    emit({ docs: [{ id: payload.mediaId, data: () => watch }] });
    await vi.waitFor(() => expect(onNext).toHaveBeenCalledOnce());
    const result = adaptWatchlistItem(onNext.mock.calls[0][0].docs[0].data());
    expect(result.media.worldIds).toEqual(['wizarding-world']);
    expect(worldForItem(result)?.id).toBe('wizarding-world');
  });
  it('omits affiliation on ordinary provider writes rather than inventing or clearing it', async () => {
    const { addWatchlistItem } = await loadModule();
    const set = vi.fn();
    writeBatchMock.mockReturnValue({
      set,
      commit: vi.fn().mockResolvedValue(),
    });
    await addWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      payload: {
        type: 'movie',
        title: 'Unclassified movie',
        source: { provider: 'tmdb', providerId: 'synthetic-movie' },
        media: { type: 'movie', title: 'Unclassified movie' },
      },
    });
    expect(set.mock.calls[0][1].media).not.toHaveProperty('worldIds');
    expect(set.mock.calls[0][2]).toEqual({ merge: true });
  });
  it('routes validated explicit affiliation edits to catalog metadata', async () => {
    const { updateWatchlistItem } = await loadModule();
    const set = vi.fn();
    writeBatchMock.mockReturnValue({
      set,
      commit: vi.fn().mockResolvedValue(),
    });
    await updateWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'space',
      itemId: 'synthetic',
      updates: { 'media.worldId': 'dc' },
    });
    expect(set.mock.calls[0][1]).toMatchObject({ 'media.worldIds': ['dc'] });
  });
});
