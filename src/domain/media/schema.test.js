import { describe, expect, it } from 'vitest';
import { buildWatchlistPayload } from './schema.js';
import { adaptWatchlistItem, mapWatchlistUpdatesForWrite } from './adapters.js';
import {
  getExplicitWorldMetadata,
  normalizeWorldIds,
  worldForItem,
} from '../../config/collectionWorlds.js';

const show = {
  type: 'show',
  title: 'Synthetic World TV',
  source: { provider: 'tmdb', providerId: 'synthetic-show' },
  media: { type: 'show', title: 'Synthetic World TV' },
};
describe('optional explicit World metadata roundtrip', () => {
  it('validates and deduplicates stable World IDs without title/company guesses', () => {
    expect(
      normalizeWorldIds([
        'wizarding-world',
        'dc',
        'dc',
        'Disney',
        '__proto__',
        'unknown',
        5,
      ]),
    ).toEqual(['wizarding-world', 'dc']);
    expect(normalizeWorldIds('pixar')).toEqual(['pixar']);
    expect(normalizeWorldIds({ company: 'Disney' })).toEqual([]);
  });
  it('roundtrips a supplied TV World through v2 write payload and adaptation', () => {
    const payload = buildWatchlistPayload(
      { ...show, worldIds: ['wizarding-world', 'not-a-world'] },
      'synthetic-user',
    );
    expect(payload.media.worldIds).toEqual(['wizarding-world']);
    const adapted = adaptWatchlistItem(payload);
    expect(adapted.worldIds).toEqual(['wizarding-world']);
    expect(worldForItem(adapted)?.id).toBe('wizarding-world');
    expect(adapted.media.collection).toBeNull();
  });
  it('preserves validated metadata in legacy writes and reads', () => {
    const legacy = { title: 'Synthetic TV', type: 'show', worldId: 'dc' };
    expect(buildWatchlistPayload(legacy, 'synthetic-user').worldIds).toEqual([
      'dc',
    ]);
    expect(adaptWatchlistItem(legacy).worldIds).toEqual(['dc']);
    expect(
      adaptWatchlistItem({ ...legacy, worldIds: ['invalid'] }).worldIds,
    ).toEqual([]);
  });
  it('distinguishes omitted affiliation from an explicit clear and gives nested metadata precedence', () => {
    expect(getExplicitWorldMetadata(show)).toEqual({});
    expect(buildWatchlistPayload(show, 'user').media).not.toHaveProperty(
      'worldIds',
    );
    expect(
      buildWatchlistPayload(
        { ...show, worldId: 'pixar', media: { ...show.media, worldIds: [] } },
        'user',
      ).media.worldIds,
    ).toEqual([]);
    expect(
      getExplicitWorldMetadata({
        worldId: 'marvel',
        media: { worldIds: ['dc'] },
      }),
    ).toEqual({ worldIds: ['dc'] });
  });
  it('normalizes explicit edit paths without changing unrelated edits', () => {
    const current = { ...show, schemaVersion: 2 };
    expect(
      mapWatchlistUpdatesForWrite(current, {
        worldId: 'wizarding-world',
        note: 'Keep this note',
      }),
    ).toMatchObject({
      'media.worldIds': ['wizarding-world'],
      note: 'Keep this note',
    });
    expect(
      mapWatchlistUpdatesForWrite(current, {
        'media.worldIds': ['pixar', 'bogus', 'pixar'],
      }),
    ).toEqual({ 'media.worldIds': ['pixar'] });
    expect(
      mapWatchlistUpdatesForWrite(current, { 'media.worldId': 'dc' }),
    ).toEqual({ 'media.worldIds': ['dc'] });
  });
});
