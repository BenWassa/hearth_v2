import { beforeEach, describe, expect, it, vi } from 'vitest';

const runTransactionMock = vi.fn();
beforeEach(() => {
  runTransactionMock.mockImplementation(async (_db, action) => {
    const batch = writeBatchMock();
    return action({
      get: async () => ({ exists: () => false, data: () => undefined }),
      set: (...args) => batch.set(...args),
    });
  });
});
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
  getDocs: vi.fn(),
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

  it('creates a fresh watchlist document inside a transaction', async () => {
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
    expect(commit).not.toHaveBeenCalled();
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

describe('persistCatalogClassification', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses conditional field-path updates without touching user state or timestamps', async () => {
    const current = {
      source: { provider: 'tmdb', providerId: '603' },
      media: {
        type: 'movie',
        classificationOverride: { attributes: { comfort: 'low' } },
      },
    };
    const transaction = {
      get: vi.fn().mockResolvedValue({ data: () => current }),
      update: vi.fn(),
    };
    runTransactionMock.mockImplementation((_db, callback) =>
      callback(transaction),
    );
    const { persistCatalogClassification } = await loadModule();
    const classification = { key: 'tmdb:movie:603', classifiedAt: 100 };
    await persistCatalogClassification({
      db: 'db',
      appId: 'app',
      mediaId: 'tmdb:603',
      classification,
    });
    expect(transaction.update).toHaveBeenCalledWith(expect.anything(), {
      'media.classification': classification,
    });
    expect(current.media.classificationOverride.attributes.comfort).toBe('low');
    transaction.update.mockClear();
    current.media.classification = { classifiedAt: 200 };
    await persistCatalogClassification({
      db: 'db',
      appId: 'app',
      mediaId: 'tmdb:603',
      classification,
    });
    expect(transaction.update).not.toHaveBeenCalled();
    current.media.type = 'show';
    await persistCatalogClassification({
      db: 'db',
      appId: 'app',
      mediaId: 'tmdb:603',
      classification,
    });
    expect(transaction.update).not.toHaveBeenCalled();
  });
  it('does not overwrite generated classification when adding the same title to another space', async () => {
    const set = vi.fn();
    writeBatchMock.mockReturnValue({
      set,
      commit: vi.fn().mockResolvedValue(undefined),
    });
    const { addWatchlistItem } = await loadModule();
    await addWatchlistItem({
      db: 'db',
      appId: 'app',
      spaceId: 'another',
      payload: {
        title: 'Film',
        type: 'movie',
        source: { provider: 'tmdb', providerId: '603' },
        media: {
          type: 'movie',
          title: 'Film',
          classification: { method: 'rules' },
        },
      },
    });
    expect(set.mock.calls[0][1].media).not.toHaveProperty('classification');
  });
});

