import { getShowEntryTarget } from './showProgress';

describe('getShowEntryTarget', () => {
  it('targets latest season with remaining unwatched episodes', () => {
    const seasons = [
      {
        number: 1,
        episodes: [
          { id: 's1e1', number: 1 },
          { id: 's1e2', number: 2 },
        ],
      },
      {
        number: 2,
        episodes: [
          { id: 's2e1', number: 1 },
          { id: 's2e2', number: 2 },
          { id: 's2e3', number: 3 },
        ],
      },
    ];
    const episodeProgress = {
      s1e1: true,
      s1e2: true,
      s2e1: true,
    };

    expect(getShowEntryTarget({ seasons, episodeProgress })).toEqual({
      seasonNumber: 2,
      episodeId: 's2e2',
    });
  });

  it('does not leak progress between shows', () => {
    const showASeasons = [
      { number: 2, episodes: [{ id: 'a-s2e1', number: 1 }] },
    ];
    const showBSeasons = [
      { number: 1, episodes: [{ id: 'b-s1e1', number: 1 }] },
      { number: 2, episodes: [{ id: 'b-s2e1', number: 1 }] },
    ];

    const showAResult = getShowEntryTarget({
      seasons: showASeasons,
      episodeProgress: { 'a-s2e1': true },
    });
    const showBResult = getShowEntryTarget({
      seasons: showBSeasons,
      episodeProgress: {},
    });

    expect(showAResult).toEqual({ seasonNumber: 2, episodeId: 'a-s2e1' });
    expect(showBResult).toEqual({ seasonNumber: 2, episodeId: 'b-s2e1' });
  });

  it('targets latest episode in latest season when show is fully watched', () => {
    const seasons = [
      {
        number: 1,
        episodes: [{ id: 's1e1', number: 1 }],
      },
      {
        number: 2,
        episodes: [
          { id: 's2e1', number: 1 },
          { id: 's2e2', number: 2 },
        ],
      },
    ];
    const episodeProgress = {
      s1e1: true,
      s2e1: true,
      s2e2: true,
    };

    expect(getShowEntryTarget({ seasons, episodeProgress })).toEqual({
      seasonNumber: 2,
      episodeId: 's2e2',
    });
  });
});
