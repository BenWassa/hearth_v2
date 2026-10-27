import { describe, expect, it } from 'vitest';
import { COLLECTION_CATALOG } from './collectionCatalog.js';
import {
  buildWorlds,
  COLLECTION_WORLDS,
  isRailSaga,
  selectTonightWorlds,
  WORLD_ROTATION_MS,
  worldForItem,
  worldForSaga,
} from './collectionWorlds.js';
const now = Date.parse('2026-10-26T12:00:00Z');
const movie = (id, extra = {}) => ({
  id,
  type: 'movie',
  status: 'unwatched',
  ...extra,
});
const saga = (id, items = []) => ({
  id: `collection:tmdb:${id}`,
  collection: { provider: 'tmdb', providerId: id },
  items,
  totalCount: items.length,
  watchedCount: 0,
});

describe('approved World membership', () => {
  it('uses stable local cover artwork for all eight Worlds', () => {
    expect(COLLECTION_WORLDS).toHaveLength(8);
    for (const world of COLLECTION_WORLDS) {
      expect(world.cover).toBe(`/assets/worlds/${world.id}/cover.webp`);
      expect(world.tile).toBe(`/assets/worlds/${world.id}/tile.webp`);
      expect(world.wordmark).toBe(`/assets/worlds/${world.id}/wordmark.svg`);
    }
  });
  it('represents all approved brand Worlds without corporate or continuity conflation', () => {
    expect(COLLECTION_WORLDS.map((w) => w.name)).toEqual([
      'Wizarding World',
      'Marvel',
      'Star Wars',
      'Pixar',
      'Disney',
      'DC',
      'DreamWorks Animation',
      'Studio Ghibli',
    ]);
    expect(worldForSaga(saga('1241'))?.id).toBe('wizarding-world');
    expect(worldForSaga(saga('435259'))?.id).toBe('wizarding-world');
    expect(worldForSaga(saga('263'))?.id).toBe('dc');
    expect(worldForSaga(saga('86311'))?.id).toBe('marvel');
    expect(worldForSaga(saga('10194'))?.id).toBe('pixar');
    expect(worldForSaga(saga('264'))).toBeNull();
    expect(
      new Set(COLLECTION_WORLDS.flatMap((w) => w.collectionIds)).size,
    ).toBe(COLLECTION_WORLDS.flatMap((w) => w.collectionIds).length);
    expect(COLLECTION_CATALOG['tmdb:263'].name).toBe('The Dark Knight Trilogy');
  });
  it('keeps standalone Pixar, traditional Disney, and Ghibli films as films rather than invented sagas', () => {
    const wallE = movie('wall-e', {
      source: { provider: 'tmdb', providerId: '10681' },
    });
    const cinderella = movie('cinderella', {
      source: { provider: 'tmdb', providerId: '150689' },
    });
    const spirited = movie('spirited', {
      source: { provider: 'tmdb', providerId: '129' },
    });
    expect(worldForItem(wallE)?.id).toBe('pixar');
    const worlds = buildWorlds([], [wallE, cinderella, spirited], { now });
    expect(worlds).toHaveLength(3);
    expect(worlds.find((w) => w.id === 'pixar')).toMatchObject({
      sagas: [],
      ownedFeatureCount: 1,
      shortCount: 0,
    });
    expect(worlds.find((w) => w.id === 'pixar').otherFilms).toEqual([wallE]);
    expect(
      worldForItem(movie('fake', { title: 'Pixar Marvel Disney' })),
    ).toBeNull();
    expect(
      worldForItem(
        movie('fake', { source: { provider: 'other', providerId: '10681' } }),
      ),
    ).toBeNull();
  });
  it('separates child sagas, Other films, Shorts & Specials and TV with distinct counts', () => {
    const collection = { provider: 'tmdb', providerId: '10194' };
    const feature = movie('toy', {
      collection,
      status: 'watched',
      runtimeMinutes: 90,
      source: { provider: 'tmdb', providerId: '862' },
    });
    const short = movie('short', { collection, runtimeMinutes: 7 });
    const up = movie('up', {
      source: { provider: 'tmdb', providerId: '14160' },
    });
    const show = {
      id: 'show',
      type: 'show',
      worldId: 'pixar',
      runtimeMinutes: 25,
    };
    const child = saga('10194', [feature]);
    const world = buildWorlds(
      [child],
      [feature, { ...feature, id: 'duplicate' }, short, up, show],
      { now },
    )[0];
    expect(world.sagas).toEqual([child]);
    expect(world.otherFilms).toEqual([up]);
    expect(world.shorts).toEqual([short]);
    expect(world.shows).toEqual([show]);
    expect(world).toMatchObject({
      ownedTotal: 2,
      ownedFeatureCount: 2,
      ownedFeatureWatchedCount: 1,
      unwatched: 1,
      shortCount: 1,
      showCount: 1,
    });
  });
  it('retains singleton Worlds for explicit World pages and ranks max activity rather than size', () => {
    const potter = saga('1241', [movie('potter')]);
    const marvel = saga(
      '86311',
      Array.from({ length: 50 }, (_, i) => movie(String(i))),
    );
    potter.activity = { lastActivityAt: now - 1 };
    marvel.activity = { lastActivityAt: now - 2 };
    expect(buildWorlds([marvel, potter], [], { now }).map((w) => w.id)).toEqual(
      ['wizarding-world', 'marvel'],
    );
    expect(buildWorlds([potter], [], { now })[0].sagas).toHaveLength(1);
  });
  it('ignores imported, metadata-only and future World activity', () => {
    const pixar = movie('up', {
      source: { provider: 'tmdb', providerId: '14160' },
      additionOrigin: 'import',
      createdAt: now,
      updatedAt: now,
    });
    const ghibli = movie('totoro', {
      source: { provider: 'tmdb', providerId: '8392' },
      additionOrigin: 'manual',
      createdAt: now + 100,
    });
    expect(
      buildWorlds([], [pixar, ghibli], { now }).every((w) => w.activity === 0),
    ).toBe(true);
  });
});

