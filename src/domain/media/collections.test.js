import { buildCollectionRollups, getCollectionKey } from './collections.js';

const makeMovie = (id, title, overrides = {}) => ({
  id,
  title,
  type: 'movie',
  status: 'unwatched',
  year: '2001',
  media: {
    collection: {
      provider: 'tmdb',
      providerId: '42',
      name: 'The Saga',
      poster: '/collection-poster.jpg',
      backdrop: '/collection-backdrop.jpg',
    },
  },
  ...overrides,
});

describe('collection rollups', () => {
  it('builds a stable collection key for movie collection metadata', () => {
    expect(getCollectionKey(makeMovie('a', 'Part One'))).toBe('tmdb:42');
    expect(
      getCollectionKey({ ...makeMovie('s', 'Series'), type: 'show' }),
    ).toBe('');
  });

  it('replaces repeated collection movies with one rollup', () => {
    const items = [
      makeMovie('b', 'Part Two', { year: '2002', status: 'watched' }),
      makeMovie('a', 'Part One', { year: '2001' }),
      { id: 'solo', title: 'Solo Film', type: 'movie', status: 'unwatched' },
    ];

    const rollups = buildCollectionRollups(items);

    expect(rollups).toHaveLength(2);
    expect(rollups[0]).toMatchObject({
      id: 'collection:tmdb:42',
      type: 'collection',
      title: 'The Saga',
      totalCount: 2,
      watchedCount: 1,
      significanceScore: 0,
      year: '2001-2002',
    });
    expect(rollups[0].items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(rollups[0].nextItem.id).toBe('a');
    expect(rollups[1].id).toBe('solo');
  });

  it('rolls up single collection members so collections can be discovered', () => {
    const rollups = buildCollectionRollups([makeMovie('a', 'Part One')]);

    expect(rollups).toHaveLength(1);
    expect(rollups[0]).toMatchObject({
      id: 'collection:tmdb:42',
      type: 'collection',
      title: 'The Saga',
      totalCount: 1,
      watchedCount: 0,
      significanceScore: 0,
    });
    expect(rollups[0].items.map((item) => item.id)).toEqual(['a']);
  });

  it('sorts collection rollups by average rating significance', () => {
    const items = [
      makeMovie('low-a', 'Low Part One', {
        rating: 5,
        media: {
          collection: {
            provider: 'tmdb',
            providerId: '1',
            name: 'Lower Saga',
          },
        },
      }),
      makeMovie('high-a', 'High Part One', {
        rating: 8,
        media: {
          collection: {
            provider: 'tmdb',
            providerId: '2',
            name: 'Higher Saga',
          },
        },
      }),
      makeMovie('high-b', 'High Part Two', {
        rating: 9,
        media: {
          collection: {
            provider: 'tmdb',
            providerId: '2',
            name: 'Higher Saga',
          },
        },
      }),
    ];

    const collections = buildCollectionRollups(items).filter(
      (entry) => entry.type === 'collection',
    );

    expect(collections.map((collection) => collection.title)).toEqual([
      'Higher Saga',
      'Lower Saga',
    ]);
    expect(collections[0].significanceScore).toBe(8.5);
    expect(collections[1].significanceScore).toBe(5);
  });
});
