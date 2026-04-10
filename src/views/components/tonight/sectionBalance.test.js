import {
  balanceRows,
  getBalancedRowCounts,
} from './sectionBalance.js';

const makeItems = (prefix, count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `${prefix} ${index + 1}`,
  }));

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
