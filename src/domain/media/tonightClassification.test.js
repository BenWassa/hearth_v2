import { getEffectiveClassification } from './classification.mjs';
import { buildTemplateSeedItems } from '../../template/seedLibrary.js';
import { composeTonightRows } from './tonightComposition.js';
import {
  QUICK_BITES_MAX_MINUTES,
  allocateTonightThemes,
  nextWatchRuntime,
  primaryTheme,
} from './tonightClassification.js';

const NOW = new Date('2026-06-01T12:00:00');
const override = (attributes) => ({
  media: { classificationOverride: { attributes } },
});
const movie = (providerId, values = {}) => ({
  provider: 'tmdb',
  providerId: `${providerId}`,
  type: 'movie',
  status: 'unwatched',
  title: `Film ${providerId}`,
  ...values,
});
const show = (providerId, values = {}) => ({
  ...movie(providerId, { title: `Show ${providerId}` }),
  type: 'show',
  ...values,
});
const season = (episodes) => [{ number: 1, episodes }];
const rowOf = (rows, item) =>
  Object.keys(rows).filter((name) => rows[name].includes(item));
const quick = (item) =>
  allocateTonightThemes([item], { now: NOW }).quick.includes(item);

describe('Tonight classification policy', () => {
  it('exports the Quick Bites threshold as 30 minutes', () => {
    expect(QUICK_BITES_MAX_MINUTES).toBe(30);
  });

  describe('Quick Bites runtime boundary', () => {
    it('admits exactly the threshold and rejects one minute over', () => {
      expect(quick(movie(1, { runtimeMinutes: QUICK_BITES_MAX_MINUTES }))).toBe(
        true,
      );
      expect(quick(movie(2, { runtimeMinutes: 30 }))).toBe(true);
      expect(quick(movie(3, { runtimeMinutes: 31 }))).toBe(false);
      expect(quick(movie(4, { runtimeMinutes: 30.5 }))).toBe(false);
    });
    it('applies the same boundary to a show next-episode runtime', () => {
      const withRuntime = (providerId, runtimeMinutes) =>
        show(providerId, {
          seasons: season([{ id: 'a', number: 1, runtimeMinutes }]),
        });
      expect(quick(withRuntime(5, 30))).toBe(true);
      expect(quick(withRuntime(6, 31))).toBe(false);
    });
    it.each([null, 0, NaN])('never admits runtime %s to Quick Bites', (rt) => {
      const rows = allocateTonightThemes(
        [movie(7, { runtimeMinutes: rt }), show(8, { runtimeMinutes: rt })],
        { now: NOW },
      );
      expect(rows.quick).toHaveLength(0);
      // The titles are still placed once, in a non-quick row.
      expect(Object.values(rows).flat()).toHaveLength(2);
    });
    it('never admits a show with no episode data, even with a series runtime', () => {
      const item = show(9, { runtimeMinutes: 22 });
      expect(nextWatchRuntime(item, NOW)).toBeNull();
      expect(quick(item)).toBe(false);
    });
  });

  describe('Quick Bites uses the next episode, not the first', () => {
    it('is not quick when the first episode is 24m but the next unwatched one is 55m', () => {
      // First episode is unaired, so the next released unwatched one governs.
      const item = show(10, {
        seasons: season([
          { id: 'a', number: 1, runtimeMinutes: 24, airDate: '2099-01-01' },
          { id: 'b', number: 2, runtimeMinutes: 55 },
        ]),
      });
      expect(nextWatchRuntime(item, NOW)).toBe(55);
      expect(quick(item)).toBe(false);
    });
    it('is not quick when the first episode is 24m and the next unwatched one is 55m after progress', () => {
      const item = show(11, {
        seasons: season([
          { id: 'a', number: 1, runtimeMinutes: 24 },
          { id: 'b', number: 2, runtimeMinutes: 55 },
        ]),
        episodeProgress: { a: true },
      });
      expect(nextWatchRuntime(item, NOW)).toBe(55);
      // Already started, so it is not a Tonight candidate in any row.
      const rows = allocateTonightThemes([item], { now: NOW });
      expect(Object.values(rows).flat()).toHaveLength(0);
    });
    it('is quick when the next unwatched episode is short even if the first was long', () => {
      const item = show(12, {
        seasons: season([
          { id: 'a', number: 1, runtimeMinutes: 55, airDate: '2099-01-01' },
          { id: 'b', number: 2, runtimeMinutes: 24 },
        ]),
      });
      expect(quick(item)).toBe(true);
    });
  });

  describe('already-started shows', () => {
    const episodes = season([
      { id: 'a', number: 1, runtimeMinutes: 22 },
      { id: 'b', number: 2, runtimeMinutes: 22 },
    ]);
    it.each([
      ['top-level episodeProgress', { episodeProgress: { a: true } }],
      [
        'userState episodeProgress',
        { userState: { episodeProgress: { a: true } } },
      ],
    ])('never lands in any row with %s', (_label, progress) => {
      const items = [
        show(20, { seasons: episodes, ...progress }),
        show(21, {
          seasons: episodes,
          ...progress,
          ...override({ comfort: 'high' }),
        }),
        show(22, {
          seasons: episodes,
          ...progress,
          ...override({ comedyFirst: 'high' }),
        }),
      ];
      for (const quickBites of [true, false]) {
        const rows = allocateTonightThemes(items, { quickBites, now: NOW });
        expect(Object.values(rows).flat()).toHaveLength(0);
      }
    });
    it('also excludes shows whose status is not unwatched', () => {
      const rows = allocateTonightThemes(
        [
          show(23, { seasons: episodes, status: 'watching' }),
          movie(24, { status: 'watched' }),
        ],
        { now: NOW },
      );
      expect(Object.values(rows).flat()).toHaveLength(0);
    });
    it('keeps an untouched show with the same episodes eligible', () => {
      const item = show(25, { seasons: episodes });
      expect(
        Object.values(allocateTonightThemes([item], { now: NOW })).flat(),
      ).toEqual([item]);
    });
  });

  describe('classics include explicitly curated TV', () => {
    const classicEvidence = override({ curatedClassic: 'high' });
    it('classifies a movie with strong curatedClassic evidence as classic', () => {
      expect(primaryTheme(movie(30, classicEvidence))).toBe('classic');
    });
    it('classifies a show with strong curatedClassic evidence as classic', () => {
      const item = show(31, classicEvidence);
      expect(primaryTheme(item)).toBe('classic');
    });
    it('respects an explicit classic vibe on a show', () => {
      expect(
        primaryTheme(
          show(32, { ...classicEvidence, userState: { vibe: 'classic' } }),
        ),
      ).toBe('classic');
      expect(primaryTheme(movie(33, { vibe: 'classic' }))).toBe('classic');
    });
    it('places a curated classic show in the classic row', () => {
      const item = show(34, classicEvidence);
      for (const quickBites of [true, false]) {
        const rows = allocateTonightThemes([item], { quickBites, now: NOW });
        expect(rows.classic).toEqual([item]);
        expect(rowOf(rows, item)).toEqual(['classic']);
      }
    });
  });

  describe('single placement per canonical title', () => {
    it('places a title once even when duplicated in input', () => {
      const original = movie(40, override({ comfort: 'high' }));
      const rows = allocateTonightThemes(
        [original, { ...original, id: 'dup-a' }, { ...original, id: 'dup-b' }],
        { now: NOW },
      );
      expect(Object.values(rows).flat()).toEqual([original]);
    });
    it('keeps the first occurrence, including across runtime-driven rows', () => {
      const short = movie(41, { runtimeMinutes: 20 });
      const long = { ...short, id: 'long', runtimeMinutes: 120 };
      const rows = allocateTonightThemes([short, long], { now: NOW });
      expect(rows.quick).toEqual([short]);
      expect(Object.values(rows).flat()).toHaveLength(1);
    });
    it('treats a movie and a show with the same provider id as distinct titles', () => {
      const rows = allocateTonightThemes([movie(42), show(42)], { now: NOW });
      expect(Object.values(rows).flat()).toHaveLength(2);
    });
    it('dedupes id-only items by id and keeps distinct ids', () => {
      const a = { id: 'x', type: 'movie', status: 'unwatched' };
      const rows = allocateTonightThemes([a, { ...a }, { ...a, id: 'y' }], {
        now: NOW,
      });
      expect(Object.values(rows).flat()).toHaveLength(2);
    });
  });

  describe('quickBites disabled', () => {
    it('routes short titles to their mood theme instead of quick', () => {
      const comfort = movie(50, {
        runtimeMinutes: 20,
        ...override({ comfort: 'high' }),
      });
      const comedy = movie(51, {
        runtimeMinutes: 25,
        ...override({ comedyFirst: 'high' }),
      });
      const unclassified = movie(52, { runtimeMinutes: 10 });
      const items = [comfort, comedy, unclassified];

      const on = allocateTonightThemes(items, { now: NOW });
      expect(on.quick).toEqual(items);

      const off = allocateTonightThemes(items, { quickBites: false, now: NOW });
      expect(off.quick).toHaveLength(0);
      expect(off.comfort).toEqual([comfort]);
      expect(off.comedy).toEqual([comedy]);
      expect(off.unknown).toEqual([unclassified]);
      expect(Object.values(off).flat()).toHaveLength(items.length);
    });
    it('does the same for short shows', () => {
      const item = show(53, {
        seasons: season([{ id: 'a', number: 1, runtimeMinutes: 22 }]),
        ...override({ comfort: 'high' }),
      });
      const off = allocateTonightThemes([item], {
        quickBites: false,
        now: NOW,
      });
      expect(off.comfort).toEqual([item]);
      expect(off.quick).toHaveLength(0);
    });
  });
});

