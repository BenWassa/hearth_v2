import {
  classifyMedia,
  blendClassification,
  canonicalMediaKey,
  CLASSIFIER_VERSION,
  FACETS,
  classificationRevision,
  getEffectiveClassification,
  tagProvenance,
} from './classification.mjs';
import {
  primaryTheme,
  nextWatchRuntime,
  allocateTonightThemes,
} from './tonightClassification.js';
import { buildWatchlistPayload } from './schema.js';
import { adaptWatchlistItem } from './adapters.js';
import fixtures from './classificationFixtures.json';
const movie = (values = {}) => ({
  provider: 'tmdb',
  providerId: '603',
  type: 'movie',
  status: 'unwatched',
  title: 'Film',
  ...values,
});
const attributes = (values = {}) =>
  Object.fromEntries(
    FACETS.map((name) => [
      name,
      {
        value: values[name] || 'unknown',
        confidence: values[name] ? 'high' : 'unknown',
      },
    ]),
  );

describe('automatic viewing classification', () => {
  it('keeps movie/TV identities separate and ignores malformed identities', () => {
    expect(canonicalMediaKey(movie())).toBe('tmdb:movie:603');
    expect(canonicalMediaKey(movie({ type: 'show' }))).toBe('tmdb:tv:603');
    expect(canonicalMediaKey(movie({ providerId: '../bad' }))).toBe('');
  });
  it('has stable public revisions that exclude private user state, timestamps and artwork', () => {
    expect(classificationRevision(movie())).toBe(
      classificationRevision(
        movie({
          note: 'private',
          source: { provider: 'tmdb', providerId: '603', fetchedAt: 123 },
          userState: { vibe: 'visual' },
          poster: '/x',
        }),
      ),
    );
    expect(
      classificationRevision(movie({ keywords: ['heist', 'sitcom'] })),
    ).toBe(classificationRevision(movie({ keywords: ['sitcom', 'heist'] })));
  });
  it('keeps unknowns unknown and refuses genre, age and animation shortcuts', () => {
    for (const input of [
      {},
      { genres: ['Comedy', 'Animation'], year: '1930' },
      { locale: 'fr-FR', keywords: ['heartwarming'] },
      { keywords: null },
    ]) {
      expect(
        Object.values(classifyMedia(input).attributes).every(
          (a) => a.value === 'unknown',
        ),
      ).toBe(true);
    }
  });
  it('rejects corrupt catalog facets and handles malformed locale safely', () => {
    const item = movie();
    const corrupt = { ...classifyMedia(item), attributes: {} };
    expect(primaryTheme({ ...item, classification: corrupt })).toBe('unknown');
    expect(() =>
      classifyMedia({ ...item, locale: 42, keywords: null }),
    ).not.toThrow();
  });
  it('supports independent facets, constraints and controlled admin corrections', () => {
    const item = movie({
      keywords: ['sitcom', 'heartwarming', 'psychological horror'],
    });
    const baseline = classifyMedia(item);
    expect(baseline.attributes.comedyFirst.value).toBe('high');
    expect(baseline.attributes.comfort.value).toBe('low');
    const hybrid = blendClassification(
      baseline,
      attributes({
        comfort: 'high',
        visualDistinctiveness: 'high',
        curatedClassic: 'high',
      }),
      'test',
    );
    expect(hybrid.attributes.comfort.value).toBe('low');
    expect(hybrid.attributes.visualDistinctiveness.value).toBe('high');
    expect(hybrid.attributes.curatedClassic.value).toBe('unknown');
    expect(
      primaryTheme({ ...item, media: { ...item, classification: hybrid } }),
    ).toBe('visual');
    const corrected = getEffectiveClassification({
      ...item,
      media: {
        ...item,
        classification: hybrid,
        classificationOverride: { attributes: { comfort: 'high' } },
      },
    });
    expect(corrected.attributes.comfort).toEqual({
      value: 'high',
      method: 'admin',
      confidence: 'high',
    });
    expect(() =>
      blendClassification(
        baseline,
        { ...attributes(), injected: true },
        'test',
      ),
    ).toThrow();
  });
  it('preserves manual/imported/unknown-origin tags and progress through v2 normalization', () => {
    const input = {
      schemaVersion: 2,
      source: { provider: 'tmdb', providerId: '603' },
      media: {
        type: 'movie',
        title: 'Film',
        keywords: ['heist'],
        classification: classifyMedia(movie()),
      },
      userState: {
        vibe: 'visual',
        energy: 'light',
        note: 'private',
        episodeProgress: { s1e1: true },
      },
    };
    const payload = buildWatchlistPayload(input, 'user');
    expect(payload.userState.tagProvenance).toEqual({
      vibe: 'legacy',
      energy: 'legacy',
    });
    expect(payload.userState.episodeProgress).toEqual({ s1e1: true });
    expect(adaptWatchlistItem(payload).vibe).toBe('visual');
    expect(primaryTheme(adaptWatchlistItem(payload))).toBe('visual');
    expect(tagProvenance({ vibe: 'comfort' }).vibe).toBe('legacy');
  });
  it.each([null, undefined, '', 0, -1, NaN, Infinity, '22'])(
    'never qualifies invalid runtime %s as Quick Bites',
    (runtimeMinutes) => {
      const item = movie({ runtimeMinutes });
      expect(nextWatchRuntime(item)).toBeNull();
      expect(allocateTonightThemes([item]).quick).toHaveLength(0);
    },
  );
  it('uses the next released unwatched episode, not typical series runtime', () => {
    const item = movie({
      type: 'show',
      runtimeMinutes: 22,
      seasons: [
        {
          number: 1,
          episodes: [
            { id: 'a', number: 1, runtimeMinutes: 22 },
            { id: 'b', number: 2, runtimeMinutes: 55 },
            { id: 'c', number: 3, runtimeMinutes: 10, airDate: '2099-01-01' },
          ],
        },
      ],
      episodeProgress: { a: true },
    });
    expect(nextWatchRuntime(item)).toBe(55);
    expect(
      nextWatchRuntime({ ...item, episodeProgress: { a: true, b: true } }),
    ).toBeNull();
    expect(allocateTonightThemes([item]).quick).toHaveLength(0);
    expect(
      allocateTonightThemes([{ ...item, episodeProgress: {} }]).quick,
    ).toHaveLength(1);
    expect(nextWatchRuntime({ ...item, seasons: [] })).toBeNull();
  });
  it('allocates each eligible canonical title once across overlapping thematic facets', () => {
    const item = movie({
      keywords: ['heartwarming', 'sitcom', 'time paradox', 'visually stunning'],
    });
    const rows = allocateTonightThemes([
      item,
      { ...item, id: 'duplicate' },
      movie({ providerId: '2', status: 'watched' }),
    ]);
    expect(Object.values(rows).flat()).toHaveLength(1);
  });
  it('covers 50 real titles plus a synthetic low-information case, with diverse annotated editorial cases including all 30 seeds, with deterministic independent facets and unique allocation', () => {
    expect(fixtures).toHaveLength(51);
    expect(fixtures.filter((f) => f.seed)).toHaveLength(30);
    for (const fixture of fixtures) {
      const result = classifyMedia(fixture.input);
      expect(result.version).toBe(CLASSIFIER_VERSION);
      expect(result).toEqual(classifyMedia(fixture.input));
      expect(Object.keys(fixture.expected)).toEqual(FACETS);
      for (const name of FACETS)
        expect(['low', 'medium', 'high', 'unknown']).toContain(
          fixture.expected[name],
        );
    }
    const rows = allocateTonightThemes(
      fixtures.map((f, i) => ({ ...f.input, id: `${i}`, status: 'unwatched' })),
    );
    const allocated = Object.values(rows).flat();
    expect(new Set(allocated.map(canonicalMediaKey)).size).toBe(
      allocated.length,
    );
    expect(allocated).toHaveLength(51);
  });
});
