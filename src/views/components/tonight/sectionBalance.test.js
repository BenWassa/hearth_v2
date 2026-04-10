import {
  balanceRows,
  dedupeRowsInOrder,
  getBalancedRowCounts,
} from './sectionBalance.js';

const makeItems = (prefix, count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `${prefix} ${index + 1}`,
  }));

describe('dedupeRowsInOrder', () => {
  it('removes duplicates from later rows while preserving row priority', () => {
    const shared = { id: 'shared', title: 'Shared' };

    const [first, second] = dedupeRowsInOrder([
      [shared, { id: 'first-only', title: 'First only' }],
      [shared, { id: 'second-only', title: 'Second only' }],
    ]);

    expect(first.map((item) => item.id)).toEqual(['shared', 'first-only']);
    expect(second.map((item) => item.id)).toEqual(['second-only']);
  });
});

describe('getBalancedRowCounts', () => {
  it('caps larger rows so counts stay closer together', () => {
    expect(getBalancedRowCounts([1, 10, 8, 7, 6])).toEqual([1, 7, 7, 7, 6]);
  });

  it('keeps empty rows empty', () => {
    expect(getBalancedRowCounts([0, 4, 4])).toEqual([0, 4, 4]);
  });
});

describe('balanceRows', () => {
  it('slices each row to its balanced display count', () => {
    const rows = balanceRows([
      makeItems('classics', 1),
      makeItems('comfort', 10),
      makeItems('comedy', 8),
      makeItems('focused', 7),
      makeItems('visual', 6),
    ]);

    expect(rows.map((row) => row.length)).toEqual([1, 7, 7, 7, 6]);
    expect(rows[1].at(-1)?.id).toBe('comfort-7');
  });
});
