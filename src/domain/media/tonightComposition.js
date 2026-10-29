// Pure row composition for Tonight (issue #7). Consumes the output of
// allocateTonightThemes (each canonical title in exactly one array) and returns
// the bounded, ordered rows the page should render. No React, no I/O.

// Selection tie-break and allocation traversal order (preserves item ordering).
const THEME_ORDER = [
  'comfort',
  'comedy',
  'hooked',
  'quick',
  'focused',
  'visual',
  'classic',
];

// Display order is independent of strength, size and selection tie-breaks.
const DISPLAY_ORDER = [
  'comfort',
  'comedy',
  'quick',
  'hooked',
  'focused',
  'visual',
  'classic',
];

const THEME_TITLES = {
  comfort: 'Easy & Comforting',
  comedy: 'Need a Laugh',
  hooked: 'Get Hooked',
  quick: 'Quick Bites',
  focused: 'Deep Dives',
  visual: 'Spectacles',
  classic: 'The Classics',
};

// Unclassified titles can join compact picks, but never form their own row.
const UNCLASSIFIED_KEY = 'unknown';
export const MIXED_ROW_KEY = 'mixed';
export const MIXED_ROW_TITLE = "Tonight's picks";

export const MAX_ROW_ITEMS = 12;

// UX test parameters from issue #7, not final policy. The first tier whose
// `maxEligible` is >= the eligible count applies.
//   compact: one mixed row instead of thematic rows
//   maxRows: most mood rows shown (Quick Bites is extra)   minItems: fewest cards a thematic row may have
export const TONIGHT_TIERS = Object.freeze([
  Object.freeze({ maxEligible: 0, maxRows: 0, minItems: 0, compact: false }),
  Object.freeze({ maxEligible: 5, maxRows: 1, minItems: 1, compact: true }),
  Object.freeze({ maxEligible: 12, maxRows: 2, minItems: 2, compact: false }),
  Object.freeze({ maxEligible: 30, maxRows: 5, minItems: 3, compact: false }),
  Object.freeze({
    maxEligible: Infinity,
    maxRows: 6,
    minItems: 3,
    compact: false,
  }),
]);

const itemKey = (item) => String(item?.id ?? item?.key ?? '');

// FNV-1a (32-bit) over the string, then a final avalanche so short keys that
// differ in one character still spread across the range.
const hashString = (value) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
};

// Deterministic seeded order. O(n log n); ties on equal hashes fall back to
// input position so the result is always fully determined.
export const stableOrder = (items, seed = '') =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      item,
      index,
      hash: hashString(`${seed}\u0000${itemKey(item)}`),
    }))
    .sort((a, b) => a.hash - b.hash || a.index - b.index)
    .map(({ item }) => item);

const finiteScore = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getTier = (eligibleCount) =>
  TONIGHT_TIERS.find((tier) => eligibleCount <= tier.maxEligible) ||
  TONIGHT_TIERS[TONIGHT_TIERS.length - 1];

// Score once, then sort by score desc with the seeded order as tie-break.
const rankItems = (items, scoreItem, seed) => {
  const seeded = stableOrder(items, seed);
  return seeded
    .map((item, position) => ({
      item,
      position,
      score: finiteScore(scoreItem(item)),
    }))
    .sort((a, b) => b.score - a.score || a.position - b.position);
};

const buildRow = (key, title, items, scoreItem, seed) => {
  const ranked = rankItems(items, scoreItem, seed);
  const visible = ranked.slice(0, MAX_ROW_ITEMS);
  return {
    key,
    title,
    items: visible.map(({ item }) => item),
    strength: visible.reduce((sum, { score }) => sum + score, 0),
    size: ranked.length,
  };
};

const publicRow = ({ key, title, items }) => ({ key, title, items });

