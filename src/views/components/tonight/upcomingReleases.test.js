import { getUpcomingReleases } from './upcomingReleases.js';

const now = new Date(2026, 4, 1);

describe('getUpcomingReleases', () => {
  it('ignores movies', () => {
    const releases = getUpcomingReleases(
      [
        {
          id: 'movie-1',
          type: 'movie',
          title: 'Future Movie',
          seasons: [{ episodes: [{ airDate: '2026-05-02' }] }],
        },
      ],
      { now },
    );

    expect(releases).toEqual([]);
  });

  it('includes watched shows when a future season has upcoming episodes', () => {
    const releases = getUpcomingReleases(
      [
        {
          id: 'show-1',
          type: 'show',
          status: 'watched',
          title: 'Finished Show',
          seasons: [
            {
              seasonNumber: 3,
              name: 'Season 3',
              episodes: [{ episodeNumber: 1, airDate: '2026-06-01' }],
            },
          ],
        },
      ],
      { now },
    );

    expect(releases).toHaveLength(1);
    expect(releases[0]).toMatchObject({
      showTitle: 'Finished Show',
      seasonNumber: 3,
      episodeNumber: 1,
      airDate: '2026-06-01',
    });
  });

  it('groups upcoming episodes by show season and keeps the nearest episode', () => {
    const releases = getUpcomingReleases(
      [
        {
          id: 'show-1',
          type: 'show',
          status: 'watching',
          title: 'The North Road',
          poster: '/posters/show.jpg',
          seasons: [
            {
              seasonNumber: 2,
              name: 'Season 2',
              poster: '/posters/season-2.jpg',
              episodes: [
                {
                  id: 's2e2',
                  episodeNumber: 2,
                  name: 'The Return',
                  airDate: '2026-05-08',
                },
                {
                  id: 's2e1',
                  episodeNumber: 1,
                  name: 'The Signal',
                  airDate: '2026-05-03',
                },
              ],
            },
          ],
        },
      ],
      { now },
    );

    expect(releases).toHaveLength(1);
    expect(releases[0]).toMatchObject({
      showId: 'show-1',
      showTitle: 'The North Road',
      seasonNumber: 2,
      seasonName: 'Season 2',
      seasonPoster: '/posters/season-2.jpg',
      poster: '/posters/season-2.jpg',
      episodeId: 's2e1',
      episodeTitle: 'The Signal',
      episodeNumber: 1,
      airDate: '2026-05-03',
    });
  });

  it('sorts releases by nearest local air date and falls back to show poster', () => {
    const releases = getUpcomingReleases(
      [
        {
          id: 'show-b',
          type: 'show',
          status: 'unwatched',
          title: 'Beta',
          poster: '/posters/beta.jpg',
          seasons: [
            {
              seasonNumber: 1,
              episodes: [{ episodeNumber: 1, airDate: '2026-05-05' }],
            },
          ],
        },
        {
          id: 'show-a',
          type: 'show',
          status: 'unwatched',
          title: 'Alpha',
          poster: '/posters/alpha.jpg',
          seasons: [
            {
              seasonNumber: 1,
              episodes: [{ episodeNumber: 1, airDate: '2026-05-02' }],
            },
          ],
        },
      ],
      { now },
    );

    expect(releases.map((release) => release.showTitle)).toEqual([
      'Alpha',
      'Beta',
    ]);
    expect(releases[0].poster).toBe('/posters/alpha.jpg');
  });
});
