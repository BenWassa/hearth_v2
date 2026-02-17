import {
  buildTonightTray,
  isTonightTrayValidForPool,
} from './domain/watchlist';

const makeItem = (id, energy) => ({ id, energy });

describe('buildTonightTray', () => {
  it('returns one of each energy when available', () => {
    const unwatched = [
      makeItem('l1', 'light'),
      makeItem('b1', 'balanced'),
      makeItem('f1', 'focused'),
      makeItem('l2', 'light'),
    ];

    const tray = buildTonightTray(unwatched, () => 0);

    expect(tray).toEqual([unwatched[0], unwatched[1], unwatched[2]]);
  });

  it('fills remaining slots from the pool', () => {
    const unwatched = [
      makeItem('l1', 'light'),
      makeItem('b1', 'balanced'),
      makeItem('x1', null),
    ];

    const tray = buildTonightTray(unwatched, () => 0);

    expect(tray).toEqual(unwatched);
  });

  it('treats energy labels case-insensitively', () => {
    const unwatched = [
      makeItem('l1', ' Light '),
      makeItem('b1', 'BALANCED'),
      makeItem('f1', 'Focused'),
      makeItem('x1', null),
    ];

    const tray = buildTonightTray(unwatched, () => 0);

    expect(tray).toEqual([unwatched[0], unwatched[1], unwatched[2]]);
  });

  it('falls back to remaining items when an energy bucket is missing', () => {
    const unwatched = [
      makeItem('b1', 'balanced'),
      makeItem('f1', 'focused'),
      makeItem('b2', 'balanced'),
      makeItem('x1', null),
    ];

    const tray = buildTonightTray(unwatched, () => 0);

    expect(tray).toEqual([unwatched[0], unwatched[1], unwatched[2]]);
  });
});

describe('isTonightTrayValidForPool', () => {
  it('rejects trays that miss an available energy', () => {
    const pool = [
      makeItem('l1', 'light'),
      makeItem('b1', 'balanced'),
      makeItem('f1', 'focused'),
      makeItem('b2', 'balanced'),
    ];
    const tray = [pool[1], pool[3], pool[2]];

    expect(isTonightTrayValidForPool(pool, tray)).toBe(false);
  });

  it('accepts trays that include each available energy', () => {
    const pool = [
      makeItem('l1', 'light'),
      makeItem('b1', 'balanced'),
      makeItem('f1', 'focused'),
      makeItem('b2', 'balanced'),
    ];
    const tray = [pool[0], pool[1], pool[2]];

    expect(isTonightTrayValidForPool(pool, tray)).toBe(true);
  });
});
