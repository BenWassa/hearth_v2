import { getShowEntryTarget } from './showProgress';

describe('getShowEntryTarget', () => {
  it('targets next unwatched episode in chronological order', () => {
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

  it('starts brand new shows at season 1 episode 1', () => {
    const seasons = [
      {
        number: 1,
        episodes: [{ id: 's1e1', number: 1 }],
      },
      {
        number: 4,
        episodes: [{ id: 's4e1', number: 1 }],
      },
      {
        number: 9,
        episodes: [{ id: 's9e1', number: 1 }],
      },
    ];

    expect(getShowEntryTarget({ seasons, episodeProgress: {} })).toEqual({
      seasonNumber: 1,
      episodeId: 's1e1',
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
    expect(showBResult).toEqual({ seasonNumber: 1, episodeId: 'b-s1e1' });
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

  it('supports legacy progress keys when episode ids changed across sources', () => {
    const seasons = [
      {
        number: 2,
        episodes: [
          {
            id: '2001',
            seasonNumber: 2,
            number: 1,
            progressKeys: ['2001', 's2e1'],
          },
          {
            id: '2002',
            seasonNumber: 2,
            number: 2,
            progressKeys: ['2002', 's2e2'],
          },
          {
            id: '2003',
            seasonNumber: 2,
            number: 3,
            progressKeys: ['2003', 's2e3'],
          },
        ],
      },
    ];
    const episodeProgress = {
      s2e1: true,
      s2e2: true,
    };

    expect(getShowEntryTarget({ seasons, episodeProgress })).toEqual({
      seasonNumber: 2,
      episodeId: '2003',
    });
  });

  it('supports refreshed API episode shape (episodeId + episodeNumber)', () => {
    const seasons = [
      {
        number: 1,
        episodes: [
          { episodeId: 's1e1', episodeNumber: 1 },
          { episodeId: 's1e2', episodeNumber: 2 },
        ],
      },
    ];
    const episodeProgress = {
      s1e1: true,
    };

    expect(getShowEntryTarget({ seasons, episodeProgress })).toEqual({
      seasonNumber: 1,
      episodeId: 's1e2',
    });
  });
});
