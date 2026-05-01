import {
  buildMetadataAuditReport,
  getMetadataGaps,
  getPrimaryCredit,
  hasListValues,
  hasValue,
  hasShowEpisodeMetadataGaps,
  pickPrimaryPerson,
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
});