describe('World rail and tile sagas', () => {
  const films = (n, prefix) =>
    Array.from({ length: n }, (_, i) => movie(`${prefix}-${i}`));
  const marvelWorld = (sagas) =>
    buildWorlds(sagas, [], { now }).find((w) => w.id === 'marvel');

  it('flags exactly the eight editorial rail sagas in the catalog', () => {
    const flagged = Object.values(COLLECTION_CATALOG)
      .filter((entry) => entry.rail === true)
      .map((entry) => `${entry.providerId}:${entry.name}`)
      .sort();
    expect(flagged).toEqual(
      [
        '86311:The Avengers',
        '131296:Thor',
        '748:X-Men',
        '1241:Harry Potter',
        '10:Star Wars / Skywalker Saga',
        '10194:Toy Story',
        '2150:Shrek',
        '77816:Kung Fu Panda',
      ].sort(),
    );
    expect(isRailSaga(saga('86311'))).toBe(true);
    expect(isRailSaga(saga('131292'))).toBe(false);
    expect(isRailSaga(saga('not-in-catalog'))).toBe(false);
  });
  it('splits child sagas into rails and tiles and keeps sagas unchanged', () => {
    const avengers = saga('86311', films(3, 'av'));
    const ironMan = saga('131292', films(2, 'im'));
    const thor = saga('131296', films(2, 'th'));
    const panther = saga('529892', films(1, 'bp'));
    const input = [ironMan, avengers, panther, thor];
    const world = marvelWorld(input);
    expect(world.railSagas).toEqual([avengers, thor]);
    expect(world.tileSagas).toEqual([ironMan, panther]);
    expect(world.sagas).toEqual(input);
    expect(world.cover).toBe('/assets/worlds/marvel/cover.webp');
    expect(world.collectionIds).toContain('86311');
  });
  it('drops a flagged saga with fewer than two owned films into tiles', () => {
    const avengers = saga('86311', films(1, 'av'));
    const world = marvelWorld([avengers]);
    expect(world.railSagas).toEqual([]);
    expect(world.tileSagas).toEqual([avengers]);
  });
  it('preserves the incoming ranked order in both lists', () => {
    const a = saga('131296', films(2, 'th'));
    const b = saga('86311', films(2, 'av'));
    const c = saga('748', films(2, 'xm'));
    const x = saga('573436', films(1, 'sv'));
    const y = saga('131292', films(1, 'im'));
    const z = saga('529892', films(1, 'bp'));
    const world = marvelWorld([z, a, y, b, x, c]);
    expect(world.railSagas).toEqual([a, b, c]);
    expect(world.tileSagas).toEqual([z, y, x]);
  });
  it('leaves zero-item sagas out of both lists but in sagas', () => {
    const empty = saga('86311', []);
    const emptyTile = saga('131292', []);
    const owned = saga('529892', films(1, 'bp'));
    const world = marvelWorld([empty, emptyTile, owned]);
    expect(world.railSagas).toEqual([]);
    expect(world.tileSagas).toEqual([owned]);
    expect(world.sagas).toEqual([empty, emptyTile, owned]);
  });
});