describe('Recently removed', () => {
  let records;
  let catalog;
  let transaction;
  const args = { db: 'db', appId: 'app', spaceId: 'space' };
  beforeEach(() => {
    vi.clearAllMocks();
    records = new Map([
      [
        'one',
        {
          mediaId: 'one',
          title: 'One',
          status: 'watching',
          userState: { note: 'Keep this', episodeProgress: { 1: [1, 2] } },
        },
      ],
      ['two', { mediaId: 'two', title: 'Two' }],
    ]);
    catalog = {
      media: { title: 'One', classification: { primary: 'comfort' } },
    };
    serverTimestampMock.mockImplementation(() => Date.now());
    transaction = {
      get: vi.fn(async (ref) => {
        const id = ref.args.at(-1);
        if (id === 'failure') throw new Error('offline');
        const data = ref.args.includes('media_catalog')
          ? catalog
          : records.get(id);
        return { exists: () => Boolean(data), data: () => data };
      }),
      update: vi.fn((ref, updates) =>
        records.set(ref.args.at(-1), {
          ...records.get(ref.args.at(-1)),
          ...updates,
        }),
      ),
      delete: vi.fn((ref) => records.delete(ref.args.at(-1))),
    };
    runTransactionMock.mockImplementation(async (_db, action) =>
      action(transaction),
    );
  });
  it('removes and restores intact household data with per-title failures', async () => {
    const { removeWatchlistItems, restoreWatchlistItems } = await loadModule();
    const original = structuredClone(records.get('one'));
    const results = await removeWatchlistItems({
      ...args,
      itemIds: ['one', 'failure', 'two'],
      removedBy: 'member-a',
    });
    expect(results.map((entry) => entry.status)).toEqual([
      'removed',
      'failed',
      'removed',
    ]);
    expect(records.get('one').removedBy).toBe('member-a');
    expect(records.get('one').userState).toEqual(original.userState);
    expect(await restoreWatchlistItems({ ...args, itemIds: ['one'] })).toEqual([
      { itemId: 'one', status: 'restored' },
    ]);
    expect(records.get('one')).toMatchObject({ ...original, removedAt: null });
  });
  it('preserves changed household data and rejects missing or expired titles', async () => {
    const { removeWatchlistItems, restoreWatchlistItems } = await loadModule();
    await removeWatchlistItems({
      ...args,
      itemIds: ['one', 'two'],
      removedBy: 'a',
    });
    records.get('one').userState.note = 'Newer note';
    records.get('two').removedAt = Date.now() - 24 * 60 * 60 * 1000;
    transaction.update.mockClear();
    expect(
      (
        await restoreWatchlistItems({
          ...args,
          itemIds: ['one', 'two', 'missing'],
        })
      ).map((entry) => entry.status),
    ).toEqual(['restored', 'expired', 'missing']);
    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(records.get('one').userState.note).toBe('Newer note');
  });
  it('ignores newer catalog changes, including classification', async () => {
    const { removeWatchlistItems, restoreWatchlistItems } = await loadModule();
    await removeWatchlistItems({ ...args, itemIds: ['one'], removedBy: 'a' });
    catalog.media.classification = { primary: 'spectacle' };
    expect(
      (await restoreWatchlistItems({ ...args, itemIds: ['one'] }))[0].status,
    ).toBe('restored');
  });
  it('purges only expired markers and tolerates partial failure and another member purging', async () => {
    const { removeWatchlistItems, purgeRemovedWatchlistItems } =
      await loadModule();
    await removeWatchlistItems({
      ...args,
      itemIds: ['one', 'two'],
      removedBy: 'a',
    });
    records.get('one').removedAt = Date.now() - 7 * 24 * 60 * 60 * 1000;
    expect(
      (
        await purgeRemovedWatchlistItems({
          ...args,
          itemIds: ['one', 'two', 'failure'],
        })
      ).map((entry) => entry.status),
    ).toEqual(['purged', 'skipped', 'failed']);
    expect(records.has('one')).toBe(false);
    expect(
      (await purgeRemovedWatchlistItems({ ...args, itemIds: ['one'] }))[0]
        .status,
    ).toBe('missing');
    records.get('two').removedAt = null;
    expect(
      (await purgeRemovedWatchlistItems({ ...args, itemIds: ['two'] }))[0]
        .status,
    ).toBe('skipped');
  });
  it.each(['', '   ', 'Keep this'])(
    'manual re-add fills only an empty retained note (%s)',
    async (note) => {
      const { removeWatchlistItems, addWatchlistItem } = await loadModule();
      records.get('one').userState.note = note;
      await removeWatchlistItems({ ...args, itemIds: ['one'], removedBy: 'a' });
      await addWatchlistItem({
        ...args,
        payload: { mediaId: 'one', additionOrigin: 'manual', note: 'New note' },
      });
      const updates = transaction.update.mock.calls.at(-1)[1];
      if (note.trim()) expect(updates).not.toHaveProperty('userState.note');
      else {
        expect(updates.note).toBe('New note');
        expect(updates['userState.note']).toBe('New note');
      }
    },
  );
  it.each(['manual', 'import'])(
    're-add %s restores current household state',
    async (additionOrigin) => {
      const { removeWatchlistItems, addWatchlistItem } = await loadModule();
      await removeWatchlistItems({ ...args, itemIds: ['one'], removedBy: 'a' });
      records.get('one').addedBy = 'original';
      records.get('one').userState.note = 'Current note';
      transaction.update.mockClear();
      const result = await addWatchlistItem({
        ...args,
        payload: {
          mediaId: 'one',
          title: 'Replacement',
          additionOrigin,
          addedBy: 'other',
        },
      });
      expect(result.status).toBe('restored');
      expect(records.get('one')).toMatchObject({
        title: 'One',
        addedBy: 'original',
        userState: { note: 'Current note' },
        removedAt: null,
      });
      expect(transaction.update.mock.calls[0][1]).not.toHaveProperty(
        'userState',
      );
    },
  );
  it('does not purge before seven days or when timestamp is pending', async () => {
    const { purgeRemovedWatchlistItems } = await loadModule();
    records.get('one').removedAt = Date.now() - 6 * 86400000;
    expect(
      (await purgeRemovedWatchlistItems({ ...args, itemIds: ['one'] }))[0]
        .status,
    ).toBe('skipped');
    transaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ removedAt: Date.now() - 8 * 86400000 }),
      metadata: { hasPendingWrites: true },
    });
    expect(
      (await purgeRemovedWatchlistItems({ ...args, itemIds: ['one'] }))[0]
        .status,
    ).toBe('skipped');
    expect(transaction.delete).not.toHaveBeenCalled();
  });
  it('excludes removed and expired titles at the shared subscription boundary before catalog reads', async () => {
    let handler;
    onSnapshotMock.mockImplementation((_query, next) => {
      handler = next;
      return vi.fn();
    });
    getDocMock.mockResolvedValue({ exists: () => true, data: () => catalog });
    const { subscribeWatchlist } = await loadModule();
    const onNext = vi.fn();
    const onRemoved = vi.fn();
    subscribeWatchlist({ ...args, onNext, onRemoved });
    handler({
      docs: [
        { id: 'active', data: () => ({ mediaId: 'active' }) },
        {
          id: 'removed',
          data: () => ({
            removedAt: Date.now(),
            removedItem: { title: 'Removed' },
          }),
        },
        { id: 'expired', data: () => ({ removedAt: 1 }) },
      ],
    });
    await vi.waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(onNext.mock.calls[0][0].docs.map((entry) => entry.id)).toEqual([
      'active',
    ]);
    expect(getDocMock).toHaveBeenCalledTimes(1);
    expect(onRemoved.mock.calls[0][0].map((entry) => entry.id)).toEqual([
      'removed',
      'expired',
    ]);
  });
});

it('wipe enumerates and deletes active and removed documents', async () => {
  const firestore = await import('firebase/firestore');
  firestore.getDocs.mockResolvedValue({
    docs: [{ id: 'active' }, { id: 'removed' }],
  });
  const { wipeWatchlist } = await loadModule();
  await wipeWatchlist({ db: 'db', appId: 'app', spaceId: 'space' });
  expect(
    firestore.deleteDoc.mock.calls.slice(-2).map(([ref]) => ref.args.at(-1)),
  ).toEqual(['active', 'removed']);
});