describe('bounded weak comedy signal', () => {
  it.each(['easy', 'comfort'])(
    'uses first-listed Comedy with legacy %s',
    (vibe) => {
      expect(
        primaryTheme(movie(60, { vibe, genres: ['Comedy', 'Drama'] })),
      ).toBe('comedy');
    },
  );
  it('uses original media genre order as fallback', () => {
    expect(
      primaryTheme(
        movie(60, { vibe: 'easy', media: { genres: ['Comedy', 'Drama'] } }),
      ),
    ).toBe('comedy');
  });
  it.each(['gripping', 'visual', undefined])('rejects vibe %s', (vibe) => {
    expect(primaryTheme(movie(61, { vibe, genres: ['Comedy'] }))).not.toBe(
      'comedy',
    );
  });
  it('rejects automatic tags, non-first Comedy and explicit facet answers', () => {
    for (const values of [
      { tagProvenance: { vibe: 'automatic' } },
      { genres: ['Drama', 'Comedy'] },
      override({ comedyFirst: 'low' }),
      override({ comedyFirst: 'medium' }),
    ])
      expect(
        primaryTheme(
          movie(62, { vibe: 'easy', genres: ['Comedy'], ...values }),
        ),
      ).not.toBe('comedy');
  });
});
describe('Get Hooked', () => {
  it.each(['low', 'medium'])(
    'accepts accessible high momentum with %s demand',
    (level) => {
      const item = movie(
        70,
        override({
          plotMomentum: 'high',
          narrativeComplexity: level,
          attentionDemand: level,
        }),
      );
      expect(primaryTheme(item)).toBe('hooked');
      expect(allocateTonightThemes([item]).hooked).toEqual([item]);
    },
  );
  it.each(['narrativeComplexity', 'attentionDemand'])(
    'keeps high %s in Deep Dives',
    (facet) => {
      expect(
        primaryTheme(
          movie(
            71,
            override({
              plotMomentum: 'high',
              narrativeComplexity: 'medium',
              attentionDemand: 'medium',
              [facet]: 'high',
            }),
          ),
        ),
      ).toBe('focused');
    },
  );
  it('accepts rules-only high momentum with unknown complexity and demand', () => {
    const item = movie(72, { keywords: ['heist'] });
    const { attributes } = getEffectiveClassification(item);
    expect(attributes.narrativeComplexity.value).toBe('unknown');
    expect(attributes.attentionDemand.value).toBe('unknown');
    expect(primaryTheme(item)).toBe('hooked');
  });
  it.each(['complex', 'graphic violence'])(
    'keeps rules-only high momentum with %s in Deep Dives',
    (keyword) => {
      expect(primaryTheme(movie(72, { keywords: ['heist', keyword] }))).toBe(
        'focused',
      );
    },
  );
  it('requires high momentum', () => {
    expect(
      primaryTheme(
        movie(
          73,
          override({
            plotMomentum: 'medium',
            narrativeComplexity: 'low',
            attentionDemand: 'low',
          }),
        ),
      ),
    ).not.toBe('hooked');
  });
  it('does not infer classic TV from age or automatic legacy tags', () => {
    expect(primaryTheme(show(74, { year: '1951' }))).toBe('unknown');
    expect(
      primaryTheme(
        show(75, { vibe: 'classic', tagProvenance: { vibe: 'automatic' } }),
      ),
    ).toBe('unknown');
  });
});

