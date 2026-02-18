import { normalizeSeasons } from './normalizers';

describe('normalizeSeasons', () => {
  it('filters out seasons that have zero total episodes', () => {
    const seasons = normalizeSeasons([
      {
        seasonNumber: 1,
        episodeCount: 2,
        episodes: [
          { episodeNumber: 1, name: 'A' },
          { episodeNumber: 2, name: 'B' },
        ],
      },
      {
        seasonNumber: 2,
        episodeCount: 0,
        episodes: [],
      },
      {
        seasonNumber: 3,
        episodeCount: 5,
        episodes: [],
      },
      {
        seasonNumber: 4,
        episodes: [],
      },
    ]);

    expect(seasons.map((season) => season.number)).toEqual([1, 3]);
  });
});
