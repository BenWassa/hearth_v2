import {
  buildMetadataAuditReport,
  getMetadataGaps,
  getPrimaryCredit,
  hasListValues,
  hasValue,
  hasShowEpisodeMetadataGaps,
  isActivelyAiringShow,
  pickPrimaryPerson,
  shouldRefreshAiringShowMetadata,
  shouldRefreshShowEpisodeMetadata,
} from './metadata.js';

const completeMovie = {
  id: 'movie-1',
  title: 'Movie',
  type: 'movie',
  source: { provider: 'tmdb', providerId: '123' },
  poster: '/poster.jpg',
  backdrop: '/backdrop.jpg',
  logo: '/logo.svg',
  year: '2024',
  overview: 'A movie.',
  genres: ['Drama'],
  actors: ['Actor One'],
  director: 'Director One',
  runtimeMinutes: 110,
};

const completeShow = {
  id: 'show-1',
  title: 'Show',
  type: 'show',
  source: { provider: 'tmdb', providerId: '456' },
  media: {
    poster: '/poster.jpg',
    backdrop: '/backdrop.jpg',
    logo: '/logo.svg',
    year: '2023',
    overview: 'A show.',
    genres: ['Comedy'],
    cast: ['Actor Two'],
    creators: ['Creator One'],
  },
  showData: {
    seasonCount: 1,
    seasons: [
      {
        seasonNumber: 1,
        episodeCount: 2,
        episodes: [
          { episodeNumber: 1, name: 'Pilot', overview: 'A beginning.' },
          { episodeNumber: 2, name: 'Second', overview: 'A follow-up.' },
        ],
      },
    ],
  },
};