describe('realistic demo seed', () => {
  it('qualifies comedy and hooked while selecting five mood rows plus Quick Bites', () => {
    const items = buildTemplateSeedItems();
    const allocated = allocateTonightThemes(items, { now: NOW });
    expect(items).toHaveLength(30);
    expect(allocated.comedy).toHaveLength(3);
    expect(allocated.hooked).toHaveLength(3);
    expect(allocated.focused).toHaveLength(4);
    const ids = Object.values(allocated)
      .flat()
      .map((item) => item.id);
    expect(new Set(ids).size).toBe(30);
    expect(
      composeTonightRows(allocated)
        .rows.map((r) => r.key)
        .sort(),
    ).toEqual(['classic', 'comedy', 'comfort', 'focused', 'quick', 'visual']);
    expect(Object.values(allocated).flat()).toHaveLength(30);
  });
  it.each([
    ['Paddington 2', 'comfort'],
    ['Legally Blonde', 'comedy'],
    ['School of Rock', 'comedy'],
    ['Knives Out', 'hooked'],
    ['Only Murders in the Building', 'hooked'],
    ["Ocean's Eleven", 'hooked'],
    ['The Grand Budapest Hotel', 'comedy'],
    ['The Intern', 'comfort'],
    ['Gone Girl', 'focused'],
    ['The Dark Knight', 'focused'],
    ['Stranger Things', 'focused'],
    ['Severance', 'focused'],
  ])('%s has one plausible home', (title, theme) => {
    const item = buildTemplateSeedItems().find(
      (entry) => entry.title === title,
    );
    expect(primaryTheme(item)).toBe(theme);
    expect(
      rowOf(
        allocateTonightThemes([item], { quickBites: false, now: NOW }),
        item,
      ),
    ).toEqual([theme]);
  });
});
