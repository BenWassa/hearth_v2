import { describe, expect, it } from 'vitest';
import {
  getSagaActivity,
  preserveSagaOrder,
  rankSagas,
  searchSagaName,
  selectTonightSagas,
} from './collectionActivity.js';
import {
  buildWorlds,
  COLLECTION_WORLDS,
  worldForSaga,
} from '../../config/collectionWorlds.js';
const now = Date.parse('2026-10-25T18:00:00Z');
const day = 86400000;
export const saga = (id, title, films) => ({
  id,
  title,
  collection: { provider: 'tmdb', providerId: id },
  items: films,
  totalCount: films.length,
  watchedCount: films.filter((film) => film.status === 'watched').length,
});
const film = (id, status = 'unwatched', extra = {}) => ({
  id,
  type: 'movie',
  status,
  ...extra,
});
const watched = (id, days = 1) =>
  film(id, 'watched', { userState: { markedWatchedAt: now - days * day } });
const added = (id, days = 0) =>
  film(id, 'unwatched', {
    additionOrigin: 'manual',
    createdAt: now - days * day,
  });

describe('household saga activity', () => {
  it('prioritizes Avengers continuation, then clustered Harry Potter additions', () => {
    const avengers = saga('86311', 'Avengers Collection', [
      watched('a'),
      film('b'),
    ]);
    const potter = saga('1241', 'Harry Potter', [
      added('p1'),
      added('p2'),
      added('p3'),
    ]);
    const finished = saga('f', 'Finished', [watched('f', 0)]);
    const dormant = saga('d', 'Dormant', [watched('d', 120), film('e')]);
    expect(
      selectTonightSagas([finished, dormant, potter, avengers], { now }).map(
        (s) => s.id,
      ),
    ).toEqual(['86311', '1241']);
    expect(getSagaActivity(potter, now).reason).toBe('3 films added this week');
    expect(rankSagas([avengers, finished], { now })[0].id).toBe('f');
  });
  it.each([0, 1, 3, 5, 25, 50, 75])(
    'retains every saga at library size %i and caps Tonight',
    (size) => {
      const sagas = Array.from({ length: size }, (_, i) =>
        saga(String(i), `Saga ${String(i).padStart(2, '0')}`, [
          added(`film-${i}`),
        ]),
      );
      expect(rankSagas(sagas, { now })).toHaveLength(size);
      expect(selectTonightSagas(sagas, { now })).toHaveLength(
        Math.min(size, 2),
      );
    },
  );
  it('suppresses bulk imports, metadata, note edits, seeds and unknown historical watch dates', () => {
    const imports = Array.from({ length: 40 }, (_, i) =>
      film(String(i), 'watched', {
        additionOrigin: 'import',
        createdAt: now,
        updatedAt: now,
      }),
    );
    const s = saga('i', 'Imported', imports);
    expect(getSagaActivity(s, now).lastActivityAt).toBe(0);
    expect(
      selectTonightSagas(
        [
          s,
          saga('old', 'Old', [
            film('old', 'unwatched', {
              createdAt: now,
              updatedAt: now,
              note: 'new',
            }),
          ]),
        ],
        { now },
      ),
    ).toEqual([]);
  });
  it('clears the effective watch boost on undo and deduplicates household film actions', () => {
    const a = watched('same');
    const b = { ...a, addedBy: 'other-member' };
    expect(
      getSagaActivity(saga('a', 'A', [a, b, film('next')]), now).ownedTotal,
    ).toBe(2);
    expect(
      getSagaActivity(
        saga('a', 'A', [{ ...a, status: 'unwatched' }, film('next')]),
        now,
      ).lastMarkedWatchedAt,
    ).toBe(0);
  });
  it('decays and expires signals; rejects invalid and future dates', () => {
    const s = saga('a', 'A', [watched('a'), film('b')]);
    expect(getSagaActivity(s, now + day).score).toBeLessThan(
      getSagaActivity(s, now).score,
    );
    expect(selectTonightSagas([s], { now: now + 90 * day })).toEqual([]);
    expect(
      getSagaActivity(
        saga('x', 'X', [
          added('x', -1),
          watched('y', -1),
          film('z', 'watched', { markedWatchedAt: 'bad' }),
        ]),
        now,
      ).lastActivityAt,
    ).toBe(0);
  });
  it('allows brief exploration only with known unowned parts and preserves live browse positions', () => {
    const s = saga('a', 'A', [watched('a')]);
    expect(selectTonightSagas([s], { now })).toEqual([]);
    expect(
      selectTonightSagas([s], { now, counts: new Map([['a', 4]]) }),
    ).toHaveLength(1);
    expect(getSagaActivity(s, now, 4).nextOwnedUnwatched).toBeNull();
    const b = saga('b', 'B', [added('b')]);
    expect(
      preserveSagaOrder(rankSagas([s, b], { now }), ['a', 'b']).map(
        (s) => s.id,
      ),
    ).toEqual(['a', 'b']);
  });
  it('searches suffixes, case and accents, with deterministic alphabetical fallback', () => {
    expect(searchSagaName('ÉCLAIR Collection')).toBe('eclair');
    expect(
      rankSagas(
        [saga('z', 'Z Collection', []), saga('a', 'A Collection', [])],
        { now },
      ).map((s) => s.id),
    ).toEqual(['a', 'z']);
  });
});
describe('versioned World taxonomy', () => {
  it('has unique stable IDs; keeps Pixar, Marvel and Disney Animation separate', () => {
    const ids = COLLECTION_WORLDS.flatMap((w) => w.collectionIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(worldForSaga(saga('86311', 'Anything', []))?.id).toBe('marvel');
    expect(worldForSaga(saga('10194', 'Anything', []))?.id).toBe('pixar');
    expect(worldForSaga(saga('386382', 'Anything', []))?.id).toBe(
      'disney-animation',
    );
    expect(worldForSaga(saga('unknown', 'Marvel Collection', []))).toBeNull();
    expect(
      worldForSaga({
        ...saga('10', 'Star Wars', []),
        collection: { provider: 'other', providerId: '10' },
      }),
    ).toBeNull();
  });
  it('counts only household shelf films in concentrated and dispersed libraries', () => {
    const sagas = ['86311', '131292', '10194', 'unknown'].map((id) =>
      saga(id, id, [watched(id), film(`next-${id}`)]),
    );
    const worlds = buildWorlds(rankSagas(sagas, { now }));
    expect(worlds.find((w) => w.id === 'marvel')).toMatchObject({
      ownedTotal: 4,
      unwatched: 2,
    });
    expect(worlds.reduce((sum, w) => sum + w.sagas.length, 0)).toBe(3);
    expect(
      buildWorlds(
        Array.from({ length: 50 }, (_, i) =>
          saga(`unknown-${i}`, String(i), []),
        ),
      ),
    ).toEqual([]);
  });
});
