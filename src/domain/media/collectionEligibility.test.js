import { describe, expect, it } from 'vitest';
import {
  classifyCollection,
  hasFilmFormatMetadata,
  distinctShelfItems,
  filterEligibleCollections,
  getCollectionIdentity,
  isFeatureFilm,
} from './collectionEligibility.js';
import { buildCollectionRollups } from './collections.js';

const movie = (id, extra = {}) => ({
  id,
  type: 'movie',
  status: 'unwatched',
  ...extra,
});
const saga = (providerId, count = 1, extra = {}) => ({
  id: `collection:tmdb:${providerId}`,
  collection: { provider: 'tmdb', providerId, name: 'Synthetic saga' },
  items: Array.from({ length: count }, (_, i) => movie(`film-${i}`)),
  ...extra,
});

describe('approved editorial eligibility', () => {
  it.each([
    '86311',
    '1241',
    '435259',
    '10',
    '115575',
    '420',
    '722971',
    '726871',
    '10194',
    '645',
    '9485',
    '263',
    '264',
  ])('allows approved collection %s with one owned feature', (id) => {
    expect(classifyCollection(saga(id))).toMatchObject({
      eligible: true,
      reason: 'editorial_default',
      ownedFeatureCount: 1,
    });
  });
  it.each(['488924', '2980'])(
    'does not promote excluded collection %s for any film count',
    (id) => {
      for (const count of [1, 2, 3, 20])
        expect(classifyCollection(saga(id, count))).toMatchObject({
          eligible: false,
          reason: 'editorial_hidden',
        });
    },
  );
  it('does not promote arbitrary metadata or a provider count', () => {
    expect(
      classifyCollection(saga('unknown', 20, { providerFeatureCount: 50 })),
    ).toMatchObject({ eligible: false, reason: 'not_curated' });
    expect(
      classifyCollection(saga('unknown', 1), { 'tmdb:unknown': 'show' })
        .eligible,
    ).toBe(true);
  });
  it('distinguishes shared explicit hide/show from absence/default/null', () => {
    const potter = saga('1241');
    for (const hide of [false, 'hide', { visibility: 'hide' }]) {
      expect(classifyCollection(potter, { 'tmdb:1241': hide })).toMatchObject({
        eligible: false,
        reason: 'household_hidden',
      });
    }
    for (const value of [undefined, null, 'default'])
      expect(classifyCollection(potter, { 'tmdb:1241': value }).eligible).toBe(
        true,
      );
    for (const show of [true, 'show', { visibility: 'show' }])
      expect(
        classifyCollection(saga('488924', 2), new Map([['tmdb:488924', show]])),
      ).toMatchObject({ eligible: true, reason: 'household_shown' });
  });
  it('preserves raw metadata when filtering and supports anthology semantics', () => {
    const paddington = saga('488924', 2);
    expect(filterEligibleCollections([paddington])).toEqual([]);
    expect(paddington.collection.providerId).toBe('488924');
    expect(classifyCollection(saga('645')).sequenceMode).toBe('anthology');
  });
  it('requires canonical provider identity, never the title', () => {
    expect(
      getCollectionIdentity({ media: { collection: { providerId: 263 } } }),
    ).toBe('tmdb:263');
    expect(
      classifyCollection(
        saga('unknown', 1, { title: 'The Avengers Collection' }),
      ).eligible,
    ).toBe(false);
    expect(
      classifyCollection(
        saga('263', 1, {
          collection: { provider: 'other', providerId: '263' },
        }),
      ).eligible,
    ).toBe(false);
  });
});

describe('feature counts', () => {
  it('keeps known shorts and specials out of feature progress, including explicit Show', () => {
    const short = movie('short', { runtimeMinutes: 7 });
    const special = movie('special', {
      contentKind: 'special',
      runtimeMinutes: 90,
    });
    expect(isFeatureFilm(short)).toBe(false);
    expect(isFeatureFilm(special)).toBe(false);
    expect(
      classifyCollection(saga('10194', 0, { items: [short, special] }), {
        'tmdb:10194': 'show',
      }),
    ).toMatchObject({
      eligible: false,
      reason: 'short_only',
      ownedFeatureCount: 0,
      shortCount: 2,
    });
    const feature = movie('feature', { runtimeMinutes: 95, status: 'watched' });
    expect(
      classifyCollection(saga('10194', 0, { items: [short, feature] })),
    ).toMatchObject({
      eligible: true,
      ownedFeatureCount: 1,
      ownedFeatureWatchedCount: 1,
      shortCount: 1,
    });
  });
  it('retains unknown runtimes without guessing from the title and respects explicit feature metadata', () => {
    expect(isFeatureFilm(movie('unknown', { title: 'A Short Story' }))).toBe(
      true,
    );
    expect(
      isFeatureFilm(
        movie('feature', { contentKind: 'feature', runtimeMinutes: 40 }),
      ),
    ).toBe(true);
    expect(isFeatureFilm({ type: 'show', runtimeMinutes: 90 })).toBe(false);
  });
  it('deduplicates shared provider identity and excludes discovery-only films from shelf counts', () => {
    const films = [
      movie('a', { source: { provider: 'tmdb', providerId: '42' } }),
      movie('b', { source: { provider: 'tmdb', providerId: '42' } }),
      movie('c', { owned: false }),
    ];
    expect(distinctShelfItems(films)).toHaveLength(1);
    expect(
      classifyCollection(saga('86311', 0, { items: films })).ownedFeatureCount,
    ).toBe(1);
  });
  it('works with actual feature-only rollups and does not mutate short membership', () => {
    const collection = {
      provider: 'tmdb',
      providerId: '10194',
      name: 'Toy Story Collection',
    };
    const films = [
      movie('feature', { collection, runtimeMinutes: 90 }),
      movie('short', { collection, runtimeMinutes: 7 }),
    ];
    const rollups = buildCollectionRollups(films.filter(isFeatureFilm)).filter(
      (i) => i.type === 'collection',
    );
    expect(filterEligibleCollections(rollups)[0].totalCount).toBe(1);
    expect(films[1].collection).toBe(collection);
  });
});

it('distinguishes verified film format metadata from unknown provider records', () => {
  expect(hasFilmFormatMetadata({ runtimeMinutes: 95 })).toBe(true);
  expect(hasFilmFormatMetadata({ runtimeMinutes: 7 })).toBe(true);
  expect(hasFilmFormatMetadata({ contentKind: 'special' })).toBe(true);
  expect(hasFilmFormatMetadata({ type: 'movie', runtimeMinutes: null })).toBe(
    false,
  );
  expect(hasFilmFormatMetadata({ runtimeMinutes: Infinity })).toBe(false);
  expect(hasFilmFormatMetadata({ type: 'show', runtimeMinutes: 95 })).toBe(
    false,
  );
});
