import { describe, expect, it } from 'vitest';
import {
  composeTonightRows,
  MAX_ROW_ITEMS,
  stableOrder,
  TONIGHT_TIERS,
} from './tonightComposition.js';

const THEMES = [
  'comfort',
  'comedy',
  'hooked',
  'quick',
  'focused',
  'visual',
  'classic',
];

const make = (prefix, n) =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}` }));

const allocate = (counts) => {
  const rows = {
    comfort: [],
    comedy: [],
    hooked: [],
    quick: [],
    focused: [],
    visual: [],
    classic: [],
    unknown: [],
  };
  Object.entries(counts).forEach(([key, n]) => {
    rows[key] = make(key, n);
  });
  return rows;
};

// Spreads n titles round-robin over the six mood themes plus Quick Bites.
const spread = (n) => {
  const counts = {};
  for (let i = 0; i < n; i += 1) {
    const key = THEMES[i % THEMES.length];
    counts[key] = (counts[key] || 0) + 1;
  }
  return allocate(counts);
};

const ids = (result) => result.rows.flatMap((r) => r.items.map((i) => i.id));

const expectInvariants = (result, { compact = false } = {}) => {
  const all = ids(result);
  expect(new Set(all).size).toBe(all.length);
  result.rows.forEach((row) => {
    expect(row.items.length).toBeLessThanOrEqual(MAX_ROW_ITEMS);
    if (!compact) expect(row.items.length).toBeGreaterThan(1);
  });
};

describe('composeTonightRows sizes', () => {
  it('returns empty for 0 eligible', () => {
    expect(composeTonightRows(allocate({}))).toEqual({
      rows: [],
      isEmpty: true,
    });
    expect(composeTonightRows(undefined)).toEqual({ rows: [], isEmpty: true });
  });

  it('shows one compact mixed row for 1 and 5 titles', () => {
    const one = composeTonightRows(allocate({ comedy: 1 }));
    expect(one.isEmpty).toBe(false);
    expect(one.rows).toHaveLength(1);
    expect(one.rows[0].key).toBe('mixed');
    expect(one.rows[0].items).toHaveLength(1);

    const five = composeTonightRows(
      allocate({ comfort: 2, comedy: 1, visual: 1, unknown: 1 }),
    );
    expect(five.rows).toHaveLength(1);
    expect(five.rows[0].key).toBe('mixed');
    expect(five.rows[0].items).toHaveLength(5);
    expectInvariants(five, { compact: true });
  });

  it('shows up to 2 rows of >=2 for 12 titles', () => {
    const result = composeTonightRows(
      allocate({
        comfort: 2,
        comedy: 2,
        hooked: 2,
        focused: 2,
        visual: 2,
        classic: 2,
      }),
    );
    expect(
      result.rows.filter((r) => r.key !== 'quick').length,
    ).toBeLessThanOrEqual(2);
    expect(result.rows.length).toBeGreaterThan(0);
    expectInvariants(result);
  });

  it('shows up to 5 rows of >=3 for 30 titles', () => {
    const result = composeTonightRows(
      allocate({
        comfort: 5,
        comedy: 5,
        hooked: 5,
        focused: 5,
        visual: 5,
        classic: 5,
      }),
    );
    expect(result.rows).toHaveLength(5);
    result.rows.forEach((r) =>
      expect(r.items.length).toBeGreaterThanOrEqual(3),
    );
    expectInvariants(result);
  });

  it('shows up to 6 rows of >=3 and caps cards for 50+ titles', () => {
    const result = composeTonightRows(
      allocate({
        comfort: 20,
        comedy: 10,
        hooked: 6,
        quick: 8,
        focused: 7,
        visual: 5,
        classic: 4,
      }),
    );
    expect(result.rows).toHaveLength(7);
    expect(result.rows[0].items).toHaveLength(MAX_ROW_ITEMS);
    expectInvariants(result);
  });

  it('uses the supplied eligibleCount to choose the tier', () => {
    const allocated = allocate({ comfort: 4, comedy: 4 });
    expect(
      composeTonightRows(allocated, { eligibleCount: 4 }).rows[0].key,
    ).toBe('mixed');
    expect(composeTonightRows(allocated).rows.map((r) => r.key)).toEqual([
      'comfort',
      'comedy',
    ]);
  });

  it('exposes tunable tiers', () => {
    expect(TONIGHT_TIERS.map((t) => t.maxRows)).toEqual([0, 1, 2, 5, 6]);
    expect(TONIGHT_TIERS.map((t) => t.minItems)).toEqual([0, 1, 2, 3, 3]);
    expect(TONIGHT_TIERS.map((t) => t.maxEligible)).toEqual([
      0,
      5,
      12,
      30,
      Infinity,
    ]);
  });
});

describe('composeTonightRows skew and unclassified titles', () => {
  it('keeps a comedy-heavy library led by comedy with no tiny rails', () => {
    const result = composeTonightRows(
      allocate({ comedy: 18, comfort: 2, visual: 1, focused: 1 }),
    );
    expect(result.rows[0].key).toBe('comedy');
    expectInvariants(result);
    expect(result.rows.map((r) => r.key)).not.toContain('visual');
  });

  it('omits undersized themes and unclassified titles without a catch-all row', () => {
    const result = composeTonightRows(
      allocate({ comedy: 8, visual: 1, classic: 1, quick: 1, unknown: 2 }),
    );
    expect(result.rows.map((r) => r.key)).toEqual(['comedy']);
    expect(result.rows[0].items).toHaveLength(8);
    expectInvariants(result);
  });

  it('keeps only qualifying themes', () => {
    const result = composeTonightRows(
      allocate({ comedy: 8, comfort: 4, visual: 1, unknown: 0 }),
    );
    expect(result.rows.map((r) => r.key)).toEqual(['comfort', 'comedy']);
  });

  it('keeps Spectacles in fixed order in a visual-heavy library', () => {
    const result = composeTonightRows(
      allocate({ visual: 15, comfort: 3, comedy: 3 }),
    );
    expect(result.rows.map((row) => row.key)).toEqual([
      'comfort',
      'comedy',
      'visual',
    ]);
    expect(result.rows[2].title).toBe('Spectacles');
    expect(result.rows[2].items).toHaveLength(MAX_ROW_ITEMS);
    expectInvariants(result);
  });

  it('never uses an available slot for an unclassified row', () => {
    const result = composeTonightRows(
      allocate({
        comfort: 3,
        comedy: 3,
        hooked: 3,
        quick: 3,
        focused: 3,
        visual: 3,
        unknown: 4,
      }),
    );
    expect(result.rows).toHaveLength(6);
    expect(result.rows.map((r) => r.key)).not.toContain('unknown');
  });

  it('does not invent a grouping when no themes qualify', () => {
    expect(composeTonightRows(spread(7))).toEqual({ rows: [], isEmpty: true });
    expect(composeTonightRows(allocate({ unknown: 20 }))).toEqual({
      rows: [],
      isEmpty: true,
    });
  });

  it('drops a title that appears in two allocated rows', () => {
    const shared = { id: 'dup' };
    const result = composeTonightRows({
      comfort: [shared, ...make('a', 3)],
      comedy: [shared, ...make('b', 3)],
    });
    expect(ids(result).filter((id) => id === 'dup')).toHaveLength(1);
  });
});

describe('composeTonightRows ordering and determinism', () => {
  const counts = { comfort: 4, comedy: 4, focused: 4, visual: 4 };

  it('selects equal-strength rows by count then displays them in fixed order', () => {
    const result = composeTonightRows(
      allocate({ visual: 5, comfort: 3, comedy: 3 }),
    );
    expect(result.rows.map((r) => r.key)).toEqual(['comfort', 'visual']);
    const equal = composeTonightRows(allocate(counts));
    expect(equal.rows.map((r) => r.key)).toEqual([
      'comfort',
      'comedy',
      'focused',
      'visual',
    ]);
  });

  it('keeps display order when scoreItem favors a later theme', () => {
    const scoreItem = (item) => (item.id.startsWith('visual') ? 10 : 1);
    const result = composeTonightRows(allocate(counts), { scoreItem });
    expect(result.rows.map((row) => row.key)).toEqual([
      'comfort',
      'comedy',
      'focused',
      'visual',
    ]);
  });

  it('chooses row slots by visible strength after the 12 card cap', () => {
    // Whole-group sums favor comfort (20 vs 18), but visible strength favors
    // comedy (18 vs 12). Only comedy wins the unreserved small-tier slot.
    const allocated = {
      comfort: make('comfort', 20),
      comedy: make('comedy', 6),
      classic: make('classic', 2),
    };
    const scoreItem = (item) => (item.id.startsWith('comfort') ? 1 : 3);

    const result = composeTonightRows(allocated, {
      scoreItem,
      eligibleCount: 12,
    });

    expect(result.rows.map((row) => row.key)).toEqual(['comedy', 'classic']);
  });

  it('displays all themes in fixed order regardless of optional scores and library skew', () => {
    const expected = [
      'comfort',
      'comedy',
      'quick',
      'hooked',
      'focused',
      'visual',
      'classic',
    ];
    for (const favored of expected) {
      const counts = Object.fromEntries(
        expected.map((key) => [key, key === favored ? 30 : 3]),
      );
      for (const scoreItem of [
        () => 0,
        (item) => (item.id.startsWith(favored) ? 100 : 1),
      ]) {
        const result = composeTonightRows(allocate(counts), { scoreItem });
        expect(result.rows.map((row) => row.key)).toEqual(expected);
      }
    }
  });

  it.each([
    { comfort: 3, comedy: 2 },
    { comfort: 15, comedy: 4, quick: 3, unknown: 3, visual: 1 },
  ])('uses only seeded order by default in every row for %j', (counts) => {
    const allocated = allocate(counts);
    Object.values(allocated)
      .flat()
      .forEach((item, index) => {
        item.additionOrigin = 'manual';
        item.createdAt = index % 2 ? '2026-10-28' : '2020-01-01';
        item.markedWatchedAt = '2026-10-28';
      });
    const a = composeTonightRows(allocated, { sessionSeed: '20261028' });
    const b = composeTonightRows(allocated, { sessionSeed: '20261029' });
    for (const row of a.rows) {
      const pool =
        row.key === 'mixed'
          ? Object.values(allocated).flat()
          : allocated[row.key];
      expect(row.items).toEqual(stableOrder(pool, '20261028').slice(0, 12));
      expect(b.rows.find(({ key }) => key === row.key).items).toEqual(
        stableOrder(pool, '20261029').slice(0, 12),
      );
    }
    expect(a).toEqual(
      composeTonightRows(allocated, {
        scoreItem: () => 0,
        sessionSeed: '20261028',
      }),
    );
    expect(b.rows).not.toEqual(a.rows);
  });

  it('sorts items inside a row by score before the seeded order', () => {
    const allocated = allocate({ comfort: 6 });
    const scoreItem = (item) => (item.id === 'comfort-4' ? 5 : 0);
    const a = composeTonightRows(allocated, { scoreItem, sessionSeed: 'a' });
    const b = composeTonightRows(allocated, { scoreItem, sessionSeed: 'b' });
    expect(a.rows[0].items[0].id).toBe('comfort-4');
    expect(b.rows[0].items[0].id).toBe('comfort-4');
  });

  it('is deterministic for the same inputs and seed', () => {
    const run = () =>
      composeTonightRows(spread(40), {
        sessionSeed: 'day-1',
        scoreItem: () => 1,
      });
    expect(run()).toEqual(run());
  });

  it('changes order across seeds only among equal scores', () => {
    const allocated = allocate({ comfort: 10 });
    const scoreItem = (item) =>
      Number(item.id.split('-')[1]) % 3 === 0 ? 2 : 0;
    const orders = ['s1', 's2', 's3', 's4'].map((sessionSeed) =>
      composeTonightRows(allocated, {
        scoreItem,
        sessionSeed,
      }).rows[0].items.map((i) => i.id),
    );
    // Score tiers never interleave, whatever the seed.
    orders.forEach((order) => {
      const scores = order.map((id) => scoreItem({ id }));
      expect(scores).toEqual([...scores].sort((x, y) => y - x));
    });
    expect(new Set(orders.map((o) => o.join())).size).toBeGreaterThan(1);
    // Same members every time.
    orders.forEach((o) => expect([...o].sort()).toEqual([...orders[0]].sort()));
  });
});

describe('stableOrder', () => {
  const items = make('t', 20);

  it('is pure, deterministic and keeps every item once', () => {
    const copy = [...items];
    const a = stableOrder(items, 'seed');
    expect(items).toEqual(copy);
    expect(stableOrder(items, 'seed')).toEqual(a);
    expect(a.map((i) => i.id).sort()).toEqual(items.map((i) => i.id).sort());
  });

  it('depends on the seed', () => {
    expect(stableOrder(items, 'x')).not.toEqual(stableOrder(items, 'y'));
  });

  it('does not depend on input order', () => {
    const forward = stableOrder(items, 'k').map((i) => i.id);
    const reversed = stableOrder([...items].reverse(), 'k').map((i) => i.id);
    expect(reversed).toEqual(forward);
  });

  it('handles empty and invalid input', () => {
    expect(stableOrder([], 's')).toEqual([]);
    expect(stableOrder(null, 's')).toEqual([]);
  });

  it('scales to large inputs', () => {
    expect(stableOrder(make('big', 20000), 'seed')).toHaveLength(20000);
  });
});

describe('approved row slots', () => {
  it('reserves Classics by displacing the weakest mood, with Quick Bites extra and displayed in fixed order', () => {
    const result = composeTonightRows(
      allocate({
        comfort: 4,
        comedy: 4,
        hooked: 4,
        focused: 4,
        visual: 4,
        classic: 3,
        quick: 4,
      }),
      {
        scoreItem: (item) =>
          item.id.startsWith('quick')
            ? 10
            : item.id.startsWith('classic')
            ? 0
            : 1,
      },
    );
    expect(result.rows.map((r) => r.key)).toEqual([
      'comfort',
      'comedy',
      'quick',
      'hooked',
      'focused',
      'classic',
    ]);
    expectInvariants(result);
  });
  it('orders Get Hooked after comedy on equal strength', () => {
    expect(
      composeTonightRows(allocate({ comedy: 3, hooked: 3 }), {
        eligibleCount: 13,
      }).rows.map((r) => r.title),
    ).toEqual(['Need a Laugh', 'Get Hooked']);
  });
});
