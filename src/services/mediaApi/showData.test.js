import { vi } from 'vitest';
import {
  hydrateShowData,
  refreshShowDataForMissingEpisodes,
} from './showData.js';
import { getSeasonEpisodes, getShowSeasons } from './client.js';

vi.mock('./client.js', () => ({
  getSeasonEpisodes: vi.fn(),
  getShowSeasons: vi.fn(),
}));

describe('hydrateShowData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

describe('refreshShowDataForMissingEpisodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not request episodes for complete existing seasons', async () => {
    getShowSeasons.mockResolvedValue({
      seasonCount: 1,
      episodeCount: 1,
      seasons: [{ seasonNumber: 1, name: 'Season 1', episodeCount: 1 }],
    });

    const data = await refreshShowDataForMissingEpisodes({
      provider: 'tmdb',
      providerId: '42',
      currentShowData: {
        seasonCount: 1,
        episodeCount: 1,
        seasons: [
          {
            seasonNumber: 1,
            name: 'Season 1',
            episodeCount: 1,
            episodes: [
              {
                id: 's1e1',
                episodeNumber: 1,
                name: 'Pilot',
                description: 'A beginning.',
              },
            ],
          },
        ],
      },
    });

    expect(getSeasonEpisodes).not.toHaveBeenCalled();
    expect(data.seasons[0].episodes).toEqual([
      {
        id: 's1e1',
        episodeNumber: 1,
        name: 'Pilot',
        description: 'A beginning.',
      },
    ]);
  });

  it('fetches only incomplete and new seasons while preserving complete seasons', async () => {
    getShowSeasons.mockResolvedValue({
      seasonCount: 3,
      episodeCount: 6,
      showStatus: 'Returning Series',
      inProduction: true,
      nextEpisodeAirDate: '2026-07-17',
      seasons: [
        { seasonNumber: 1, name: 'Season 1', episodeCount: 2 },
        { seasonNumber: 2, name: 'Season 2', episodeCount: 2 },
        { seasonNumber: 3, name: 'Season 3', episodeCount: 2 },
      ],
    });
    getSeasonEpisodes.mockImplementation(async ({ seasonNumber }) => ({
      episodes: [
        {
          episodeId: `s${seasonNumber}e1`,
          episodeNumber: 1,
          name: `Season ${seasonNumber} Premiere`,
          overview: 'Fresh details.',
        },
        {
          episodeId: `s${seasonNumber}e2`,
          episodeNumber: 2,
          name: `Season ${seasonNumber} Finale`,
          overview: 'Fresh details.',
        },
      ],
    }));

    const data = await refreshShowDataForMissingEpisodes({
      provider: 'tmdb',
      providerId: '42',
      currentShowData: {
        seasonCount: 2,
        episodeCount: 4,
        seasons: [
          {
            seasonNumber: 1,
            name: 'Season 1',
            episodeCount: 2,
            episodes: [
              {
                id: 's1e1',
                episodeNumber: 1,
                name: 'Pilot',
                description: 'Existing details.',
              },
              {
                id: 's1e2',
                episodeNumber: 2,
                name: 'Second',
                description: 'Existing details.',
              },
            ],
          },
          {
            seasonNumber: 2,
            name: 'Season 2',
            episodeCount: 2,
            episodes: [{ id: 's2e1', episodeNumber: 1, name: 'Episode 1' }],
          },
        ],
      },
    });

    expect(getSeasonEpisodes).toHaveBeenCalledTimes(2);
    expect(getSeasonEpisodes).toHaveBeenCalledWith({
      provider: 'tmdb',
      providerId: '42',
      seasonNumber: 2,
    });
    expect(getSeasonEpisodes).toHaveBeenCalledWith({
      provider: 'tmdb',
      providerId: '42',
      seasonNumber: 3,
    });
    expect(data.seasons[0].episodes[0].name).toBe('Pilot');
    expect(data.seasons[1].episodes).toHaveLength(2);
    expect(data.seasons[2].episodes).toHaveLength(2);
    expect(data).toMatchObject({
      showStatus: 'Returning Series',
      inProduction: true,
      nextEpisodeAirDate: '2026-07-17',
    });
  });

  it('preserves existing local season data when a targeted episode fetch fails', async () => {
    getShowSeasons.mockResolvedValue({
      seasonCount: 1,
      episodeCount: 2,
      seasons: [{ seasonNumber: 1, name: 'Season 1', episodeCount: 2 }],
    });
    getSeasonEpisodes.mockRejectedValue(new Error('rate limited'));

    const data = await refreshShowDataForMissingEpisodes({
      provider: 'tmdb',
      providerId: '42',
      currentShowData: {
        seasonCount: 1,
        seasons: [
          {
            seasonNumber: 1,
            name: 'Season 1',
            episodeCount: 2,
            episodes: [{ id: 's1e1', episodeNumber: 1, name: 'Pilot' }],
          },
        ],
      },
    });

    expect(getSeasonEpisodes).toHaveBeenCalledTimes(1);
    expect(data.seasons[0].episodes).toEqual([
      { id: 's1e1', episodeNumber: 1, name: 'Pilot' },
    ]);
  });
});
