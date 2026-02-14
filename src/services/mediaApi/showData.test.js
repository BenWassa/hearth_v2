import { hydrateShowData } from './showData.js';
import { getSeasonEpisodes, getShowSeasons } from './client.js';

jest.mock('./client.js', () => ({
  getSeasonEpisodes: jest.fn(),
  getShowSeasons: jest.fn(),
}));

describe('hydrateShowData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not request episodes for season 0', async () => {
    getShowSeasons.mockResolvedValue({
      seasonCount: 3,
      seasons: [
        { seasonNumber: 0, name: 'Specials', episodeCount: 2 },
        { seasonNumber: 1, name: 'Season 1', episodeCount: 3 },
        { seasonNumber: 2, name: 'Season 2', episodeCount: 4 },
      ],
    });

    getSeasonEpisodes.mockImplementation(async ({ seasonNumber }) => ({
      episodes: [
        {
          episodeId: `${seasonNumber}-1`,
          episodeNumber: 1,
          name: `Episode ${seasonNumber}-1`,
        },
      ],
    }));

    const data = await hydrateShowData({
      provider: 'tmdb',
      providerId: '1399',
    });

    expect(getSeasonEpisodes).toHaveBeenCalledTimes(2);
    expect(getSeasonEpisodes).toHaveBeenCalledWith({
      provider: 'tmdb',
      providerId: '1399',
      seasonNumber: 1,
    });
    expect(getSeasonEpisodes).toHaveBeenCalledWith({
      provider: 'tmdb',
      providerId: '1399',
      seasonNumber: 2,
    });
    expect(data.seasons[0]).toMatchObject({
      seasonNumber: 0,
      name: 'Specials',
      episodes: [],
    });
  });

  it('keeps hydrating other seasons when one season request fails', async () => {
    getShowSeasons.mockResolvedValue({
      seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }],
    });

    getSeasonEpisodes.mockImplementation(async ({ seasonNumber }) => {
      if (seasonNumber === 1) {
        throw new Error('rate limited');
      }
      return {
        episodes: [
          {
            episodeId: '2-1',
            episodeNumber: 1,
            name: 'Episode 2-1',
          },
        ],
      };
    });

    const data = await hydrateShowData({
      provider: 'tmdb',
      providerId: '42',
    });

    expect(data.seasons).toHaveLength(2);
    expect(data.seasons[0].episodes).toEqual([]);
    expect(data.seasons[1].episodes).toHaveLength(1);
  });
});
