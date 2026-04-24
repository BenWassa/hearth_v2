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
      year: '2001-2002',
    });
    expect(rollups[0].items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(rollups[0].nextItem.id).toBe('a');
    expect(rollups[1].id).toBe('solo');
  });

  it('leaves single collection members as normal movies', () => {
    const rollups = buildCollectionRollups([makeMovie('a', 'Part One')]);

    expect(rollups).toHaveLength(1);
    expect(rollups[0].id).toBe('a');
    expect(rollups[0].type).toBe('movie');
  });
});
