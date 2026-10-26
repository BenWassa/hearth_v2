import { describe, expect, it } from 'vitest';
import { COLLECTION_CATALOG } from './collectionCatalog.js';
import {
  buildWorlds,
  COLLECTION_WORLDS,
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
  it('uses stable local artwork for all eight Worlds', () => {
    expect(COLLECTION_WORLDS).toHaveLength(8);
    for (const world of COLLECTION_WORLDS) {
      expect(world.cover).toBe(`/assets/worlds/${world.id}/cover.webp`);
      expect(world.hero).toBe(`/assets/worlds/${world.id}/hero.webp`);
      const suffix = ['star-wars', 'wizarding-world', 'studio-ghibli'].includes(
        world.id,
      )
        ? 'svg'
        : 'png';
      expect(world.wordmark).toBe(
        `/assets/worlds/${world.id}/wordmark.${suffix}`,
      );
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
