import { getShowWatchProgressPercent } from './showCardProgress.js';

describe('getShowWatchProgressPercent', () => {
  it('tracks progress across all seasons using total episode counts', () => {
    const progress = getShowWatchProgressPercent({
      type: 'show',
      seasons: [
        {
          number: 1,
          episodeCount: 3,
          episodes: [
            { id: 's1e1', number: 1, seasonNumber: 1 },
            { id: 's1e2', number: 2, seasonNumber: 1 },
            { id: 's1e3', number: 3, seasonNumber: 1 },
          ],
        },
        {
          number: 2,
          episodeCount: 3,
          episodes: [
            { id: 's2e1', number: 1, seasonNumber: 2 },
            { id: 's2e2', number: 2, seasonNumber: 2 },
            { id: 's2e3', number: 3, seasonNumber: 2 },
          ],
        },
      ],
      episodeProgress: {
        s1e1: true,
      },
    });

    expect(progress).toBe(17);
  });

  it('counts watched episodes from canonical keys when season episode arrays are missing', () => {
    const progress = getShowWatchProgressPercent({
      type: 'show',
      seasons: [
        { number: 1, episodeCount: 10, episodes: [] },
        { number: 2, episodeCount: 10, episodes: [] },
      ],
      episodeProgress: {
        s1e1: true,
        s1e2: true,
        s1e3: true,
      },
    });

    expect(progress).toBe(15);
  });

  it('falls back to minimal progress when no total episode count is known', () => {
    const progress = getShowWatchProgressPercent({
      type: 'show',
      seasons: [],
      episodeProgress: { any: true },
    });

    expect(progress).toBe(5);
  });
});