describe('metadata helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks scalar and list values with trimmed strings', () => {
    expect(hasValue(' value ')).toBe(true);
    expect(hasValue('   ')).toBe(false);
    expect(hasListValues(['', ' item '])).toBe(true);
    expect(hasListValues(['', '   '])).toBe(false);
    expect(hasListValues('item')).toBe(false);
  });

  it('picks direct directors before media directors or show creators', () => {
    expect(pickPrimaryPerson([' Person ', 'Other'])).toBe('Person');
    expect(pickPrimaryPerson('Person')).toBe('');
    expect(
      getPrimaryCredit({
        item: {
          director: ' Direct ',
          media: { directors: ['Media Director'], creators: ['Creator'] },
        },
        isShow: true,
      }),
    ).toBe('Direct');
    expect(
      getPrimaryCredit({
        item: { media: { directors: [' Media Director '] } },
      }),
    ).toBe('Media Director');
    expect(
      getPrimaryCredit({
        item: { media: { creators: [' Creator '] } },
        isShow: true,
      }),
    ).toBe('Creator');
  });

  it('detects movie metadata gaps while preserving main-app logo behavior', () => {
    expect(getMetadataGaps(completeMovie)).toEqual([]);
    expect(getMetadataGaps({ ...completeMovie, logo: '' })).toEqual([]);
    expect(
      getMetadataGaps({ ...completeMovie, logo: '' }, { includeLogoGap: true }),
    ).toEqual(['logo']);
    expect(
      getMetadataGaps({
        ...completeMovie,
        source: {},
        poster: '',
        runtimeMinutes: 0,
        genres: [],
      }),
    ).toEqual(['source', 'poster', 'runtimeMinutes', 'genres']);
  });

  it('uses show-specific creator and season requirements', () => {
    expect(getMetadataGaps(completeShow, { includeLogoGap: true })).toEqual([]);
    expect(
      getMetadataGaps({
        ...completeShow,
        media: { ...completeShow.media, directors: [], creators: [] },
        showData: { seasonCount: 0, seasons: [] },
      }),
    ).toEqual(['director', 'seasonCount', 'seasons']);
  });

  it('detects targeted TV episode metadata gaps', () => {
    expect(hasShowEpisodeMetadataGaps(completeShow)).toBe(false);
    expect(shouldRefreshShowEpisodeMetadata(completeShow)).toBe(false);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: { seasonCount: 1, seasons: [] },
      }),
    ).toBe(true);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 3,
              episodes: [
                { episodeNumber: 1, name: 'Pilot', overview: 'A beginning.' },
              ],
            },
          ],
        },
      }),
    ).toBe(true);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [{ episodeNumber: 1, name: '' }],
            },
          ],
        },
      }),
    ).toBe(true);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [{ episodeNumber: 6, name: 'Episode 6' }],
            },
          ],
        },
      }),
    ).toBe(true);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 5,
                  name: 'Episode 5',
                  description: 'No description yet.',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(true);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 5,
                  name: 'Episode 5',
                  description: 'A real episode summary.',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(true);

    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 5,
                  name: 'Beware the Jabberwock, My Son',
                  description: 'A real episode summary.',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(false);

    // airDate alone should not satisfy rich metadata — description is still missing
    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  name: 'Pilot',
                  airDate: '2024-01-15',
                  runtimeMinutes: 45,
                },
              ],
            },
          ],
        },
      }),
    ).toBe(true);

    // still image satisfies rich metadata even without description (no air date)
    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  name: 'Pilot',
                  still: '/path/to/still.jpg',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(false);

    // a RECENTLY aired episode with a still but no description is still a gap —
    // providers backfill the synopsis on/after air, so we must keep refreshing
    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  name: 'Pilot',
                  airDate: '2026-04-20', // 4 days before mocked "now"
                  still: '/path/to/still.jpg',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(true);

    // a recently aired episode WITH a real description is complete
    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  name: 'Pilot',
                  airDate: '2026-04-20',
                  description: 'A real, freshly published synopsis.',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(false);

    // an episode aired long ago (beyond the backfill window) with a still but
    // no description is NOT flagged — avoids refreshing forever for episodes the
    // provider will never describe
    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  name: 'Pilot',
                  airDate: '2020-01-01',
                  still: '/path/to/still.jpg',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(false);

    // an upcoming (not-yet-aired) episode with only a title/still is fine —
    // the synopsis legitimately may not exist yet
    expect(
      hasShowEpisodeMetadataGaps({
        ...completeShow,
        showData: {
          seasonCount: 1,
          seasons: [
            {
              seasonNumber: 1,
              episodeCount: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  name: 'Pilot',
                  airDate: '2026-12-01',
                  still: '/path/to/still.jpg',
                },
              ],
            },
          ],
        },
      }),
    ).toBe(false);
  });

  it('limits auto episode refresh candidates to TMDB-backed shows', () => {
    expect(shouldRefreshShowEpisodeMetadata(completeMovie)).toBe(false);
    expect(
      shouldRefreshShowEpisodeMetadata({
        ...completeShow,
        source: {},
        showData: { seasonCount: 1, seasons: [] },
      }),
    ).toBe(false);
    expect(
      shouldRefreshShowEpisodeMetadata({
        ...completeShow,
        source: { provider: 'tmdb', providerId: '456' },
        showData: { seasonCount: 1, seasons: [] },
      }),
    ).toBe(true);
  });

  it('builds audit totals and gap counts', () => {
    const report = buildMetadataAuditReport(
      [
        completeMovie,
        { ...completeMovie, id: 'movie-2', title: '', poster: '' },
        {
          ...completeShow,
          logo: '',
          media: { ...completeShow.media, logo: '' },
        },
      ],
      { includeLogoGap: true },
    );

    expect(report.generatedAt).toBe(Date.now());
    expect(report.totalItems).toBe(3);
    expect(report.completeItems).toBe(1);
    expect(report.itemsWithGaps).toBe(2);
    expect(report.gapCounts.poster).toBe(1);
    expect(report.gapCounts.logo).toBe(1);
    expect(report.byType).toEqual({
      movie: { total: 2, withGaps: 1 },
      show: { total: 1, withGaps: 1 },
    });
    expect(report.missingRows).toEqual([
      {
        id: 'movie-2',
        title: '[untitled]',
        type: 'movie',
        gaps: ['poster'],
      },
      {
        id: 'show-1',
        title: 'Show',
        type: 'show',
        gaps: ['logo'],
      },
    ]);
  });

  it('identifies actively airing shows by status, inProduction, or upcoming air date', () => {
    const NOW = new Date('2026-04-24T12:00:00Z').getTime();

    expect(isActivelyAiringShow(completeMovie)).toBe(false);
    expect(isActivelyAiringShow(completeShow)).toBe(false);

    expect(
      isActivelyAiringShow({
        ...completeShow,
        media: { ...completeShow.media, showStatus: 'Returning Series' },
      }),
    ).toBe(true);

    expect(
      isActivelyAiringShow({
        ...completeShow,
        media: { ...completeShow.media, showStatus: 'In Production' },
      }),
    ).toBe(true);

    expect(
      isActivelyAiringShow({
        ...completeShow,
        media: { ...completeShow.media, showStatus: 'Ended' },
      }),
    ).toBe(false);

    expect(
      isActivelyAiringShow({
        ...completeShow,
        media: { ...completeShow.media, inProduction: true },
      }),
    ).toBe(true);

    expect(
      isActivelyAiringShow({
        ...completeShow,
        media: {
          ...completeShow.media,
          nextEpisodeAirDate: new Date(NOW + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        },
      }),
    ).toBe(true);

    expect(
      isActivelyAiringShow({
        ...completeShow,
        media: {
          ...completeShow.media,
          nextEpisodeAirDate: new Date(NOW - 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        },
      }),
    ).toBe(false);
  });

  it('gates airing show refresh on staleAfter and TMDB source', () => {
    const NOW = new Date('2026-04-24T12:00:00Z').getTime();
    const airingShow = {
      ...completeShow,
      source: { provider: 'tmdb', providerId: '456', staleAfter: NOW - 1 },
      media: { ...completeShow.media, showStatus: 'Returning Series' },
    };

    expect(shouldRefreshAiringShowMetadata(airingShow)).toBe(true);

    expect(
      shouldRefreshAiringShowMetadata({
        ...airingShow,
        source: { ...airingShow.source, staleAfter: NOW + 3600000 },
      }),
    ).toBe(false);

    // missing staleAfter (e.g. added via search/import) should be treated as due
    // so airing shows are not silently skipped forever
    expect(
      shouldRefreshAiringShowMetadata({
        ...airingShow,
        source: { provider: 'tmdb', providerId: '456' },
      }),
    ).toBe(true);

    expect(
      shouldRefreshAiringShowMetadata({
        ...airingShow,
        source: { provider: 'other', providerId: '456', staleAfter: NOW - 1 },
      }),
    ).toBe(false);

    expect(
      shouldRefreshAiringShowMetadata({
        ...airingShow,
        media: { ...airingShow.media, showStatus: 'Ended' },
      }),
    ).toBe(false);

    expect(shouldRefreshAiringShowMetadata(completeMovie)).toBe(false);
  });
});