describe('Tonight World selection', () => {
  const world = (id, extra = {}) => ({
    id,
    activity: 0,
    ownedFeatureWatchedCount: 0,
    ownedTotal: 1,
    ...extra,
  });
  const all = (overrides = {}) =>
    COLLECTION_WORLDS.map((entry) => world(entry.id, overrides[entry.id]));
  const ids = (result) => result.worlds.map((entry) => entry.id);
  const week = 100 * WORLD_ROTATION_MS;

  it('shows the four permanent Worlds first, then the two most active candidates', () => {
    const result = selectTonightWorlds(
      all({
        dc: { activity: 30 },
        'studio-ghibli': { activity: 20 },
        'star-wars': { activity: 10 },
      }),
      { now: week },
    );
    expect(ids(result)).toEqual([
      'disney-animation',
      'pixar',
      'marvel',
      'dreamworks',
      'dc',
      'studio-ghibli',
    ]);
  });
  it('breaks activity ties by watched count, size, then candidate order', () => {
    const tied = selectTonightWorlds(
      all({
        'wizarding-world': { ownedFeatureWatchedCount: 3 },
        dc: { ownedTotal: 9 },
      }),
      { now: week },
    );
    expect(ids(tied).slice(4)).toEqual(['wizarding-world', 'dc']);
    expect(ids(selectTonightWorlds(all(), { now: week })).slice(4)).toEqual([
      'star-wars',
      'wizarding-world',
    ]);
  });
  it('omits Worlds with nothing on the shelf rather than showing empty pages', () => {
    const result = selectTonightWorlds(
      all().filter((entry) => !['pixar', 'dc'].includes(entry.id)),
      { now: week },
    );
    expect(ids(result)).toEqual([
      'disney-animation',
      'marvel',
      'dreamworks',
      'star-wars',
      'wizarding-world',
    ]);
  });
  it('holds the adaptive pick for the rotation period, even as activity changes', () => {
    const first = selectTonightWorlds(all({ dc: { activity: 30 } }), {
      now: week,
    });
    const later = selectTonightWorlds(
      all({ 'studio-ghibli': { activity: 99 }, 'star-wars': { activity: 98 } }),
      { now: week + WORLD_ROTATION_MS - 1, stored: first.pick },
    );
    expect(ids(later)).toEqual(ids(first));
  });
  it('re-picks when the period turns over or a held World leaves the shelf', () => {
    const first = selectTonightWorlds(all({ dc: { activity: 30 } }), {
      now: week,
    });
    const next = all({ 'studio-ghibli': { activity: 99 } });
    expect(
      ids(
        selectTonightWorlds(next, {
          now: week + WORLD_ROTATION_MS,
          stored: first.pick,
        }),
      ).slice(4),
    ).toContain('studio-ghibli');
    const removed = selectTonightWorlds(
      all().filter((entry) => entry.id !== 'dc'),
      { now: week, stored: first.pick },
    );
    expect(ids(removed)).not.toContain('dc');
    expect(removed.worlds).toHaveLength(6);
  });
  it('tolerates a corrupt stored pick', () => {
    expect(
      selectTonightWorlds(all(), { now: week, stored: { ids: 'dc' } }).worlds,
    ).toHaveLength(6);
  });
});