/**
 * Compose the visible Tonight rows from allocated themes.
 *
 * @param {Record<string, object[]>} allocated allocateTonightThemes() output.
 * @param {object} [options]
 * @param {number} [options.eligibleCount] Eligible unwatched titles; picks the
 *   size tier. Defaults to the number of distinct titles in `allocated`.
 * @param {(item: object) => number} [options.scoreItem] Utility per title;
 *   drives row strength and in-row order. Defaults to 0 (all equal), as used
 *   by Tonight so items follow only the daily seeded shuffle.
 * @param {string} [options.sessionSeed] Breaks ties between equal scores only.
 * @returns {{ rows: {key: string, title: string, items: object[]}[], isEmpty: boolean }}
 *
 * Tiers (TONIGHT_TIERS): 0 -> empty; 1-5 -> one compact mixed row; 6-12 -> up to
 * 2 rows of >=2; 13-30 -> up to 5 rows of >=3; 31+ -> up to 6 rows of >=3.
 * Strength (then size and selection tie-break order) selects rows when the tier
 * is full; it never controls display order. Selected themes always display as
 * comfort, comedy, quick, hooked, focused, visual, classic.
 * Quick Bites is an extra optional row; qualifying Classics always gets a mood slot.
 * Undersized themes and unclassified titles stay on the Shelf; there is no
 * catch-all row outside the compact tier.
 * Titles not shown stay on the Shelf. No row ever holds a title twice, and
 * outside the compact tier no row has fewer than the tier minimum.
 */
export const composeTonightRows = (
  allocated,
  { eligibleCount, scoreItem = () => 0, sessionSeed = '' } = {},
) => {
  const seen = new Set();
  const groups = {};
  const allKeys = [...THEME_ORDER, UNCLASSIFIED_KEY];
  // Preserve unexpected allocation keys for compact picks only.
  const extraKeys = Object.keys(allocated || {}).filter(
    (key) => !allKeys.includes(key),
  );
  for (const key of [...allKeys, ...extraKeys]) {
    const target = THEME_ORDER.includes(key) ? key : UNCLASSIFIED_KEY;
    const list = Array.isArray(allocated?.[key]) ? allocated[key] : [];
    for (const item of list) {
      const id = itemKey(item);
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      (groups[target] ||= []).push(item);
    }
  }

  const total = Object.values(groups).reduce((n, list) => n + list.length, 0);
  const requested = Number.isFinite(eligibleCount)
    ? Math.max(0, Math.floor(eligibleCount))
    : total;
  const tier = getTier(total === 0 ? 0 : requested);
  const empty = { rows: [], isEmpty: true };
  if (total === 0 || tier.maxRows === 0) return empty;

  if (tier.compact) {
    const everything = allKeys.flatMap((key) => groups[key] || []);
    const row = buildRow(
      MIXED_ROW_KEY,
      MIXED_ROW_TITLE,
      everything,
      scoreItem,
      sessionSeed,
    );
    return { rows: [publicRow(row)], isEmpty: false };
  }

  const themed = [];
  THEME_ORDER.forEach((key, order) => {
    const list = groups[key] || [];
    if (list.length >= tier.minItems) {
      themed.push({
        ...buildRow(key, THEME_TITLES[key], list, scoreItem, sessionSeed),
        order,
      });
    }
  });

  const byStrength = (a, b) =>
    b.strength - a.strength || b.size - a.size || a.order - b.order;
  themed.sort(byStrength);
  const moods = themed.filter((row) => row.key !== 'quick');
  const rows = moods.slice(0, tier.maxRows);
  const classic = moods.find((row) => row.key === 'classic');
  if (classic && !rows.includes(classic)) rows[rows.length - 1] = classic;
  const quick = themed.find((row) => row.key === 'quick');
  if (quick) rows.push(quick);
  rows.sort(
    (a, b) => DISPLAY_ORDER.indexOf(a.key) - DISPLAY_ORDER.indexOf(b.key),
  );
  return { rows: rows.map(publicRow), isEmpty: rows.length === 0 };
};
